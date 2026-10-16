#!/usr/bin/env bash
# SCOB Night-Sky - publish from Git Bash / macOS / Linux.
# The same steps, in the same order and with the same safeguards, as publish.bat
# (the Windows one-click version). Keep the two in step.
#
# Usage:  ./deploy.sh "what changed"
#
# v4.18: rewritten. The old version had the bug publish.bat had before v4.08:
# it treated a FAILED commit as "nothing to commit" and stopped (or, with a
# stale lock, pushed the previous commit). It also never pulled first, so the
# haze-image Action's commits made every push bounce.
set -u
cd "$(dirname "$0")"

fail() { echo; echo "*** $1 ***"; shift; for l in "$@"; do echo "  $l"; done; echo; exit 1; }

# --- clear stale git locks left by a crashed git process (see publish.bat) ---
for L in .git/index.lock .git/HEAD.lock .git/ORIG_HEAD.lock .git/config.lock \
         .git/refs/heads/*.lock .git/refs/remotes/origin/*.lock; do
  [ -e "$L" ] && { echo "Removing stale $L ..."; rm -f "$L"; }
done

MSG="${1:-}"
[ -z "$MSG" ] && read -r -p "Describe what changed (then press Enter): " MSG
[ -z "$MSG" ] && MSG="Update SCOB Night-Sky"

echo; echo "== Local pre-flight tests =="
if command -v node >/dev/null 2>&1; then
  node test-astro.js && node test-pages.js && node test-logic.js \
    || fail "Local checks FAILED - nothing was committed or pushed." "Fix the problem above, then run again."
  echo "All local tests passed."
else
  echo "Node.js not found - skipping local tests (the GitHub Action still runs them)."
fi

echo; echo "== Release check =="
bash ./check-release.sh || fail "check-release.sh FAILED - nothing was committed or pushed."

echo; echo "== Committing and pushing =="
git add -A
if git diff --cached --quiet; then
  echo "  (Nothing new to commit - pushing any pending commits.)"
else
  git commit -m "$MSG" || fail "git commit FAILED - nothing was pushed." \
    "Read git's message above. A stale lock is the usual cause; this script clears them on start."
  echo "Committed."
fi

echo "Syncing with GitHub before pushing..."
git pull --no-edit || fail "git pull hit a merge conflict." "Your commit is saved locally." \
  "Resolve the files git listed, then: git add -A && git commit --no-edit && git push"
git push || fail "git push failed." "Not signed in, or the remote moved on: git pull --no-edit, then retry."

echo
echo "Pushed. The deploy is now running."
echo "  Watch it:   https://github.com/AFBooster/Astro_SCOB/actions"
echo "  Live site:  https://afbooster.online/  (the deploy itself now checks the live site serves the new build)"
