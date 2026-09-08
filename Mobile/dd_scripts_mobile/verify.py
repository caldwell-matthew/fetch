"""Verify ONE leaf test for 2 billed runs instead of 6-15.

THE PROBLEM THIS SOLVES — and it is a BILLING problem, not a testing one.

  ⭐ **A SUBTEST IS BILLED AS ITS OWN RUN.** A suite is not one run; it is `1 + len(children)`.
  So one full pass of all 13 suites costs **106 billed runs**, and the 1,000-run monthly
  allowance is ~9 passes.

  The dominant consumer is not regression passes - it is VERIFYING A CHANGE. A leaf carries no
  login of its own, so the only way to exercise it has been to run its whole suite:

      change MOB.622  ->  run MOB.994  ->  6 billed runs
      change MOB.346  ->  run MOB.990  -> 15 billed runs

  Most of that is re-running children that did not change. `MOB.999_Verify_Scratch` is a
  ONE-CHILD suite you re-point at whatever you are checking:

      change MOB.622  ->  verify.py MOB.622  ->  2 billed runs   (the suite + the one child)

  ⚠️ **VERIFYING IS NOT THE SAME AS PASSING IN ITS SUITE.** A leaf run alone gets a FRESH
  session; in its suite it inherits whatever the previous children left behind - a sort still
  applied, a filter still set, a crew still switched. A test can pass here and fail there.
  ➡️ Use this to iterate cheaply, then run the real suite ONCE at the end to confirm.

USAGE
    ./.venv/bin/python Mobile/dd_scripts_mobile/verify.py MOB.622        # point + push + run
    ./.venv/bin/python Mobile/dd_scripts_mobile/verify.py MOB.622 --no-run   # point + push only

  The scratch suite is deliberately in NO other suite and is never wired anywhere, so
  re-pointing it cannot disturb real coverage.
"""
import glob, json, os, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import step, test, write, HERE  # noqa: E402

SCRATCH = "MOB.999_Verify_Scratch"
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PY = os.path.join(REPO, ".venv", "bin", "python")
SCRIPTS = os.path.dirname(os.path.abspath(__file__))


def resolve(frag):
    """MOB.622 -> MOB.622_Collector_Photo_Carousel. Refuses an ambiguous or missing match."""
    hits = [os.path.basename(f)[:-5] for f in sorted(glob.glob(os.path.join(HERE, "*.json")))
            if frag in os.path.basename(f) and "Suite" not in os.path.basename(f)]
    if not hits:
        raise SystemExit(f"no leaf test matches {frag!r}")
    if len(hits) > 1:
        raise SystemExit(f"{frag!r} is ambiguous: {hits}")
    return hits[0]


def build(child, subtest_id):
    login = json.load(open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
    return test(
        SCRATCH,
        f"**SCRATCH — re-pointed by `verify.py`. Currently: `{child}`.**\n"
        "- Exists to verify ONE leaf for **2 billed runs** instead of the 6-15 its real suite\n"
        "  costs, because **a subtest is billed as its own run**.\n"
        "- ⚠️ **A fresh session is not the same as a suite session.** In its real suite a child\n"
        "  inherits what earlier children left behind (a sort, a filter, a switched crew). A test\n"
        "  can pass here and fail there — **run the real suite once before believing it.**\n"
        "- 🛑 Wired into nothing. Its contents are disposable and change constantly; do not cite\n"
        "  it as coverage anywhere.",
        login + [step("playSubTest", child,
                      {"subtestPublicId": subtest_id, "playingTabId": -1})],
        ["Mobile", "env:dev", "scratch"],
        extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"))


def _push():
    r = subprocess.run([PY, os.path.join(SCRIPTS, "dd_tools.py"), "push"],
                       capture_output=True, text=True)
    if r.returncode:
        print(r.stdout[-800:])
        raise SystemExit("push failed - not running")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        raise SystemExit(__doc__)
    child = resolve(args[0])

    # 🛑 ORDER MATTERS, AND THE OBVIOUS ORDER IS WRONG.
    # This used to be push -> wire -> push, with `build()` writing the literal string
    # `PENDING-WIRE-UP` as the subtest id first. That first push then tried to upload a suite
    # whose child id was not an id, and Datadog rejects it with a 400 - so `verify.py` could
    # never complete. It went unnoticed because the scratch test had never been created
    # remotely at all (`wire_suite.py` globbed `MOB.9*Suite.json`, which does not match
    # `MOB.999_Verify_Scratch.json`), so nobody had reached the failing step.
    #
    # Now: push the CHILDREN first (the scratch on disk still holds its previous, valid
    # pointing), then resolve the child's real public_id in-process, then write and push once.
    # An invalid intermediate never reaches disk, let alone Datadog.
    _push()                                   # ensures `child` exists remotely and has an id

    sys.path.insert(0, SCRIPTS)
    from dd_tools import _conf, remote_ids    # noqa: E402
    from datadog_api_client import ApiClient  # noqa: E402
    from datadog_api_client.v1.api.synthetics_api import SyntheticsApi  # noqa: E402
    with ApiClient(_conf()) as c:
        ids = remote_ids(SyntheticsApi(c))
    if child not in ids:
        raise SystemExit(f"{child} is not on Datadog even after a push - cannot wire it")

    write(build(child, ids[child]), force=True)   # scratch: always overwrite, that is the point
    print(f"pointed {SCRATCH} -> {child} ({ids[child]})")
    _push()
    print("pushed and wired")

    if "--no-run" in sys.argv:
        return 0
    print(f"\nrunning {SCRATCH} (2 billed runs)...")
    return subprocess.run([PY, os.path.join(SCRIPTS, "dd_tools.py"), "run", SCRATCH]).returncode


if __name__ == "__main__":
    sys.exit(main())
