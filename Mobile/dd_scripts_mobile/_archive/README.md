# Archived scripts

Scripts that did their job once and are kept only as a record of what was done and why. **Don't run them:**
each one patched test JSON that has been the source of truth since, and run from here they can't import
`dd_tools` anyway.

| Script | What it did | Why it's done |
|---|---|---|
| `fix_crew_coupling.py` | Took `MOB.200_Crew_Switch` out of the scratch suite (it switched the account's crew and never switched back, so every later run saw a different data set), and made `MOB.140` stop relying on a crew-scoped search box as its route signal | Applied to the JSON; `MOB.200` now sits in no scheduled suite (`suite_plan.STANDALONE`) |
| `harden_login.py` | Inserted a wait between opening the SSO page and typing the email, after a whole suite died on `No element found … input[@name="email"]` on a cold load | In `MOB.000_Login_(Dev).json`, which every builder copies the login prefix from |
| `patch_collector_upload.py` | Patched `MOB.600` in place: closed the photo modal, and replaced a negative assertion that could never fail with a positive proof of creation | `MOB.600`'s JSON carries steps only the Datadog UI can author, so it has been edited as JSON since |
| `build_form_fill_test.py` | An earlier `MOB.134` generator, parked 2026-08-20 after five failure causes | Superseded by `../build_form_fill_test.py`, which passes |

**Not archived, though they patch JSON too:** `add_role_guard.py` and `add_crash_guard.py`. They are the maintained
way to change the shared login prefix across every test that logs in (`test_authoring.md`, Tooling), so they
stay beside the daily tools.
