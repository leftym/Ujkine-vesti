#!/usr/bin/env bash
# usage: publish-ci-log.sh <local-file> <name-on-ci-logs-branch>
# Pushes a log file to the `ci-logs` branch so it can be read with plain git (no API token needed).
set -uo pipefail
src="$1"; name="$2"
url="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
for attempt in 1 2 3 4; do
tmp="$(mktemp -d)"
if ! git clone -q --depth 1 --branch ci-logs "$url" "$tmp" 2>/dev/null; then
  git init -q "$tmp"; git -C "$tmp" checkout -q -b ci-logs; git -C "$tmp" remote add origin "$url"
fi
mkdir -p "$(dirname "$tmp/$name")"
cp "$src" "$tmp/$name"
cd "$tmp"
git config user.name "github-actions"; git config user.email "actions@users.noreply.github.com"
git add -A
git commit -qm "CI log: $name (run ${GITHUB_RUN_NUMBER:-?})" || exit 0
git push -q origin ci-logs && exit 0
# another run pushed at the same time: start again from the new state
cd /; sleep $((RANDOM % 5 + 1))
done
exit 1
