# Working in this repo

⛔ **Datadog is paused** (the owner's manager, 2026-09-18, over the bill) and the suites are **being converted to
Playwright**, to run from CircleCI after each dev deploy (`Mobile/testing_checklist.md` ▶ #37). Run nothing on
Datadog and set nothing live until the owner says it is cleared. Everything below still applies: the Playwright
tests hit the same shared data on dev, and CI minutes cost money too.

Datadog Synthetics tests for the MentorAPM mobile app. The tests run against **shared** data on
`dev.mentorapm.com`, and every Datadog run **bills**. These rules come from the owner. Each one exists because
breaking it once cost data, runs or trust. They apply to people and AI assistants alike — Claude Code, Codex
and other agents all read this file by name.

## Hard rules

**Data on dev**
- **Never write a delete step unless the owner names the flow.** A delete path existing in the app does not make
  it supported. The named flows are listed in `Mobile/test_authoring.md`, trap 2.
- **Only Datadog-created records may be deleted**, identified by their marker (`DD SYNTHETIC …`). Never a fixture,
  never a person's data.
- **Never touch Pump 0102's attachments.**
- **One device per test.** Two devices run as concurrent sessions and race on the shared fixtures (trap 1). The one
  exception is the phone suite, which is read-only and never runs beside a data-changing suite.
- Suites that change data never run at the same time as each other, or beside a read-only suite. The weekly
  schedule enforces this with time slots (`suite_plan.SLOTS`, `preflight.py schedule`).

**Datadog runs cost money**
- **State the cost and get a go-ahead before any Datadog run**: `verify.py`, `dd_tools.py run`, a suite, or a
  schedule change that makes tests live. A suite bills `1 + its tests`; `verify.py <test>` bills 2, or 3 when red.
- **Never raise the on-demand concurrency cap above 1.** Datadog bills each parallel testing slot by the month,
  on its own invoice line: 5 slots were billed in September 2026, about $1,000 for the month. It needs the owner's manager's
  approval, not just a go-ahead. The monthly plan is **1,000 runs**; runs past it bill as overage.
- **Give a time estimate** for every Datadog run, push or pull. No estimate is needed for local work.
- **Verify tests one at a time** (`verify.py <test>`), not by running their suite, unless the owner asks for a suite.
- **Push and pull only the tests being edited.** `dd_tools.py push` takes names and refuses without them. Never
  push everything as a side effect. Before looping any script, read what it pushes or rebuilds.
- Anything free comes first: `preflight.py`, the bench, `local_run.py`. A local replay runs **headless** unless
  someone asks to watch.

**Reporting**
- **Describe a run from its evidence**: the failure screenshot in `Mobile/local_runs/<test>/`, the page, a probe.
  Not from step names or the source. Label anything not observed as inferred.
- **Ask before filing a new bug** in `bugs_found.md`.

**Docs are living state, not a history**
- `testing_checklist.md` and `coverage.md` describe the state *now*. Edit rows in place, and never append dated
  "done" notes, lessons or run-cost logs.
- **OPEN WORK holds only unfinished work.** Finishing an item deletes its row in the same change, and every `#N`
  that cited it is reworded. Row numbers are never reused.
- **`bugs_found.md` holds real bugs only.** Dead code, by-design behaviour, latent hazards nobody can reach, and
  environment facts get deleted, not kept as notes. A test-relevant fact from a deleted entry is restated where
  it's used (the § number dropped).
- Test-design reasoning goes in the `build_*.py` docstring, and traps go in `test_authoring.md`.
- Run `preflight.py docs` after any doc change. It fails on a finished OPEN WORK row, a dangling `#N`, or stale
  counts.

**Git**
- The owner commits straight to `main`, as one commit per work session, only when asked. Pushing is a separate
  ask.

## The loop: adding or changing a test

| # | Step | Command | Datadog runs |
|---|---|---|---|
| 1 | Read the component on `origin/development`: its branches, its submit path, what a closing modal really proves | `git -C "$MENTORTWO_REPO" show origin/development:client/mobile/…` | 0 |
| 2 | Build the test | `build_*.py` (replacing existing JSON needs `DD_FORCE=1`; run `check_drift.py` first) | 0 |
| 3 | Static checks, including a **must-fail** bench case for every new JavaScript step | `preflight.py` | 0 |
| 4 | Replay locally until green (or red only where designed) | `local_run.py <test>` | 0 |
| 5 | Confirm on Datadog, **after a go-ahead** | `verify.py <test>` | 2 (3 red) |
| 6 | Wire it into its suite | `suite_plan.py` → `build_module_suites.py` → `wire_suite.py` → `dd_tools.py push <suite>` | 0 |

All commands live in `Mobile/dd_scripts_mobile/` and run with `.venv/bin/python`. **The JSON in
`Mobile/dd_tests_mobile/` is the source of truth**: fix the generator to match it, never the reverse.

## Before trusting a result

- `preflight.py` must end in **PREFLIGHT CLEAN** before any Datadog run.
- A UI signal (a toast, a closed modal) is not proof that something saved. Prove writes with a server read
  (`dd_tools.server_assert`).
- Read `Mobile/test_authoring.md`'s traps before building. Each one cost a run once.
