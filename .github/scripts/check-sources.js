#!/usr/bin/env node
/* SCOB Night-Sky — weekly check that the outside data sources still answer.
 *
 * The deploy job proves the SITE loads. It cannot prove that NEA, Open-Meteo, NASA,
 * CelesTrak and MSS still answer in the shape the pages expect — and when one of them
 * changes, the page quietly falls back to "no data" and nobody notices until a Friday.
 * (NEA moved its API from v1 to v2 in 2025; this is the kind of change it catches.)
 *
 * Where it can, it runs the site's OWN code: haze-core.js is loaded as-is and its
 * fetchNow / fetchForecast / fetchTransport are called, so a change in the response
 * shape fails here exactly as it would in a visitor's browser.
 *
 * Run by .github/workflows/check-sources.yml every Monday, or by hand:
 *     node .github/scripts/check-sources.js            (prints a report, exit 1 on failure)
 *     node .github/scripts/check-sources.js --md out.md (also writes the report as Markdown)
 * Needs Node 20+ (built-in fetch). No dependencies.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const TIMEOUT = 25000;
const UA = 'SCOB-NightSky-source-check (+https://afbooster.online)';

// Every request — the site's own code included — gets a timeout and a polite User-Agent.
const rawFetch = globalThis.fetch;
globalThis.fetch = function (url, opts) {
  opts = Object.assign({}, opts || {});
  opts.headers = Object.assign({ 'User-Agent': UA }, opts.headers || {});
  delete opts.cache;                       // a browser option; undici rejects some values
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT);
  opts.signal = ac.signal;
  return rawFetch(url, opts).finally(() => clearTimeout(t));
};
globalThis.window = globalThis;
require(path.join(ROOT, 'haze-core.js'));
const H = globalThis.Haze;

const sgDate = (offsetDays) => new Date(Date.now() + 8 * 3600e3 + (offsetDays || 0) * 864e5).toISOString().slice(0, 10);
const pad = (n) => (n < 10 ? '0' : '') + n;
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function getOK(url, wantType) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const ct = r.headers.get('content-type') || '';
  if (wantType && ct.indexOf(wantType) < 0) throw new Error('unexpected content-type ' + ct);
  const b = Buffer.from(await r.arrayBuffer());
  return { ct, bytes: b.length, buf: b };
}
const need = (cond, msg) => { if (!cond) throw new Error(msg); };

/* page = which pages lose something when this source breaks */
const CHECKS = [
  { name: 'NEA live PSI + PM2.5 (data.gov.sg)', page: 'haze.html, dashboard haze card',
    run: async () => {
      const d = await H.fetchNow();
      need(d.psi && typeof d.psi.west === 'number', 'no 24-h PSI for the west region');
      need(d.pm && typeof d.pm.west === 'number', 'no 1-h PM2.5 for the west region (page falls back to an estimate)');
      return 'west PSI ' + d.psi.west + ', PM2.5 ' + d.pm.west + ' µg/m³ · ' + (d.psiTime || '');
    } },
  { name: 'NEA day history (trend & week strip)', page: 'haze.html',
    run: async () => {
      const s = await H.fetchTrend('psi', 'west', sgDate(-1));
      need(s.length >= 12, 'only ' + s.length + ' readings for yesterday');
      return s.length + ' hourly readings for yesterday';
    } },
  { name: 'NEA v1 fallback endpoint', page: 'haze.html (only if v2 fails)', soft: true,
    run: async () => {
      const j = await getJSON('https://api.data.gov.sg/v1/environment/psi');
      need(j.items && j.items.length, 'no items');
      return 'answers';
    } },
  { name: 'NEA 2-hour area forecast', page: 'dashboard nowcast card',
    run: async () => {
      const j = await getJSON('https://api.data.gov.sg/v1/environment/2-hour-weather-forecast');
      need(j.items && j.items[0] && j.items[0].forecasts && j.items[0].forecasts.length, 'no forecasts');
      const w = j.items[0].forecasts.find((f) => /Jurong/i.test(f.area));
      return j.items[0].forecasts.length + ' areas' + (w ? ' · ' + w.area + ': ' + w.forecast : '');
    } },
  { name: 'Open-Meteo weather (cloud & rain)', page: 'dashboard go/no-go, Should I come tonight?, First Night, Plan ahead',
    run: async () => {
      const d = sgDate(0);
      const j = await getJSON('https://api.open-meteo.com/v1/forecast?latitude=1.3342&longitude=103.7357&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,cloud_cover,wind_speed_10m,weather_code,wind_speed_250hPa,wind_speed_850hPa,cape&timezone=Asia%2FSingapore&start_date=' + d + '&end_date=' + d);
      need(j.hourly && j.hourly.cloud_cover && j.hourly.cloud_cover.length === 24, 'no hourly cloud cover');
      need(j.hourly.precipitation_probability && j.hourly.precipitation_probability[20] != null, 'no rain probability');
      need(j.hourly.wind_speed_250hPa && j.hourly.wind_speed_250hPa[20] != null, 'no jet-stream wind (seeing estimate)');
      return '8 pm tonight: ' + j.hourly.cloud_cover[20] + '% cloud, ' + j.hourly.precipitation_probability[20] + '% rain';
    } },
  { name: 'Open-Meteo air quality (haze forecast)', page: 'haze.html outlook, dashboard haze for future dates',
    run: async () => {
      const h = await H.fetchForecast(7);
      const n = H.nightlyFromForecast(h);
      need(n.length >= 4, 'only ' + n.length + ' nights');
      need(n.some((x) => x.aod != null), 'no aerosol optical depth');
      return n.length + ' nights forecast';
    } },
  { name: 'Open-Meteo upper winds (smoke transport)', page: 'haze.html "which way is the smoke blowing"',
    run: async () => {
      const t = await H.fetchTransport(sgDate(0), 21);
      need(t && t.dir != null, 'no wind direction');
      return 'from ' + Math.round(t.dir) + '° at ' + t.level;
    } },
  { name: 'NASA GIBS satellite imagery', page: 'haze.html satellite layers',
    run: async () => {
      const r = await getOK(H.satURL('truecolor', sgDate(-1), 270, 160), 'image/');
      need(r.bytes > 3000, 'image suspiciously small (' + r.bytes + ' bytes)');
      const r2 = await getOK(H.satURL('himawari', H.satInstant(), 270, 160), 'image/');
      need(r2.bytes > 2000, 'Himawari image suspiciously small');
      return 'true-colour ' + Math.round(r.bytes / 1024) + ' KB, Himawari ' + Math.round(r2.bytes / 1024) + ' KB';
    } },
  { name: 'MSS haze satellite pointer (nea-haze.json)', page: 'haze.html NEA/MSS layer',
    run: async () => {
      const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'nea-haze.json'), 'utf8'));
      need(j.image, 'no image in nea-haze.json');
      const m = j.image.match(/_(\d{8})_/);
      const age = m ? (Date.now() - Date.parse(m[1].slice(0, 4) + '-' + m[1].slice(4, 6) + '-' + m[1].slice(6, 8))) / 864e5 : null;
      await getOK(j.image, 'image/');
      need(age == null || age < 5, 'the newest MSS scene is ' + Math.round(age) + ' days old — the hourly refresh job may be failing');
      return 'scene ' + (m ? m[1] : '?') + ' answers';
    } },
  { name: 'MSS rain radar (weather.gov.sg)', page: 'dashboard radar card',
    run: async () => {
      for (let k = 0; k < 6; k++) {
        const t = new Date(Math.floor((Date.now() + 8 * 3600e3 - (k * 5 + 2) * 60000) / 300000) * 300000);
        const stamp = '' + t.getUTCFullYear() + pad(t.getUTCMonth() + 1) + pad(t.getUTCDate()) + pad(t.getUTCHours()) + pad(t.getUTCMinutes());
        try { await getOK('https://www.weather.gov.sg/files/rainarea/50km/v2/dpsri_70km_' + stamp + '0000dBR.dpsri.png', 'image/'); return 'frame ' + stamp + ' answers'; } catch (e) { /* try older */ }
      }
      throw new Error('no radar frame in the last 30 minutes');
    } },
  { name: 'CelesTrak ISS / Tiangong orbits', page: 'dashboard passes, sky-events.html transits',
    run: async () => {
      const r = await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE');
      need(r.ok, 'HTTP ' + r.status);
      const t = await r.text();
      need(/^1 25544/m.test(t) && /^2 25544/m.test(t), 'no ISS TLE in the reply');
      const ep = t.match(/^1 25544\S*\s+\S+\s+(\d{2})(\d{3})/m);
      if (ep) {
        const d = new Date(Date.UTC(2000 + +ep[1], 0, 1) + (+ep[2] - 1) * 864e5);
        need((Date.now() - d) / 864e5 < 7, 'ISS elements are ' + Math.round((Date.now() - d) / 864e5) + ' days old');
      }
      return 'ISS elements current';
    } },
  { name: 'NASA SDO live Sun image', page: 'solar.html',
    run: async () => { const r = await getOK('https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_HMIIC.jpg', 'image/'); return Math.round(r.bytes / 1024) + ' KB'; } },
  { name: 'NOAA SWPC space weather', page: 'solar.html sunspot & flare panel',
    run: async () => {
      const a = await getJSON('https://services.swpc.noaa.gov/json/solar_regions.json');
      const b = await getJSON('https://services.swpc.noaa.gov/products/summary/10cm-flux.json');
      const c = await getJSON('https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json');
      need(Array.isArray(a) && b && Array.isArray(c), 'unexpected shape');
      return a.length + ' sunspot-region records, flux ' + (b.Flux || '?');
    } },
  { name: 'Live site version matches the repo', page: 'every page (installed apps)', soft: true,   /* the deploy job checks this too */
    run: async () => {
      const local = fs.readFileSync(path.join(ROOT, 'version.js'), 'utf8').match(/SCOB_VERSION\s*=\s*'([^']+)'/)[1];
      const r = await fetch('https://afbooster.online/version.js?_=' + Date.now());
      need(r.ok, 'HTTP ' + r.status);
      const live = ((await r.text()).match(/SCOB_VERSION\s*=\s*'([^']+)'/) || [])[1];
      need(live === local, 'live site serves ' + live + ' but the repo is at ' + local);
      return live;
    } }
];

(async () => {
  const rows = [];
  for (const c of CHECKS) {
    let ok = false, note = '', tries = 0;
    while (!ok && tries < 2) {
      tries++;
      try { note = await c.run(); ok = true; }
      catch (e) { note = (e && e.name === 'AbortError') ? 'timed out after ' + TIMEOUT / 1000 + ' s' : String(e && e.message || e); if (tries < 2) await new Promise((r) => setTimeout(r, 4000)); }
    }
    rows.push({ c, ok, note });
    console.log((ok ? 'PASS ' : (c.soft ? 'WARN ' : 'FAIL ')) + c.name + ' — ' + note);
  }
  const hard = rows.filter((r) => !r.ok && !r.c.soft);
  const soft = rows.filter((r) => !r.ok && r.c.soft);
  const when = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') + ' SGT';
  let md = '## SCOB data-source check — ' + when + '\n\n'
    + (hard.length ? '**' + hard.length + ' source(s) failing.** The pages listed below are showing "no data" or a fallback until this is fixed.\n\n'
                   : '**All ' + rows.length + ' sources answered as expected.**' + (soft.length ? ' (' + soft.length + ' fallback endpoint(s) not answering — not urgent.)' : '') + '\n\n')
    + '| | Source | What it feeds | Result |\n|---|---|---|---|\n'
    + rows.map((r) => '| ' + (r.ok ? '✅' : (r.c.soft ? '⚠️' : '❌')) + ' | ' + r.c.name + ' | ' + r.c.page + ' | ' + r.note.replace(/\|/g, '/') + ' |').join('\n') + '\n';
  const i = process.argv.indexOf('--md');
  if (i > 0 && process.argv[i + 1]) fs.writeFileSync(process.argv[i + 1], md);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  console.log(hard.length ? '\n' + hard.length + ' FAILING' : '\nALL SOURCES OK');
  process.exit(hard.length ? 1 : 0);
})();
