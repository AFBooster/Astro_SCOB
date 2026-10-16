/* SCOB Night-Sky — SINGLE SOURCE OF TRUTH for the site version.
 *
 * Bump SCOB_VERSION here on every release. The version/copyright footer on
 * every page (scob-dashboard-v3.html, telescope-types.html, moon-tonight.html,
 * tracking-methods.html and the redirect stubs) is injected from this value at
 * runtime, so there is exactly ONE number to change.
 *
 * ⚠ ALSO bump the CACHE name in sw.js in lockstep (e.g. v3.6 -> scob-sky-v10).
 *   The service-worker cache is what forces installed PWAs to fetch the new
 *   pages; forget it and users keep seeing the old cached version.
 *
 * After bumping: add a row to the README version-history table, then run
 *   ./check-release.sh
 * to confirm everything is in sync before uploading.
 */
window.SCOB_VERSION   = 'v4.17';   /* keep in lockstep with sw.js cache scob-sky-v120 */
window.SCOB_COPYRIGHT = '© 2026 AFBOOSTER.online';   // year of creation — do not roll forward

(function () {
  function fill() {
    var html = 'SCOB Night-Sky <b>' + window.SCOB_VERSION + '</b> · ' + window.SCOB_COPYRIGHT;
    var nodes = document.querySelectorAll('.scob-version');
    for (var i = 0; i < nodes.length; i++) nodes[i].innerHTML = html;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill);
  } else {
    fill();
  }
})();

/* v3.15: "update available" toast — when a newer service worker has cached a fresh
 * build, offer a one-tap refresh so installed PWAs don't sit on a stale cache. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var shown = false;
  function toast() {
    if (shown || document.getElementById('scobUpd')) return;
    shown = true;
    var b = document.createElement('div');
    b.id = 'scobUpd';
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;' +
      'background:#13224a;color:#f4f6fb;border:1px solid #f5c542;border-radius:10px;padding:10px 15px;' +
      'font:600 13px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
      'box-shadow:0 6px 24px rgba(0,0,0,.45);cursor:pointer;max-width:92vw;text-align:center;';
    b.innerHTML = '🔄 New version available — tap to refresh';
    b.addEventListener('click', function () { try { b.remove(); } catch (e) {} location.reload(); });
    (document.body || document.documentElement).appendChild(b);
  }
  try {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) toast();
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', function () {
          // "installed" while a controller already exists => this is an update, not the first install
          if (nw.state === 'installed' && navigator.serviceWorker.controller) toast();
        });
      });
    }).catch(function () {});
  } catch (e) {}
})();

/* v4.17: on phones, a page header slides away while you scroll down and comes back as soon as
 * you scroll up. The shared theme pins every <header> (scob-theme.css, since v3.83); on a phone
 * many of them are a quarter to half the screen — measured at iPhone size on 16 Oct 2026, 44
 * pages had a pinned header over 25% of the screen, moon-tonight and solar-system over 50%.
 * The slide is a CSS transform, so the page layout never changes and it cannot flicker. It lives
 * here because every page already loads this file. The dashboard has its own version of this
 * (dashboard-core.js) and is skipped. */
(function () {
  if (document.getElementById('mobileRoot') || document.getElementById('desktopRoot')) return;
  var mq = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
  function init() {
    var hdr = document.querySelector('header');
    if (!hdr) return;
    var DIST = 18, hidden = false, run = 0, lastY = Math.max(0, window.pageYOffset || 0);
    function set(h) { if (h === hidden) return; hidden = h; hdr.classList.toggle('hdr-away', h); }
    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      y = Math.min(max, Math.max(0, y));
      var dy = y - lastY; lastY = y; if (!dy) return;
      var pos = window.getComputedStyle(hdr).position;
      if ((mq && !mq.matches) || (pos !== 'sticky' && pos !== 'fixed')) { run = 0; set(false); return; }
      if (y <= hdr.offsetHeight + 16) { run = 0; set(false); return; }
      var ae = document.activeElement;
      if (ae && ae !== document.body && hdr.contains(ae)) { run = 0; set(false); return; }
      if ((dy > 0) !== (run > 0)) run = 0;
      run += dy;
      if (run > DIST) set(true); else if (run < -DIST) set(false);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    hdr.addEventListener('focusin', function () { set(false); });
    if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (!mq.matches) set(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
