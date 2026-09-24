# Mobile docs

| File | What it holds |
|---|---|
| `testing_checklist.md` | What is covered, route by route, and the open work. **Start here for status** |
| `coverage.md` | What a green run of each suite actually proves |
| `source_coverage.md` | Which app files the tests touch — generated, see below |
| `test_authoring.md` | How to build and prove a test, and the numbered traps — each cost a failed run once |
| `bugs_found.md` | Real product bugs the tests found (fixed ones are deleted, not kept) |
| `cleanup_spec.md` | Test residue on dev, cleanup, and resetting the Asset Verify fixture |

After any change to these files or to the tests, run:

```bash
.venv/bin/python e2e/mobile/tools/check_docs.py
```

`source_coverage.md` is generated — re-run `.venv/bin/python e2e/mobile/tools/source_coverage.py --write` rather
than editing it.

⚠️ **Written in the Datadog era, not yet fully rewritten.** The tests were Datadog browser tests until
2026-09-23 and are Playwright now (`../README.md`). The coverage, bugs and traps all still hold, but some passages
still name Datadog-era tooling — `build_*.py`, `preflight.py`, `local_run.py`, `verify.py` — which is in
`legacy/` and no longer how tests are written. `test_authoring.md`'s loop is the one most out of date; the loop in
`../README.md` replaces it.
