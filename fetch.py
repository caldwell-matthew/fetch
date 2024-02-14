#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Fetch.py
#   Created By  : Matthew Caldwell
#   Created On  : 20240214
#   Description : Script to "fetch" tests from DataDog into JSON
#   Changelog   :
#     20240214  MAT  INIT    
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

from datadog_api_client import ApiClient, Configuration
from datadog_api_client.v1.api.authentication_api import AuthenticationApi
from datadog_api_client.v1.api.synthetics_api import SyntheticsApi
import json

# Config Keys
configuration = Configuration()
configuration.api_key["apiKeyAuth"] = "7014e4144493a636642d6d2b8c4a7b45"
configuration.api_key["appKeyAuth"] = "e9971fad36b67e5684b45e767156e6c764c51c14" 

# Validate API is connected/working, should return 'True'
def validate_api(api_client):
    return AuthenticationApi(api_client).validate()

# Process data into JSON format
def process_to_json(data):
    json_data = json.dumps(data, indent=4)
    with open("datadog_tests.json", "w") as file:
        file.write(json_data)

# Fetch all DataDog tests and append all related test steps
def fetch_tests(api_client):
    API = SyntheticsApi(api_client)
    res = API.list_tests()

    tests_list = res.to_dict()["tests"]
    tests = []

    for test in tests_list:
        t_id = test["public_id"]
        t_name = test["name"]
        t_details = API.get_browser_test(t_id)

        steps = []
        if "steps" in t_details.to_dict():
            steps = t_details.to_dict()["steps"]

        test_with_steps = {
            "test_name": t_name,
            "test_id": t_id,
            "steps": steps
        }
        tests.append(test_with_steps)  
    return process_to_json(tests)

with ApiClient(configuration) as api_client:
    if (validate_api(api_client)):
        fetch_tests(api_client)
