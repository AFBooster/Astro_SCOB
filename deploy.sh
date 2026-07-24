#!/usr/bin/env bash
# One-command publish for the SCOB Night-Sky site.
# GitHub Pages (via .github/workflows/deploy-pages.yml) rebuilds automatically on push.
# Usage:  ./deploy.sh "optional commit message"
set -e
cd "$(dirname "$0")"

# Optional local pre-flight — same check the CI runs.
if [ -f check-release.sh ]; then
  chmod +x check-release.sh
  ./check-release.sh || { echo "Pre-flight check failed — fix the items above, then re-run."; exit 1; }
fi

git add -A
git commit -m "${1:-Update SCOB Night-Sky site}" || { echo "Nothing to commit."; exit 0; }
git push
echo
echo "Pushed. Watch the deploy under the repo's Actions tab — the live site updates in ~1 minute."
