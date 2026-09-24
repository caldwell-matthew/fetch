# Adding a test

Read [AGENTS.md](AGENTS.md) first: its rules decide what a test may touch on dev. This page walks through the loop
with a real example, lists the commands, and ends with a glossary of the repo's vocabulary.

The TypeScript in `e2e/<app>/tests/` and `e2e/<app>/suites/` is the source: edit it directly.

## The worked example: `MOB.331_Work_GenInfo_Value_Modal`

The job: on a work order's General Info tab, a multi-line field with a value shows an arrow that opens the full
value in a modal. The test should prove that.

**1 · Read the component, not the screen.** `DetailPage/utils/MultiLineLabel.tsx` returns nothing when the value
is empty, and its click handler is on the icon's `<svg>`, not the button around it (whose `aria-label` is a
misleading `Settings`). Reading it first decided three things before any code existed. The test needed a field
**with** a value and a field **without** one, so one check proves both directions. The click had to land on the
`<svg>`. And the label was not to be relied on.

**2 · Check the fixture over the API, not by assumption.** The fixture work order's `desc` (Stage Notes) holds
`DATADOG FIXTURE` and its `problemDesc` is empty, which is exactly the pair needed.

**3 · Write it** in `e2e/mobile/tests/MOB.331_Work_GenInfo_Value_Modal.ts`, and call it from its suite
(`e2e/mobile/suites/MOB.954_…spec.ts`, after `MOB.330`). Say why it's built this way in a comment in the test, so
the next person knows.

**4 · Run it locally, and read the failure's screenshot.** The first run failed: the arrow was not where the test
looked. `FormFieldContainer` puts a label's right-hand section *beside* the input's wrapper, not inside it (now
trap 36). Fixed, and it passed:

```bash
cd e2e && npx tsc --noEmit && npx playwright test mobile/suites/MOB.954*
```

**5 · Update the docs in place** — the route's row in `testing_checklist.md`, and what the suite proves in
`coverage.md` — then run `.venv/bin/python e2e/mobile/tools/check_docs.py`.

## Commands

Run from the repo root unless noted. None of them costs anything but time; all of them use shared data on dev.

| Command | Does |
|---|---|
| `cd e2e && npx playwright test mobile/suites/MOB.9xx*` | runs one suite locally (headless); failures leave a screenshot and trace in `e2e/results/` |
| `.venv/bin/python e2e/mobile/tools/playwright_pass.py [--dry-run \| --stage 1 \| --stage 2]` | a full pass in the safe order: read-only suites, then each data-changing suite alone with the fixture checks between |
| `.venv/bin/python e2e/mobile/tools/fixtures.py` | are the shared fixture records on dev at rest? (read-only) |
| `.venv/bin/python e2e/mobile/tools/reset_av_fixture.py [--check \| --apply]` | reads back / restores the Asset Verify fixture job |
| `.venv/bin/python e2e/mobile/tools/cleanup_residue.py [--apply]` | lists / prunes the records tests created and cannot remove themselves |
| `.venv/bin/python e2e/mobile/tools/check_docs.py` | do the docs still match the tests? |
| `.venv/bin/python e2e/mobile/tools/source_coverage.py [--write]` | which app files the tests touch → `e2e/mobile/docs/source_coverage.md` |

## Glossary

| Term | Meaning |
|---|---|
| **fixture** | A record on dev that tests rely on being in a known state: the fixture work order `EYRpYJ9QYdQ1JFF10JtB0Q`, the Asset Verify job `DATADOG MOBILE JOB`, Pump 0102. `fixtures.py` checks they are at rest. |
| **test / child** | One test (`MOB.331`), an exported function in `tests/`. It has no login of its own; it runs inside a suite. |
| **suite** | A spec in `suites/` that logs in once and runs its children in order in one session. Listed, with whether it writes, in `tools/suites.json`. |
| **read-only / writes** | Whether a suite changes data on dev. Suites that write never overlap with anything. |
| **pass** | Every suite once, in the safe order, via `playwright_pass.py`. |
| **residue** | Records a test creates and cannot remove (e.g. a work order, until bugs §41 is fixed). |
| **self-restoring** | A test that puts what it changed back, on steps that run even after a failure. |
| **`always` / `allow: 'soft'` / `allow: 'ignore'`** | Step options in the converted tests: runs even after a failure / fails the test but keeps going / may fail without failing the test. |
| **server read** | Asking `/graphql` directly whether a write happened, because the UI can say "saved" when it didn't. |
| **trap** | A numbered lesson in `test_authoring.md`: a way a test once passed or failed for the wrong reason. |
| **§N / #N** | A bug in `bugs_found.md` / an OPEN WORK row in `testing_checklist.md`. |
