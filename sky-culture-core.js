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

  /* ---------------------------------------------------------------- cross-culture lookup
     Every culture data file uses the same entry shape:
        { n, <nameKey>, en, west, det, stars: [[ra, dec, mag, HIP, westName, nativeStarName]], ... }
     so ONE generic RA/Dec scan serves all of them. Chinese and Indian keep their own
     tuned resolvers (chineseStarAt also scans the Three Enclosures, nakshatraStarAt
     reports the junction star), and those are used when present.

     Register a new culture by adding one row to CULTURES — no other edit anywhere.
     A culture whose data file is not loaded on the page is simply skipped. */
  var CULTURES = [
    { id:"chinese",    label:"Chinese",    global:"CSKY",  nameKey:"zh",   resolver:"chineseStarAt"   },
    { id:"indian",     label:"Indian",     global:"NAK",   nameKey:"sa",   resolver:"nakshatraStarAt" },
    { id:"arabic",     label:"Arabic",     global:"AMANZIL", nameKey:"tr"  },
    { id:"babylonian", label:"Babylonian", global:"BSKY",  nameKey:"name" },
    { id:"egyptian",   label:"Egyptian",   global:"ESKY",  nameKey:"eg"   },
    { id:"greek",      label:"Greek",      global:"GREEK", nameKey:"name" },
    { id:"malay",      label:"Malay",      global:"MSKY",  nameKey:"rumi" },
    { id:"maya",       label:"Maya",       global:"MAYA",  nameKey:"name" },
    { id:"inca",       label:"Inca",       global:"INCA",  nameKey:"name" },
    { id:"polynesian", label:"Polynesian", global:"POLY",  nameKey:"name" },
    { id:"aboriginal", label:"Aboriginal", global:"ABOR",  nameKey:"name" }
  ];

  /* Generic scan: nearest star within `tol` degrees in both RA and Dec.
     Returns the SAME field names the tuned resolvers use where they overlap
     (west, en, n, det) plus `name` (the asterism in its own language) and
     `starNative` (that individual star's native name, when the data has one). */
  function scanCulture(c, ra, dec, tol) {
    var list = window[c.global];
    if (!Array.isArray(list) || ra == null || dec == null) return null;
    tol = tol || 0.5;
    var best = null;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e || !e.stars) continue;
      for (var j = 0; j < e.stars.length; j++) {
        var s = e.stars[j];
        var dr = Math.abs(((s[0] - ra + 540) % 360) - 180), dd = Math.abs(s[1] - dec);
        if (dr < tol && dd < tol) {
          var d = dr * dr + dd * dd;
          if (!best || d < best.d) best = {
            d: d, culture: c.id, label: c.label,
            name: e[c.nameKey] || e.name || "", en: e.en || "",
            n: e.n, west: s[4] || "", starNative: s[5] || "",
            det: j === e.det
          };
        }
      }
    }
    return best;
  }

  /* Given a star's J2000 RA/Dec, return the match in EVERY sky-culture whose data
     file is loaded on the page. Keyed by culture id; `chinese` and `indian` keep
     the exact shape the existing pages already read (mzh/men/iast/west). */
  function crossLinks(ra, dec) {
    var out = {};
    if (typeof window === "undefined") return out;
    for (var i = 0; i < CULTURES.length; i++) {
      var c = CULTURES[i];
      if (c.resolver && typeof window[c.resolver] === "function") {
        var hit = window[c.resolver](ra, dec);
        if (hit) out[c.id] = hit;
        continue;
      }
      var g = scanCulture(c, ra, dec);
      if (g) out[c.id] = g;
    }
    return out;
  }

  /* Ordered array form, for UI that wants to list "what everyone calls this star".
     Each item: {culture, label, name, en, west, starNative}. Chinese/Indian are
     normalised into the same shape so a renderer needs no special cases. */
  function crossLinkList(ra, dec) {
    var L = crossLinks(ra, dec), out = [];
    for (var i = 0; i < CULTURES.length; i++) {
      var c = CULTURES[i], h = L[c.id];
      if (!h) continue;
      var name, starNative;
      if (c.id === "chinese")      { name = h.mzh || "";  starNative = h.cn || ""; }
      else if (c.id === "indian")  { name = h.sa || "";   starNative = h.iast || ""; }
      else                         { name = h.name || ""; starNative = h.starNative || ""; }
      out.push({ culture: c.id, label: c.label, name: name, starNative: starNative,
                 en: h.en || h.men || "", west: h.west || "", raw: h });
    }
    return out;
  }

  function cultures() { return CULTURES.slice(); }
  function culturesLoaded() {
    return CULTURES.filter(function (c) { return Array.isArray(window[c.global]); });
  }

  var api = { SVGNS:SVGNS, RAD:RAD, DEG:DEG, SCOB:SCOB, CMP:CMP, WD_EN:WD_EN, MON:MON,
    rev:rev, pad:pad, compass:compass, el:el, jd:jd, sgtNow:sgtNow, nextFridayYMD:nextFridayYMD,
    lstAt:lstAt, altAz:altAz, eclLonOf:eclLonOf, signOfLon:signOfLon,
    crossLinks:crossLinks, crossLinkList:crossLinkList, scanCulture:scanCulture,
    CULTURES:CULTURES, cultures:cultures, culturesLoaded:culturesLoaded };
  if (typeof window !== "undefined") window.SkyCore = api;
  else if (typeof module !== "undefined") module.exports = api;   // node-friendly
})();
