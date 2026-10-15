/* SCOB Night-Sky — seeing-core.js  (v4.15)
 * ---------------------------------------------------------------------------
 * The seeing estimate, in one place. Until v4.15 it lived inside the dashboard;
 * it moved here so the session logbook can record the SAME prediction the
 * dashboard showed, and grade it against what the eyepiece said.
 *
 * WHAT IT IS — AND IS NOT
 *   Astronomical seeing is the blur from turbulence along the line of sight.
 *   No public feed measures it over Jurong, so this is a rule of thumb built
 *   from three things a forecast model does give us, each a known driver:
 *     • the jet-level wind at 250 hPa (~10 km) — shear at the tropopause;
 *     • the shear between 850 hPa (~1.5 km) and the surface wind on the deck;
 *     • convective energy (CAPE) — a Singapore evening still turning over
 *       after an afternoon storm is the classic boiling-image night.
 *
 *     arcsec ≈ 0.9 + 0.035·jet + 0.05·shear + 0.25·CAPE/1000   (winds in m/s)
 *
 *   The weights are hand-set from general principles and have NOT been fitted
 *   to anything at SCOB. The session logbook now records the observed seeing
 *   (Antoniadi scale) beside this number so a season of Fridays can fit them.
 *   Until then: trust the eyepiece over this file.
 *
 * Nothing here touches the DOM.
 */
(function (global) {
'use strict';

var LAT = 1.3342, LON = 103.7357;

/* v250, v850, v10 in km/h (as Open-Meteo returns them); cape in J/kg. */
function estimate(v250, v850, v10, cape) {
  if (v250 == null || isNaN(v250)) return null;
  var jet = v250 / 3.6,
      shear = Math.max(0, ((v850 == null ? v10 : v850) - (v10 || 0))) / 3.6,
      cv = Math.min(cape || 0, 3500) / 1000;
  var tJ = 0.035 * jet, tS = 0.05 * shear, tC = 0.25 * cv, arc = 0.9 + tJ + tS + tC;
  var q = arc <= 1.1 ? ['ok', 'excellent'] : arc <= 1.6 ? ['ok', 'good'] : arc <= 2.3 ? ['warn', 'fair'] : ['bad', 'poor'];
  var driver;
  if (arc <= 1.3) driver = 'calm aloft and stable below';
  else if (tC >= tJ && tC >= tS) driver = 'convective instability (CAPE ' + Math.round(cape) + ' J/kg) — the evening air is still turning over';
  else if (tJ >= tS) driver = 'jet-level wind, ' + Math.round(v250) + ' km/h at 250 hPa';
  else driver = 'wind shear in the lowest 1.5 km (' + Math.round(v850) + ' km/h aloft over ' + Math.round(v10 || 0) + ' at the deck)';
  return { arc: arc, cls: q[0], label: q[1], driver: driver };
}

/* The Antoniadi scale, the standard way an observer grades seeing at the
   eyepiece. I is perfect; V is barely usable. Rough arc-second equivalents
   are the conventional ones, used only to put the two on one axis. */
var ANTONIADI = [
  { n: 1, roman: 'I',   text: 'Perfect — the image is rock-steady',              arc: 0.8 },
  { n: 2, roman: 'II',  text: 'Slight undulations, with calm moments of several seconds', arc: 1.3 },
  { n: 3, roman: 'III', text: 'Moderate — large tremors blur the detail',         arc: 2.0 },
  { n: 4, roman: 'IV',  text: 'Poor — constant troublesome undulations',          arc: 3.0 },
  { n: 5, roman: 'V',   text: 'Very bad — hardly steady enough for a sketch',     arc: 4.5 }
];

/* The forecast inputs for one evening, as the dashboard would have read them
   at 9 pm. Works for recent past dates too (Open-Meteo keeps ~3 months), which
   is what lets the logbook capture the prediction after the session. */
function fetchEvening(dateISO, hour) {
  var h = (hour == null ? 21 : hour);
  var u = 'https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON
        + '&hourly=wind_speed_10m,wind_speed_250hPa,wind_speed_850hPa,cape,relative_humidity_2m,cloud_cover'
        + '&timezone=Asia%2FSingapore&start_date=' + dateISO + '&end_date=' + dateISO;
  return fetch(u, { cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (j) {
    var H = j && j.hourly; if (!H || !H.time) throw new Error('no data');
    var i = H.time.indexOf(dateISO + 'T' + (h < 10 ? '0' : '') + h + ':00');
    if (i < 0) throw new Error('hour missing');
    var at = function (k) { return (H[k] && typeof H[k][i] === 'number') ? H[k][i] : null; };
    return { v250: at('wind_speed_250hPa'), v850: at('wind_speed_850hPa'), v10: at('wind_speed_10m'),
             cape: at('cape'), rh: at('relative_humidity_2m'), cloud: at('cloud_cover') };
  });
}

/* Spearman rank correlation — for "does a worse prediction go with a worse
   observed grade?" on a handful of nights, where a linear fit would be spurious. */
function spearman(xs, ys) {
  var n = xs.length; if (n < 3) return null;
  function ranks(a) {
    var idx = a.map(function (v, i) { return [v, i]; }).sort(function (p, q) { return p[0] - q[0]; });
    var r = new Array(n), k = 0;
    while (k < n) { var j = k; while (j + 1 < n && idx[j + 1][0] === idx[k][0]) j++;
      var avg = (k + j) / 2 + 1; for (var m = k; m <= j; m++) r[idx[m][1]] = avg; k = j + 1; }
    return r;
  }
  return pearson(ranks(xs), ranks(ys));
}
function pearson(xs, ys) {
  var n = xs.length; if (n < 3) return null;
  var mx = 0, my = 0, i; for (i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; } mx /= n; my /= n;
  var sxy = 0, sxx = 0, syy = 0;
  for (i = 0; i < n; i++) { var dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return (sxx > 0 && syy > 0) ? sxy / Math.sqrt(sxx * syy) : null;
}
/* Least-squares line y = a + b·x, with r. */
function fitLine(xs, ys) {
  var n = xs.length; if (n < 3) return null;
  var mx = 0, my = 0, i; for (i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; } mx /= n; my /= n;
  var sxy = 0, sxx = 0; for (i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
  if (!(sxx > 0)) return null;
  var b = sxy / sxx; return { a: my - b * mx, b: b, r: pearson(xs, ys), n: n };
}

global.Seeing = {
  estimate: estimate,
  ANTONIADI: ANTONIADI,
  fetchEvening: fetchEvening,
  spearman: spearman,
  pearson: pearson,
  fitLine: fitLine
};

})(typeof window !== 'undefined' ? window : this);
