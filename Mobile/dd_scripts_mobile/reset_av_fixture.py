"""Put the Asset Verification fixture job back the way the tests assume it — 0 Datadog runs.

WHY THIS EXISTS
  `cleanup_spec.md` §7 is the design; this is option A. Five tests are blocked only because
  mobile cannot walk the fixture back: bugs §10 — `VerificationCheckbox.tsx` recomputes the
  job's status on the client and only ever moves it FORWARD (`READY → IN_PROGRESS →
  COMPLETED`). Verifying the last asset flips the job to `COMPLETED` and nothing in the mobile
  app can reverse it, so `MOB.500`/`510`/`530`/`560` would fail at their fixture guards on the
  next run. Everything the reset needs is an ordinary GraphQL mutation the `Admin` role already
  has, so this runs locally and bills nothing.

  ⭐ THE POINT IS TO UNBLOCK, NOT TO TIDY. Once a run can be undone, "verify every asset and
  watch the job flip to COMPLETED" becomes testable — with the reset as the step after the run.

THE SESSION IS PLAIN HTTP — NO HEADLESS BROWSER (measured 2026-09-10, `cleanup_spec.md` §7.6)

    POST /login            {email, password}                            -> {route, token}
    POST /login/user-env   {coretoken: token}                           -> [{environment, ...}]
    POST /login/sso        {environment_id, environment_org,
                            environment, token, mobile: 'true'}         -> sets the cookie
    POST /graphql          {query, variables}                           -> same-origin cookie

  🛑 STEP 3 IS NOT OPTIONAL. It is what `MOB.000`'s "Choose the development environment" click
  does. Skip it and you hold a coretoken with no session, and every mutation comes back
  unauthenticated.

  🛑 NEVER LOG OUT, AND NEVER RUN THIS DURING A SUITE. This authenticates as the SAME account
  the tests use, and a `LOGOUT` event from anywhere redirects an in-flight run to the login
  page (the session model note in `testing_checklist.md`). This script never calls logout.

SAFETY
  - **Dry run by default.** It prints the plan and changes nothing. `--apply` performs it.
  - It only ever touches ONE job id, and it refuses to act on a job whose name is not the
    fixture's.
  - It ends by RE-READING the job and asserting §7.2's three invariants. A reset that reports
    success without reading back is trap 6 in a different coat, and this exits non-zero if the
    read-back disagrees.

USAGE
    ./.venv/bin/python Mobile/dd_scripts_mobile/reset_av_fixture.py            # dry run
    ./.venv/bin/python Mobile/dd_scripts_mobile/reset_av_fixture.py --apply
    ./.venv/bin/python Mobile/dd_scripts_mobile/reset_av_fixture.py --check    # read-back only

CREDENTIALS — NOTHING NEW TO STORE
  ⭐ `DATA_DOG_EMAIL` and `DATA_DOG_PASSWORD` are **not secure** globals (measured
  2026-09-10), so `get_global_variable` returns their values to the `DD_API`/`DD_APP` keys
  already in `.env`. This script reads them the same way the tests receive them, and no
  credential is copied anywhere new. `cleanup_spec.md` §7.5 decision 1 is therefore moot.

  If someone later marks either global secure, the API stops returning the value; put it in
  `.env` as `DATA_DOG_EMAIL` / `DATA_DOG_PASSWORD` and this falls back to that. Either way the
  script never prompts and never prints a credential.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

from dotenv import dotenv_values

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
ORIGIN = "https://dev.mentorapm.com"
ENVIRONMENT = "development"

# The fixture, and the shape it has to be left in (cleanup_spec.md §7.2).
JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_NAME = "DATADOG MOBILE JOB"
WANT_STATUS = "IN_PROGRESS"
WANT_ASSETS = {"Tank 0000", "A/C Motor 0002"}
# Assets the collector tests create. Only these are ever deleted, and only when a job link
# points at one — the script never deletes an asset it did not find attached to the fixture.
SYNTHETIC_PREFIX = "DD SYNTHETIC MOBILE"


def wanted(name):
    """Is this one of the two fixture assets?

    🛑 NOT `name in WANT_ASSETS`. The fixture asset's real name is `⚡ Tank 0000` — the
    lightning bolt is part of the stored name, not UI decoration — so equality says "this is a
    stranger" and the plan comes out as *unlink Tank 0000*. The dry-run default caught that on
    the first run; matching on containment is what makes it right. The browser tests were never
    exposed to it: their locators are `contains(., "Tank 0000")`.
    """
    return any(w in name for w in WANT_ASSETS)


JOB_QUERY = """
query DDResetRead($id: ID!) {
  mobileJob(id: $id) {
    id name status
    assets { id verified assetId { id name } }
  }
}
"""
SET_VERIFIED = """
mutation DDResetVerified($id: ID!, $verified: Boolean!) {
  updateMobileJobAsset(id: $id, data: { verified: $verified }) { id verified }
}
"""
SET_STATUS = """
mutation DDResetStatus($id: ID!, $status: MobileJobStatus!) {
  updateMobileJob(id: $id, data: { status: $status }) { id status }
}
"""
UNLINK = """
mutation DDResetUnlink($ids: [ID!]!) { deleteMobileJobAssets(ids: $ids) }
"""
DELETE_ASSETS = """
mutation DDResetDeleteAssets($ids: [ID!]!) { deleteAssets(ids: $ids) }
"""


class Session:
    """A logged-in `dev.mentorapm.com` session — cookie jar plus a `graphql()` call."""

    def __init__(self):
        self.cookies = {}

    # ---------------------------------------------------------------- transport
    def _post(self, path, payload, extra_headers=None):
        body = json.dumps(payload).encode()
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.cookies:
            headers["Cookie"] = "; ".join(f"{k}={v}" for k, v in self.cookies.items())
        headers.update(extra_headers or {})
        req = urllib.request.Request(ORIGIN + path, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode()
                for header in resp.headers.get_all("Set-Cookie") or []:
                    name, _, rest = header.partition("=")
                    self.cookies[name.strip()] = rest.split(";")[0]
                try:
                    return json.loads(raw)
                except json.JSONDecodeError:
                    return raw
        except urllib.error.HTTPError as e:
            detail = e.read().decode()[:300]
            raise SystemExit(f"POST {path} -> {e.code} {e.reason}\n  {detail}")

    # ---------------------------------------------------------------- login
    def login(self, email, password):
        first = self._post("/login", {"email": email, "password": password})
        token = first.get("token") if isinstance(first, dict) else None
        if not token:
            raise SystemExit(f"POST /login gave no token: {str(first)[:200]}")

        envs = self._post("/login/user-env", {"coretoken": token})
        rows = envs if isinstance(envs, list) else (envs or {}).get("environments") or []
        row = next((r for r in rows if r.get("environment") == ENVIRONMENT), None)
        if not row:
            names = sorted({r.get("environment") for r in rows})
            raise SystemExit(f"no {ENVIRONMENT!r} environment on this account; saw {names}")

        # ⭐ the step that actually mints the session cookie
        self._post("/login/sso", {
            "environment_id": row["environment_id"],
            "environment_org": row["environment_org"],
            "environment": row["environment"],
            "token": token,
            "mobile": "true",
        })
        if not self.cookies:
            raise SystemExit("POST /login/sso set no cookie — cannot call /graphql")
        return self

    # ---------------------------------------------------------------- graphql
    def graphql(self, query, variables=None):
        out = self._post("/graphql", {"query": query, "variables": variables or {}},
                         {"apollo-require-preflight": "*"})
        if not isinstance(out, dict):
            raise SystemExit(f"/graphql returned non-JSON: {str(out)[:200]}")
        if out.get("errors"):
            raise SystemExit("GraphQL error: " + json.dumps(out["errors"])[:400])
        return out["data"]


def credentials():
    """The test account's email and password — from the Datadog globals, else from `.env`.

    The globals are the SAME values the browser tests log in with, so reading them here keeps
    one copy of the credential rather than making a second. Nothing is printed or written.
    """
    email = password = None
    try:
        sys.path.insert(0, HERE)
        from dd_tools import _conf, GLOBALS  # noqa: E402  (local import: needs HERE on the path)
        from datadog_api_client import ApiClient
        from datadog_api_client.v1.api.synthetics_api import SyntheticsApi
        with ApiClient(_conf()) as client:
            api = SyntheticsApi(client)
            email = api.get_global_variable(GLOBALS["DATA_DOG_EMAIL"]).to_dict()["value"].get("value")
            password = api.get_global_variable(GLOBALS["DATA_DOG_PASSWORD"]).to_dict()["value"].get("value")
    except Exception as err:                                   # secure global, or no keys
        print(f"  (Datadog globals unavailable: {str(err)[:80]} — falling back to .env)")
    if email and password:
        return email, password
    env = dotenv_values(os.path.join(REPO, ".env"))
    return env.get("DATA_DOG_EMAIL") or email, env.get("DATA_DOG_PASSWORD") or password


def read_job(session):
    job = session.graphql(JOB_QUERY, {"id": JOB_ID})["mobileJob"]
    if job["name"] != JOB_NAME:
        raise SystemExit(f"{JOB_ID} is named {job['name']!r}, not {JOB_NAME!r} — refusing to touch it")
    return job


def describe(job):
    print(f"  job    : {job['name']}  status={job['status']}")
    for link in job["assets"] or []:
        print(f"  asset  : {link['assetId']['name']:<24} verified={link['verified']}  link={link['id']}")


def plan(job):
    """What has to happen for the job to satisfy §7.2. Empty list means it already does."""
    steps = []
    keep, extra = [], []
    for link in job["assets"] or []:
        (keep if wanted(link["assetId"]["name"]) else extra).append(link)

    for link in keep:
        if link["verified"]:
            steps.append(("unverify", link["assetId"]["name"], SET_VERIFIED,
                          {"id": link["id"], "verified": False}))
    for link in extra:
        name = link["assetId"]["name"]
        steps.append(("unlink", name, UNLINK, {"ids": [link["id"]]}))
        if name.startswith(SYNTHETIC_PREFIX):
            steps.append(("delete asset", name, DELETE_ASSETS, {"ids": [link["assetId"]["id"]]}))
        else:
            print(f"  ⚠️  {name} is linked to the fixture but is not synthetic — unlinking only, "
                  f"NOT deleting the asset")
    # status last: it is recomputed from the links, so reversing it first can be undone
    if job["status"] != WANT_STATUS:
        steps.append(("status", f"{job['status']} -> {WANT_STATUS}", SET_STATUS,
                      {"id": JOB_ID, "status": WANT_STATUS}))

    missing = {w for w in WANT_ASSETS if not any(w in l["assetId"]["name"] for l in keep)}
    if missing:
        print(f"  🛑 the fixture is MISSING {sorted(missing)} — this script cannot recreate a "
              f"link, only remove one. Re-attach it from desktop.")
    return steps


def check(job):
    """§7.2, asserted. Returns a list of violations."""
    bad = []
    if job["status"] != WANT_STATUS:
        bad.append(f"status is {job['status']}, want {WANT_STATUS}")
    names = [l["assetId"]["name"] for l in job["assets"] or []]
    if len(names) != len(WANT_ASSETS) or not all(wanted(n) for n in names):
        bad.append(f"assets are {sorted(names)}, want exactly {sorted(WANT_ASSETS)}")
    for want in WANT_ASSETS:
        if not any(want in n for n in names):
            bad.append(f"{want} is not linked to the job")
    for link in job["assets"] or []:
        if link["verified"]:
            bad.append(f"{link['assetId']['name']} is still verified")
    return bad


def main():
    ap = argparse.ArgumentParser(description="Reset the AV fixture job (cleanup_spec.md §7)")
    ap.add_argument("--apply", action="store_true", help="perform the plan (default: dry run)")
    ap.add_argument("--check", action="store_true", help="read the job and assert §7.2 only")
    args = ap.parse_args()

    email, password = credentials()
    if not email or not password:
        print("Could not obtain the test account's credentials.\n"
              "They normally come from the Datadog globals DATA_DOG_EMAIL / DATA_DOG_PASSWORD,\n"
              "which are not marked secure and so are readable with the DD_API/DD_APP keys in\n"
              ".env. If one has since been marked secure, add it to .env instead:\n"
              f"    {os.path.join(REPO, '.env')}\n"
              "        DATA_DOG_EMAIL=...\n"
              "        DATA_DOG_PASSWORD=...", file=sys.stderr)
        return 2

    session = Session().login(email, password)
    job = read_job(session)
    print("BEFORE")
    describe(job)

    if args.check:
        bad = check(job)
        print("\n" + ("✅ fixture is at rest" if not bad else "🛑 " + "\n🛑 ".join(bad)))
        return 1 if bad else 0

    steps = plan(job)
    if not steps:
        print("\nnothing to do — the fixture is already at rest")
        return 0 if not check(job) else 1

    print(f"\nPLAN ({'APPLYING' if args.apply else 'dry run — nothing will change'})")
    for what, subject, _, _ in steps:
        print(f"  {what:<13} {subject}")
    if not args.apply:
        print("\nre-run with --apply to perform it")
        return 0

    for what, subject, query, variables in steps:
        session.graphql(query, variables)
        print(f"  done: {what} {subject}")

    after = read_job(session)
    print("\nAFTER")
    describe(after)
    bad = check(after)
    print("\n" + ("✅ read back clean — §7.2 holds" if not bad else "🛑 " + "\n🛑 ".join(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
