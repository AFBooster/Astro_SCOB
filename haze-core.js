/* SCOB Night-Sky — haze-core.js
 * ---------------------------------------------------------------------------
 * Shared haze / air-quality engine. Single source of truth for:
 *   • fetching NEA readings (24-h PSI, 1-hour PM2.5) for all five regions,
 *   • the day's trend, so "getting worse / clearing" is a fact, not a guess,
 *   • a 5-day haze forecast (Open-Meteo air quality — the same provider the
 *     dashboard already uses for cloud and rain),
 *   • the official NEA bands and their health advice,
 *   • and the physics that turns a µg/m³ number into "how much of tonight's
 *     sky you lose".
 *
 * Used by scob-dashboard-v3.html (the weather card's haze panel) and
 * haze.html (the full page). Nothing here touches the DOM.
 *
 * WHY BOTH PSI AND PM2.5?
 *   The 24-hour PSI is a rolling 24-hour average, so it lags the real air by
 *   many hours — during the 4 Sep 2026 episode the 1-hour PM2.5 was already
 *   falling while the 24-h PSI was still climbing. NEA's health advisories are
 *   keyed to the 24-h PSI (so that is what the session go/no-go uses), but the
 *   1-hour PM2.5 is what the sky at 8 pm actually looks like, so that is what
 *   the optical model uses. Both are shown, and the difference between them is
 *   itself useful information.
 *
 * Everything is a deliberate estimate, not photometry. See the notes on each
 * constant for what it assumes and where it will be wrong.
 */
(function (global) {
'use strict';

var RAD = Math.PI / 180;

var SCOB = { lat: 1.3342, lon: 103.7357 };
var REGIONS = ['west', 'central', 'south', 'east', 'north'];
var REGION_LABEL = {
  west:    'West',
  central: 'Central',
  south:   'South',
  east:    'East',
  north:   'North'
};
/* SCOB sits in Jurong, so "west" is our region. "central" and "south" matter
   too: that is the direction of the city light dome, and haze there scatters
   Singapore's own streetlights straight back down onto our sky. */
var HOME_REGION = 'west';

/* ── NEA bands ────────────────────────────────────────────────────────────
   24-hour PSI. These five bands, and the health advice attached to them, are
   NEA's — they are what school and workplace decisions are made on. The sky
   note is ours. */
var PSI_BANDS = [
  { max: 50,  name: 'Good',           cls: 'ok',
    health: 'Normal activities for everyone.',
    sky:    'No measurable haze penalty — this is as clear as a Jurong sky gets.' },
  { max: 100, name: 'Moderate',       cls: 'warn',
    health: 'Normal activities for everyone.',
    sky:    'A slight loss of transparency. Bright targets unaffected; the faintest fuzzies soften.' },
  { max: 200, name: 'Unhealthy',      cls: 'bad',
    health: 'Reduce prolonged or strenuous outdoor exertion. Elderly, children, pregnant women and anyone with heart or lung conditions should minimise outdoor activity.',
    sky:    'Stars visibly dim and the sky glows brighter. Deep-sky work is largely finished; Moon and planets still hold up.' },
  { max: 300, name: 'Very unhealthy', cls: 'bad',
    health: 'Avoid prolonged or strenuous outdoor exertion. Vulnerable groups should stay indoors.',
    sky:    'Only the Moon, the bright planets and the brightest doubles are worth pointing at.' },
  { max: 1e9, name: 'Hazardous',      cls: 'bad',
    health: 'Everyone should minimise outdoor activity; vulnerable groups should stay indoors.',
    sky:    'Not an observing night. Even the Moon will look brown and soft.' }
];

/* 1-hour PM2.5. NEA publishes these four bands as an informational "what is
   the air doing right now" reading. They deliberately carry no health
   advisory of their own — only the 24-h PSI does — but they are the honest
   answer to "is it getting better or worse this hour". */
var PM_BANDS = [
  { max: 55,  name: 'Normal',    cls: 'ok'   },
  { max: 150, name: 'Elevated',  cls: 'warn' },
  { max: 250, name: 'High',      cls: 'bad'  },
  { max: 1e9, name: 'Very high', cls: 'bad'  }
];

function band(bands, v) {
  if (v == null || isNaN(v)) return null;
  for (var i = 0; i < bands.length; i++) if (v <= bands[i].max) return bands[i];
  return bands[bands.length - 1];
}
function psiBand(v) { return band(PSI_BANDS, v); }
function pmBand(v)  { return band(PM_BANDS, v); }

/* ── The public-session call ──────────────────────────────────────────────
   SCOB's Friday night is a public event on an open deck, with visitors of
   every age standing outside for a couple of hours. That is a different
   question from "can we see anything", and it is keyed to the 24-h PSI
   because that is the index NEA's advisories use. */
function sessionCall(psi24) {
  if (psi24 == null) return null;
  if (psi24 <= 100) return { cls: 'ok',   verdict: 'Session GO',
    note: 'Air quality is fine for a normal public night on the deck.' };
  if (psi24 <= 150) return { cls: 'warn', verdict: 'GO — with a word to visitors',
    note: 'Still in the lower half of the Unhealthy band. Run the session as usual, but mention it at the welcome, keep the talk brisk, and let anyone with heart or lung trouble know they may prefer the indoor portion.' };
  if (psi24 <= 200) return { cls: 'warn', verdict: 'CAUTION — shorten the outdoor time',
    note: 'Rotate the queue faster, favour the dome scopes over the open deck, put more of the session into the indoor talk, and do not press anyone to stay outside.' };
  if (psi24 <= 300) return { cls: 'bad',  verdict: 'Consider postponing the outdoor session',
    note: 'Very unhealthy air. An indoor session — the sky map, the tour script, a Seestar replay — serves visitors better than two hours on the deck.' };
  return { cls: 'bad', verdict: 'Do not run the outdoor session',
    note: 'Hazardous air. Move everything indoors or postpone.' };
}

/* ── PSI → PM2.5 concentration ────────────────────────────────────────────
   A fallback for when only the 24-h PSI came back. Singapore's PM2.5
   sub-index uses the US EPA breakpoints, and in a transboundary smoke
   episode PM2.5 is what drives the PSI, so inverting that sub-index recovers
   a usable 24-hour concentration. Not valid when the PSI is being driven by
   ozone on a hot clear afternoon — which is exactly why the panel prefers the
   real 1-hour PM2.5 reading when it has one. */
var PM_BREAK = [ /* [indexLo, indexHi, concLo, concHi] — µg/m³, 24-h average */
  [  0,  50,   0.0,  12.0],
  [ 51, 100,  12.1,  55.4],
  [101, 150,  55.5, 150.4],
  [151, 200, 150.5, 250.4],
  [201, 300, 250.5, 350.4],
  [301, 500, 350.5, 500.4]
];
function pm25FromPSI(psi) {
  if (psi == null || isNaN(psi)) return null;
  for (var i = 0; i < PM_BREAK.length; i++) {
    var b = PM_BREAK[i];
    if (psi <= b[1]) return b[2] + (psi - b[0]) * (b[3] - b[2]) / (b[1] - b[0]);
  }
  return 500;
}

/* ── The optical model ────────────────────────────────────────────────────
   Smoke particles do two separate things to a night sky, and the old
   dashboard model only knew about the first:

     1. EXTINCTION — they absorb and scatter starlight out of the beam, so
        every star dims. This scales with AIRMASS, so an object 20° up loses
        roughly three times what one overhead loses. That is why haze kills a
        low Sagittarius globular long before it touches the zenith.

     2. SKY GLOW — they scatter Jurong's streetlights back down at you, so the
        background gets BRIGHTER. Under a Bortle 8–9 sky this is often the
        bigger effect: haze does not just dim the stars, it raises the floor
        they have to beat.

   Both are estimates. The numbers below are the standard ones for aged
   biomass smoke at high humidity; they are good to a few tenths of a
   magnitude, not better. */

var ALPHA = 4.0;   /* m²/g — dry mass extinction efficiency of fine smoke at
                      550 nm. Aged transboundary smoke sits around 3–5. */
var HMIX  = 1.2;   /* km — depth of the haze layer. Surface readings are taken
                      at ground level but starlight crosses the whole layer;
                      1–1.5 km is typical for the Singapore boundary layer. */

/* Hygroscopic growth. Singapore evenings run 75–90% RH, and smoke particles
   swell with water, scattering far more light than their dry mass suggests.
   Normalised so a dry-ish 40% RH gives 1.0; ~1.3 at 80%, ~1.6 at 90%. */
function fRH(rh) {
  if (rh == null || isNaN(rh)) rh = 80;
  var r = Math.max(0, Math.min(95, rh)) / 100;
  return (1 / Math.pow(1 - r, 0.25)) / 1.136;
}

/* Aerosol optical depth at 550 nm, straight up. */
function aod(pm25, rh) {
  if (pm25 == null || isNaN(pm25) || pm25 <= 0) return 0;
  return ALPHA * fRH(rh) * pm25 * 1e-3 * HMIX;
}

/* Kasten & Young (1989) airmass — how much more atmosphere you look through
   at altitude `alt` than straight up. 1.0 overhead, ~2 at 30°, ~3 at 20°. */
function airmass(alt) {
  if (alt == null || alt <= 0) return 40;
  return 1 / (Math.sin(alt * RAD) + 0.50572 * Math.pow(alt + 6.07995, -1.6364));
}

/* Magnitudes of starlight lost to absorption/scattering at that altitude. */
function extinction(tau, alt) {
  return 1.086 * tau * Math.min(airmass(alt == null ? 90 : alt), 6);
}

/* Magnitudes the sky background BRIGHTENS by, as haze scatters city light
   back down. The gain depends on how much artificial light there is to
   scatter, hence the Bortle class. */
function skyGlow(tau, bortle) {
  var g = bortle >= 9 ? 3.0 : (bortle >= 8 ? 2.2 : 1.2);
  return 2.5 * Math.log10(1 + g * tau);
}

/* The combined cost, in magnitudes, to what you can actually see at `alt`.
   Sky glow is weighted 0.7 because a brighter background costs a point source
   somewhat less than it costs an extended object. */
function impact(pm25, rh, alt, bortle) {
  var t = aod(pm25, rh);
  var e = extinction(t, alt);
  var g = skyGlow(t, bortle || 8);
  return { tau: t, ext: e, glow: g, total: Math.min(6, e + 0.7 * g) };
}

/* There is ALWAYS some aerosol over Singapore, and the Bortle limiting
   magnitudes the app quotes are already calibrated on an ordinary — not
   pristine — local night. So when the question is "what is the HAZE costing
   me tonight", the honest answer is the excess over a clean local night, not
   the absolute figure. CLEAN_PM is the top of the Good PM2.5 sub-index band.
   `impact()` above stays available for the absolute physics. */
var CLEAN_PM = 12;
function excess(pm25, rh, alt, bortle) {
  var now = impact(pm25, rh, alt, bortle);
  var ref = impact(CLEAN_PM, rh, alt, bortle);
  return {
    tau: now.tau,
    ext: Math.max(0, now.ext - ref.ext),
    glow: Math.max(0, now.glow - ref.glow),
    total: Math.max(0, now.total - ref.total)
  };
}

/* ── NEA readings (data.gov.sg) ───────────────────────────────────────────
   Tries the current v2 real-time endpoint first and falls back to the legacy
   v1 one, and reads either response shape — v2 wraps the payload in `.data`
   and camel-cases some metadata, v1 does not. Written this way so the panel
   keeps working through the v1 → v2 migration in either direction. */
function neaURLs(kind, date) {
  var q = date ? '?date=' + date : '';
  return [
    'https://api-open.data.gov.sg/v2/real-time/api/' + kind + q,
    'https://api.data.gov.sg/v1/environment/' + kind + q
  ];
}
/* Reading names differ slightly between the two APIs and over time, so match
   on the first key that exists rather than hard-coding one. */
function pickReading(readings, names) {
  if (!readings) return null;
  for (var i = 0; i < names.length; i++) if (readings[names[i]]) return readings[names[i]];
  return null;
}
function regionsOf(readingObj) {
  if (!readingObj) return null;
  var out = {}, got = false;
  REGIONS.forEach(function (r) {
    var v = readingObj[r];
    if (typeof v === 'number' && !isNaN(v)) { out[r] = v; got = true; }
  });
  if (readingObj.national != null) out.national = readingObj.national;
  return got ? out : null;
}

function fetchJSON(url) {
  return fetch(url, { cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}
function itemsOf(j) {
  var root = (j && j.data) ? j.data : j;          /* v2 nests under .data */
  return (root && root.items) ? root.items : [];
}

/* One reading set (the latest, or every reading of a given day). */
function fetchNEA(kind, date) {
  var urls = neaURLs(kind, date), i = 0;
  function attempt() {
    if (i >= urls.length) return Promise.reject(new Error('all endpoints failed'));
    return fetchJSON(urls[i++]).catch(attempt);
  }
  return attempt().then(function (j) {
    var items = itemsOf(j);
    if (!items.length) throw new Error('no items');
    return items;
  });
}

var PSI_KEYS = ['psi_twenty_four_hourly', 'psiTwentyFourHourly'];
var PM_KEYS  = ['pm25_one_hourly', 'pm25OneHourly'];

/* Latest readings: 24-h PSI and 1-hour PM2.5, per region, plus timestamps. */
function fetchNow() {
  return Promise.all([
    fetchNEA('psi').catch(function () { return null; }),
    fetchNEA('pm25').catch(function () { return null; })
  ]).then(function (r) {
    var out = { psi: null, pm: null, psiTime: null, pmTime: null };
    if (r[0] && r[0].length) {
      var it = r[0][r[0].length - 1];
      out.psi = regionsOf(pickReading(it.readings, PSI_KEYS));
      out.psiTime = it.timestamp || it.updatedTimestamp || null;
    }
    if (r[1] && r[1].length) {
      var it2 = r[1][r[1].length - 1];
      out.pm = regionsOf(pickReading(it2.readings, PM_KEYS));
      out.pmTime = it2.timestamp || it2.updatedTimestamp || null;
    }
    if (!out.psi && !out.pm) throw new Error('no haze data');
    return out;
  });
}

/* The day's readings for one region, oldest first — for the trend line and
   the rising/falling arrow. `kind` is 'psi' or 'pm25'. */
function fetchTrend(kind, region, date) {
  var d = date || localDateISO();
  var keys = (kind === 'pm25') ? PM_KEYS : PSI_KEYS;
  return fetchNEA(kind, d).then(function (items) {
    var out = [];
    items.forEach(function (it) {
      var reg = pickReading(it.readings, keys);
      if (!reg) return;
      var v = reg[region || HOME_REGION];
      if (typeof v !== 'number' || isNaN(v)) return;
      out.push({ t: it.timestamp || it.updatedTimestamp, v: v });
    });
    out.sort(function (a, b) { return new Date(a.t) - new Date(b.t); });
    return out;
  });
}

/* Rising / falling / steady, from the last few points of a trend series. */
function trendOf(series, span) {
  if (!series || series.length < 3) return null;
  var n = Math.min(span || 4, series.length - 1);
  var last = series[series.length - 1].v;
  var then = series[series.length - 1 - n].v;
  var d = last - then;
  var hours = (new Date(series[series.length - 1].t) - new Date(series[series.length - 1 - n].t)) / 3600000;
  var lbl = (hours >= 0.5 ? 'over the last ' + (hours < 1.5 ? 'hour' : Math.round(hours) + ' hours') : 'recently');
  if (d <= -8) return { dir: 'down', arrow: '↘', cls: 'ok',   text: 'clearing',       delta: d, since: lbl };
  if (d >= 8)  return { dir: 'up',   arrow: '↗', cls: 'bad',  text: 'getting worse',  delta: d, since: lbl };
  return          { dir: 'flat', arrow: '→', cls: 'warn', text: 'holding steady', delta: d, since: lbl };
}

/* ── Forecast (Open-Meteo air quality) ────────────────────────────────────
   The dashboard already gets its cloud and rain from Open-Meteo; the same
   provider publishes a global air-quality model with hourly PM2.5, PM10,
   Saharan/biomass dust and — most usefully for us — aerosol optical depth,
   which is the exact quantity the optical model above wants. No key needed.
   Global resolution is coarse (~40 km) and 3-hourly under the hood, so treat
   it as a trend for planning Fridays, not as a nowcast. */
function fetchForecast(days) {
  var u = 'https://air-quality-api.open-meteo.com/v1/air-quality'
        + '?latitude=' + SCOB.lat + '&longitude=' + SCOB.lon
        + '&hourly=pm2_5,pm10,dust,aerosol_optical_depth'
        + '&timezone=Asia%2FSingapore&forecast_days=' + (days || 5);
  return fetchJSON(u).then(function (j) {
    if (!j || !j.hourly || !j.hourly.time) throw new Error('no forecast');
    return j.hourly;
  });
}

/* Collapse an hourly forecast into one figure per night, averaged across the
   observing window (default 7–11 pm) — which is the only part of the day a
   session cares about. */
function nightlyFromForecast(hourly, fromHour, toHour) {
  var f = fromHour == null ? 19 : fromHour, t = toHour == null ? 23 : toHour;
  var byDay = {};
  hourly.time.forEach(function (ts, i) {
    var day = ts.slice(0, 10), hr = +ts.slice(11, 13);
    if (hr < f || hr > t) return;
    if (!byDay[day]) byDay[day] = { date: day, pm25: [], pm10: [], aod: [], dust: [] };
    var push = function (arr, v) { if (typeof v === 'number' && !isNaN(v)) arr.push(v); };
    push(byDay[day].pm25, hourly.pm2_5 && hourly.pm2_5[i]);
    push(byDay[day].pm10, hourly.pm10 && hourly.pm10[i]);
    push(byDay[day].aod,  hourly.aerosol_optical_depth && hourly.aerosol_optical_depth[i]);
    push(byDay[day].dust, hourly.dust && hourly.dust[i]);
  });
  var mean = function (a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; };
  return Object.keys(byDay).sort().map(function (k) {
    var d = byDay[k];
    return { date: k, pm25: mean(d.pm25), pm10: mean(d.pm10), aod: mean(d.aod), dust: mean(d.dust) };
  });
}

/* ── helpers ──────────────────────────────────────────────────────────────*/
function localDateISO(d) {
  /* Today in Singapore, as YYYY-MM-DD, without depending on the device TZ. */
  var n = d || new Date();
  var sg = new Date(n.getTime() + (8 * 60 + n.getTimezoneOffset()) * 60000);
  var p = function (x) { return (x < 10 ? '0' : '') + x; };
  return sg.getFullYear() + '-' + p(sg.getMonth() + 1) + '-' + p(sg.getDate());
}
function fmtTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  if (isNaN(d)) return '';
  var sg = new Date(d.getTime() + (8 * 60 + d.getTimezoneOffset()) * 60000);
  var h = sg.getHours(), m = sg.getMinutes();
  return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? 'am' : 'pm');
}

global.Haze = {
  SCOB: SCOB,
  REGIONS: REGIONS,
  REGION_LABEL: REGION_LABEL,
  HOME_REGION: HOME_REGION,
  PSI_BANDS: PSI_BANDS,
  PM_BANDS: PM_BANDS,
  psiBand: psiBand,
  pmBand: pmBand,
  sessionCall: sessionCall,
  pm25FromPSI: pm25FromPSI,
  fRH: fRH,
  aod: aod,
  airmass: airmass,
  extinction: extinction,
  skyGlow: skyGlow,
  impact: impact,
  excess: excess,
  CLEAN_PM: CLEAN_PM,
  fetchNow: fetchNow,
  fetchTrend: fetchTrend,
  trendOf: trendOf,
  fetchForecast: fetchForecast,
  nightlyFromForecast: nightlyFromForecast,
  localDateISO: localDateISO,
  fmtTime: fmtTime
};

})(typeof window !== 'undefined' ? window : this);
