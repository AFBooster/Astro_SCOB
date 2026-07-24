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
window.SCOB_VERSION   = 'v3.46';
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
