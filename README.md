# MentorAPM Datadog tests

Datadog Synthetics browser tests for the **MentorAPM mobile app** (`dev.mentorapm.com/apm-mobile`), and the
tooling that keeps them trustworthy: 145 tests in 24 suites covering every mobile route, scheduled weekly
on Datadog.

Writing a test is the easy part, and an AI assistant can draft one. The point of this repo is the checks
around it. Every test is replayed locally before it spends a Datadog run. Every JavaScript assertion is
proven against a model page that must also make it fail. Every string a test looks for is checked against
the app's source. And shared test data is verified to be back at rest.

## Five-minute start

```bash
./setup.sh                           # venv, packages, Chromium, jsdom
.venv/bin/python mobile.py           # the commands, and what each costs in Datadog runs
.venv/bin/python mobile.py preflight # every free check; ends in PREFLIGHT CLEAN
.venv/bin/python mobile.py replay MOB.310   # replay one test locally (0 Datadog runs)
```

Before that, you need:

- **Datadog keys** in a `.env` at the repo root (never committed):
  ```
  DD_API="…"
  DD_APP="…"
  ```
  The test account's login is read from Datadog's global variables with these keys. Nothing else to store.
- **A MentorTwo checkout** (the app's source), for the checks that read it. By default it's expected beside
  this repo at `~/GitHub/MentorAPM/MentorTwo`; elsewhere, `export MENTORTWO_REPO=/path/to/MentorTwo`. Run
  `git fetch origin development` in it before the source checks.
- Python 3.12+, Node 18+, git.

## Before you change anything

Read **[CLAUDE.md](CLAUDE.md)**. It holds the rules that keep these tests from damaging shared data or
spending the run budget, and it applies whether you work by hand or with an AI assistant. Then
**[CONTRIBUTING.md](CONTRIBUTING.md)** walks through adding a test.

⚠️ **A Datadog run costs money** (a suite bills one run per test in it). Everything under "Five-minute start"
is free; `verify.py`, `dd_tools.py run` and a live schedule are not.

## Where things live

| Path | What |
|---|---|
| `Mobile/testing_checklist.md` | What's covered, what's proven on Datadog, and the open work. **Start here for status.** |
| `Mobile/test_authoring.md` | How to build and prove a test: the loop, fixtures, tooling, and 40 traps that each cost a run once |
| `Mobile/coverage.md` | What a green run of each suite actually proves |
| `Mobile/bugs_found.md` | Real product bugs the tests found |
| `Mobile/cleanup_spec.md` | Test residue, cleanup, and resetting the Asset Verify fixture |
| `mobile.py` | One entry point onto the tooling, with each command's Datadog cost |
| `Mobile/dd_scripts_mobile/` | Tooling: `build_*.py` generate tests; `preflight.py`, `local_run.py`, `verify.py`, `dd_tools.py`, `suite_plan.py` |
| `Mobile/dd_tests_mobile/` | The tests as JSON, which is **the source of truth** pushed to Datadog |
| `legacy/` | The repo's original bulk download/edit tool, kept for full backups |
| `repo_migration.md` | The plan for making this repo easier for others to use |
