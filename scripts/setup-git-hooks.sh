#!/usr/bin/env sh
set -eu

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
	echo "Not inside a git repository; skipping hook setup." >&2
	exit 0
}
git -C "$repo_root" config core.hooksPath .githooks
echo "Git hooks enabled from $repo_root/.githooks"
