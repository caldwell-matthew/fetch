# MentorAPM end-to-end tests

Playwright (TypeScript) tests for the **MentorAPM apps** on `dev.mentorapm.com`, and the tooling that keeps
them trustworthy. The mobile app is covered today — 24 suites, 139 tests, every mobile route — and the desktop
app is next.

Writing a test is the easy part, and an AI assistant can draft one. What makes a test worth trusting is the work
around it: every write proven with a server read rather than a toast, the shared test data checked to be at rest
before a suite that changes it, and a record of what each suite actually proves and what it doesn't.

## Five-minute start

```bash
./setup.sh                                             # venv, Playwright, Chromium
.venv/bin/python e2e/mobile/tools/fixtures.py          # are dev's shared test records at rest? (read-only)
cd e2e && npx playwright test mobile/suites/MOB.975*   # run one suite: the phone suite, read-only, ~2 min
```

Before that, you need:

- A **`.env`** at the repo root (never committed) with the test account and the dev URL:
  ```
  DATA_DOG_EMAIL="…"
  DATA_DOG_PASSWORD="…"
  MOBDEV="https://dev.mentorapm.com/apm-mobile/"
  ```
- A **MentorTwo checkout** (the app's source), for reading components and for the source-coverage map. By
  default it's expected beside this repo at `~/GitHub/MentorAPM/MentorTwo`; elsewhere,
  `export MENTORTWO_REPO=/path/to/MentorTwo`.
- Python 3.12+, Node 18+, git.

## Before you change anything

Read **[AGENTS.md](AGENTS.md)**. The tests change **shared data on dev**, and its rules keep them from damaging
it; they apply whether you work by hand or with an AI assistant. Then **[CONTRIBUTING.md](CONTRIBUTING.md)**
walks through adding a test.

## Where things live

| Path | What |
|---|---|
| [`e2e/`](e2e/README.md) | **Everything in use.** Shared Playwright config and helpers, one folder per app. Moves into MentorTwo later |
| [`e2e/mobile/`](e2e/mobile/README.md) | The mobile suite: status, tests, suites, tools, and `docs/` — **start with its README for status** |
| `e2e/mobile/docs/testing_checklist.md` | What's covered, route by route, and the open work |
| `legacy/` | The Datadog era, kept for reference and deletable: the Datadog tests and their tooling, the original bulk download tool, and full backups of every Datadog test. Nothing in `e2e/` depends on it |
| `repo_migration.md` | The plan for making this repo easier for others to use |
