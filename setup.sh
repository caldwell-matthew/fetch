#!/usr/bin/env bash
# One-time setup for a fresh clone. Safe to re-run: every step skips what is already in place.
#
#   ./setup.sh
#
# Needs: Python 3.12+, Node 18+, git. Then a `.env` at the repo root (see README.md) and, for the
# source checks, a MentorTwo checkout (MENTORTWO_REPO).
set -euo pipefail
cd "$(dirname "$0")"

step() { printf '\n\033[1m%s\033[0m\n' "$*"; }

step "1/4  Python virtualenv (.venv) — every script expects ./.venv/bin/python"
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
fi
.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -r requirements.txt

step "2/4  Chromium for local replays (Playwright)"
.venv/bin/python -m playwright install chromium

step "3/4  jsdom for the JS assertion bench"
npm install --no-audit --no-fund --silent

step "4/4  Checking what is still yours to provide"
missing=0
if [ ! -f .env ]; then
  echo "  ✗ .env — create it at the repo root with your Datadog keys:"
  echo '        DD_API="…"'
  echo '        DD_APP="…"'
  missing=1
else
  echo "  ✓ .env"
fi
repo="${MENTORTWO_REPO:-$HOME/GitHub/MentorAPM/MentorTwo}"
if [ -d "$repo/.git" ]; then
  echo "  ✓ MentorTwo checkout at $repo"
else
  echo "  ✗ No MentorTwo checkout at $repo — the source checks (check_literals, sweep_strings) need one."
  echo "    Clone it, then:  export MENTORTWO_REPO=/path/to/MentorTwo   (and 'git fetch origin development' in it)"
  missing=1
fi

if [ "$missing" = 0 ]; then
  echo
  echo "Ready. Try:  .venv/bin/python legacy/Mobile/dd_scripts_mobile/preflight.py"
else
  echo
  echo "Setup done; provide the ✗ items above, then run .venv/bin/python legacy/Mobile/dd_scripts_mobile/preflight.py"
fi
