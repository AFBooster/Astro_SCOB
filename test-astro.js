#!/usr/bin/env node
/* SCOB Night-Sky — astronomy regression test.
 * Loads astro-core.js and checks it against reference values that were independently
 * verified (NOAA solar algorithm + published almanac) for a fixed instant. Run in CI
 * before deploy:  node test-astro.js   (exits non-zero on any failure).
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'astro-core.js'), 'utf8');
eval(src);                                   // attaches globalThis.Astro
const A = globalThis.Astro;
if (!A) { console.error('astro-core did not load'); process.exit(2); }

let fails = 0;
function ok(name, got, exp, tol) {
  const pass = Math.abs(got - exp) <= tol;
  console.log((pass ? '  ✓ ' : '  ✗ ') + name + ': got ' + (Math.round(got * 100) / 100) + ', expected ' + exp + ' ±' + tol);
  if (!pass) fails++;
}

// Reference instant: 2026-07-10 20:30 SGT = 12:30 UTC (Science Centre Observatory).
const date = new Date(Date.UTC(2026, 6, 10, 12, 30, 0));
const s = A.sky(date);

console.log('Sidereal time & Sun');
ok('LST (deg)',  A.lstDeg(date), 219.68, 0.1);
ok('Sun altitude', s.sunAlt, -17.81, 0.1);
ok('Sun azimuth',  s.sunAz, 293.84, 0.1);

console.log('Moon');
ok('Moon illumination %', s.moon.illum, 21, 2);
ok('Moon altitude', s.moon.alt, -63.06, 0.2);

console.log('Planets (visibility pattern for July 2026: only Venus up in the evening)');
ok('Venus altitude', s.planets.Venus.alt, 23.48, 0.15);
ok('Venus magnitude', s.planets.Venus.mag, -4.01, 0.05);
ok('Jupiter altitude', s.planets.Jupiter.alt, -4.29, 0.15);
ok('Saturn altitude', s.planets.Saturn.alt, -64.08, 0.15);

console.log('Twilight (independently confirmed vs NOAA: sunset 7:16pm, astro-dark 8:30pm)');
function crossMs(fn, thr, a, b) { if ((fn(a) > thr) === (fn(b) > thr)) return null; for (let k = 0; k < 26; k++) { const m = (a + b) / 2; if ((fn(m) > thr) === (fn(a) > thr)) a = m; else b = m; } return (a + b) / 2; }
const sunF = t => A.sunAltAt(new Date(t));
const base = Date.UTC(2026, 6, 10, 10, 0, 0);
const sunsetMin = (crossMs(sunF, -0.833, base, base + 4 * 3600000) - base) / 60000 + 18 * 60; // minutes into the SGT day
const darkMin   = (crossMs(sunF, -18,     base, base + 6 * 3600000) - base) / 60000 + 18 * 60;
ok('Sunset (min after midnight SGT)', sunsetMin, 19 * 60 + 16, 3);   // 7:16pm
ok('Astro-dark (min after midnight SGT)', darkMin, 20 * 60 + 30, 3); // 8:30pm

console.log('Comet 10P/Tempel 2 (elements from MPEC 2024-D126; ref TheSkyLive 2026-06-15)');
const c10p = A.COMETS.find(c => c.id === '10p');
const ce = A.cometEq(c10p, new Date(Date.UTC(2026, 5, 15, 0, 0, 0)));
ok('Comet 10P RA (deg)', ce.ra, 308.94, 0.6);
ok('Comet 10P Dec (deg)', ce.dec, -9.2, 0.4);
ok('Comet 10P mag (~binocular)', ce.mag, 9.7, 0.6);
ok('activeComets in-window count', A.activeComets(new Date(Date.UTC(2026, 6, 15))).length, 1, 0.5);
ok('activeComets out-of-window count', A.activeComets(new Date(Date.UTC(2027, 0, 1))).length, 0, 0.5);

console.log('Moon libration (Meeus optical) & topocentric Moon');
const lb = A.libration(date);
ok('Libration longitude (deg)', lb.lon, -4.61, 0.4);
ok('Libration latitude (deg)', lb.lat, -6.65, 0.4);
const mt = A.moonTopo(date);
ok('Moon angular radius (deg)', mt.radius, 0.273, 0.02);
ok('Moon horizontal parallax (deg)', mt.par, 1.00, 0.06);

console.log('Lunar occultation scan (topocentric, from SCOB)');
const occ = A.occultations(new Date(Date.UTC(2026, 3, 20)), 14);
const reg = occ.filter(function (e) { return e.name === 'Regulus' && e.occult; })[0];
ok('Regulus occultation found ~26 Apr 2026', reg ? 1 : 0, 1, 0.5);
if (reg) ok('  Regulus min separation (deg)', reg.sep, 0.03, 0.2);

/* ---- Satellite transit geometry (v3.31) ----------------------------------
   SGP4 itself is satellite.js's job and is exercised in the browser. What is
   tested here is OUR half: the disc positions/radii and the minimum-finder,
   duration bisection and classification. A synthetic "satellite" is flown on a
   straight track past the disc centre at a known rate, so the correct answer is
   known analytically. */
console.log('Satellite transit geometry (synthetic track, analytic answer)');
const T0 = Date.UTC(2026, 7, 14, 4, 30, 0);          // ~12:30 SGT — Sun high over SCOB
const RD = Math.PI / 180, DG = 180 / Math.PI;
function _uv(az, alt) { const a = az * RD, h = alt * RD; return [Math.cos(h) * Math.cos(a), Math.cos(h) * Math.sin(a), Math.sin(h)]; }
function _cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function _norm(v) { const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; }
function synthSat(which, t0, rateDegPerSec, missDeg, rangeKm) {
  const b = A.discBody(which, new Date(t0)), u = _uv(b.az, b.alt);
  const e1 = _norm(_cross([0, 0, 1], u)), e2 = _norm(_cross(u, e1));
  return function (t) {
    const d = Math.tan(rateDegPerSec * (t - t0) / 1000 * RD), m = Math.tan(missDeg * RD);
    const v = _norm([u[0] + e1[0] * d + e2[0] * m, u[1] + e1[1] * d + e2[1] * m, u[2] + e1[2] * d + e2[2] * m]);
    return { alt: Math.asin(v[2]) * DG, az: ((Math.atan2(v[1], v[0]) * DG) % 360 + 360) % 360, range: rangeKm };
  };
}
const sunB = A.discBody('sun', new Date(T0));
ok('Sun angular radius mid-Aug (deg)', sunB.radius, 0.2631, 0.002);   // 959.63" / 1.0130 AU
let ev = A.transitScan(synthSat('sun', T0, 0.8, 0, 500), 'sun', T0 - 120000, T0 + 120000, { stepS: 20 });
ok('central solar transit: one event found', ev.length, 1, 0);
if (ev[0]) {
  ok('  timing error vs planned centre (s)', (ev[0].t - T0) / 1000, 0, 0.05);
  ok('  minimum separation (deg)', ev[0].sep, 0, 0.012);
  ok('  duration (s) = 2R/rate', ev[0].dur, 2 * sunB.radius / 0.8, 0.03);
  ok('  station apparent size at 500 km (arcsec)', ev[0].issDeg * 3600, 45.0, 1.5);
  ok('  classified as a full transit', ev[0].kind === 'full' ? 1 : 0, 1, 0);
}
ev = A.transitScan(synthSat('sun', T0, 0.8, 0.15, 500), 'sun', T0 - 120000, T0 + 120000, { stepS: 20 });
if (ev[0]) {
  ok('offset chord: minimum separation (deg)', ev[0].sep, 0.15, 0.012);
  ok('  chord duration (s) = 2*sqrt(R^2-d^2)/rate', ev[0].dur, 2 * Math.sqrt(sunB.radius * sunB.radius - 0.0225) / 0.8, 0.04);
}
ev = A.transitScan(synthSat('sun', T0, 0.8, 0.5, 500), 'sun', T0 - 120000, T0 + 120000, { stepS: 20 });
ok('0.5 deg pass reported as a near miss, not a transit', (ev[0] && ev[0].kind === 'miss') ? 1 : 0, 1, 0);
ev = A.transitScan(synthSat('sun', T0, 0.8, 3.0, 500), 'sun', T0 - 120000, T0 + 120000, { stepS: 20 });
ok('3 deg pass produces no event at all', ev.length, 0, 0);
let TM = null;
for (let h = 0; h < 72 && TM === null; h++) { const t = Date.UTC(2026, 7, 14) + h * 3600000; if (A.discBody('moon', new Date(t)).alt > 50) TM = t; }
const moonB = A.discBody('moon', new Date(TM));
ok('Moon angular radius (deg)', moonB.radius, 0.2683, 0.012);
ok('Moon topocentric parallax (deg)', moonB.par, 0.98, 0.06);
ev = A.transitScan(synthSat('moon', TM, 0.8, 0, 420), 'moon', TM - 120000, TM + 120000, { stepS: 20 });
ok('central lunar transit: one event found', ev.length, 1, 0);
if (ev[0]) ok('  duration (s) = 2R/rate', ev[0].dur, 2 * moonB.radius / 0.8, 0.03);

console.log('Catalogue sanity');
const m31 = A.SHOWPIECES ? null : null; // showpieces present?
ok('Showpiece count >= 40', A.SHOWPIECES.length, 42, 5);

/* ---- Dated-data review guards (v3.33) ------------------------------------
   Some numbers in this site are fitted to a moment in time and quietly go wrong
   afterwards: comet orbital elements, Jupiter's Great Red Spot longitude (its
   drift rate wanders year to year), and the CelesTrak TLE cache. Each carries a
   review date. These checks turn "nobody remembered" into a build failure. */
console.log('Dated-data review guards');
const today = new Date();
function reviewGuard(label, dueISO, graceDays) {
  const due = new Date(dueISO + 'T00:00:00Z');
  const daysLeft = Math.round((due - today) / 86400000);
  if (daysLeft > 30) { console.log('  ✓ ' + label + ': review due ' + dueISO + ' (' + daysLeft + ' days away)'); return; }
  if (daysLeft >= 0) { console.log('  ! ' + label + ': review due ' + dueISO + ' — ' + daysLeft + ' days left. Refresh it now, before it goes stale.'); return; }
  const over = -daysLeft;
  if (over <= (graceDays || 0)) { console.log('  ! ' + label + ': review was due ' + dueISO + ' (' + over + ' days ago) — inside the grace period, but fix it.'); return; }
  console.log('  ✗ ' + label + ': review was due ' + dueISO + ', ' + over + ' days ago. This data is now presumed WRONG.');
  fails++;
}
A.COMETS.forEach(function (c) {
  if (c.review) reviewGuard('Comet elements — ' + c.name, c.review, 30);
  const nowJD = A.jd(today);
  if (nowJD > c.to) console.log('  · ' + c.name + ' is past its visibility window and no longer listed to the public (this is by design).');
});
// The GRS marker lives in the dashboard; read it rather than duplicating the date here.
try {
  const dash = fs.readFileSync(path.join(__dirname, 'scob-dashboard-v3.html'), 'utf8');
  const m = dash.match(/REVIEW BY (\d{4}-\d{2}-\d{2})/);
  if (m) reviewGuard('Great Red Spot longitude (scob-dashboard-v3.html)', m[1], 60);
  else { console.log('  ✗ Great Red Spot review marker missing from scob-dashboard-v3.html'); fails++; }
} catch (e) { console.log('  · dashboard not readable here — skipping the GRS marker check'); }

console.log('');
if (fails) { console.error(fails + ' CHECK(S) FAILED — the astronomy engine has regressed, or dated data is overdue for review.'); process.exit(1); }
console.log('All astronomy checks passed.');
