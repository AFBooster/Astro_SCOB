#!/usr/bin/env bash
# SCOB Night-Sky — pre-flight release check.
# Run from the project folder BEFORE uploading:  ./check-release.sh
# Verifies the version is consistent everywhere, the PWA cache is wired up,
# and no internal links are broken. Exits non-zero if anything is off.
#
# Note: grep uses -a (treat files as text) because the pages contain UTF-8
# glyphs (© · ✓) and very long lines that grep may otherwise flag as binary.

set -u
cd "$(dirname "$0")" || exit 2

pass=0; fail=0
ok(){      printf '  \033[32m/\033[0m %s\n' "$1"; pass=$((pass+1)); }
bad(){     printf '  \033[31mX %s\033[0m\n' "$1"; fail=$((fail+1)); }
section(){ printf '\n\033[1m%s\033[0m\n' "$1"; }   # not "head" — that shadows the builtin

# Pages whose footer is version-injected, and that must load version.js.
PAGES=(scob-dashboard-v3.html telescope-types.html moon-tonight.html tracking-methods.html tonights-tour.html sky-finder.html eyepiece-fov.html kiosk.html align-stars.html plan-ahead.html solar.html object-cards.html checklist.html constellation-story.html scale-model.html highlights-card.html qr-poster.html identify.html audio-tour.html almanac.html quiz.html occultations.html iss-transits.html sky-events.html cosmic-extremes.html singapore-sky.html light-pollution.html phone-astrophotography.html seestar.html sky-guide.html main.html scob-dashboard.html)
# Pages/assets the service worker must cache for offline use.
CACHED=(scob-dashboard-v3.html telescope-types.html moon-tonight.html tracking-methods.html tonights-tour.html sky-finder.html eyepiece-fov.html kiosk.html align-stars.html plan-ahead.html solar.html object-cards.html checklist.html constellation-story.html scale-model.html highlights-card.html qr-poster.html identify.html audio-tour.html almanac.html quiz.html occultations.html iss-transits.html sky-events.html cosmic-extremes.html singapore-sky.html light-pollution.html phone-astrophotography.html seestar.html sky-guide.html main.html scob-dashboard.html astro-core.js version.js)

section "Version source of truth"
VER=$(grep -aoE "SCOB_VERSION[[:space:]]*=[[:space:]]*'[^']+'" version.js 2>/dev/null | grep -aoE "v[0-9]+\.[0-9]+")
if [ -n "$VER" ]; then ok "version.js declares $VER"; else bad "could not read SCOB_VERSION from version.js"; fi

section "No hardcoded version numbers left in pages"
if grep -alr 'SCOB Night-Sky <b>v' --include='*.html' . | grep -q .; then
  grep -anr 'SCOB Night-Sky <b>v' --include='*.html' . | sed 's/^/    /'
  bad "hardcoded version footer(s) found — these should use class=\"scob-version\""
else
  ok "all live pages inject the version (none hardcoded)"
fi

section "Pages load version.js"
for p in "${PAGES[@]}"; do
  if [ ! -f "$p" ]; then bad "$p missing"; continue; fi
  if grep -aq 'class="scob-version"' "$p" && grep -aq 'version\.js' "$p"; then
    ok "$p"
  else
    bad "$p is missing the .scob-version placeholder or the version.js include"
  fi
done

section "Service worker (sw.js)"
CACHE=$(grep -aoE "scob-sky-v[0-9]+" sw.js | head -n 1)
if [ -n "$CACHE" ]; then ok "cache name is $CACHE"; else bad "no scob-sky-vN cache name in sw.js"; fi
for a in "${CACHED[@]}"; do
  if grep -aq "'$a'" sw.js; then ok "cached: $a"; else bad "sw.js ASSETS is missing $a"; fi
done

section "README in step"
if [ -n "$VER" ] && grep -aEq "\*\*${VER}\*\*.*current" README.md; then
  ok "README marks $VER as (current)"
else
  bad "README has no *(current)* row for $VER"
fi
if [ -n "$CACHE" ] && grep -aqF "$CACHE" README.md; then
  ok "README mentions $CACHE"
else
  printf '  \033[33m! README does not mention %s (optional)\033[0m\n' "${CACHE:-cache}"
fi

section "Internal links resolve"
badlinks=0
for f in *.html; do
  for t in $(grep -aoE 'href="[^"#:]+\.html"' "$f" | sed -E 's/href="([^"]+)"/\1/'); do
    if [ ! -f "$t" ]; then bad "$f -> $t (missing)"; badlinks=$((badlinks+1)); fi
  done
done
if [ "$badlinks" -eq 0 ]; then ok "all internal .html links point to existing files"; fi

section "Result"
printf '  %d passed, %d failed\n' "$pass" "$fail"
if [ "$fail" -eq 0 ]; then
  printf '  \033[32mREADY TO UPLOAD.\033[0m\n'
  exit 0
else
  printf '  \033[31mNOT READY - fix the X items above.\033[0m\n'
  exit 1
fi
