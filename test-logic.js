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

console.log('');
if (fails) { console.error('\x1b[31m' + fails + ' logic check(s) FAILED — an interactive feature has regressed.\x1b[0m'); process.exit(1); }
console.log('\x1b[32mAll interactive-logic checks passed.\x1b[0m');
