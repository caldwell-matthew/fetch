# Repo migration: from this repo into MentorTwo

**Where it's going:** `e2e/` moves into the MentorTwo repo, so tests sit beside the code they test and a pull
request that changes a screen can change its test. `legacy/` does not move; it is deleted once nothing needs it.

## Done

- **Datadog → Playwright.** The mobile suite was converted from Datadog browser tests to Playwright
  (TypeScript) on 2026-09-23. All 23 scheduled suites (135 tests) pass locally against dev. The TypeScript is the
  source now; the converter is retired in `legacy/`.
- **One folder for everything in use.** `e2e/` holds the shared Playwright config and helpers, and one folder per
  app (`e2e/mobile/`, with its tests, suites, docs and tools). Nothing in `e2e/` depends on `legacy/`.
- **Front door and rules.** `README.md`, `AGENTS.md` (read by Claude Code, Codex and other agents), `CONTRIBUTING.md`
  and `./setup.sh` describe the Playwright workflow.
- **Backups.** Every Datadog test (433) and global variable (250) is saved under `legacy/dd_tests_backup/`; the
  variables' values are in the repo-root `.env`.

## Left

| | |
|---|---|
| **CI** | Draft in `e2e/ci/circleci-e2e.yml`: the read-only smoke suites after each dev deploy, a full pass nightly. Needs: can CircleCI reach dev; which context holds the login; where results go |
| **Block Datadog RUM in the tests** | Otherwise every test session is billed and counted as a real user |
| **Desktop** | `e2e/desktop/`, the same shape as `e2e/mobile/` |
| **Port the two Datadog-era checks** | The JS-assertion bench and the literals check read the old JSON; they need to read `e2e/*/tests/` |
| **Rewrite `e2e/mobile/docs/test_authoring.md`** | Its traps hold; its loop describes Datadog JSON |
| **Move `e2e/` into MentorTwo** | Settings then come from CI variables rather than this repo's `.env`; the one path that climbs out of `e2e/` is `support/env.ts` reading the repo-root `.env` |
| **Retire Datadog** | Decide with the owner's manager; then delete `legacy/` |
| **Ownership** | Test credentials per person or a service account in CI, never a shared file |

Mobile-specific work (new tests, open coverage gaps) is tracked in `e2e/mobile/docs/testing_checklist.md`, ▶ OPEN
WORK — this file covers the repo.

## Out of scope

- Changing what the tests assert. The migration moves and packages them.
- Running anything on Datadog while it is paused.
