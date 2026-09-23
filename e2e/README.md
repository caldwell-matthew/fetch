# Playwright tests for the MentorAPM mobile app

The mobile suites, converted from the Datadog browser tests into Playwright (TypeScript). This folder is
**self-contained** — its own `package.json`, config, helpers and tests — so it can move into MentorTwo as a
folder when you want the tests to live beside the app (`Mobile/testing_checklist.md` ▶ #37).

```bash
cd e2e
npm install
npx playwright install chromium
npm test                                        # every converted suite, one at a time
npx playwright test suites/MOB.954*             # one suite
npx playwright test --headed --workers=1        # watch it
npm run report                                  # the HTML report of the last run
```

Nothing here costs a Datadog run. What it does use is **shared data on dev**, so the rules in
[../AGENTS.md](../AGENTS.md) apply exactly as they do to the Datadog tests: never delete anything the owner
has not named, never touch Pump 0102's attachments, and never run two data-changing suites at once
(`workers: 1` in the config enforces the last one).

## Where things are

| Path | What |
|---|---|
| `suites/*.spec.ts` | A suite: log in once, then run its children in order in that one session |
| `tests/*.ts` | One exported function per leaf test, its steps in order |
| `support/dd.ts` | Datadog's step rules in Playwright: polling, one-element locators, soft/optional steps, JS assertions, upload stand-ins |
| `support/login.ts` | The shared login, generated from `MOB.000` |
| `support/env.ts` | Globals from the repo-root `.env`, and per-run ids (`{{ numeric(8) }}`) |
| `playwright.config.ts` | Devices (tablet 768×1020, phone 320×550), timeouts, one worker, JUnit + HTML reports |

## How a test gets here

Generated, not written by hand:

```bash
.venv/bin/python Mobile/dd_scripts_mobile/to_playwright.py MOB.954   # one suite and its children
```

The Datadog JSON in `Mobile/dd_tests_mobile/` is still the source. The conversion is **faithful**: every step,
including the fixed `wait`s, comes across as it stands, so a red means a real difference rather than a
rewrite. Tightening those waits into waits-for-a-condition happens later, suite by suite, with timings
measured either side. Until a suite has been through that, edit its `build_*.py` and re-convert rather than
editing the generated files.

## What does not survive the move from Datadog

- **`MOB.600`'s photo picker** cannot be driven outside Datadog's browser, so that check stays manual.
- **Uploaded file bytes** live in Datadog's storage (trap 12). Upload steps use a stand-in file of the same
  name, from `Mobile/local_fixtures/` when one exists.
- **Global variables** now come from the repo-root `.env`. Their old definitions are in
  `legacy/dd_tests_backup/<date>/global_variables.json`.
