# Playwright tests for the MentorAPM mobile app

The mobile regression suite, converted from the Datadog browser tests into Playwright (TypeScript) and
run against **dev.mentorapm.com**. This folder is **self-contained** — its own `package.json`, config,
helpers and tests — so it can move into MentorTwo as a folder.

## Status

**Every scheduled suite passes locally against dev: 23 suites, 135 tests.** Datadog is paused (▶ checklist
#37); these tests are its replacement.

| | Suites | Tests | Result |
|---|---|---|---|
| Read-only | 10 | 60 | ✅ all pass — one run, 48 min |
| Data-changing, one at a time with the fixture checks between them | 13 | 75 | ✅ all pass — ≈ 80 min; the fixtures read back at rest after the last |
| Held | 1 (`MOB.967`) | 4 | ⏸️ not run — see *Held* below |

What those tests prove, route by route, is in [`docs/coverage.md`](docs/coverage.md); what is left to cover is in
[`docs/testing_checklist.md`](docs/testing_checklist.md) (176 of the 190 automatable rows automated, 13 partial, 1 open).
The docs are copies of `legacy/Mobile/`'s for now — see [`docs/README.md`](docs/README.md).

### Per suite

| Suite | Writes? | Tests | Local time |
|---|---|---|---|
| `MOB.953` Work orders · list | ✏️ | 9 | 8.3 min |
| `MOB.954` Work orders · detail, open tabs | | 8 | 7.9 min |
| `MOB.955` Work orders · detail, assets and records | | 6 | |
| `MOB.956` Work orders · records (charges, conditions, failures, notes) | ✏️ | 8 | 11.1 min |
| `MOB.957` Work orders · status and field edits | ✏️ | 5 | 9.9 min |
| `MOB.958` Work orders · assets and location edits | ✏️ | 4 | 3.7 min |
| `MOB.959` Work orders · stage writes and creates | ✏️ | 6 | 10.3 min |
| `MOB.960` Work orders · forms | ✏️ | 3 | 4.8 min |
| `MOB.981` Work orders · charges and offline | | 6 | |
| `MOB.961` Asset Verify · jobs list | | 6 | |
| `MOB.962` Asset Verify · job assets | | 6 | |
| `MOB.963` Asset Verify · verify, status and queue | ✏️ | 6 | 10.5 min |
| `MOB.964` Asset Verify · asset detail | | 3 | |
| `MOB.965` Asset Verify · asset detail edits | ✏️ | 3 | 5.7 min |
| `MOB.966` Asset Collector · capture | | 9 | |
| `MOB.968` Asset Lookup · rows and tabs | | 9 | |
| `MOB.969` Asset Lookup · filters and sort | | 5 | 3.0 min |
| `MOB.980` Asset Lookup · edits | ✏️ | 3 | 1.9 min |
| `MOB.970` Material Lookup | ✏️ | 7 | 4.3 min |
| `MOB.971` Map | ✏️ | 4 | 1.9 min |
| `MOB.972` App shell (header, menu, home) | ✏️ | 15 | 4.0 min |
| `MOB.973` Session — runs alone, last | ✏️ | 2 | 2.7 min |
| `MOB.975` Phone (320×550) | | 2 | |

The read-only suites ran as one batch, so they have a combined time rather than one each.

### Held

- **`MOB.967` Asset Collector · saved asset.** Its first test, `MOB.600`, opens the photo picker with a step
  Datadog recorded **without an xpath**, so only Datadog's own locator can find it. The converter marks the
  test `fixme`, so it reports as skipped, never as a pass. The suite was also held on Datadog while
  bugs §34 is open.

### Left to do

| | |
|---|---|
| **CircleCI** | Draft in `ci/circleci-e2e.yml`: read-only smoke after every dev deploy, full pass nightly. Needs: can CircleCI reach dev; which context holds the login; where results go (Slack, email) |
| **Block Datadog RUM in the tests** | A Playwright run is a real browser session, so RUM would bill it as a user and mix it into real-user data. One `context.route` in the suite setup |
| **`fixtures.ts`** | Record names, ids and `DD SYNTHETIC` markers in one file, not spread through the tests |
| **Tighten the waits** | 1,179 fixed `wait` steps are kept from Datadog. Replace them suite by suite with waits for a condition, timed either side |
| **Move into MentorTwo** | So a pull request that changes a component can change its test |
| **Retire Datadog** | Its 433 tests and 250 global variables are backed up in `legacy/dd_tests_backup/`; the values are in the repo-root `.env` |

## Running it

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test suites/MOB.954*             # one suite
npx playwright test suites/MOB.954* --headed    # watch it
npm run report                                  # the HTML report of the last run
```

**For a pass, use the runner, not `npm test`.** Playwright runs suites back to back and knows nothing about
the shared records on dev. The runner keeps the schedule's order, runs each data-changing suite alone,
checks the fixtures before each one and after the last, stops at the first red, and saves each suite's
screenshots and traces:

```bash
.venv/bin/python legacy/Mobile/dd_scripts_mobile/playwright_pass.py --dry-run    # the plan
.venv/bin/python legacy/Mobile/dd_scripts_mobile/playwright_pass.py --stage 1    # read-only suites
.venv/bin/python legacy/Mobile/dd_scripts_mobile/playwright_pass.py --stage 2    # data-changing, one at a time
```

Summaries go to `legacy/Mobile/local_runs/passes/` (git-ignored).

Nothing here costs a Datadog run, but it does use **shared data on dev**, so the rules in
[../AGENTS.md](../AGENTS.md) apply exactly as before: never delete anything the owner has not named, never
touch Pump 0102's attachments, never run two data-changing suites at once (`workers: 1` enforces it).

## Where things are

| Path | What |
|---|---|
| `suites/*.spec.ts` | A suite: log in once, then run its children in order in that one session |
| `tests/*.ts` | One exported function per leaf test, its steps in order |
| `support/dd.ts` | Datadog's step rules in Playwright (see below) |
| `support/login.ts` | The shared login, generated from `MOB.000` |
| `support/env.ts` | Globals from the repo-root `.env`, and per-run ids (`{{ numeric(8) }}`) |
| `playwright.config.ts` | Devices (tablet 768×1020, phone 320×550), timeouts, one worker, JUnit + HTML reports |
| `ci/circleci-e2e.yml` | Draft CircleCI jobs |
| `probe/` | Read-only diagnostics, never part of a pass: `E2E_PROBE=1 npx playwright test probe/<name>` |
| `docs/` | The suite's working docs: checklist, coverage, authoring traps, bugs found, cleanup |

## How a test gets here

Generated, not written by hand:

```bash
.venv/bin/python legacy/Mobile/dd_scripts_mobile/to_playwright.py --all       # every suite
.venv/bin/python legacy/Mobile/dd_scripts_mobile/check_conversion.py          # prove it matches the source
```

The Datadog JSON in `legacy/Mobile/dd_tests_mobile/` is still the source: change a test in its `build_*.py`, then
re-convert — never edit the generated files. The conversion is **faithful**: every step comes across as it
stands, including the fixed `wait`s, so a red means a real difference rather than a rewrite.
`check_conversion.py` compares every generated step with its JSON — order, flags, timeouts, names — and
every suite's children and device.

## Datadog's rules, as this port keeps them

Each of these was a bug in the first conversion, found by a suite that went red for the wrong reason.

| Datadog rule | How `support/dd.ts` keeps it | What broke when it didn't |
|---|---|---|
| A failed step skips the steps after it, **except** `alwaysExecute` ones, which run **where they are** | every step goes through `run.step(name, {always?, allow?})`, in its original order | hoisting `alwaysExecute` steps to the end left `MOB.626`'s menus open mid-test |
| `alwaysExecute` and `allowFailure` are **independent** flags | `{always: true, allow: 'ignore'}` is a valid step | treating "always" as a kind made `MOB.348`'s optional fallback fatal |
| The report names the **first** failure | `Sequence` keeps it; later failures are logged | a failing cleanup step hid what really broke `MOB.389` |
| A click lands on the element, even under an overlay | strict click first, then `dispatchEvent('click')` — never `force: true`, which fires at coordinates, so an open modal eats it | `MOB.389`'s Failure-tab click went to the Condition modal, and Playwright called it a success |
| `typeText` types key by key and **appends** (trap 17) | `pressSequentially`, no delay, and the value is checked afterwards | a 20ms delay let the login form wipe the password mid-word |
| Datadog's browsers run on Linux, where select-all is Control+A | `Control+` becomes `ControlOrMeta+` | on macOS the "select the old term, then retype" steps left the old text |
| One match or fail (trap 3) — among elements you can **see** | `one()` keeps the visible match when hidden Mantine nodes also match | — |
| A suite's children share local variables by name, first definition wins | each test gets its **own** `RUNID` — a deliberate difference | nothing: in the four suites where two children declare `RUNID`, neither reads the other's |

## Test faults the port uncovered

Two failures were not the port: each failed the same way when the Python runner replayed the same JSON, so
they would have been red on Datadog too. Both are fixed in the tests' source.

- **The work-list gate passed in the gaps between loading phases.** The list shows six loading phases one
  after another, with 2–5s of nothing on screen between them, and the gate checked three messages in turn —
  so it passed in a gap, before loading had finished. A test that then navigated away killed the prefetch,
  and `MOB.350`'s equipment picker (which reads only the cache) had nothing to offer. The gate now needs no
  loading bar on screen for 10 seconds straight (`dd_tools.work_list_idle`); 27 tests use it.
- **`MOB.345` proved a sort on a set that kept growing.** It now narrows to the two protected fixture stages
  named `USED IN DATADOG`, which fit on screen in both orders.

## What does not survive the move from Datadog

- **`MOB.600`'s photo picker** cannot be driven outside Datadog's browser (see *Held*).
- **Uploaded file bytes** live in Datadog's storage (trap 12). Upload steps use a stand-in file of the same
  name, from `legacy/Mobile/local_fixtures/` when one exists.
- **Global variables** now come from the repo-root `.env`. Their old definitions are in
  `legacy/dd_tests_backup/<date>/global_variables.json`.
