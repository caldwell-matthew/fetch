# Working in this repo

End-to-end tests for the MentorAPM apps, in Playwright (TypeScript), run against **shared** data on
`dev.mentorapm.com`. Everything in use lives in **`e2e/`** — one folder per app (`e2e/mobile/` today, `e2e/desktop/`
next) — and is meant to move into the MentorTwo repo. **`legacy/`** holds the Datadog-era tooling and backups,
kept for reference and deletable: nothing in `e2e/` may depend on it, and nothing new goes into it.

These rules come from the owner. Each exists because breaking it once cost data, money or trust. They apply to
people and AI assistants alike — Claude Code, Codex and other agents all read this file by name.

⛔ **Datadog is paused** (the owner's manager, 2026-09-18, over the bill). Run nothing on Datadog and set nothing
live until the owner says it is cleared.

## Hard rules

**Data on dev**
- **Never write a delete step unless the owner names the flow.** A delete path existing in the app does not make
  it supported. The named flows are listed in `e2e/mobile/docs/test_authoring.md`, trap 2.
- **Only test-created records may be deleted**, identified by their marker (`DD SYNTHETIC …`). Never a fixture,
  never a person's data.
- **Never touch Pump 0102's attachments.**
- **One device per test.** Two devices are two sessions racing on the shared fixtures (trap 1). The phone suite is
  the exception: read-only, and never run beside a suite that writes.
- **Suites that change data run one at a time**, never beside each other or beside a read-only suite. Playwright
  runs with one worker, and `e2e/mobile/tools/playwright_pass.py` runs them in order with the fixture checks
  between them. Use it for a pass, not a bare `npx playwright test`.

**Cost**
- Local runs are free but touch shared data: run them **headless** unless someone asks to watch.
- **Never raise Datadog's on-demand concurrency cap above 1**, should Datadog return: each parallel slot bills by
  the month (5 slots cost about $1,000 in September 2026). It needs the owner's manager's approval. The Datadog plan
  is 1,000 runs a month; runs past it bill as overage. Datadog runs need the cost stated and a go-ahead first.
- CI minutes cost money too: keep the per-deploy run to the read-only smoke suites.

**Reporting**
- **Describe a run from its evidence**: the failure screenshot and trace in `e2e/results/`, the page, a probe. Not
  from step names or the source. Label anything not observed as inferred.
- **Ask before filing a new bug** in `bugs_found.md`.

**Docs are living state, not a history**
- `testing_checklist.md` and `coverage.md` describe the state *now*. Edit rows in place, and never append dated
  "done" notes, lessons or run logs.
- **OPEN WORK holds only unfinished work.** Finishing an item deletes its row in the same change, and every `#N`
  that cited it is reworded. Row numbers are never reused.
- **`bugs_found.md` holds real bugs only.** Fixed bugs, dead code, by-design behaviour, latent hazards nobody can
  reach, and environment facts get deleted, not kept as notes. A test-relevant fact from a deleted entry is
  restated where it's used (the § number dropped).
- Why a test is built as it is goes in a comment in the test; traps go in `test_authoring.md`.
- Run `e2e/mobile/tools/check_docs.py` after any change to the docs or the tests. It fails on a finished OPEN WORK
  row, a dangling `#N`, or stale counts.

**Git**
- The owner commits straight to `main`, as one commit per work session, only when asked. Pushing is a separate
  ask.

## The loop: adding or changing a test

The TypeScript in `e2e/<app>/tests/` and `e2e/<app>/suites/` **is the source** — edit it directly.

| # | Step | Command |
|---|---|---|
| 1 | Read the component on `origin/development`: its branches, its submit path, what a closing modal really proves | `git -C "$MENTORTWO_REPO" show origin/development:client/mobile/…` |
| 2 | Write or change the test in `tests/`, and call it from its suite in `suites/` (a new suite also goes into `tools/suites.json`) | — |
| 3 | Type-check | `cd e2e && npx tsc --noEmit` |
| 4 | Check the fixtures are at rest, then run the suite locally until it is green — or red only where it pins a bug | `.venv/bin/python e2e/mobile/tools/fixtures.py` · `cd e2e && npx playwright test mobile/suites/MOB.9xx*` |
| 5 | Update the docs in place | `.venv/bin/python e2e/mobile/tools/check_docs.py` |

## Before trusting a result

- A UI signal (a toast, a closed modal) is not proof that something saved. Prove writes with a server read.
- A red is only a failure of the thing tested if the fixtures were at rest when it started
  (`e2e/mobile/tools/fixtures.py`).
- Read `e2e/mobile/docs/test_authoring.md`'s traps before building. Each one cost a failed run once.
