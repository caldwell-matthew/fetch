# Mobile — Playwright tests for the MentorAPM mobile app

The mobile app's regression suite, run against **dev.mentorapm.com** (`/apm-mobile`). Converted from the
Datadog browser tests on 2026-09-23; **the TypeScript here is the source now** — edit it directly. Shared
config and step helpers are one level up in `e2e/`.

## Status

**Every suite passes locally against dev: 24 suites, 139 tests** — one of them red by design (below). Datadog is paused (▶ checklist
#37); these tests are its replacement.

| | Suites | Tests | Result |
|---|---|---|---|
| Read-only | 10 | 60 | ✅ all pass — one run, 48 min |
| Data-changing, one at a time with the fixture checks between them | 13 | 75 | ✅ all pass — ≈ 80 min; the fixtures read back at rest after the last |
| Data-changing, bug pin | 1 (`MOB.967`) | 8 | ✅ as intended — `MOB.600` red on bugs §34 alone, the others green |

What those tests prove, route by route, is in [`docs/coverage.md`](docs/coverage.md); what is left to cover is in
[`docs/testing_checklist.md`](docs/testing_checklist.md) (198 of the 207 automatable rows automated, 8 partial, 1 open).
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
| `MOB.962` Asset Verify · job assets | | 7 | 2.3 min |
| `MOB.963` Asset Verify · verify, status and queue | ✏️ | 6 | 10.5 min |
| `MOB.964` Asset Verify · asset detail | | 3 | |
| `MOB.965` Asset Verify · asset detail edits | ✏️ | 3 | 5.7 min |
| `MOB.966` Asset Collector · capture | | 9 | |
| `MOB.968` Asset Lookup · rows and tabs | | 9 | |
| `MOB.969` Asset Lookup · filters and sort | | 5 | 3.0 min |
| `MOB.980` Asset Lookup · edits | ✏️ | 3 | 1.9 min |
| `MOB.970` Material Lookup | ✏️ | 7 | 4.3 min |
| `MOB.971` Map (`MOB.930` is `fixme` — checklist #84) | ✏️ | 7 | 4.7 min |
| `MOB.972` App shell (header, menu, home) | ✏️ | 15 | 4.0 min |
| `MOB.967` Asset Collector · saved asset | ✏️ | 8 | 5.5 min without `MOB.936` |
| `MOB.973` Session — runs alone, last | ✏️ | 2 | 2.7 min |
| `MOB.975` Phone (320×550) | | 2 | |
| `MOB.982` Resilience · error states (network interception) | ✏️ | 6 | 2.4 min |
| `MOB.983` Resilience · session expiry | | 2 | |
| `MOB.984` Resilience · offline note | ✏️ | 1 | |

The read-only suites ran as one batch, so they have a combined time rather than one each.

### Red by design

- **`MOB.600` Asset Collector · create an asset** (in `MOB.967`). It pins bugs §34: the asset is created and shown
  locally, but the collect never reaches the server, so its last step — the server proof — fails. The suite
  expects exactly that failure and carries on; any other failure is a real red, and when §34 is fixed the test
  goes green by itself.
- **`MOB.923`** pins bugs §48 ("Item added" shown for a save the server refused), **`MOB.924`** pins §11 ("Form
  added" likewise), **`MOB.925`** pins §49 (a session the server extended is reported as "The operation was
  aborted."). Same rule: only the pinned symptom counts as the expected failure.

### Left to do

| | |
|---|---|
| **CircleCI** | Draft in `ci/circleci-e2e.yml`: read-only smoke after every dev deploy, full pass nightly. Needs: can CircleCI reach dev; which context holds the login; where results go (Slack, email) |
| **Block Datadog RUM in the tests** | A Playwright run is a real browser session, so RUM would bill it as a user and mix it into real-user data. One `context.route` in the suite setup |
| **`fixtures.ts`** | Record names, ids and `DD SYNTHETIC` markers in one file, not spread through the tests |
| **Tighten the waits** | 1,088 fixed `wait` steps are kept from Datadog. `mobile/tools/tighten_waits.py` removes the ones a polling check makes redundant and swaps the prefetch sleeps for a wait on the app's loading bars, one suite at a time (checklist #89) |
| **Rewrite `docs/test_authoring.md`** | Its traps still hold, but its loop describes building Datadog JSON; the loop above replaces it |
| **Move into MentorTwo** | So a pull request that changes a component can change its test |
| **Retire Datadog** | Its 433 tests and 250 global variables are backed up in `legacy/dd_tests_backup/`; the values are in the repo-root `.env` |

## Running it

From `e2e/`, where the shared config is:

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test mobile/suites/MOB.954*            # one suite
npx playwright test mobile/suites/MOB.954* --headed   # watch it
npm run report                                        # the HTML report of the last run
```

**For a pass, use the runner, not `npm test`.** Playwright runs suites back to back and knows nothing about
the shared records on dev. The runner keeps the pass order, runs each data-changing suite alone, checks the
fixtures before each one and after the last, stops at the first red, and saves each suite's screenshots and
traces. From the repo root:

```bash
.venv/bin/python e2e/mobile/tools/playwright_pass.py --dry-run    # the plan
.venv/bin/python e2e/mobile/tools/playwright_pass.py --stage 1    # read-only suites
.venv/bin/python e2e/mobile/tools/playwright_pass.py --stage 2    # data-changing, one at a time
```

Summaries go to `e2e/results/passes/mobile/` (git-ignored).

Nothing here costs a Datadog run, but it does use **shared data on dev**, so the rules in
[../../AGENTS.md](../../AGENTS.md) apply: never delete anything the owner has not named, never touch Pump
0102's attachments, never run two data-changing suites at once (`workers: 1` enforces it).

## Where things are

| Path | What |
|---|---|
| `suites/*.spec.ts` | A suite: log in once, then run its children in order in that one session |
| `tests/*.ts` | One exported function per test, its steps in order |
| `support/login.ts` | The shared mobile login |
| `docs/` | Checklist, coverage, authoring traps, bugs found, cleanup, source coverage |
| `tools/suites.json` | Every suite: its children, whether it writes, its place in a pass, and whether it is held |
| `tools/playwright_pass.py` | A full pass in the safe order |
| `tools/fixtures.py` | Are the shared fixture records on dev at rest? (read-only) |
| `tools/reset_av_fixture.py` · `tools/cleanup_residue.py` | Put the Asset Verify job back · prune test-created records (both dry-run by default) |
| `tools/check_docs.py` | Do the docs still match the tests? Run it after any change to either |
| `tools/check_js_assertions.js` | Every JavaScript assertion proven against model pages, including pages that must make it fail |
| `tools/check_literals.py` | Every string a test asserts still exists in the app's source |
| `tools/source_coverage.py` | Which app files the tests touch → `docs/source_coverage.md` |
| `probe/` | Read-only diagnostics, never part of a pass: `E2E_PROBE=1 npx playwright test mobile/probe/<name>` |
| `../support/dd.ts` · `../support/env.ts` | Shared: the step rules below, and settings from `.env` |
| `../playwright.config.ts` | Shared: devices (tablet 768×1020, phone 320×550), timeouts, one worker, reports |

## Changing or adding a test

**Edit the TypeScript.** The tests were converted from the Datadog JSON on 2026-09-23 and the TypeScript
has been the source since; the converter is retired in `legacy/` and re-running it would overwrite every edit
made since.

1. Read the component on MentorTwo's `origin/development` first: its branches, its submit path, what a closing
   modal really proves (`docs/test_authoring.md`, and its traps).
2. Add or change a function in `tests/`, and call it from its suite in `suites/` (a new suite also goes into
   `tools/suites.json`, with `writes` and `order`).
3. `npx tsc --noEmit` from `e2e/`. A new JavaScript assertion gets bench cases in
   `tools/check_js_assertions.js`, including one that must make it fail. Then run the suite locally until it is green — or red only where it is meant
   to pin a bug. A test that writes proves the write with a server read, not a toast.
4. Update `docs/` in place and run `tools/check_docs.py`.

The converted tests still use the step helpers in `../support/dd.ts` (`run.step`, `click`, `typeText`, the
JS assertions) because that is how Datadog behaved. New tests can use plain Playwright; the rules below are
what to keep in mind when mixing the two.

## Datadog's rules, as this port keeps them

The converted tests keep Datadog's behaviour through these helpers. Each was a bug in the first conversion,
found by a suite that went red for the wrong reason.

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
