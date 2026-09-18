# Repo migration: making this usable by other people

Status: **proposed, not started** (2026-09-17). Start after the weekly Datadog schedule is switched on, not while
a run or a local timing pass is using the scripts: moving files mid-run breaks it.

## Why

This repo began as `fetch`, a script to bulk-download and bulk-edit Datadog tests. It is now mostly `Mobile/`: a
full Datadog Synthetics suite for the MentorAPM mobile app, with 145 leaf tests, 24 suites, 123 scripts and about
2,200 lines of docs. Writing a test is the cheap part now, because an AI assistant can generate one. What makes
this repo worth sharing are the **guardrails** that make a generated test trustworthy:

- `preflight.py`, a single command that runs every check (wiring, sync, drift, literals, bench, locals, fixtures,
  docs, schedule)
- the must-fail JS bench (`check_js_assertions.js`)
- the stale-literal scan (`check_literals.py`)
- the fixture resets and checks
- the 40 traps in `Mobile/test_authoring.md`

The migration should make those the front door.

## What is in the way today

| Problem | Where | Effect on a newcomer |
|---|---|---|
| Two projects in one repo | root: `fetch.py`, `test.py`, `DOCS.md`, `fetch_logo.png` (2024); `Mobile/`: the real project | The README describes only the old tool, so a newcomer starts in the wrong place |
| Setup depends on one machine's layout | `requirements.txt` lacks Playwright; the bench finds `jsdom` in a sibling `../../MentorTwo/node_modules`; `check_literals.py` and `sweep_strings.py` default to `~/GitHub/MentorAPM/MentorTwo`; everything assumes `.venv` at the root | A fresh clone fails in places the current owner never sees |
| The safety rules live outside the repo | the owner's standing rules are held in one person's Claude memory files | Another person, or their AI assistant, starts without them |
| One-off migration scripts beside daily tools | `add_crash_guard.py`, `add_role_guard.py`, `fix_crew_coupling.py`, `harden_login.py`, `patch_collector_upload.py` | The toolset looks larger and riskier than it is |
| Fixture ids hardcoded | the work-order fixture id in 33 scripts, the AV job id in 18 | Changing a fixture means a hunt through many scripts |
| Docs written as one maintainer's running record | `Mobile/*.md`: § bug numbers, OPEN WORK `#N` rows, traps | Accurate, but no "start here" and no glossary |
| Personal ownership | remote is `github.com/caldwell-matthew/fetch`; Datadog keys in a personal `.env` | Others can't be given access cleanly, and keys can't be rotated per person |

The standing rules to carry into the repo (step 2) are:
- never write a delete step unless the owner names the flow
- never touch Pump 0102's attachments
- one device per test
- only Datadog-created work orders may be deleted
- state the cost and get a go-ahead before any Datadog run
- push and pull only the tests being edited
- verify tests individually, not by suite
- `bugs_found.md` holds real bugs only
- OPEN WORK holds only unfinished work
- the docs are living state, not a changelog

## Plan

### 1 · Front door (about 2 hours)
- [ ] New root `README.md` that says what the repo is now, with a five-minute path: set up, run
      `preflight.py`, replay one test locally.
- [ ] Move the original `fetch` tool (`fetch.py`, `test.py`, `DOCS.md`, logo) to `legacy/`, or delete it
      (owner's decision).
- [ ] One setup command (`make setup` or `setup.sh`): create the venv, install packages,
      `playwright install chromium`, install `jsdom` locally.
- [ ] Complete `requirements.txt` (Playwright) and add a `package.json` for `jsdom`.
- [ ] Read the MentorTwo checkout path from a setting (an env var, e.g. `MENTORTWO_DIR`) instead of assuming
      one. Fail with a clear message when it's missing.

### 2 · Rules into the repo (about 1 hour)
- [ ] `CLAUDE.md` at the root: the standing rules above, the six-step loop from `test_authoring.md` (read the
      component → build → static checks → local replay → `verify.py` → wire), and where each kind of fact
      lives. AI assistants read this file automatically, so the rules apply to everyone's sessions, not one.
- [ ] `CONTRIBUTING.md`: "adding a test in six steps", with one worked example, plus a glossary (fixture,
      suite, leaf, wire, verify, soft/optional/always, residue, trap).

### 3 · Tidy (about half a day)
- [ ] Move the one-off migration scripts to `Mobile/dd_scripts_mobile/_archive/` with a one-line note on what
      each did and when.
- [ ] A `fixtures.py` holding every fixture id and name, imported by the build scripts.
- [ ] One entry command, e.g. `mobile.py verify | run | push | preflight | timing | reset-av`, wrapping the
      existing scripts. Keep the scripts; the entry point is only a map.
- [ ] Consider grouping the 103 `build_*.py` into folders by module, matching `suite_plan.MODULES`.
- [ ] Re-run `preflight.py` and `check_drift.py` after every move: generators and JSON must still agree.

### 4 · Ownership and CI
- [ ] Move the repo to the MentorAPM GitHub org.
- [ ] Datadog keys per person, or a service account, never shared in a file. Document which Datadog
      permissions are needed (the concurrency-cap setting needs `billing_edit`).
- [ ] CI on every pull request running the **free** checks only: drift, literals, bench, locals, docs,
      schedule, wiring. Never a Datadog run. `sync` and the fixture checks need keys and dev access, so they can
      stay local, or run with a read-only key.

## Out of scope
- Rewriting tests or changing what they assert. This is packaging and docs only.
- The local-only Playwright tier (checklist #43, deferred by the owner).
- Anything that spends Datadog runs.
