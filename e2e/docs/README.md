# e2e docs

The mobile test suite's working docs. They moved here from `Mobile/` when that folder became
`legacy/Mobile/` (2026-09-23); these are now the only copies.

| File | What it holds |
|---|---|
| `testing_checklist.md` | What is covered, route by route, and the open work. **Start here for status** |
| `coverage.md` | What a green run of each suite actually proves |
| `test_authoring.md` | How to build and prove a test, and the numbered traps — each cost a failed run once |
| `bugs_found.md` | Real product bugs the tests found (fixed ones are deleted, not kept) |
| `cleanup_spec.md` | Test residue on dev, cleanup, and resetting the Asset Verify fixture |

`preflight.py docs` checks these files. After any change, run:

```bash
.venv/bin/python legacy/Mobile/dd_scripts_mobile/preflight.py docs
```

**The tooling they describe is still in `legacy/Mobile/`.** The build scripts, the converter, the fixture
checks and the pass runner live in `legacy/Mobile/dd_scripts_mobile/`, and the tests' source JSON in
`legacy/Mobile/dd_tests_mobile/`. A bare `dd_scripts_mobile/…` or `build_*.py` in these docs means that
folder.
