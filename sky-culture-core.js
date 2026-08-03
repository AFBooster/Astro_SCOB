/* SCOB Night-Sky — shared SKY-CULTURE ENGINE.
 * One home for the star-location maths, time helpers, SVG helper, compass and cross-culture links
 * that every "<culture>-sky / <culture>-tonight" page needs, so the geometry lives in ONE place
 * instead of being copy-pasted into each page. Load this BEFORE a culture's data file:
 *     <script src="sky-culture-core.js"></script>
 *     <script src="chinese-sky-data.js"></script>   (for WCONST + chineseStarAt cross-links)
 *     <script src="nakshatra-sky-data.js"></script> (for nakshatraStarAt cross-links)
 *     <script src="<culture>-sky-data.js"></script>
 * Everything is exposed on window.SkyCore ONLY (no loose globals), so a page can safely pull what it
 * needs with:   const {el,rev,altAz,lstAt,compass,crossLinks,...} = window.SkyCore;
 *
 * Adopted by the newer culture pages (Polynesian, Aboriginal, Greek, …); the earlier pages still
 * carry their own inline copies and can be migrated to this module page-by-page (each migration is
 * just: add this <script>, delete the page's local helper block — the test suite verifies it).
 */
(function () {
  var SVGNS = "http://www.w3.org/2000/svg";
  var RAD = Math.PI / 180, DEG = 180 / Math.PI;
  var SCOB = { lat: 1.3342, lon: 103.7357, name: "Science Centre Observatory, Jurong" };
  var CMP = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  var WD_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function rev(x){ return ((x % 360) + 360) % 360; }
  function pad(n){ return String(n).padStart(2, "0"); }
  function compass(az){ return CMP[Math.round(az / 22.5) % 16]; }
  function el(t, a){ var e = document.createElementNS(SVGNS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }

  function jd(date){ return date.getTime() / 86400000 + 2440587.5; }
  /* "now" in Singapore civil time (UTC+8), whatever the device timezone */
  function sgtNow(){ var n = new Date(); return new Date(n.getTime() + (n.getTimezoneOffset() + 480) * 60000); }
  function nextFridayYMD(){ var d = sgtNow(); var dow = d.getDay(); var add = (5 - dow + 7) % 7;
    if (add === 0 && d.getHours() > 22) add = 7; d.setDate(d.getDate() + add);
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() }; }

  /* The star-location maths is delegated to the shared astro-core engine — the SINGLE source of
     truth for local sidereal time and alt/az (so the SCOB location and the formulas live in exactly
     one place). Any page that calls lstAt/altAz must also load astro-core.js. */
  function lstAt(y, m, d, hh, mm){ return window.Astro.lstDeg(new Date(Date.UTC(y, m, d, hh - 8, mm, 0))); }
  function altAz(ra, dec, LST){ return window.Astro.altazLST(ra, dec, LST); }

  /* J2000 ecliptic longitude of a star (deg) + the 30° sign it falls in. */
  function eclLonOf(ra, dec){ var e = 23.4393 * RAD, a = ra * RAD, dd = dec * RAD;
    var lon = Math.atan2(Math.sin(a) * Math.cos(e) + Math.tan(dd) * Math.sin(e), Math.cos(a)) * DEG;
    return rev(lon); }
  function signOfLon(lon){ return Math.floor(rev(lon) / 30); }

  /* Unified cross-culture lookup: given a star's J2000 RA/Dec, return the matches across every
     sky-culture whose data file is loaded on the page (currently Chinese + Indian). */
  function crossLinks(ra, dec){
    var out = {};
    if (typeof window !== "undefined") {
      if (window.chineseStarAt)   { var c = window.chineseStarAt(ra, dec);   if (c) out.chinese = c; }
      if (window.nakshatraStarAt) { var n = window.nakshatraStarAt(ra, dec); if (n) out.indian = n; }
    }
    return out;
  }

  var api = { SVGNS:SVGNS, RAD:RAD, DEG:DEG, SCOB:SCOB, CMP:CMP, WD_EN:WD_EN, MON:MON,
    rev:rev, pad:pad, compass:compass, el:el, jd:jd, sgtNow:sgtNow, nextFridayYMD:nextFridayYMD,
    lstAt:lstAt, altAz:altAz, eclLonOf:eclLonOf, signOfLon:signOfLon, crossLinks:crossLinks };
  if (typeof window !== "undefined") window.SkyCore = api;
  else if (typeof module !== "undefined") module.exports = api;   // node-friendly
})();
