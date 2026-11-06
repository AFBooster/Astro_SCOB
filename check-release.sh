#!/usr/bin/env bash
# SCOB Night-Sky — pre-flight release check.  (v2 — self-maintaining)
#
# Run from the project folder BEFORE uploading:
#     ./check-release.sh          # verify only
#     ./check-release.sh --fix    # verify, and rewrite sw.js ASSETS to match the folder
#
# WHAT CHANGED FROM v1
# --------------------
# v1 carried two hand-maintained arrays — PAGES (55 entries) and CACHED (68) —
# listing every file by name. Adding a sky culture meant editing sw.js, PAGES,
# CACHED, the dashboard nav and the README: five places, and forgetting one
# shipped a page that was uncached or unversioned. The arrays had no independent
# value — they were just a copy of `ls`.
#
# v2 derives both lists from the filesystem, so a new page is checked the moment
# it exists. The only per-release edits left are the ones that carry real
# information: version.js, the sw.js cache NAME, the README row, and the nav link.
#
# Every check v1 performed is still here; three have been added (cache-name
# lockstep, orphan pages, duplicate *(current)* rows).
#
# Note: grep uses -a (treat files as text) because the pages contain UTF-8
# glyphs (© · ✓) and very long lines that grep may otherwise flag as binary.

set -u
cd "$(dirname "$0")" || exit 2
FIX=0; [ "${1:-}" = "--fix" ] && FIX=1

# Files that are deliberately NOT shipped/cached (dev-only, never served).
EXCLUDE_PAGES=()                                    # pages exempt from the version footer
EXCLUDE_ASSETS=(sw.js test-astro.js test-logic.js test-pages.js test-browser.js migrate-theme.js)
# Redirect stubs kept alive for people who installed the PWA from an old URL.
# They are deliberately unlinked, so the orphan check should not nag about them.
STUBS=(index.html main.html scob-dashboard.html occultations.html iss-transits.html identify.html audio-tour.html)

pass=0; fail=0
ok(){      printf '  \033[32m/\033[0m %s\n' "$1"; pass=$((pass+1)); }
bad(){     printf '  \033[31mX %s\033[0m\n' "$1"; fail=$((fail+1)); }
note(){    printf '  \033[33m! %s\033[0m\n' "$1"; }
section(){ printf '\n\033[1m%s\033[0m\n' "$1"; }

excluded(){ local n="$1"; shift; for e in "$@"; do [ "$n" = "$e" ] && return 0; done; return 1; }

# ── Derive the lists ───────────────────────────────────────────────────────
PAGES=()
for f in *.html; do
  [ "${#EXCLUDE_PAGES[@]}" -gt 0 ] && excluded "$f" "${EXCLUDE_PAGES[@]}" && continue
  PAGES+=("$f")
done

ASSETS=()
for f in *.html; do ASSETS+=("$f"); done
for f in *.js *.css; do
  [ -e "$f" ] || continue
  excluded "$f" "${EXCLUDE_ASSETS[@]}" || ASSETS+=("$f")
done
for f in *.webmanifest icon-*.png; do [ -f "$f" ] && ASSETS+=("$f"); done

section "Inventory"
ok "${#PAGES[@]} pages, ${#ASSETS[@]} cacheable assets found on disk"

# ── Version source of truth ────────────────────────────────────────────────
section "Version source of truth"
VER=$(grep -aoE "SCOB_VERSION[[:space:]]*=[[:space:]]*'[^']+'" version.js 2>/dev/null | grep -aoE "v[0-9]+\.[0-9]+")
if [ -n "$VER" ]; then ok "version.js declares $VER"; else bad "could not read SCOB_VERSION from version.js"; fi

YEAR=$(grep -aoE "SCOB_COPYRIGHT[^;]*" version.js | grep -aoE "20[0-9]{2}" | head -n1)
[ -n "$YEAR" ] && ok "copyright year $YEAR (year of creation — do not roll forward)"

section "No hardcoded version numbers left in pages"
if grep -alr 'SCOB Night-Sky <b>v' --include='*.html' . | grep -q .; then
  grep -anr 'SCOB Night-Sky <b>v' --include='*.html' . | sed 's/^/    /'
  bad "hardcoded version footer(s) found — use class=\"scob-version\" instead"
else
  ok "all pages inject the version (none hardcoded)"
fi

# ── Every page is wired to version.js ──────────────────────────────────────
section "Pages load version.js"
missing=0
for p in "${PAGES[@]}"; do
  if grep -aq 'class="scob-version"' "$p" && grep -aq 'version\.js' "$p"; then :; else
    bad "$p is missing the .scob-version placeholder or the version.js include"
    missing=$((missing+1))
  fi
done
[ "$missing" -eq 0 ] && ok "all ${#PAGES[@]} pages carry the version footer"

# ── Service worker ─────────────────────────────────────────────────────────
section "Service worker (sw.js)"
CACHE=$(grep -aoE "scob-sky-v[0-9]+" sw.js | head -n 1)
if [ -n "$CACHE" ]; then ok "cache name is $CACHE"; else bad "no scob-sky-vN cache name in sw.js"; fi

uncached=()
for a in "${ASSETS[@]}"; do grep -aq "'$a'" sw.js || uncached+=("$a"); done

# Every asset the service worker pre-caches must exist on disk. A cached name with
# no matching file — e.g. sw.js lists icon-192.png but only icon192.png is present —
# makes the SW install reject and 404s that asset on every page. Before, only
# .html/.js/.css were checked here, so a renamed/missing icon or manifest slipped
# through; now ALL cached asset types are verified.
stale=()
while IFS= read -r a; do
  [ -z "$a" ] && continue
  case "$a" in
    *.html|*.js|*.css|*.png|*.webmanifest|*.svg|*.ico|*.jpg|*.jpeg|*.gif|*.webp)
      [ -f "$a" ] || stale+=("$a");;
  esac
done < <(grep -aoE "^[[:space:]]*'[^']+'," sw.js | tr -d " ',")

if [ "${#uncached[@]}" -eq 0 ] && [ "${#stale[@]}" -eq 0 ]; then
  ok "sw.js ASSETS matches the folder exactly (${#ASSETS[@]} entries)"
else
  for a in "${uncached[@]:-}"; do [ -n "$a" ] && bad "sw.js ASSETS is missing $a"; done
  for a in "${stale[@]:-}";    do [ -n "$a" ] && bad "sw.js ASSETS lists $a, which no longer exists"; done
  if [ "$FIX" -eq 1 ]; then
    printf '  → rewriting the ASSETS array…\n'
    {
      printf 'const ASSETS = [\n'
      for a in "${ASSETS[@]}"; do printf "  '%s',\n" "$a"; done
      printf '];\n'
    } > .assets.new
    if python3 - <<'PY'
import re, sys
sw  = open('sw.js', encoding='utf-8').read()
new = open('.assets.new', encoding='utf-8').read()
sw2, n = re.subn(r'const ASSETS = \[.*?\];\n', new, sw, count=1, flags=re.S)
if n != 1:
    sys.exit("could not find the 'const ASSETS = [ ... ];' block in sw.js")
open('sw.js', 'w', encoding='utf-8', newline='\n').write(sw2)
PY
    then
      rm -f .assets.new
      ok "sw.js ASSETS regenerated — re-run ./check-release.sh to confirm"
    else
      rm -f .assets.new
      bad "could not rewrite sw.js (read-only file, or the ASSETS block was reformatted)"
    fi
  else
    note "run  ./check-release.sh --fix  to regenerate the list automatically"
  fi
fi

# The cache name must move whenever the version does, or installed PWAs keep the
# old build. Compare against the last release recorded in the README.
if [ -n "$CACHE" ] && [ -n "$VER" ]; then
  PREV_CACHE=$(grep -aoE 'scob-sky-v[0-9]+' README.md | sed -n '2p')
  if [ -n "$PREV_CACHE" ] && [ "$PREV_CACHE" = "$CACHE" ]; then
    bad "cache name $CACHE is unchanged from the previous release — bump it in lockstep with $VER"
  else
    ok "cache name moved with the version"
  fi
fi

# ── README ─────────────────────────────────────────────────────────────────
section "README in step"
if [ -n "$VER" ] && grep -aEq "\*\*${VER}\*\*.*current" README.md; then
  ok "README marks $VER as (current)"
else
  bad "README has no *(current)* row for $VER"
fi
# Count only the version CELL marker (| **vN.NN** *(current)* |), not the words
# "*(current)*" appearing inside a changelog description — the v3.82 entry
# describes this very check and would otherwise flag itself.
CURROWS=$(grep -acE '^\|[[:space:]]*\*\*v[0-9]+\.[0-9]+\*\*[[:space:]]*\*\(current\)\*' README.md || true)
if [ "${CURROWS:-0}" -gt 1 ]; then
  bad "README has $CURROWS rows marked *(current)* — only the newest release should be"
elif [ "${CURROWS:-0}" -eq 0 ]; then
  bad "no release row is marked *(current)*"
fi
if [ -n "$CACHE" ] && grep -aqF "$CACHE" README.md; then
  ok "README mentions $CACHE"
else
  note "README does not mention ${CACHE:-cache} (optional but useful)"
fi

# ── Links ──────────────────────────────────────────────────────────────────
section "Internal links resolve"
badlinks=0
# v4.16: dashboard-core.js holds the dashboard's code (and any links it builds)
for f in *.html dashboard-core.js; do
  [ -f "$f" ] || continue
  for t in $(grep -aoE '(href|src)="[^"#:]+\.(html|js|css)"' "$f" | sed -E 's/.*="([^"]+)"/\1/' | sort -u); do
    [ -f "$t" ] || { bad "$f -> $t (missing)"; badlinks=$((badlinks+1)); }
  done
done
[ "$badlinks" -eq 0 ] && ok "all internal html/js/css references point to existing files"

# ── Referenced assets exist — icons, manifests, images ─────────────────────
# The links check above only covers .html/.js/.css. Pages and manifests also
# reference NON-code assets that were never validated:
#   <link rel="apple-touch-icon" href="icon-180.png">
#   <link rel="icon"             href="icon-192.png">
#   <link rel="manifest"         href="manifest.webmanifest">
#   manifest "icons":[{ "src":"icon-192.png", "sizes":"192x192" }]
# A page pointing at icon-192.png while only icon192.png existed passed clean and
# shipped broken icons on every page — the exact drift a hyphen typo caused. Now
# every local (non-URL, non-anchor) asset reference must resolve to a real file,
# and each manifest icon's pixel size must match its declared "sizes".
section "Referenced assets exist (icons, manifests, images)"
badassets=0

# (1) href/src/content="…ext" in HTML and the dashboard's JS. Absolute URLs
#     (which contain "://") are skipped by the [^"#:] class.
for f in *.html dashboard-core.js *.webmanifest; do
  [ -f "$f" ] || continue
  for t in $(grep -aoE '(href|src|content)="[^"#:]+\.(png|webmanifest|svg|ico|jpg|jpeg|gif|webp)"' "$f" \
              | sed -E 's/.*="([^"]+)"/\1/' | sed -E 's/\?.*$//' | sort -u); do
    [ -f "$t" ] || { bad "$f -> $t (missing)"; badassets=$((badassets+1)); }
  done
done

# (2) manifest "icons":[{ "src": "…" }] — the JSON form the regex above can't
#     see. Existence is pure bash, so it always runs.
for m in *.webmanifest; do
  [ -f "$m" ] || continue
  for src in $(grep -aoE '"src"[[:space:]]*:[[:space:]]*"[^"]+"' "$m" \
                | sed -E 's/.*"([^"]+)"[[:space:]]*$/\1/' | sed -E 's/\?.*$//' | sort -u); do
    [ -f "$src" ] || { bad "$m -> $src (missing)"; badassets=$((badassets+1)); }
  done
done

# (3) manifest icon pixel size must match its declared "sizes" — catches a
#     same-name wrong-size swap (e.g. a 196×196 file shipped as icon-192.png).
#     python3-gated; existence (1)/(2) and the sw.js check already guard the rest.
ICON_SIZE_PY='
import glob, re, struct, os, sys
def png_size(p):
    try:
        with open(p, "rb") as fh: h = fh.read(24)
        if h[:8] == b"\x89PNG\r\n\x1a\n":
            w, ht = struct.unpack(">II", h[16:24]); return "%dx%d" % (w, ht)
    except Exception: pass
    return None
for mf in sorted(glob.glob("*.webmanifest")):
    txt = open(mf, encoding="utf-8").read()
    for blk in re.findall(r"\{[^{}]*\"src\"[^{}]*\}", txt):
        m = re.search(r"\"src\"\s*:\s*\"([^\"]+)\"", blk)
        if not m: continue
        src = m.group(1).split("?")[0]
        if not os.path.isfile(src): continue
        sm = re.search(r"\"sizes\"\s*:\s*\"([^\"]+)\"", blk)
        if not sm: continue
        want = sm.group(1).split()[0]
        got = png_size(src)
        if got and want and got != want:
            sys.stdout.write("%s|%s|%s|%s\n" % (mf, src, want, got))
'
if command -v python3 >/dev/null 2>&1; then
  while IFS='|' read -r mf src want got; do
    [ -z "$mf" ] && continue
    bad "$mf declares $src as $want but the file is $got"; badassets=$((badassets+1))
  done < <(python3 -c "$ICON_SIZE_PY" 2>/dev/null)
else
  note "manifest icon pixel-size cross-check skipped (python3 not found)"
fi

if [ "$badassets" -eq 0 ]; then
  ok "all referenced icons, manifests and images exist (and match declared sizes)"
fi

# ── Orphan check — a new page nobody can reach ─────────────────────────────
section "Every page is reachable"
orphans=0
for p in "${PAGES[@]}"; do
  case "$p" in scob-dashboard-v3.html) continue;; esac
  excluded "$p" "${STUBS[@]}" && continue
  if ! grep -alqE "href=\"$p" -- *.html dashboard-core.js 2>/dev/null; then
    note "$p is not linked from any other page (nav link missing?)"
    orphans=$((orphans+1))
  fi
done
[ "$orphans" -eq 0 ] && ok "no orphan pages"

# ── v4.24: new pages must be findable and translatable ─────────────────────
# search-index.js (site search, Start here, the menu filter) and scob-i18n.js (page titles in
# 中文 / BM / தமிழ்) each keep a list of pages. A page missing from either is invisible to
# search, or keeps an English title in the other languages.
section "Search index and translations cover every page"
if command -v node >/dev/null 2>&1; then
  miss=$(node -e '
    const fs=require("fs");global.window=global;global.document={readyState:"loading",addEventListener(){}};
    require("./search-index.js");require("./scob-i18n.js");
    const inIdx=new Set(window.SCOB_PAGES.map(p=>p.f)),I=window.SCOBI18N.PAGES,out=[];
    for(const f of fs.readdirSync(".").filter(f=>f.endsWith(".html"))){
      const s=fs.readFileSync(f,"utf8");if(/http-equiv="refresh"/.test(s))continue;      // redirect stubs
      if(!inIdx.has(f))out.push(f+" is not in search-index.js");
      if(!I[f])out.push(f+" has no translated title in scob-i18n.js");
    }
    console.log(out.join("\n"));' 2>&1)
  if [ -z "$miss" ]; then ok "every page is in the search index and has translated titles"
  else while IFS= read -r l; do [ -n "$l" ] && bad "$l"; done <<< "$miss"; fi
else note "node not found — skipped"; fi

# ── v4.24: time-limited data — warnings only, so they are seen in good time ─
section "Time-limited data"
if command -v node >/dev/null 2>&1; then
  node -e '
    const fs=require("fs"),now=Date.now(),day=864e5,iso=t=>new Date(t).toISOString().slice(0,10);let n=0;
    const say=m=>{console.log("  \x1b[33m! "+m+"\x1b[0m");n++;};
    const ev=[...fs.readFileSync("dashboard-core.js","utf8").matchAll(/^ \[\x27(\d{4}-\d\d-\d\d)\x27,/gm)].map(m=>m[1]).sort();
    const last=Date.parse(ev[ev.length-1]);
    if(last-now<120*day)say("events calendar (dashboard-core.js EVENTS) ends "+ev[ev.length-1]+" — add the next year");
    global.window=global;require("./astro-core.js");const A=window.Astro,J=A.jd(new Date()),toD=j=>(j-2440587.5)*day;
    const C=(A.COMETS||[]).filter(c=>c.to>J);
    if(!C.length)say("no comet in astro-core.js COMETS is tracked beyond today — add the next comets worth showing");
    else{const end=Math.max(...C.map(c=>toD(c.to)));if(end-now<60*day)say("the last tracked comet window ends "+iso(end)+" — add the next comets worth showing (astro-core.js COMETS)");}
    for(const f of fs.readdirSync(".").filter(f=>/\.(js|html)$/.test(f)&&!/^test-/.test(f)))
      for(const m of fs.readFileSync(f,"utf8").matchAll(/REVIEW BY (\d{4}-\d\d-\d\d)/g))
        if(Date.parse(m[1])-now<60*day)say(f+": REVIEW BY "+m[1]+(Date.parse(m[1])<now?" has passed":" is coming up"));
    if(!n)console.log("  \x1b[32m/\x1b[0m nothing due in the next two months");'
else note "node not found — skipped"; fi

# ── Result ─────────────────────────────────────────────────────────────────
section "Result"
printf '  %d passed, %d failed\n' "$pass" "$fail"
if [ "$fail" -eq 0 ]; then
  printf '  \033[32mREADY TO UPLOAD.\033[0m\n'; exit 0
else
  printf '  \033[31mNOT READY - fix the X items above.\033[0m\n'; exit 1
fi
