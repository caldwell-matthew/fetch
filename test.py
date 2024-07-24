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
    # Edit types ("ID" and "Restore") are not directly tested since they are used in "full_restore()""

    # edit(data, "xpath", TESTING_DIR)
    # edit(data, "steps", TESTING_DIR)

    print('Woah nelly')

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

    
#     {
#     "test_name": "TEST_TEST",
#     "details": {
#         "created_at": "created_at",
#         "modified_at": "modified_at",
#         "creator": {
#             "name": "CREATOR",
#             "handle": "HANDLE",
#             "email": "EMAIL"
#         },
#         "monitor_id": 000000000,
#         "public_id": "public_id", 
#         "status": "paused",
#         "steps": [],
#         "tags": [],
#         "config": {
#             "assertions": [],
#             "config_variables": [],
#             "set_cookie": "",
#             "variables": [],
#             "request": {
#                 "headers": {},
#                 "method": "GET",
#                 "url": "https://starting_url"
#             }
#         },
#         "locations": [
#             "gcp:us-west2"
#         ],
#         "message": "",
#         "name": "TEST_TEST",
#         "options": {
#             "bindings": [],
#             "enableProfiling": false,
#             "enableSecurityTesting": false,
#             "device_ids": [
#                 "firefox.laptop_large",
#                 "chrome.laptop_large",
#                 "edge.laptop_large"
#             ],
#             "disable_cors": false,
#             "disable_csp": false,
#             "ignore_server_certificate_error": false,
#             "min_failure_duration": 0,
#             "min_location_failed": 1,
#             "monitor_options": {
#                 "notification_preset_name": "show_all"
#             },
#             "no_screenshot": false,
#             "retry": {
#                 "count": 0,
#                 "interval": 300.0
#             },
#             "rum_settings": {
#                 "application_id": "7372fdca-35b0-42f6-86e1-b994dc85d451",
#                 "client_token_id": 85674,
#                 "is_enabled": true
#             },
#             "tick_every": 300
#         },
#         "type": "browser"
#     }
# }