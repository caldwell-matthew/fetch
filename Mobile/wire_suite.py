"""Fill in MOB.999_Mobile_Suite's subtestPublicId values.

The suite chains its children with playSubTest steps, but a subtestPublicId only
exists once the child test has been created on Datadog. So the order is:

    1. throw() every MOB.0xx / MOB.1xx / MOB.900 child       (creates them, assigns IDs)
    2. python3 Mobile/wire_suite.py                          (this script - patches the suite)
    3. throw() MOB.999_Mobile_Suite                          (uploads the wired suite)

Read-only against Datadog: it only calls list_tests() to look up the child IDs.
Run from the repo root, with the venv python:

    ./.venv/bin/python Mobile/wire_suite.py
"""
import json, os, sys, certifi
from dotenv import dotenv_values
from datadog_api_client import ApiClient, Configuration
from datadog_api_client.v1.api.synthetics_api import SyntheticsApi

HERE = os.path.dirname(os.path.abspath(__file__))
SUITE = os.path.join(HERE, "MOB.999_Mobile_Suite.json")

conf = Configuration(ssl_ca_cert=certifi.where())
env = dotenv_values(os.path.join(os.path.dirname(HERE), ".env"))
conf.api_key["apiKeyAuth"] = env.get("DD_API")
conf.api_key["appKeyAuth"] = env.get("DD_APP")

with ApiClient(conf) as c:
    remote = SyntheticsApi(c).list_tests().to_dict()["tests"]
ids = {t["name"]: t["public_id"] for t in remote}

suite = json.load(open(SUITE))
steps = suite["details"]["steps"]

wired, missing = 0, []
for s in steps:
    if s.get("type") != "playSubTest":
        continue
    child = s["name"]
    if child in ids:
        s["params"]["subtestPublicId"] = ids[child]
        wired += 1
    else:
        missing.append(child)

if missing:
    print("Not yet on Datadog - throw() these children first:")
    for m in missing:
        print("   ", m)
    print("\nNothing written.")
    sys.exit(1)

with open(SUITE, "w") as f:
    f.write(json.dumps(suite, indent=4))
print(f"Wired {wired} subtest IDs into {os.path.basename(SUITE)}")
print("Now throw it:  throw('MOB.999_Mobile_Suite', './Mobile/')")
