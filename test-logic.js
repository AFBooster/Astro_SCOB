#!/usr/bin/env node
/* SCOB Night-Sky — interactive-logic regression tests.
 *
 * test-astro.js guards the astronomy engine; test-pages.js proves every page
 * loads and runs without crashing. Neither exercises the DECISION logic inside
 * the interactive pages — the eyepiece recommender's ranking, the Seestar
 * frame-fit thresholds, the finder's Identify-mode "what am I pointing at",
 * the distance-ladder number formatting. A wrong-but-not-crashing change there
 * would sail past both other suites. This file calls those functions directly,
 * in the same stub DOM test-pages.js uses, and asserts on their output.
 *
 * Dependency-free (reuses test-pages.js's harness). Run:  node test-logic.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { makeContext, inlineScripts, externalScripts } = require('./test-pages.js');

const DIR = __dirname;
let fails = 0;
function ok(name, cond, detail) {
  console.log((cond ? '  \x1b[32m/\x1b[0m ' : '  \x1b[31mx\x1b[0m ') + name + (cond ? '' : '  \x1b[31m<-- ' + (detail || 'FAILED') + '\x1b[0m'));
  if (!cond) fails++;
}
function section(t) { console.log('\n\x1b[1m' + t + '\x1b[0m'); }

// Load a page's scripts into a fresh stub-DOM context and hand it back.
function loadPage(file) {
  const html = fs.readFileSync(path.join(DIR, file), 'utf8');
  const ctx = makeContext(html, file);
  vm.createContext(ctx);
  for (const src of externalScripts(html)) {
    if (/^https?:/i.test(src)) continue;
    vm.runInContext(fs.readFileSync(path.join(DIR, src), 'utf8'), ctx);
  }
  for (const code of inlineScripts(html)) vm.runInContext(code, ctx);
  return ctx;
}
const strip = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

/* ============================================================= eyepiece recommender */
section('Eyepiece recommender (eyepiece-fov.html)');
(function () {
  const ctx = loadPage('eyepiece-fov.html');
  const $ = id => ctx.document.getElementById(id);
  function reco(ap, fl, targetIdx) {
    $('ap').value = String(ap); $('fl').value = String(fl); $('target').value = String(targetIdx);
    ctx.recommend();
    return { recos: strip($('recos').innerHTML), note: strip($('recnote').innerHTML) };
  }
  // TARGETS index reference (from the page): 0 Full Moon, 2 Jupiter disc, 4 Saturn, 6 M42, 12 Albireo
  const jup = reco(406, 4064, 2);                       // 40 cm dome on Jupiter
  ok('40 cm dome + Jupiter recommends the 25 mm', /25 mm/.test(jup.recos), jup.recos.slice(0, 80));
  ok('  …and explains ceilings in the note', /useful limit|Singapore/.test(jup.note), jup.note.slice(0, 60));

  const see = reco(30, 150, 2);                          // Seestar — sealed, no eyepiece
  ok('Seestar (30 mm f/5) says it takes no eyepiece', /no eyepiece/i.test(see.recos), see.recos.slice(0, 80));

  const m42 = reco(203, 2032, 6);                        // 20 cm SCT on the Orion Nebula (faint, wide)
  ok('20 cm + M42 returns at least one ranked eyepiece', /mm/.test(m42.recos) && !/no eyepiece/i.test(m42.recos), m42.recos.slice(0, 80));

  // over-magnification guard: a tiny scope on a planet should never rank a 6 mm past the seeing cap
  const tiny = reco(60, 900, 2);                         // 60 mm f/15 on Jupiter (cap ~120x)
  ok('over-magnifying eyepieces are ruled out (no 300x+ winner)', !/\b[3-9]\d\d×|\b[3-9]\d\d x/.test(tiny.recos), tiny.recos.slice(0, 80));
})();

/* ============================================================= Seestar frame-fit */
section('Seestar frame-fit thresholds (seestar.html)');
(function () {
  const ctx = loadPage('seestar.html');
  const ff = ctx.frameFit;
  ok('FOV long side is 2.1°', ctx.FOV_W === 2.1, String(ctx.FOV_W));
  ok('30′ target frames well', ff(30)[0] === 'fits', JSON.stringify(ff(30)));
  ok('100′ target fills the frame', ff(100)[0] === 'tight', JSON.stringify(ff(100)));
  ok('180′ target overflows', ff(180)[0] === 'over', JSON.stringify(ff(180)));
  ok('600′ target is far too big', ff(600)[0] === 'over' && /too big|mosaic/i.test(ff(600)[1]), JSON.stringify(ff(600)));
  ok('bestNow / renderTable run without throwing', (function () { try { ctx.bestNow(); ctx.renderTable(); return true; } catch (e) { return false; } })());
})();

/* ============================================================= finder Identify mode */
section('Finder Identify mode (sky-finder.html)');
(function () {
  const ctx = loadPage('sky-finder.html');
  const cand = ctx.idCandidates();
  ok('idCandidates() returns bright objects that are up now', Array.isArray(cand) && cand.length >= 1, 'got ' + (cand && cand.length));
  // Aim the phone at a fixed direction and confirm renderIdentify names the truly-nearest candidate.
  ctx.MODE = 'identify'; ctx.heading = 120; ctx.pitch = 45;
  // compute the expected nearest ourselves (same great-circle formula the page uses)
  const RAD = Math.PI / 180;
  function sep(a1, z1, a2, z2) { const c = Math.sin(a1 * RAD) * Math.sin(a2 * RAD) + Math.cos(a1 * RAD) * Math.cos(a2 * RAD) * Math.cos((z1 - z2) * RAD); return Math.acos(Math.max(-1, Math.min(1, c))) / RAD; }
  const expect = cand.map(o => ({ n: o.sp.name, s: sep(45, 120, o.alt, o.az) })).sort((a, b) => a.s - b.s)[0];
  ctx.renderIdentify();
  const shown = strip(ctx.document.getElementById('hitNm').textContent);
  ok('renderIdentify names the nearest object to the aim', shown === expect.n, 'showed "' + shown + '", nearest is "' + expect.n + '"');
  // mode switch must not throw and must set the body flag
  let switched = true; try { ctx.setMode('identify'); } catch (e) { switched = false; }
  ok('setMode(identify) runs cleanly', switched);
})();

/* ============================================================= distance-ladder formatting */
section('Distance-ladder number formatting (scale-model.html)');
(function () {
  const ctx = loadPage('scale-model.html');
  const LY = 9.4607e15, log10 = x => Math.log(x) / Math.LN10;
  const f = ctx.fmtLy;
  ok('4.2 ly → "4 ly"', f(log10(4.246 * LY)) === '4 ly', f(log10(4.246 * LY)));
  ok('26,000 ly → "26 thousand ly"', f(log10(26000 * LY)) === '26 thousand ly', f(log10(26000 * LY)));
  ok('2.5 Mly → "million ly"', /million ly$/.test(f(log10(2.537e6 * LY))), f(log10(2.537e6 * LY)));
  ok('near the observable edge → "billion ly"', /billion ly$/.test(f(log10(4.65e26))), f(log10(4.65e26)));
  // v3.41 "where does it end" — big model distances shown as everyday journeys, not raw km
  const hr = ctx.humanRef;
  ok('humanRef exists', typeof hr === 'function', typeof hr);
  if (typeof hr === 'function') {
    ok('~32,000 km → "around the Earth"', /around the Earth/.test(hr(32225000)), hr(32225000));
    ok('~86,000 km → "2.x times around the Earth"', /times around the Earth/.test(hr(86362000)), hr(86362000));
    ok('~390,000 km → "distance to the Moon"', /distance to the Moon/.test(hr(390000000)), hr(390000000));
    ok('a few hundred km → a Singapore-relative journey, not raw km', /Singapore/.test(hr(1000000)), hr(1000000));
    ok('never dumps a huge raw kilometre figure', !/\d{4,}\s*km/.test(hr(32225000) + ' ' + hr(86362000)), hr(86362000));
  }
})();

/* ============================================================= dashboard blurb (no-crash guard) */
section('Dashboard share-blurb generator (scob-dashboard-v3.html)');
(function () {
  const ctx = loadPage('scob-dashboard-v3.html');
  ok('tonightBlurb is defined', typeof ctx.tonightBlurb === 'function', typeof ctx.tonightBlurb);
  // The dashboard boot populates GL in the stub, so this produces a real blurb.
  let out = '', threw = false; try { out = ctx.tonightBlurb(); } catch (e) { threw = true; }
  ok('tonightBlurb() runs without throwing', !threw);
  ok('  blurb names the observatory and session time', /Science Centre Observatory/.test(out) && /7:30/.test(out), out.slice(0, 70));
  ok('  blurb is a complete, non-trivial sentence', out.length > 80 && /welcome|turn up/i.test(out), out.length + ' chars');
  ok('applyNavFilter is exposed for the menu filter', typeof ctx.applyNavFilter === 'function', typeof ctx.applyNavFilter);
})();

/* ===================================================== culture pages are credited in About =====
 * Release-hygiene guard: every "culture sky" feature (a `<x>-sky.html` explainer that also has a
 * `<x>-tonight.html` live page) MUST be linked from about.html's credits, so the About & Credits
 * page can never silently fall behind a release. Auto-discovers culture pages — add a new culture
 * and this check will require its credit automatically, no edit here needed. */
section('Culture pages are credited on the About page (about.html)');
(function () {
  const about = fs.readFileSync(path.join(DIR, 'about.html'), 'utf8');
  const cultures = fs.readdirSync(DIR)
    .filter(f => /^[a-z]+-sky\.html$/.test(f))
    .map(f => f.replace('-sky.html', ''))
    .filter(base => fs.existsSync(path.join(DIR, base + '-tonight.html')));  // has a live "tonight" sibling
  ok('found culture pages to check', cultures.length > 0, cultures.join(', ') || 'none');
  cultures.forEach(base => {
    ok('about.html links ' + base + '-sky.html', about.includes(base + '-sky.html'),
       'add a credit + link for ' + base + '-sky.html to about.html');
    ok('about.html links ' + base + '-tonight.html', about.includes(base + '-tonight.html'),
       'add a credit + link for ' + base + '-tonight.html to about.html');
  });
})();

// ── v4.24: the v4.21 visitor modules ─────────────────────────────────────────
// They run outside a page, so each gets a small context of its own: a fixed clock, a
// stubbed fetch and localStorage. What is checked is the decision, not the network.
function moduleCtx(files, nowISO, fetchStub, store) {
  const T0 = Date.parse(nowISO), RealDate = Date;
  class FixedDate extends RealDate { constructor(...a) { super(...(a.length ? a : [T0])); } static now() { return T0; } }
  const mem = Object.assign({}, store || {});
  const ctx = { console, Promise, JSON, Math, RegExp, Array, Object, String, Number, Error, setTimeout, clearTimeout, encodeURIComponent, unescape,
    Date: FixedDate,
    localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } },
    document: { readyState: 'loading', addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {} }), head: { appendChild() {} }, querySelector: () => null },
    fetch: fetchStub || (() => Promise.reject(new Error('offline'))) };
  ctx.window = ctx; vm.createContext(ctx);
  files.forEach(f => vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), ctx));
  return ctx;
}
const jsonRes = o => Promise.resolve({ ok: true, json: () => Promise.resolve(o), text: () => Promise.resolve(JSON.stringify(o)) });
function wxStub(day, cc, pp, code, psi, nea) {
  return url => {
    if (/api\.open-meteo\.com/.test(url)) {
      const t = [...Array(24)].map((_, h) => day + 'T' + String(h).padStart(2, '0') + ':00');
      return jsonRes({ hourly: { time: t, cloud_cover: t.map(() => cc), precipitation_probability: t.map(() => pp), weather_code: t.map(() => code) } });
    }
    if (/2-hour-weather-forecast/.test(url)) return jsonRes({ items: [{ forecasts: [{ area: 'Jurong West', forecast: nea }] }] });
    if (/real-time\/api\/psi/.test(url)) return jsonRes({ data: { items: [{ readings: { psi_twenty_four_hourly: { west: psi } } }] } });
    return Promise.reject(new Error('blocked'));
  };
}

section('Should I come tonight? (come-tonight.js)');
(function () {
  let c = moduleCtx(['come-tonight.js'], '2026-11-06T10:00:00Z');          // Friday 6 pm SGT
  let S = c.ComeTonight.session();
  ok('Friday 6 pm → the session is tonight', S.tonight && S.ymd === '2026-11-06', JSON.stringify(S));
  c = moduleCtx(['come-tonight.js'], '2026-11-06T14:30:00Z');              // Friday 10:30 pm
  S = c.ComeTonight.session();
  ok('Friday after 10 pm → next Friday', !S.tonight && S.ymd === '2026-11-13' && S.daysAhead === 7, JSON.stringify(S));
  c = moduleCtx(['come-tonight.js'], '2026-11-03T02:00:00Z');              // Tuesday
  ok('Tuesday → this Friday, 3 days ahead', c.ComeTonight.session().daysAhead === 3);
  ok('cloud thresholds match the dashboard (30 / 65 %)', c.ComeTonight.cloudLevel(30, 29) === 'go' && c.ComeTonight.cloudLevel(31, 0) === 'maybe' && c.ComeTonight.cloudLevel(66, 0) === 'no');
  const cases = [
    ['clear, clean air', [15, 10, 1, 40, 'Fair (Night)'], 'go', 'cloud'],
    ['clear but PSI 140', [15, 10, 1, 140, 'Fair (Night)'], 'maybe', 'haze'],
    ['clear but PSI 230', [15, 10, 1, 230, 'Fair (Night)'], 'no', 'haze'],
    ['part cloud, NEA thundery showers', [40, 40, 95, 40, 'Thundery Showers'], 'no', 'storm'],
    ['overcast', [85, 70, 61, 40, 'Cloudy'], 'no', 'cloud']
  ];
  return Promise.all(cases.map(([name, a, lvl, cause]) => {
    const cx = moduleCtx(['come-tonight.js'], '2026-11-06T10:00:00Z', wxStub('2026-11-06', ...a));
    return cx.ComeTonight.check().then(r => ok(name + ' → ' + lvl + ' (' + cause + ')', r.level === lvl && r.cause === cause, r.level + ' / ' + r.cause));
  }));
})().then(() => {

section('Add to calendar (scob-ics.js)');
(function () {
  const c = moduleCtx(['scob-ics.js'], '2026-11-06T10:00:00Z');
  const t = c.SCOBICS.text([
    { title: '2P/Encke 恩克彗星 在西方低空 — ' + 'x'.repeat(60), start: Date.UTC(2027, 0, 20, 12, 30), end: Date.UTC(2027, 0, 20, 13, 30), alarm: 60 },
    { title: 'Eclipse', start: '2027-08-02', allDay: true, loc: '' },
    c.SCOBICS.sessionsEvent()
  ]);
  const lines = t.split('\r\n');
  ok('CRLF line endings, wrapped in VCALENDAR', /^BEGIN:VCALENDAR\r\n/.test(t) && /END:VCALENDAR\r\n$/.test(t) && !/[^\r]\n/.test(t));
  ok('every line ≤ 75 octets (multi-byte titles folded safely)', lines.every(l => Buffer.byteLength(l, 'utf8') <= 75), lines.find(l => Buffer.byteLength(l, 'utf8') > 75));
  ok('folding keeps the Chinese title intact', t.replace(/\r\n /g, '').includes('恩克彗星 在西方低空'));
  ok('timed event in UTC', t.includes('DTSTART:20270120T123000Z') && t.includes('TRIGGER:-PT60M'));
  ok('all-day event uses VALUE=DATE, next-day end, no empty LOCATION', t.includes('DTSTART;VALUE=DATE:20270802') && t.includes('DTEND;VALUE=DATE:20270803') && !/LOCATION:\r\n/.test(t));
  ok('Friday sessions repeat weekly from a Friday 7:30 pm SGT', t.includes('RRULE:FREQ=WEEKLY;BYDAY=FR') && /DTSTART:\d{8}T113000Z/.test(t));
  ok('the session entry says tickets are needed', /Tickets are needed/.test(t.replace(/\r\n /g, '')));
})();

section('Search (search-index.js)');
(function () {
  const c = moduleCtx(['search-index.js'], '2026-11-06T10:00:00Z');
  const top = q => (c.SCOBSearch.find(q)[0] || { p: {} }).p.f;
  ok('"psi" → the haze page first', top('psi') === 'haze.html', top('psi'));
  ok('"psi" does not match inside "upside"', !c.SCOBSearch.find('psi').some(h => h.p.f === 'hemispheres.html'));
  ok('"saturn" finds the planner and the planets page', ['scob-dashboard-v3.html', 'solar-system-planets.html'].every(f => c.SCOBSearch.find('saturn').some(h => h.p.f === f)));
  ok('"eyepieces" (plural) finds the eyepiece pages', c.SCOBSearch.find('eyepieces').filter(h => /eyepiece/.test(h.p.f)).length === 2);
  ok('nonsense finds nothing', c.SCOBSearch.find('zzqqxx').length === 0);
})();

section('Languages (scob-i18n.js)');
(function () {
  let c = moduleCtx(['scob-i18n.js'], '2026-11-06T10:00:00Z', null, { scobLang: 'zh' });
  ok('an old per-page choice (scobLang) no longer turns the site Chinese', c.SCOBI18N.lang() === 'en');
  c = moduleCtx(['scob-i18n.js'], '2026-11-06T10:00:00Z', null, { scobSiteLang: 'ta' });
  ok('the site-wide choice (scobSiteLang) is honoured', c.SCOBI18N.lang() === 'ta');
  ok('a summary template keeps its placeholders filled', !/\{|\}/.test(c.SCOBI18N.t('dash', 'go', { when: 'x', cc: 10, pp: '5%' })));
  const D = c.SCOBI18N.DASH, missing = [];
  ['zh', 'ms', 'ta'].forEach(l => Object.keys(D.en).forEach(k => { if (D[l][k] == null) missing.push(l + ':' + k); }));
  ok('every English summary word has zh / ms / ta', missing.length === 0, missing.slice(0, 6).join(', '));
})();

section('Made of Stars (made-of-stars.html)');
(function () {
  const ctx = loadPage('made-of-stars.html'), M = ctx.MOS, $ = id => ctx.document.getElementById(id);
  ok('the page exposes its test hook', !!M && Array.isArray(M.ELS));
  const E = M.ELS, sym = s => E.find(e => e.s === s);
  ok('118 elements in atomic-number order', E.length === 118 && E.every((e, i) => e.z === i + 1) && E[25].s === 'Fe' && E[78].s === 'Au' && E[91].s === 'U' && E[117].s === 'Og');
  const badShare = E.filter(e => Math.abs(e.o.reduce((a, x) => a + x[1], 0) - 1) > 1e-9 || e.o.some(x => !M.K[x[0]]));
  ok('every element’s kitchen shares add up to 1 and name a real kitchen', badShare.length === 0, badShare.map(e => e.s).join(' '));
  const cells = E.map(e => M.pos(e.z).join(','));
  ok('no two elements share a periodic-table cell', new Set(cells).size === 118);
  ok('hydrogen comes only from the Big Bang', sym('H').o.length === 1 && sym('H').o[0][0] === 'bb');
  ok('oxygen from exploding giant stars, beryllium from cosmic rays', sym('O').o[0][0] === 'mx' && sym('Be').o[0][0] === 'cr');
  ok('gold and uranium from colliding neutron stars; lead mostly the slow lane', sym('Au').o[0][0] === 'ns' && sym('U').o[0][0] === 'ns' && sym('Pb').o[0][0] === 'lm');
  ok('iron: more than half from exploding white dwarfs', sym('Fe').o[0][0] === 'wd' && /More than half from exploding white dwarfs/.test(M.originWords(sym('Fe'))), M.originWords(sym('Fe')));
  ok('technetium & promethium: made, but none left; neptunium onward: people', sym('Tc').o[0][0] === 'rad' && sym('Pm').o[0][0] === 'rad' && E.slice(92).every(e => e.o[0][0] === 'hm'));
  ok('three kinds of atoms 3 minutes in; all 92 by the Sun’s birth', M.kindsAt(M.EV[1].a) === 3 && M.kindsAt(M.T0 - 4.567) === 92, M.kindsAt(M.EV[1].a) + ' / ' + M.kindsAt(M.T0 - 4.567));
  ok('timeline stops run forwards in time, Big Bang to today', M.EV.every((e, i) => i === 0 || e.a > M.EV[i - 1].a) && M.EV[0].a === 0 && M.EV[M.EV.length - 1].a === M.T0);
  let up = true; for (let a = 0; a < M.T0; a += 0.05) if (M.zAt(a + 0.05) < M.zAt(a)) up = false;
  ok('heavy elements only ever build up, ≈ 1.4% when the Sun forms', up && Math.abs(M.zAt(M.T0 - 4.567) - 1.4) < 0.02);
  const cal = M.cosmicCalendar;
  ok('cosmic calendar: Big Bang 1 Jan 00:00, Sun early September, humans ~23:48 on 31 Dec', cal(0) === '1 Jan, 00:00' && /^2 Sep/.test(cal(M.T0 - 4.567)) && /^31 Dec, 23:48/.test(cal(M.T0 - 300000e-9)) && /now/.test(cal(M.T0)), [cal(M.T0 - 4.567), cal(M.T0 - 300000e-9)].join(' | '));
  ok('“how long ago” reads naturally', M.fmtAgo(M.T0) === '13.8 billion years ago' && M.fmtAgo(66e-3) === '66 million years ago' && /^9 years ago \(\d{4}\)$/.test(M.fmtAgo(9e-9)), M.fmtAgo(66e-3));
  ok('squeezed star: hydrogen = 1 year, carbon ≈ 41 minutes, silicon in thousandths of a second', M.squeeze(M.STG[0].y) === '1 year' && M.squeeze(M.STG[2].y) === '41 minutes' && /thousandths/.test(M.squeeze(M.STG[5].y)));
  const w = M.waffle('weight'), at = M.waffle('atoms');
  ok('body by weight: 100 squares, 10 of them Big Bang hydrogen', w.sq.length === 100 && w.byK.bb === 10 && w.cnt[0] === 65, JSON.stringify(w.byK));
  ok('body by atoms: 62 squares of hydrogen', at.sq.length === 100 && at.byK.bb === 62, JSON.stringify(at.byK));
  M.setMode('scale'); M.TL.age = M.T0; M.tlSet();
  ok('true-to-scale mode at the end shows “You”', strip($('evT').textContent) === 'You' && strip($('rAgo').textContent) === 'Now');
  M.setMode('story'); M.TL.i = 11; M.tlSet();
  ok('story stop 12 is the Sun’s birth, with the meter at 1.4%', /Sun and planets/.test($('evT').textContent) && $('rZ').textContent === '1.4%', $('evT').textContent + ' · ' + $('rZ').textContent);
  M.ptShow(79);
  ok('tapping gold shows its story', /Gold/.test($('ptd').innerHTML) && /colliding neutron stars/.test($('ptd').innerHTML));
  const tn = strip($('tn').innerHTML);
  ok('“see it tonight” lists the life stages with heights', /Orion Nebula/.test(tn) && /Ring Nebula/.test(tn) && /(up in the|below the horizon|low —)/.test(tn));
})();

section('Reading Starlight (spectroscopy.html)');
(function () {
  const ctx = loadPage('spectroscopy.html'), S = ctx.SPEC, $ = id => ctx.document.getElementById(id);
  ok('the page exposes its test hook', !!S && Array.isArray(S.MYS) && typeof S.rydberg === 'function');
  const J = n => S.JUMPS.find(j => j.n === n);
  ok('hydrogen’s visible lines come out of the Rydberg formula (air wavelengths, ±0.02 nm)', Math.abs(J('Hα').l - 656.28) < 0.02 && Math.abs(J('Hβ').l - 486.13) < 0.02 && Math.abs(J('Hγ').l - 434.05) < 0.02 && Math.abs(J('Hδ').l - 410.17) < 0.02, S.JUMPS.map(j => j.l.toFixed(2)).join(' '));
  ok('Lyman-α is 121.57 nm (ultraviolet, 10.2 eV); Paschen-α 1,875 nm (infrared)', Math.abs(J('Lyman-α').l - 121.57) < 0.02 && Math.abs(J('Lyman-α').ev - 10.2) < 0.01 && Math.abs(J('Paschen-α').l - 1875) < 1.5);
  ok('the Hα photon carries exactly the 1.89 eV gap between rungs 3 and 2', Math.abs(J('Hα').ev - (S.levelE(3) - S.levelE(2))) < 0.005 && Math.abs(J('Hα').ev - 1.889) < 0.005, J('Hα').ev);
  ok('Wien’s law: the Sun (5,772 K) is brightest at 502 nm', Math.abs(S.wien(5772) - 502) < 1, S.wien(5772));
  const c = T => S.bbColor(T);
  ok('star colours: Betelgeuse orange, the Sun near-white, Spica blue-white', c(3600)[0] > c(3600)[1] && c(3600)[1] > c(3600)[2] && Math.min.apply(null, c(5772)) > 220 && c(25000)[2] > c(25000)[0], [c(3600), c(5772), c(25000)].join(' | '));
  ok('star classes by temperature run O B A F G K M', ['40000O', '25000B', '9940A', '6530F', '5772G', '4300K', '3600M'].every(x => S.classOf(+x.slice(0, -1)).c === x.slice(-1)));
  ok('the temperature slider round-trips (Sun → 5,772 K ± 1%)', Math.abs(S.v2t(S.t2v(5772)) / 5772 - 1) < 0.01);
  ok('Doppler: 1,100 km/s moves Hα 2.41 nm redder; 3C 273’s z = 0.158 puts Hβ at 563 nm', Math.abs(S.dopShift(656.28, 1100) - 2.408) < 0.005 && Math.abs(486.13 * 1.158 - 562.9) < 0.1);
  ok('every mystery is solvable: all the lines of each answer element are in its spectrum', S.MYS.every((m, i) => S.detEval(i, m.req.concat(m.opt)).solved && m.req.concat(m.opt).every(k => S.matchEl(k, m.f).all)));
  ok('…and the required elements alone already solve each one', S.MYS.every((m, i) => S.detEval(i, m.req).solved));
  ok('the Sun: no helium lines; hydrogen, sodium, magnesium and calcium are not enough without iron', !S.matchEl('He', S.MYS[0].f).all && !S.detEval(0, ['H', 'Na', 'Mg', 'Ca']).solved && S.detEval(0, ['H', 'Na', 'Mg', 'Ca', 'Fe']).solved);
  const ne = S.matchEl('Ne', S.MYS[4].f);
  ok('a coincidence is not a match: two neon lines land on the Orion Nebula’s, the rest do not', ne.hit > 0 && ne.hit < ne.n && !S.detEval(4, ['H', 'O', 'Ne']).solved, ne.hit + ' of ' + ne.n);
  S.pickMys(3); ['Na', 'Ca', 'TiO'].forEach(k => S.toggleEl(k)); S.detCheck();
  ok('solving Betelgeuse with titanium oxide, sodium and calcium scores it', /good/.test($('detV').className) && S.DET.solved.betel === true && /Solved: 1 of 7/.test($('detScore').textContent), $('detV').innerHTML);
  S.pickMys(0); ['H', 'He'].forEach(k => S.toggleEl(k)); S.detCheck();
  ok('a wrong element is called out', /bad/.test($('detV').className) && /helium/.test($('detV').innerHTML));
  const F = S.filterStats();
  ok('the Seestar’s dual-band filter keeps ~90% of the nebula but only ~11% of LED glow', F.neb > 0.85 && F.city < 0.15 && F.gain > 6, JSON.stringify(F));
  S.setT(5772);
  ok('the Sun on the thermometer: class G, brightest at 502 nm', /^G/.test($('bbCl').textContent) && /502 nm/.test($('bbPk').textContent), $('bbCl').textContent + ' · ' + $('bbPk').textContent);
  S.setT(40000);
  ok('a 40,000 K star peaks in the ultraviolet', /ultraviolet/.test($('bbPk').textContent) && /^O/.test($('bbCl').textContent));
  S.setPreset('vir');
  ok('the Virgo Cluster preset shows a 2.41 nm redshift', /\+2\.41 nm/.test($('dvS').textContent), $('dvS').textContent);
  S.setPreset('p51');
  ok('51 Pegasi: a wobble of metres per second, far below a pixel', /56 m\/s/.test($('dvV').textContent) && /million/.test($('dvR').textContent), $('dvR').textContent);
  S.showEl('Na');
  ok('sodium’s barcode matches the Sun', /in the Sun ✓/.test($('barCap').innerHTML));
  S.showEl('He');
  ok('helium’s does not', /not a match/.test($('barCap').innerHTML));
  S.setAtMode('abs'); S.pickJump(0, true);
  ok('absorb mode explains the rung 2 → 3 climb', /Rung 2 → rung 3/.test($('atCap').innerHTML) && /656\.3 nm/.test($('atCap').innerHTML));
  S.setLab('em'); S.setGas('Ne');
  ok('the light lab switches to glowing neon', /neon/.test($('labCap').innerHTML) && /bright lines on black/.test($('labCap').innerHTML));
  S.tnRender();
  const tn = strip($('tn').innerHTML);
  ok('tonight’s star colours: 19 bright stars, hottest first, with heights', S.STARS.length === 19 && S.STARS.every((s, i) => i === 0 || s[4] <= S.STARS[i - 1][4]) && /Betelgeuse/.test(tn) && /(° up in the|below the horizon|low —)/.test(tn));
})();

console.log('');
if (fails) { console.error('\x1b[31m' + fails + ' logic check(s) FAILED — an interactive feature has regressed.\x1b[0m'); process.exit(1); }
console.log('\x1b[32mAll interactive-logic checks passed.\x1b[0m');
});
