from fetch import validate_api
from fetch import process_to_json
from fetch import extract_json
from fetch import fetch
from fetch import throw
from fetch import edit
from fetch import traversal_edit
from fetch import delete
from fetch import nuke
from fetch import full_restore
import json, os

TESTING_DIR = "./fetch_testing/"
os.makedirs(TESTING_DIR, exist_ok=True)

def test_validate_api():
    assert validate_api()

def test_process_to_json():
    t_name = 'TEST0'
    formatted_test = { 'test_name': t_name, 'details': 'details' }
    process_to_json(formatted_test, f'{t_name}.json', TESTING_DIR)
    path = os.path.join(TESTING_DIR + '/', t_name + '.json')

    assert os.path.exists(path)
    os.remove(path)
    assert not os.path.exists(path) 

def test_extract_json():
    assert extract_json("TEST1", TESTING_DIR)

def test_fetch(): 
    # There is not a super good way to assert these but
    # it should be abundantly clear that it is working or not
    # and all should return True

    # Full Fetch, should fetch every exisiting test online
    assert fetch("full", "_", TESTING_DIR)

    # Quick Fetch, should only fetch what is not in dir
    assert fetch("quick", "_", TESTING_DIR)

    # Single Fetch, should only fetch one specific test
    assert fetch("single", "TEST1", TESTING_DIR)

def test_throw(): 
    assert throw("TEST1", TESTING_DIR)

def test_traversal_editing(): 
    # This tests traversal_edit() and edit() since edit() is only a helper function
    # Some edit types are not directly tested since they are used in other types like "ID Edit"

    # "ID Edit" (Typically only use with "Restore Edit" )
    # edit(data, "id", TESTING_DIR)


        
    # edit(data, "id", TESTING_DIR)
    # edit(data, "restore", TESTING_DIR)
    # edit(data, "xpath", TESTING_DIR)
    # edit(data, "steps", TESTING_DIR)

    # ID Edit
    #   Converts 'OLD_ID' -> 'NEW_ID' 
    #   Step through every reference to the subtest or nested test and update id      
    # if type == "id":
    #     for step in data["details"]["steps"]:
    #         if step["type"] == "playSubTest":
    #             new_step_id = extract_json(step["name"], dir)["public_id"]
    #             step["params"]["subtestPublicId"] = new_step_id
    #             for layered_sub_test in extract_json(step["name"], dir)["steps"]:
    #                 if layered_sub_test["type"] == "playSubTest":
    #                     new_layered_step_id = extract_json(layered_sub_test["name"], dir)["public_id"]
    #                     layered_sub_test["params"]["subtestPublicId"] = new_layered_step_id

    # modify_test = {
    #     "name": data["name"],
    #     "config": data["config"],
    #     "message": data["message"],
    #     "options": data["options"],
    #     "type": data["type"],
    #     "locations": data["locations"],
    #     "steps": data["steps"],
    #     "tags": data["tags"]
    # }
    # {
    #     "details": {
    #         "public_id": "PUBLIC_ID",
    #         "status": "paused",
    #         "steps": [
    #             {
    #                 "allow_failure": false,
    #                 "is_critical": true,
    #                 "name": "001.002.002_Login",
    #                 "no_screenshot": false,
    #                 "params": {
    #                     "subtestPublicId": "dzw-q2w-3rd",
    #                     "playingTabId": -1
    #                 },
    #                 "type": "playSubTest"
    #             },
    #         ],
    #         "tags": [
    #             "ADMIN"
    #         ],
    #         "config": {
    #             "assertions": [],
    #             "config_variables": [
    #                 {
    #                     "id": "dcbd1502-e595-4efe-bda7-ee1427c37116",
    #                     "name": "MENTOR_ENV",
    #                     "type": "global"
    #                 }
    #             ],
    #             "set_cookie": "",
    #             "variables": [],
    #             "request": {
    #                 "headers": {},
    #                 "method": "GET",
    #                 "url": "https://{{ MENTOR_ENV }}.mentorapm.com/login"
    #             }
    #         },
    #         "locations": [
    #             "aws:us-west-1"
    #         ],
    #         "message": "`000.000.000 RUN-0`\n- Wrapper to run all tests 1-10. \n- Datadog has a test execution time cap at ~20 minutes. \n- RUN tests are broken up to circumvent.",
    #         "name": "T_NAME_HERERERE",
    #         "options": {
    #             "device_ids": [
    #                 "chrome.laptop_large"
    #             ],
    #             "disable_cors": false,
    #             "disable_csp": false,
    #             "ignore_server_certificate_error": false,
    #             "min_failure_duration": 0,
    #             "min_location_failed": 1,
    #             "monitor_options": {},
    #             "no_screenshot": false,
    #             "retry": {
    #                 "count": 0,
    #                 "interval": 300.0
    #             },
    #             "rum_settings": {
    #                 "is_enabled": false
    #             },
    #             "tick_every": 300
    #         },
    #         "type": "browser"
    #     }
    # }