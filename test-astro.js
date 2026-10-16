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

console.log('Comet 10P/Tempel 2 (JPL solution K265/56; ref JPL Horizons geocentric apparent place, equinox of date)');
const c10p = A.COMETS.find(c => c.id === '10p');
const ce = A.cometEq(c10p, new Date(Date.UTC(2026, 5, 15, 0, 0, 0)));
ok('Comet 10P RA 15 Jun (deg)', ce.ra, 309.341, 0.05);
ok('Comet 10P Dec 15 Jun (deg)', ce.dec, -9.113, 0.05);
/* Closest approach (0.42 au) is where a frame error shows most: before the v4.13
   precession fix this point was 76 arc-minutes out. Keep it tight. */
const ceAug = A.cometEq(c10p, new Date(Date.UTC(2026, 7, 10, 0, 0, 0)));
ok('Comet 10P RA 10 Aug, closest approach (deg)', ceAug.ra, 330.463, 0.05);
ok('Comet 10P Dec 10 Aug, closest approach (deg)', ceAug.dec, -27.901, 0.05);
const ceOct = A.cometEq(c10p, new Date(Date.UTC(2026, 9, 19, 0, 0, 0)));
ok('Comet 10P RA 19 Oct (deg)', ceOct.ra, 347.117, 0.05);
ok('Comet 10P Dec 19 Oct (deg)', ceOct.dec, -29.762, 0.05);
/* COBS weekly median for 28 Sep - 4 Oct 2026 was 10.1 (16 reports). */
ok('Comet 10P mag 2 Oct (COBS median 10.1)', A.cometEq(c10p, new Date(Date.UTC(2026, 9, 2, 12, 0, 0))).mag, 10.1, 0.3);
ok('Comet 10P mag (~binocular)', ce.mag, 9.7, 0.6);
/* v4.15 — engine audit against JPL Horizons (fetched 15 Oct 2026). */
console.log('Planet perturbations & star precession (v4.15, ref JPL Horizons apparent places)');
function sepArcmin(r1, d1, r2, d2) { const R = Math.PI / 180; return Math.acos(Math.min(1, Math.sin(d1 * R) * Math.sin(d2 * R) + Math.cos(d1 * R) * Math.cos(d2 * R) * Math.cos((r1 - r2) * R))) / R * 60; }
function planetAt(nm, iso) { const sp = A.SHOWPIECES.find(s => s.planet === nm); return A.positionOf(sp, new Date(iso)); }
let pz = planetAt('Saturn', '2026-10-16T12:30:00Z');
ok('Saturn 16 Oct 2026 vs JPL (arcmin; was 8 before perturbations)', sepArcmin(pz.ra, pz.dec, 10.59405, 1.61241), 0, 2);
pz = planetAt('Jupiter', '2027-03-19T12:00:00Z');
ok('Jupiter 19 Mar 2027 vs JPL (arcmin)', sepArcmin(pz.ra, pz.dec, 140.71933, 16.46798), 0, 1.5);
const pr = A.precessJ2000(41.054063, 49.227750, new Date(Date.UTC(2028, 10, 13, 4, 33, 36)));
ok('Precession, Meeus example 21.b RA', pr.ra, 41.5472, 0.002);
ok('Precession, Meeus example 21.b Dec', pr.dec, 49.3485, 0.002);
/* Lunar occultations of Antares seen from SCOB. Before v4.15 the star was compared at
   its J2000 place: 7 Sep 2027 was called an occultation (JPL: a 17' miss) and the
   28 Feb 2027 event was missed. JPL minimum separations from Horizons' topocentric Moon. */
const occA = A.occultations(new Date(Date.UTC(2027, 1, 20)), 220).filter(e => e.name === 'Antares');
const near = (iso) => occA.reduce((b, e) => (!b || Math.abs(e.t - Date.parse(iso)) < Math.abs(b.t - Date.parse(iso))) ? e : b, null);
let ocA = near('2027-06-17T13:11:00Z');
ok('Antares 17 Jun 2027 — time vs JPL (min)', (ocA.t - Date.parse('2027-06-17T13:11:00Z')) / 60000, 0, 4);
ok('Antares 17 Jun 2027 — is an occultation', ocA.occult ? 1 : 0, 1, 0);
ocA = near('2027-09-07T08:00:00Z');
ok('Antares 7 Sep 2027 — closest approach vs JPL (arcmin)', ocA.sep * 60, 17.1, 2);
ok('Antares 7 Sep 2027 — not called an occultation', ocA.occult ? 1 : 0, 0, 0);
/* JPL: 17.1' against a 15.3' radius — inside the engine's ~2' uncertainty, so it must
   be flagged as a graze rather than stated with confidence either way. */
ok('Antares 7 Sep 2027 — flagged too close to call', ocA.graze ? 1 : 0, 1, 0);
ocA = near('2027-02-28T08:10:00Z');
ok('Antares 28 Feb 2027 — time vs JPL (min)', (ocA.t - Date.parse('2027-02-28T08:10:00Z')) / 60000, 0, 4);
/* v4.18 — data accuracy pins. Each value below was wrong before the 16 Oct 2026 audit and
   was checked against SIMBAD, OpenNGC, the HYG star catalogue or JPL Horizons. */
console.log('Catalogue & sky-culture positions (v4.18 audit: SIMBAD / OpenNGC / HYG)');
const jb = A.SHOWPIECES.find(o => o.id === 'jewelbox');
ok('Jewel Box position vs SIMBAD (arcmin; was 44)', sepArcmin(jb.ra, jb.dec, 193.42, -60.36), 0, 3);
const skySrc = fs.readFileSync(path.join(__dirname, 'sky-data.js'), 'utf8');
function catRow(name) { const m = skySrc.match(new RegExp('\\["' + name.replace(/[()]/g, '\\$&') + '","[^"]*","[^"]*",([0-9.\\-]+),([0-9.\\-]+),"[^"]*",([0-9.\\-]+)')); return m ? m.slice(1).map(Number) : [NaN, NaN, NaN]; }
let cr = catRow('Beehive Cluster (M44)');
ok('M44 position vs SIMBAD (arcmin; was 19)', sepArcmin(cr[0], cr[1], 130.05, 19.62), 0, 5);
cr = catRow('M25');
ok('M25 magnitude (Wikipedia/WEBDA 4.6; was 6.5)', cr[2], 4.6, 0.3);
cr = catRow('Tarantula Nebula (C103)');
ok('Tarantula magnitude (~8; was 1)', cr[2], 8, 0.8);
/* ε Scorpii was drawn on μ¹ Sco's position — 3.8° away — in five sky-culture files. */
['babylonian', 'greek', 'malay', 'maya', 'polynesian'].forEach(function (c) {
  const t = fs.readFileSync(path.join(__dirname, c + '-sky-data.js'), 'utf8');
  const m = t.match(/\[\s*([0-9.\-]+)\s*,\s*([0-9.\-]+)\s*,\s*[0-9.\-]+\s*,\s*\d+\s*,\s*"ε Sco"/);
  ok('ε Sco position in ' + c + '-sky-data.js (arcmin; was 226)', m ? sepArcmin(+m[1], +m[2], 252.541, -34.293) : 999, 0, 2);
});
const eg = fs.readFileSync(path.join(__dirname, 'egyptian-sky-data.js'), 'utf8').match(/\[\s*([0-9.\-]+)\s*,\s*([0-9.\-]+)\s*,\s*[0-9.\-]+\s*,\s*\d+\s*,\s*"α UMi \(Polaris\)"/);
ok('Polaris in egyptian-sky-data.js (arcmin; was on δ UMi, 238 away)', eg ? sepArcmin(+eg[1], +eg[2], 37.946, 89.264) : 999, 0, 2);
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
  // v4.16: the dashboard's code moved to dashboard-core.js; read both so the marker is found either way
  const dash = ['dashboard-core.js', 'scob-dashboard-v3.html'].map(f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8'); } catch (e) { return ''; } }).join('\n');
  const m = dash.match(/REVIEW BY (\d{4}-\d{2}-\d{2})/);
  if (m) reviewGuard('Great Red Spot longitude (dashboard-core.js)', m[1], 60);
  else { console.log('  ✗ Great Red Spot review marker missing from dashboard-core.js'); fails++; }
} catch (e) { console.log('  · dashboard not readable here — skipping the GRS marker check'); }

console.log('');
if (fails) { console.error(fails + ' CHECK(S) FAILED — the astronomy engine has regressed, or dated data is overdue for review.'); process.exit(1); }
console.log('All astronomy checks passed.');
