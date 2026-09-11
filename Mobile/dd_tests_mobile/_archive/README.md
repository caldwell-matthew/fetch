# Archived tests

Parked deliberately, not deleted. `dd_tools.push` and `set_device.py` glob
`dd_tests_mobile/*.json` non-recursively, so nothing here is pushed, device-checked or counted.
**Neither test is on Datadog.** To revive one: move its JSON (and generator, from
`dd_scripts_mobile/_archive/`) up a level and `push` — it is created fresh.

## `MOB.134_Work_Form_Fill` — filling a work form

**Verdict: not automatable through this path.** Do not revive without NEW evidence — a
different interaction model or an app change, not another locator.

It targeted `/work/:workStageId/form/:formId` and never passed. Six causes surfaced; four were
fixed, one was wrong:

| # | cause | status |
|---|---|---|
| 1 | a scoping fix lived in the generator but never reached the JSON (trap 19) | fixed |
| 2 | targeted `#senor-work-form`, which renders only below `availWidth` 750 — never on `chrome.tablet` (trap 18) | fixed |
| 3 | opened a form (`Inspection`) no longer on the fixture | fixed — opens the first form card |
| 4 | a blind warm-up wait broke once the crew's list filled (trap 21) | fixed — `work_cache_warm` |
| 5 | ~~the save is gated on the input's DOM `id`~~ (`Form.tsx:148`) | disproved — the targeted input's id IS a field id |
| 6 | **typed text never lands in the field** — the input lacks the text even before the blur | **the blocker** |

The desktop `Form.tsx` renders through `react-grid-layout`, and that combination resists typing;
`MOB.395`/`710`/`545` type into other forms fine in the same runs. The render half is covered by
`MOB.355` (tablet, desktop branch) and `MOB.951` (phone, `#senor-work-form`).

**To revive:** probe the `id` of every non-checkbox input in `#apm-dv-tabpanel` against the form's
`fields` (`InlineFormField` renders `<Input id={field.id}>`), prove text lands with a JS read
before any blur, then restore both files and `push`.

## `MOB.711_AssetLookup_Column_Search` — the column picker's search

Parked after two failures (trap 23). It was built from a grep hit: the `Find Column(s)` box sits
inside a `Menu.Dropdown` behind the `table-columns` icon (`RecordInfoTable`) and filters the
picker's **checkboxes, not records**. 🛑 A revival must never tick a checkbox — `selectedColumns`
persists to `localStorage` and would change every later run's columns.
