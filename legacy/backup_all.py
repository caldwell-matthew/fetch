"""Save EVERY Datadog synthetic test to a dated folder — 0 runs, read-only.

Files are named `<public_id>__<safe name>.json` because Datadog allows duplicate names (legacy/fetch.py
named by name alone and silently lost 6 tests in the 2026-08-12 backup). An index.json lists them all.
"""
import datetime, json, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "Mobile", "dd_scripts_mobile"))
import dd_tools

ROOT = os.path.join(HERE, "dd_tests_backup")
OUT = os.path.join(ROOT, datetime.datetime.now().strftime("%Y-%m-%d_%H%M") + "_pre-playwright")
safe = lambda s: "".join(c if c.isalnum() or c in "._- " else "_" for c in (s or "unnamed")).strip()[:100]

os.makedirs(OUT, exist_ok=True)
with dd_tools.ApiClient(dd_tools._conf()) as c:
    api = dd_tools.SyntheticsApi(c)
    tests = api.list_tests().to_dict()["tests"]
    print(f"{len(tests)} tests listed", flush=True)
    index, failed = [], []
    for i, t in enumerate(tests, 1):
        pid, name, typ = t["public_id"], t.get("name"), t.get("type")
        try:
            full = (api.get_browser_test(pid) if typ == "browser" else api.get_api_test(pid)).to_dict()
        except Exception as e:
            failed.append((pid, name, f"{type(e).__name__}: {e}"))
            continue
        fn = f"{pid}__{safe(name)}.json"
        with open(os.path.join(OUT, fn), "w") as f:
            json.dump(full, f, indent=2, default=str)
        index.append({"public_id": pid, "name": name, "type": typ, "status": t.get("status"),
                      "steps": len(full.get("steps") or []), "file": fn})
        if i % 50 == 0:
            print(f"  {i}/{len(tests)}", flush=True)
json.dump({"pulled": datetime.datetime.now().isoformat(timespec="seconds"), "count": len(index),
           "failed": failed, "tests": index}, open(os.path.join(OUT, "index.json"), "w"), indent=2)
print(f"saved {len(index)} files to {OUT}")
if failed:
    print("FAILED:", failed)
