#!/usr/bin/env bash
# One-time setup for a fresh clone. Safe to re-run: every step skips what is already in place.
#
#   ./setup.sh
#
# Needs: Python 3.12+, Node 18+, git. Then a `.env` at the repo root (see README.md) and, for the source
# coverage map, a MentorTwo checkout (MENTORTWO_REPO).
set -euo pipefail
cd "$(dirname "$0")"

step() { printf '\n\033[1m%s\033[0m\n' "$*"; }

step "1/3  Python virtualenv (.venv) — the e2e tools (fixture checks, pass runner) run with ./.venv/bin/python"
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
fi
.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -r requirements.txt

step "2/3  Playwright and Chromium for the tests (e2e/)"
(cd e2e && npm install --no-audit --no-fund --silent && npx playwright install chromium)

step "3/3  Checking what is still yours to provide"
missing=0
if [ ! -f .env ]; then
  echo "  ✗ .env — create it at the repo root with the test account's login and the dev URL:"
  echo '        DATA_DOG_EMAIL="…"'
  echo '        DATA_DOG_PASSWORD="…"'
  echo '        MOBDEV="https://dev.mentorapm.com/apm-mobile/"'
  missing=1
else
  echo "  ✓ .env"
fi
repo="${MENTORTWO_REPO:-$HOME/GitHub/MentorAPM/MentorTwo}"
if [ -d "$repo/.git" ]; then
  echo "  ✓ MentorTwo checkout at $repo"
else
  echo "  ✗ No MentorTwo checkout at $repo — reading the app's source (and the source coverage map) needs one."
  echo "    Clone it, then:  export MENTORTWO_REPO=/path/to/MentorTwo   (and 'git fetch origin development' in it)"
  missing=1
fi

if [ "$missing" = 0 ]; then
  echo
  echo "Ready. Try:  .venv/bin/python e2e/mobile/tools/fixtures.py   then   cd e2e && npx playwright test mobile/suites/MOB.975*"
else
  echo
  echo "Setup done; provide the ✗ items above, then run .venv/bin/python e2e/mobile/tools/fixtures.py"
fi
