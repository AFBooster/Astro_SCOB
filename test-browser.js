/* SCOB Night-Sky — real-browser smoke test (headless Chromium via Playwright).
 *
 * Complements the stub-DOM suites (test-pages.js / test-astro.js / test-logic.js):
 * those execute the page scripts against a fake DOM and cannot see rendering.
 * This one loads every published page in a REAL browser and fails on:
 *   • an uncaught page exception (window 'pageerror')
 *   • a console error that isn't just a deliberately-blocked network call
 *   • a page whose <body> renders essentially empty (blank page)
 * It also WARNS (does not fail) when a <canvas> looks blank, since some canvases
 * only draw after interaction.
 *
 * External origins (Open-Meteo, MSS, NEA, CelesTrak…) are blocked, so this also
 * proves each page survives with no connectivity — the observatory-deck case.
 *
 * Dev-only. Not a web asset — never uploaded (excluded in check-release.sh and
 * stripped in the deploy workflow).
 *
 * Run:  npm i -D playwright && npx playwright install chromium && node test-browser.js
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) {
  console.error('playwright is not installed. Run:  npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const ROOT = __dirname;
const PORT = 8731;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json' };

// Pages that intentionally redirect elsewhere — a near-empty body is expected.
const STUBS = new Set(['main.html','scob-dashboard.html','occultations.html','iss-transits.html',
  'identify.html','audio-tour.html','index.html']);

function serve() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

(async () => {
  const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort();
  const server = serve();
  await new Promise(r => server.listen(PORT, r));

  // In CI, `npx playwright install chromium` provides the matching browser, so a plain
  // launch() is correct. Locally you can point at an existing Chromium via PW_CHROMIUM.
  const launchOpts = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext();
  // Block every non-localhost request: proves offline resilience and keeps the run deterministic.
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    return route.abort();
  });

  let failed = 0, warned = 0, checked = 0, hung = 0;
  const gaveUp = new Set();   // hung pages: anything they report later is ignored
  const fail = (pg, msg, force) => { if (gaveUp.has(pg) && !force) return; console.log(`  \x1b[31mX ${pg}: ${msg}\x1b[0m`); failed++; };
  const warn = (pg, msg) => { if (gaveUp.has(pg)) return; console.log(`  \x1b[33m! ${pg}: ${msg}\x1b[0m`); warned++; };
  // A page that has not finished within PAGE_LIMIT_MS counts as hung: it fails, and the run
  // moves on instead of waiting for the CI job's own (6-hour) limit. In CI each page name is
  // printed first, so a stalled log shows exactly which page was on screen.
  const PAGE_LIMIT_MS = 45000;
  const within = (promise, ms) => { let t; return Promise.race([promise, new Promise(r => { t = setTimeout(() => r('timeout'), ms); })]).finally(() => clearTimeout(t)); };

  for (const pg of pages) {
    if (process.env.CI) console.log('  · ' + pg);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + (e && e.message || e)));
    page.on('console', m => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // Ignore noise from the deliberately-blocked external requests.
      if (/Failed to load resource|net::ERR_FAILED|ERR_BLOCKED|fetch|Load failed|NetworkError|Failed to fetch/i.test(t)) return;
      errors.push('console.error: ' + t);
    });
    const outcome = await within((async () => { try {
      await page.goto(`http://localhost:${PORT}/${pg}`, { waitUntil: 'load', timeout: 20000 });
      // let deferred on-load scripts and any redirect settle
      await page.waitForTimeout(700);

      if (errors.length) { fail(pg, errors[0]); }
      else {
        // body must render something, unless it's a redirect stub
        const bodyLen = await page.evaluate(() => (document.body ? document.body.innerText.trim().length : 0));
        const url = page.url();
        const redirected = !url.endsWith('/' + pg);
        if (bodyLen < 12 && !STUBS.has(pg) && !redirected) { fail(pg, `body renders empty (${bodyLen} chars)`); }
        else {
          // canvas blank check → warning only
          const blank = await page.evaluate(() => {
            const cs = Array.from(document.querySelectorAll('canvas'));
            for (const c of cs) {
              if (!c.width || !c.height) continue;
              try {
                const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
                let any = false;
                for (let i = 3; i < d.length; i += 4) { if (d[i] !== 0) { any = true; break; } }
                if (!any) return true;
              } catch (e) { /* tainted / webgl — skip */ }
            }
            return false;
          });
          if (blank) warn(pg, 'a <canvas> appears blank (may be pre-interaction)');
          checked++;
        }
      }
    } catch (e) {
      fail(pg, 'navigation/render threw: ' + (e && e.message || e));
    } })(), PAGE_LIMIT_MS);
    if (outcome === 'timeout') {
      gaveUp.add(pg);
      fail(pg, `not finished after ${PAGE_LIMIT_MS / 1000} s — the page (or the browser) hung`, true);
      if (++hung >= 2) { console.log('  Two pages hung — stopping the run here.'); break; }
    }
    await within(page.close().catch(() => {}), 5000);
  }

  await within(browser.close().catch(() => {}), 10000);
  server.close();

  console.log(`\n  ${checked} pages rendered clean, ${warned} warning(s), ${failed} failure(s), of ${pages.length} pages.`);
  if (failed) { console.log('\x1b[31m  Browser smoke test FAILED.\x1b[0m'); process.exit(1); }
  console.log('\x1b[32m  Browser smoke test passed.\x1b[0m');
  process.exit(0);   // don't let a stuck browser handle keep Node (and the CI step) alive
})().catch(e => { console.error(e); process.exit(1); });
