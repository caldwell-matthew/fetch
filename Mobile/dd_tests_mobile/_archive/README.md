# Archived tests

Tests parked here are **kept deliberately, not deleted**. They are excluded from tooling for
free: `dd_tools.push` and `set_device.py` both glob `dd_tests_mobile/*.json`, which is
**non-recursive**, so nothing in this directory is pushed, device-checked, or counted.

Each entry records why it was parked and what the next person would have to do to revive it.

---

## `MOB.134_Work_Form_Fill` — PERMANENTLY ARCHIVED 2026-08-21

> **Final answer: the typed text never reaches the field.** Measured, not inferred — see
> *The last attempt* below. Do not re-wire this without NEW evidence; five attempts, five
> different causes, and the last one is not a locator problem.

**Covers:** filling in a form attached to a work order — the `/work/:workStageId/form/:formId`
route, the only entry in `MOBILE_ROUTES.WORK.children` and the last uncovered route in mobile.

**Why parked:** it has never passed. Five distinct causes were found; four were fixed and the
fifth is understood but unfixed. It consumed more effort than any other test in this suite,
against a route the repo owner has recorded as low priority ("forms are low priority for
mobile", 2026-08-12).

**Its generator is archived alongside it:** `dd_scripts_mobile/_archive/build_form_fill_test.py`.
Read its docstring first — it carries the full history and the exact next step.

### The five causes, in the order they surfaced

| # | cause | status |
|---|---|---|
| 1 | Stale locator: the `[last()]` scoping fix lived in the generator but never reached the JSON (**trap 19**) | fixed |
| 2 | Targeted `#senor-work-form`, which `FormDetails.tsx:106` renders only **below 750px** — `chrome.tablet` is above it, so the container could never exist (**trap 18**) | fixed |
| 3 | Opened a form named `Inspection` that is no longer on the fixture — `MOB.393` stopped attaching it when it was made read-only | fixed (now opens the first form card, no name dependency) |
| 4 | Blind warm-up wait, which broke once the crew's work list stopped being empty (**trap 21**) | fixed (`work_cache_warm`) |
| 5 | ~~The save is gated on the input's DOM `id`~~ | ❌ **WRONG — disproved 2026-08-21** |
| 6 | **Typed text never lands in the field at all** | **the real blocker** |

### Cause 5 was wrong, and the probe that tested it had a bug

`MOB.977_DIAG_FormField_Probe` was written to ask whether the targeted input's `id` is a real
field id, since `Form.tsx:148` returns early when it is not. The valid probes answered
**yes**: a VISIBLE input carries a non-Mantine (record) id, and it is `inW[1]` — *exactly what
`MOB.134` already targeted*. So the id theory was wrong.

⚠️ Three of that probe's assertions (`B4`, `C0`, `C1`) were **invalid**: the helper wrapped
each in `return {expr}`, so multi-statement bodies became `return const vis = ...` — a syntax
error, reported as a falsy result. `C0` appeared to contradict `C2` for that reason. Recorded
because a diagnostic that can be silently wrong is worse than none, and this is the second
time that exact shape has bitten (see `assert_reversed` in `MOB.345`).

### The last attempt, 2026-08-21 — and the real blocker

`MOB.134` was instrumented to separate "typing did not work" from "typing worked but the save
was gated", with three probes around the blur:

| probe | result |
|---|---|
| **DIAG-1** the input holds the typed text **before** the blur | ❌ **FAIL** |
| DIAG-2 a toast appears after the blur | ❌ fail |
| DIAG-3 the value survived the blur | ❌ fail |

**DIAG-1 failing is the answer.** The text is not in the field even *before* the blur, so the
`isDirty` gate is never reached and the id question is moot. Typing simply does not land in
the element the test can read — the click, `Control+A` and `typeText` all report success while
the value never changes.

Note the contrast that makes this specific rather than general: `MOB.395`, `MOB.710` and
`MOB.545` all type successfully and pass in the same suite run. They drive
`GeneralInfo`/`EditForm`/`Attributes`; this screen renders the **desktop** `Form.tsx` through
`react-grid-layout`, and that combination is what resists.

### Verdict

Filling a work form is **not automatable from Datadog Synthetics through this path**. It is
recorded as such in the checklist rather than left as an open item. Reviving it needs new
evidence — a different interaction model, or an app change — not another locator.

### Original parking note (2026-08-20)

`tabs/forms/Form.tsx:148`:

```js
const fieldId = evt.target.id;
const field = props.fields.find(f => f.id === fieldId);
if (!field) return;                        // silent no-op
...
if (!formState.isDirty || formState.invalid) return;
props.onBlur(value, fieldId, ...);
```

A blur only saves when the blurred element's DOM `id` matches a field id in the form's own
`fields` array. The test types into the first **visible** input, whose id is evidently not a
field id — so the handler returns immediately. Every symptom matches: the text types, the blur
fires, no `Field updated` toast appears, and the value is gone on re-navigation.

### To revive it

1. **Measure, do not guess** (trap 15). Probe the `id` of every non-checkbox input inside
   `#apm-dv-tabpanel`, and which of those ids the form actually knows about — the ids come
   from `InlineFormField`, which renders `<Input id={field.id}>`.
2. Target an input whose id **is** a field id. It may well not be the first visible one — note
   that `inW[0]` is `display:none` and `inW[1]` is the first visible, both measured.
3. Restore by moving both files back up one directory, then `push`, then `wire_suite.py` if it
   is re-added to a suite.

### Note on Datadog

⚠️ **The test still EXISTS on Datadog** as `ddb-hg4-a9b`, paused and wired into no suite. Local
and remote therefore disagree on purpose: an audit that compares the two will report
`MOB.134_Work_Form_Fill` as "remote-only". **That is expected — do not delete it to make the
counts line up.** Deleting it would also lose its run history, which is the evidence behind
the five causes above.

### What it produced regardless

Three of the traps in the checklist came out of debugging this one test — **18** (a component
can branch on viewport width, and the tablet takes the desktop branch), **19** (a generator and
its JSON can disagree indefinitely, which was also why `MOB.991` sat red), and **21** (an
absence assertion cannot poll, so it is a timer rather than a gate). Those apply across the
whole suite, so the effort was not wasted even though the test is parked.
