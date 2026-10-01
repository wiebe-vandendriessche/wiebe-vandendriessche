#!/usr/bin/env bash
# Fail if any website source file contains a non-ASCII character (see CLAUDE.md).
# Accented letters belong in HTML entities, e.g. &euml;.
#
#   scripts/check-ascii.sh

set -euo pipefail
cd "$(dirname "$0")/.."

matches=$(find content config layouts i18n assets scripts static build.sh vercel.json package.json \
    -type f \( -name '*.md' -o -name '*.html' -o -name '*.toml' -o -name '*.yaml' -o -name '*.yml' \
    -o -name '*.json' -o -name '*.js' -o -name '*.mjs' -o -name '*.css' -o -name '*.sh' -o -name '*.py' \
    -o -name '*.webmanifest' \) -print0 \
  | xargs -0 grep -nP '[^\x00-\x7F]' || true)

if [[ -n "${matches}" ]]; then
  echo "Non-ASCII characters found (use ASCII or an HTML entity instead):" >&2
  echo "${matches}" >&2
  exit 1
fi
echo "ASCII check passed."
