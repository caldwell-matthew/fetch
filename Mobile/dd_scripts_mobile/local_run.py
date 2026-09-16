"""Run a Datadog browser test LOCALLY in Playwright - 0 Datadog runs.

A PRE-CHECK, NOT A VERDICT. It replays the SAME step JSON Datadog runs (`dd_tests_mobile/`) in a
local Chromium against dev.mentorapm.com, so a broken locator, a wrong assertion or a fixture
problem shows up before a billed run does. Datadog stays the final word: its browser, network
location and timing differ, and a local pass does not update any RUN STATUS.

USAGE (from dd_scripts_mobile/, with the repo venv)
    ../../.venv/bin/python local_run.py MOB.721                  # headless, tablet, login prepended
    ../../.venv/bin/python local_run.py MOB.721 --headed         # watch it
    ../../.venv/bin/python local_run.py MOB.984 --device mobile_small
    ../../.venv/bin/python local_run.py MOB.320 --max-timeout 20 # cap step timeouts while iterating
    ../../.venv/bin/python local_run.py MOB.721 --headed --slow-mo 400   # WATCH it, slowed down
    ../../.venv/bin/python local_run.py MOB.721 --trace          # then replay the timeline:
    ../../.venv/bin/python -m playwright show-trace ../local_runs/<test>/trace.zip
    ../../.venv/bin/python local_run.py MOB.721 --live           # headless, and Mobile/local_runs/live.png
                                                                 # rewritten every step (VS Code's image tab does not reload it - watch with --headed)
    ../../.venv/bin/python local_run.py MOB.984 --device large_phone   # 430x932, LOCAL ONLY (see DEVICES)

WHAT IT REPLAYS, WITH DATADOG'S RULES
    goToUrl · wait · click · typeText · pressKey · assertPageContains · assertPageLacks ·
    assertElementPresent · assertElementContent (contains) · assertFromJavascript · playSubTest
    - every step POLLS until its `timeout` (Datadog's default 60s when unset)
    - a locator matching MORE THAN ONE element fails ("Multiple elements found", trap 3)
    - `allowFailure` + not critical (`optional`) -> the test still passes
      `allowFailure` + `isCritical` (`soft`) -> the test fails, later steps still run
      neither -> the test fails and later steps are SKIPPED, except `alwaysExecute`
    - `{{ GLOBAL }}` values are read from Datadog's API (the same ones a run gets; `.env` fallback
      for the login pair), `{{ RUNID }}`-style local variables are generated from their pattern
    - a leaf test gets MOB.000's login prefix (as the scratch harness gives it); a test that
      types `{{ DATA_DOG_EMAIL }}` itself does not
    - devices: tablet 768x1020 (default), mobile_small 320x550, laptop_large 1440x1100
      (Datadog's browser-test devices); `screen` is emulated too, so `availWidth` branches match

UPLOADS WITH A STAND-IN FILE
    uploadFiles - Datadog's bytes live in its storage (trap 12), so a local replay sets a stand-in
    of the same name on the step's <input type=file>: `Mobile/local_fixtures/<name>` when present,
    else a generated file by extension (a valid 64x64 PNG/JPEG-named PNG, a one-page PDF, text).
    It really uploads to the dev server, as a Datadog run does. The step is named "(local stand-in)".
    Failure screenshots go to Mobile/local_runs/<test>/ (gitignored).

ONE REPLAY AT A TIME
    Replays share the dev fixtures, so each takes `local_runs/.replay.lock` for its browser session
    and a second one waits (it prints that it is waiting). A probe that writes should take it too.
"""
import argparse
import fcntl
import glob
import json
import os
import random
import re
import string
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
# LOCAL_RUN_TESTS: replay tests from another folder (e.g. a sandbox build) without touching the real JSON
TESTS = os.environ.get("LOCAL_RUN_TESTS") or os.path.join(HERE, "..", "dd_tests_mobile")
OUT = os.path.join(HERE, "..", "local_runs")
sys.path.insert(0, HERE)

# Datadog's three browser-test devices, plus `large_phone` - LOCAL ONLY (Datadog has no such device):
# the work-order detail page flickers below ~430px (a layout oscillation), so a 430px phone replays
# the phone branches (availWidth < 450 and < 750) without that noise. Not what Datadog runs.
DEVICES = {"tablet": (768, 1020), "mobile_small": (320, 550), "laptop_large": (1440, 1100),
           "large_phone": (430, 932)}
DEFAULT_TIMEOUT = 60      # seconds - Datadog's default for an untimed step (checklist Appendix F)
POLL = 0.5
ACTION_MS = 2000          # one click/type attempt; scaled up under --slow-mo (every action is delayed)
LOGIN_TEST = "MOB.000_Login_(Dev)"


class StepError(Exception):
    pass


# ------------------------------------------------------------------------------------ loading
def find_test(ref):
    """`MOB.721` or a full name -> the one matching JSON file."""
    hits = [f for f in glob.glob(os.path.join(TESTS, "*.json"))
            if os.path.basename(f)[:-5] == ref or os.path.basename(f).startswith(ref + "_")]
    if len(hits) != 1:
        raise SystemExit(f"{ref!r} matches {len(hits)} tests in dd_tests_mobile/")
    return json.load(open(hits[0]))["details"]


def global_values(names):
    """The values Datadog substitutes for `{{ NAME }}` globals - read over the API (0 runs)."""
    vals = {}
    try:
        from dd_tools import _conf
        from datadog_api_client import ApiClient
        from datadog_api_client.v1.api.synthetics_api import SyntheticsApi
        with ApiClient(_conf()) as client:
            for v in SyntheticsApi(client).list_global_variables().to_dict().get("variables", []):
                if v.get("name") in names and (v.get("value") or {}).get("value"):
                    vals[v["name"]] = v["value"]["value"]
    except Exception as err:
        print(f"  (Datadog globals unavailable: {str(err)[:80]})")
    if not vals.get("DATA_DOG_EMAIL") or not vals.get("DATA_DOG_PASSWORD"):
        from reset_av_fixture import credentials
        vals["DATA_DOG_EMAIL"], vals["DATA_DOG_PASSWORD"] = credentials()
    if not vals.get("MOBDEV"):
        from dd_tools import BASE
        vals["MOBDEV"] = BASE
    return vals


def local_value(var):
    """A per-run local variable from its pattern, e.g. `{{ numeric(8) }}`."""
    m = re.search(r"(numeric|alphanumeric|alphabetic)\((\d+)\)", var.get("pattern") or "")
    if not m:
        return var.get("example") or ""
    pool = {"numeric": string.digits, "alphabetic": string.ascii_letters,
            "alphanumeric": string.ascii_letters + string.digits}[m.group(1)]
    return "".join(random.choice(pool) for _ in range(int(m.group(2))))


def collect_variables(details, seen=None):
    """Globals and locals named by a test and every subtest it plays."""
    seen = seen if seen is not None else set()
    names, locals_ = set(), {}
    for v in details.get("config", {}).get("variables", []):
        if v.get("type") == "global":
            names.add(v["name"])
        elif v.get("type") == "text":
            locals_[v["name"]] = local_value(v)
    for s in details["steps"]:
        if s["type"] == "playSubTest" and s["name"] not in seen:
            seen.add(s["name"])
            n2, l2 = collect_variables(find_test(s["name"]), seen)
            names |= n2
            locals_ = {**l2, **locals_}
    return names, locals_


def sub(value, variables):
    if not isinstance(value, str):
        return value
    return re.sub(r"\{\{\s*([A-Za-z0-9_]+)\s*\}\}", lambda m: str(variables.get(m.group(1), m.group(0))), value)


# ------------------------------------------------------------------------------------ steps
def xpath_of(params):
    values = (params.get("element") or {}).get("userLocator", {}).get("values") or []
    if not values or values[0].get("type") != "xpath":
        raise StepError("no xpath locator on this step")
    return values[0]["value"]


def poll(check, timeout, what):
    """Call `check` until it returns True or raises nothing; the last error names the failure."""
    deadline = time.time() + timeout
    last = f"{what}: timed out"
    last_full = None
    while True:
        try:
            if check():
                return
        except StepError as e:
            last = str(e)
            last_full = getattr(e, "full", None)
        except Exception as e:                       # a detached node, a navigation mid-evaluate
            last = f"{what}: {str(e).splitlines()[0][:160]}"
        if time.time() >= deadline:
            err = StepError(last)
            err.full = last_full
            raise err
        time.sleep(POLL)


def one_element(page, xp, must_be_visible):
    loc = page.locator(f"xpath={xp}")
    n = loc.count()
    if n == 0:
        raise StepError(f"No element found using locator: {xp}")
    if n > 1:
        raise StepError(f"Multiple elements found using locator: {xp}")
    if must_be_visible and not loc.is_visible():
        raise StepError(f"Element located but it's invisible: {xp}")
    return loc


LIVE = None               # set by --live: a PNG redrawn in place, for a VS Code tab


def live_shot(page):
    if LIVE:
        try:
            page.screenshot(path=LIVE + ".tmp.png")
            os.replace(LIVE + ".tmp.png", LIVE)       # atomic: the viewer never reads half a file
        except Exception:
            pass


def pw_reason(err):
    """Playwright's own reason from its call log (covered, moving, outside the viewport...)."""
    lines = [l.strip() for l in str(err).splitlines()]
    for l in lines:
        if any(k in l for k in ("intercepts pointer events", "not stable", "outside of the viewport",
                                "not visible", "not enabled", "detached")):
            return l[:140]
    return lines[0][:140] if lines else "click failed"


FORCE_AFTER = 3           # strict attempts before a forced click (a moving element usually settles)


def act(loc, how, forced_steps, attempts):
    """Datadog's click is less strict than Playwright's actionability checks (a covered or
    partly scrolled element still gets clicked there). Try the strict action first; on an
    actionability refusal retry with `force` - a real mouse event at the element's centre - and
    record that the step needed it, so the gap stays visible in the report."""
    try:
        how(loc, False)
    except Exception as strict:
        attempts.append(1)
        if len(attempts) < FORCE_AFTER:
            raise StepError(pw_reason(strict))       # poll() retries the strict action
        try:
            how(loc, True)
            forced_steps.append(pw_reason(strict))
        except Exception as forced:
            err = StepError(f"{pw_reason(strict)} (forced retry: {pw_reason(forced)})")
            err.full = f"STRICT:\n{strict}\n\nFORCED:\n{forced}"
            raise err
    return True


FIXTURES = os.path.join(HERE, "..", "local_fixtures")


def stand_in(name):
    """A local file for an uploadFiles step - Datadog's own bytes are not downloadable."""
    import mimetypes, struct, zlib
    path = os.path.join(FIXTURES, name)
    mime = mimetypes.guess_type(name)[0] or "application/octet-stream"
    if os.path.exists(path):
        return {"name": name, "mimeType": mime, "buffer": open(path, "rb").read()}
    ext = name.rsplit(".", 1)[-1].lower()
    if ext in ("png", "jpg", "jpeg", "heic", "gif", "webp"):
        w = h = 64
        raw = b"".join(b"\x00" + b"".join(bytes((x * 4 % 256, y * 4 % 256, 160)) for x in range(w)) for y in range(h))

        def chunk(kind, data):
            return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
        buf = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
               + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))
        return {"name": name.rsplit(".", 1)[0] + ".png", "mimeType": "image/png", "buffer": buf}
    if ext == "pdf":
        body = (b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
                b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n")
        return {"name": name, "mimeType": "application/pdf", "buffer": body}
    return {"name": name, "mimeType": mime, "buffer": b"DD SYNTHETIC MOBILE local stand-in\n"}


def replay_lock():
    """Hold local_runs/.replay.lock for the browser session - replays share the dev fixtures."""
    os.makedirs(OUT, exist_ok=True)
    fh = open(os.path.join(OUT, ".replay.lock"), "w")
    try:
        fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("waiting for another local replay to finish (local_runs/.replay.lock) ...", flush=True)
        fcntl.flock(fh, fcntl.LOCK_EX)
    return fh


def page_text(page):
    return page.evaluate("() => document.body ? document.body.innerText : ''")


def run_step(page, step, variables, timeout, forced_steps):
    t, p = step["type"], step.get("params", {})
    if t == "wait":
        end = time.time() + float(p["value"])
        while time.time() < end:
            time.sleep(min(1.0, max(0.0, end - time.time())))
            live_shot(page)
    elif t == "goToUrl":
        page.goto(sub(p["value"], variables), wait_until="load", timeout=timeout * 1000)
    elif t == "pressKey":
        # Datadog's runners are Linux, where `Control+a` selects all. On macOS that is Meta+a, so a
        # local `Control` would append instead of replace (MOB.914 local run 1: "Tank 0000Building 0000").
        mods = ["ControlOrMeta" if m == "Control" else m for m in (p.get("modifiers") or [])]  # LOCAL_MODIFIER_MAP
        page.keyboard.press("+".join(mods + [p["value"]]))
    elif t == "click":
        xp = sub(xpath_of(p), variables)
        attempts = []
        poll(lambda: act(one_element(page, xp, True),
                         lambda l, force: l.click(timeout=ACTION_MS, force=force), forced_steps, attempts),
             timeout, "click")
    elif t == "typeText":
        xp = sub(xpath_of(p), variables)
        text, attempts = sub(p["value"], variables), []
        poll(lambda: act(one_element(page, xp, True),
                         lambda l, force: (l.click(timeout=ACTION_MS, force=force) if force else l.focus(timeout=ACTION_MS),
                                           l.press_sequentially(text)), forced_steps, attempts), timeout, "typeText")
    elif t == "assertElementPresent":
        xp = sub(xpath_of(p), variables)
        poll(lambda: bool(one_element(page, xp, False)), timeout, "assertElementPresent")
    elif t == "assertElementContent":
        xp, want = sub(xpath_of(p), variables), sub(p["value"], variables)
        if p.get("check") != "contains":
            raise StepError(f"assertElementContent check {p.get('check')!r} is not implemented locally")

        def contains():
            el = one_element(page, xp, False)
            got = el.evaluate("e => ('value' in e && e.value) ? e.value : (e.textContent || '')")
            if want not in got:
                raise StepError(f"Element content {got[:80]!r} does not contain {want!r}")
            return True
        poll(contains, timeout, "assertElementContent")
    elif t == "assertPageContains":
        want = sub(p["value"], variables)

        def has():
            if want not in page_text(page):
                raise StepError("Page does not contain given text.")
            return True
        poll(has, timeout, "assertPageContains")
    elif t == "assertPageLacks":
        unwanted = sub(p["value"], variables)

        def lacks():
            if unwanted in page_text(page):
                raise StepError("Page contains the given text.")
            return True
        poll(lacks, timeout, "assertPageLacks")
    elif t == "assertFromJavascript":
        code = sub(p["code"], variables)

        def truthy():
            if not page.evaluate("code => { try { return !!(new Function(code))(); } catch (e) { return false; } }",
                                 code):
                raise StepError("Custom assertion returned a falsy value.")
            return True
        poll(truthy, timeout, "assertFromJavascript")
    elif t == "uploadFiles":
        xp = sub(xpath_of(p), variables)
        files = [stand_in(f["name"]) for f in p.get("files", [])]
        poll(lambda: one_element(page, xp, False).set_input_files(files) is None, timeout, "uploadFiles")
        forced_steps.append("local stand-in file")
    else:
        raise NotImplementedError(f"step type {t!r}")


# ------------------------------------------------------------------------------------ running
class Run:
    def __init__(self, page, variables, max_timeout, shots, keep_going=False):
        self.page, self.variables, self.max_timeout, self.shots = page, variables, max_timeout, shots
        self.keep_going = keep_going      # --continue: TIMING ONLY - a red step does not stop the rest
        self.sub_locals = {}              # per-subtest local variables, see `steps`
        self.incomplete = False
        self.forced = 0
        self.n = 0

    def steps(self, steps, depth=0):
        """Datadog's rules for one list of steps. Returns True if this list passed."""
        passed, stopped = True, False
        pad = "    " * depth
        for step in steps:
            name = step.get("name", step["type"])
            if stopped and not step.get("alwaysExecute"):
                print(f"{pad}SKIP        {name}")
                continue
            self.n += 1
            t0 = time.time()
            timeout = step.get("timeout") or DEFAULT_TIMEOUT
            if self.max_timeout:
                timeout = min(timeout, self.max_timeout)
            error = None
            try:
                if step["type"] == "playSubTest":
                    print(f"{pad}##   {name}")
                    # A SUBTEST'S LOCAL VARIABLES ARE ITS OWN, exactly as on Datadog.
                    # `collect_variables` flattens every child's locals into one dict keyed by
                    # NAME, and most tests call theirs `RUNID` - so the winner's pattern was
                    # imposed on all of them. Measured 2026-09-15: MOB.980 went red because
                    # MOB.710's `{{ numeric(8) }}` reached MOB.722, whose input guard wants
                    # `722` + FIVE digits; it read `72252970672`. The same test is green on
                    # Datadog, which scopes locals per subtest. So does this now.
                    detail = find_test(name)
                    if name not in self.sub_locals:
                        self.sub_locals[name] = {
                            v["name"]: local_value(v)
                            for v in (detail.get("config") or {}).get("variables", [])
                            if v.get("type") == "text"}
                    outer = self.variables
                    self.variables = {**outer, **self.sub_locals[name]}
                    try:
                        if not self.steps(detail["steps"], depth + 1):
                            error = "Sub-test failed"
                    finally:
                        self.variables = outer
                else:
                    forced = []
                    run_step(self.page, step, self.variables, timeout, forced)
                    if forced == ["local stand-in file"]:
                        name = f"{name}   (local stand-in)"
                    elif forced:
                        self.forced += 1
                        name = f"{name}   (forced: {forced[0]})"
            except NotImplementedError as e:
                self.incomplete = True
                print(f"{pad}SKIP  {time.time() - t0:5.1f}s {name}   <-- not replayable locally: {e}")
                continue
            except Exception as e:
                self.last_full = getattr(e, "full", None) or str(e)
                error = str(e).splitlines()[0][:220]
            took = time.time() - t0
            live_shot(self.page)
            if error is None:
                print(f"{pad}ok    {took:5.1f}s {name}")
                continue
            shot = os.path.join(self.shots, f"{self.n:03d}.png")
            try:
                with open(shot[:-4] + ".txt", "w") as fh:
                    fh.write(f"{name}\n\n{getattr(self, 'last_full', error)}\n")
            except Exception:
                pass
            try:
                self.page.screenshot(path=shot)
            except Exception:
                shot = "(no screenshot)"
            allowed = step.get("allowFailure")
            critical = step.get("isCritical", True)
            tag = "ERR" if not allowed else ("ERR soft" if critical else "ERR opt")
            print(f"{pad}{tag:<5} {took:5.1f}s {name}   <-- {error}  [{os.path.relpath(shot, HERE)}]")
            if not allowed:
                passed, stopped = False, not self.keep_going
            elif critical:
                passed = False
        return passed


def main():
    ap = argparse.ArgumentParser(description="Replay a Datadog browser test locally in Playwright (0 runs)")
    ap.add_argument("test", help="MOB.721 or a full test name")
    ap.add_argument("--device", choices=sorted(DEVICES), default=None,
                    help="default: the test's own device_ids (tablet unless _Phone_)")
    ap.add_argument("--headed", action="store_true", help="show the browser")
    ap.add_argument("--live", action="store_true",
                    help="headless, rewriting Mobile/local_runs/live.png after every step (VS Code's image tab does not reload it; watch with --headed)")
    ap.add_argument("--no-login", action="store_true", help="do not prepend MOB.000's login steps")
    ap.add_argument("--max-timeout", type=float, default=None, help="cap every step timeout (seconds)")
    ap.add_argument("--slow-mo", type=int, default=0, help="pause N ms between browser actions (use with --headed)")
    ap.add_argument("--continue", dest="keep_going", action="store_true",
                    help="keep running after a red step (Datadog would stop) - to see every red, or to time every child")
    ap.add_argument("--trace", action="store_true",
                    help="record a Playwright trace (screenshots + DOM per action) to local_runs/<test>/trace.zip")
    args = ap.parse_args()

    details = find_test(args.test)
    steps = list(details["steps"])
    types_email = any("{{ DATA_DOG_EMAIL }}" in json.dumps(s.get("params", {})) for s in steps)
    if not args.no_login and not types_email:
        login = find_test(LOGIN_TEST)
        steps = login["steps"] + steps
        details = {**details, "config": {"variables": details.get("config", {}).get("variables", [])
                                          + login.get("config", {}).get("variables", [])}}
    names, locals_ = collect_variables({**details, "steps": steps})
    variables = {**global_values(names), **locals_}

    device = args.device or (details.get("options", {}).get("device_ids") or ["chrome.tablet"])[0].replace("chrome.", "")
    w, h = DEVICES.get(device, DEVICES["tablet"])
    shots = os.path.join(OUT, details["name"])
    os.makedirs(shots, exist_ok=True)

    global ACTION_MS, LIVE
    ACTION_MS = 2000 + 40 * args.slow_mo
    if args.live:
        import shutil, subprocess
        LIVE = os.path.join(OUT, "live.png")
        os.makedirs(OUT, exist_ok=True)
        if not os.path.exists(LIVE):
            open(LIVE, "wb").write(bytes.fromhex(
                "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
                "1f15c4890000000d49444154789c6360000002000100e221bc330000000049454e44ae426082"))
        code = shutil.which("code") or "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
        if os.path.exists(code):
            subprocess.run([code, "-r", LIVE], check=False)   # -r: reuse the current VS Code window
        print(f"live view: {os.path.relpath(LIVE, HERE)} (redrawn every step)")
    from playwright.sync_api import sync_playwright
    print(f"{details['name']}  ·  local Chromium  ·  {device} {w}x{h}  ·  {len(steps)} top-level steps")
    lock = replay_lock()
    t0 = time.time()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not args.headed, slow_mo=args.slow_mo)
        context = browser.new_context(viewport={"width": w, "height": h}, screen={"width": w, "height": h})
        if args.trace:
            context.tracing.start(screenshots=True, snapshots=True, sources=False)
        page = context.new_page()
        run = Run(page, variables, args.max_timeout, shots, keep_going=args.keep_going)
        try:
            passed = run.steps(steps)
        finally:
            if args.trace:
                trace = os.path.join(shots, "trace.zip")
                context.tracing.stop(path=trace)
                print(f"\ntrace: ../../.venv/bin/python -m playwright show-trace {os.path.relpath(trace, HERE)}")
            browser.close()
    verdict = "PASS" if passed else "FAIL"
    if run.incomplete:
        verdict += " (INCOMPLETE - some steps are Datadog-only)"
    if args.keep_going:
        verdict += " · --continue (timing run: steps after a red one still ran)"
    if run.forced:
        verdict += f" · {run.forced} step(s) needed a forced click Datadog would not flag"
    print(f"\n{verdict}  {details['name']}  {time.time() - t0:.0f}s locally  ·  0 Datadog runs")
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
