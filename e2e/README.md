# MentorAPM end-to-end tests

Playwright (TypeScript) tests that drive the MentorAPM apps on **dev.mentorapm.com** the way a user does.
This folder is everything the tests need, and is meant to move into the MentorTwo repo as-is, so a pull
request that changes a screen can change its test.

| App | Folder | Status |
|---|---|---|
| **Mobile** (`/apm-mobile`) | [`mobile/`](mobile/README.md) | ✅ 24 suites, 139 tests pass against dev (one pins a bug, red by design) |
| **Desktop** | `desktop/` — not started | Next |

Each app has its own tests, suites, docs and tools; what they share lives here.

## Shared

| Path | What |
|---|---|
| `package.json` · `tsconfig.json` | Playwright, TypeScript, dotenv |
| `playwright.config.ts` | Devices, timeouts, **one worker** (the apps' tests share records on dev, so they never run side by side), JUnit + HTML reports |
| `support/dd.ts` | Step helpers that behave the way Datadog's steps did — the mobile tests were converted from Datadog and rely on them |
| `support/env.ts` | Settings and the test login, from the repo-root `.env` (or CI variables) |
| `ci/circleci-e2e.yml` | Draft CircleCI jobs: a smoke run after each dev deploy, a nightly full pass |
| `results/` | Reports, screenshots, traces (git-ignored) |

## Setup

```bash
cd e2e
npm install
npx playwright install chromium
```

The login comes from `.env` at the repo root (`DATA_DOG_EMAIL`, `DATA_DOG_PASSWORD`, `MOBDEV`); the Python
tools use the repo's `.venv` (`./setup.sh` at the root makes both).

## Rules

These tests change **shared data on dev**. [`../AGENTS.md`](../AGENTS.md) holds the rules — what may be
deleted, which records are never touched, why suites that write never run together — and they apply to
people and AI assistants alike. Each app's `docs/` has the detail.

## Adding an app

`desktop/` should take the same shape as `mobile/`: `suites/`, `tests/`, `support/` (its login), `docs/`
(a checklist of what is covered, route by route) and `tools/` (its suite list, fixture checks and pass
runner). Add a Playwright project per app to `playwright.config.ts` when the second one arrives, so
`npx playwright test --project=mobile` runs one app.
