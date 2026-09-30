# MentorAPM end-to-end tests

Playwright (TypeScript) tests that drive the MentorAPM apps on **dev.mentorapm.com** the way a user does.
This folder is everything the tests need, and is meant to move into the MentorTwo repo as-is, so a pull
request that changes a screen can change its test.

| App | Folder | Status |
|---|---|---|
| **Mobile** (`/apm-mobile`) | [`mobile/`](mobile/README.md) | ✅ 28 suites, 191 tests, run against dev — the latest full pass is in `mobile/docs/testing_checklist.md` → 📊 RUN STATUS. Tests that pin an open bug fail by design, on that bug's symptom only |
| **Desktop** (`/apm`) | `desktop/` | Planned, not started — [`desktop/PLAN.md`](desktop/PLAN.md) |

Each app has its own tests, suites, docs and tools; what they share lives here.

## Shared

| Path | What |
|---|---|
| `package.json` · `tsconfig.json` | Playwright, TypeScript, dotenv |
| `playwright.config.ts` | Devices, timeouts, **one worker** (the apps' tests share records on dev, so they never run side by side); list, HTML, JUnit (`results/junit.xml`) and JSON (`results/results.json`) reports |
| `support/dd.ts` | Step helpers that behave the way Datadog's steps did — the mobile tests were converted from Datadog and rely on them |
| `support/env.ts` | Settings and the test login: CI variables, else `e2e/.env`, else the repo-root `.env` |
| `requirements.txt` | The Python tools' one outside package (`python-dotenv`) |
| `ci/circleci-e2e.yml` | Draft CircleCI jobs: a read-only smoke run after each dev deploy, a nightly full pass; both store the coverage page |
| `.gitignore` | The login, results and installs stay out of git wherever this folder lives |
| `results/` | Reports, screenshots, traces, the coverage page (git-ignored) |

## Setup

```bash
cd e2e
npm install
npx playwright install chromium
python3 -m venv ../.venv && ../.venv/bin/pip install -r requirements.txt   # the Python tools
```

The login (`DATA_DOG_EMAIL`, `DATA_DOG_PASSWORD`, `MOBDEV`) comes from CI variables, else `e2e/.env`, else the
repo-root `.env`; the first place that holds a name wins. Inside MentorTwo, use `e2e/.env` — the repo-root `.env`
there is the app server's.

## Seeing a run

```bash
npx playwright test mobile/suites/<the suite's FULL file name>     # the argument is a regex: a `*` matches its neighbours too
../.venv/bin/python mobile/tools/coverage_report.py --open         # the coverage page for that run
```

A full pass (`mobile/tools/playwright_pass.py`) writes its own page beside its summary in `results/passes/mobile/`.
The page shows each test passed / failed / pinned with its screenshot and trace, the checklist's gaps route by
route, the open bugs, and the app code the tests reach.

## Rules

These tests change **shared data on dev**. [`../AGENTS.md`](../AGENTS.md) holds the rules — what may be
deleted, which records are never touched, why suites that write never run together — and they apply to
people and AI assistants alike. Each app's `docs/` has the detail.

## Moving into MentorTwo

Ready: the folder is self-contained (its own packages, ignores and requirements); the login is read from `e2e/.env`
first; the tools that read the app's source (`check_literals.py`, `source_coverage.py`, `sweep_strings.py`, through
`mobile/tools/app_source.py`) read the repo they sit in, at `HEAD`, once inside MentorTwo — in CI, the commit being
deployed; the CI draft waits until dev serves the deployed build and never runs two e2e jobs at once.

Left, in order:
1. **Access** — can CircleCI's runners reach dev.mentorapm.com? A CircleCI context holding the test login and `MOBDEV`
   (a dedicated test account is better than the shared one).
2. **The pull request** into MentorTwo `development`: this folder as `e2e/`, the two jobs from `ci/circleci-e2e.yml`
   merged into `.circleci/config.yml`, and the rules in `../AGENTS.md` merged into MentorTwo's `AGENTS.md`.
3. **The first deploy** runs the smoke suites; read its stored coverage page, then decide on the nightly full pass
   (it writes to dev, about 2½ hours).

## Adding an app

`desktop/` takes the same shape as `mobile/` — see [`desktop/PLAN.md`](desktop/PLAN.md) for the planned folders (one
per module), IDs, shared tools, data safety and build order.
