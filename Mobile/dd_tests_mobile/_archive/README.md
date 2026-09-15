# Archived tests

Parked deliberately, not deleted. `dd_tools.push` and `set_device.py` glob
`dd_tests_mobile/*.json` non-recursively, so nothing here is pushed, device-checked or counted.
**Neither test is on Datadog.** To revive one: move its JSON (and generator, from
`dd_scripts_mobile/_archive/`) up a level and `push` — it is created fresh.

## `MOB.134_Work_Form_Fill` — superseded

Revived as `dd_tests_mobile/MOB.134_Work_Form_Fill.json` (`build_form_fill_test.py`).
This archived version typed `DD FORM EDIT` into the form's integer field — a Mantine `NumberInput`,
which drops letters — so its text never landed. Kept only as the superseded version; do not restore it.

## `MOB.711_AssetLookup_Column_Search` — the column picker's search

Parked after two failures (trap 23). It was built from a grep hit: the `Find Column(s)` box sits
inside a `Menu.Dropdown` behind the `table-columns` icon (`RecordInfoTable`) and filters the
picker's **checkboxes, not records**. 🛑 A revival must never tick a checkbox — `selectedColumns`
persists to `localStorage` and would change every later run's columns.
