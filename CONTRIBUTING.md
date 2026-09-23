# Adding a test

Read [CLAUDE.md](CLAUDE.md) first: its rules decide what a test may touch and when a Datadog run is allowed.
This page walks through the loop with a real example, and ends with a glossary of the repo's vocabulary.

## The worked example: `MOB.331_Work_GenInfo_Value_Modal`

The job: on a work order's General Info tab, a multi-line field with a value shows an arrow that opens the full
value in a modal. The test should prove that.

**1 · Read the component, not the screen.** `DetailPage/utils/MultiLineLabel.tsx` returns nothing when the value
is empty, and its click handler is on the icon's `<svg>`, not the button around it (whose `aria-label` is a
misleading `Settings`). Reading it first decided three things before any code existed. The test needed a field
**with** a value and a field **without** one, so one check proves both directions. The click had to be dispatched
on the `<svg>`. And the label was not to be relied on.

**2 · Check the fixture over the API, not by assumption.** The fixture work order's `desc` (Stage Notes) holds
`DATADOG FIXTURE` and its `problemDesc` is empty, which is exactly the pair needed.

**3 · Build it.** `Mobile/dd_scripts_mobile/build_value_modal_test.py` writes
`Mobile/dd_tests_mobile/MOB.331_…json`. The reasoning lives in the build script's docstring, so the next person
knows why it's built the way it is.

**4 · Replay locally, and read the failure's screenshot.** The first replay failed: the arrow was not where
the test looked. `FormFieldContainer` puts a label's right-hand section *beside* the input's wrapper, not inside
it (now trap 36). Fixed, and the replay passed. Cost so far: 0 Datadog runs.

**5 · Put every new JavaScript check on the bench**, with cases that must fail
(`check_js_assertions.js`): the arrow drawn beside the empty field too, missing beside the full one, the modal
showing the label instead of the value. The bench caught a mistake in its own model page too. A button with no
`type` inside a form submits the form, which the real Mantine button doesn't.

**6 · Confirm on Datadog, after a go-ahead:** `verify.py MOB.331`, 2 runs. Then wire it into its suite
(`suite_plan.py`, `MOB.954`, after `MOB.330`) and push the suite. Then update `testing_checklist.md` in place and
run `preflight.py`.

## Commands

`.venv/bin/python mobile.py` lists them all with their Datadog cost. Each is a name for a script in
`Mobile/dd_scripts_mobile/`, which you can also run directly:

| `mobile.py …` | Script | Does | Datadog runs |
|---|---|---|---|
| `preflight [check …]` | `preflight.py` | every free check (wiring, sync, drift, literals, bench, locals, fixtures, docs, schedule) | 0 |
| `replay <test>` | `local_run.py` | replays a test in local Chromium; failures leave a screenshot + log in `Mobile/local_runs/<test>/` | 0 |
| `timing [suite …]` | `local_timing.py` | times suites locally | 0 |
| `literals` · `sweep` | `check_literals.py` · `sweep_strings.py` | strings the tests assert vs the app source · app strings no test asserts | 0 |
| `suites` | `build_module_suites.py` + `wire_suite.py` | rebuilds the suites from `suite_plan.py` and re-wires their child ids | 0 |
| `reset-av [--check \| --apply]` | `reset_av_fixture.py` | reads back / restores the Asset Verify fixture job | 0 |
| `push <test …>` | `dd_tools.py push` | uploads the named tests (never all by default) | 0 |
| `verify <test>` | `verify.py` | pushes the test and a one-child scratch suite, and runs it | 2 (3 red) |
| `run <suite>` | `dd_tools.py run` | runs a whole suite (prints the exact cost first) | 1 + its tests |
| `pass [--dry-run]` | `full_pass.py` | every scheduled suite once, in the schedule's safe order, waiting out Datadog's retries and checking fixtures between suites | ≈158 |

## Glossary

| Term | Meaning |
|---|---|
| **fixture** | A record on dev that tests rely on being in a known state: the fixture work order `EYRpYJ9QYdQ1JFF10JtB0Q`, the Asset Verify job `DATADOG MOBILE JOB`, Pump 0102. `preflight.py` checks they are at rest. |
| **leaf / child** | A single test (`MOB.331`). It has no login of its own; it runs inside a suite. |
| **suite** | A test that logs in once and runs its children in order (`MOB.954_…_Suite`). Membership lives only in `suite_plan.py`. |
| **wire** | Fill a suite's child ids from Datadog (`wire_suite.py`) after its membership changes. |
| **verify** | Run one test on Datadog through the scratch suite `MOB.999`, 2 runs. |
| **read-only / writes** | Whether a suite changes data on dev. Suites that write never overlap with anything. |
| **residue** | Records a test creates and cannot remove (e.g. a work order, until bugs §41 is fixed). |
| **self-restoring** | A test that puts what it changed back, on steps that run even after a failure. |
| **`soft` / `optional` / `always`** | Step flags: fail the test but keep going / may fail without failing the test / runs even after a failure. |
| **server read** | Asking `/graphql` directly whether a write happened, because the UI can say "saved" when it didn't. |
| **trap** | A numbered lesson in `test_authoring.md`: a way a test once passed or failed for the wrong reason. |
| **slot** | A suite's one-hour weekly window in the Datadog schedule (`suite_plan.SLOTS`). |
| **§N / #N** | A bug in `bugs_found.md` / an OPEN WORK row in `testing_checklist.md`. |
