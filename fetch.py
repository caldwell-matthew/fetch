#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Fetch.py
#   Created By  : Matthew Caldwell
#   Created On  : 20240214
#   Description : Script to "fetch and return" tests from DataDog
#   Changelog   :
#     20240214  MAT  INIT    
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

from datadog_api_client import ApiClient, Configuration
from datadog_api_client.v1.api.authentication_api import AuthenticationApi
from datadog_api_client.v1.api.synthetics_api import SyntheticsApi
import json
import os
import requests

# Config Keys
configuration = Configuration()
configuration.api_key["apiKeyAuth"] = "7014e4144493a636642d6d2b8c4a7b45"
configuration.api_key["appKeyAuth"] = "e9971fad36b67e5684b45e767156e6c764c51c14" 

# Validate API is connected/working, should return 'True'
def validate_api():
    with ApiClient(configuration) as api_client:
        return AuthenticationApi(api_client).validate()

# Process data into JSON files
def process_to_multiple_json(data, dir, file_name):
    file_path = os.path.join(dir, file_name)
    os.makedirs(dir, exist_ok=True)
    json_data = json.dumps(data, indent=4)
    with open(file_path, "w") as file:
        file.write(json_data)

# Extract data from JSON files
def extract_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)["details"]

# Fetch DataDog tests and convert into JSON
def fetch(t_name=None, t_id=None):
    with ApiClient(configuration) as api_client:
        API = SyntheticsApi(api_client)
        
        # Fetch all tests if no specific test is specified
        if t_name is None and t_id is None:
            tests = API.list_tests().to_dict()["tests"]

        # Else fetch only a specified test 
        else: 
            tests = [{"name": t_name, "public_id": t_id}]
        
        # Process into JSON
        for test in tests:
            t_name = test["name"]
            t_id = test["public_id"]
            t_details = API.get_browser_test(t_id).to_dict()
            formatted_test = {
                "test_name": t_name + ' | ' + t_id,
                "details": t_details
            }
            f_name = f"{t_name}.json"
            clean_f_name = "".join(c if c.isalnum() or c in ['.', '_', '-'] else ' ' for c in f_name)
            process_to_multiple_json(formatted_test, "./tests", clean_f_name)

# Throw (edit or create) a DataDog test from JSON
def throw(t_file):
    data = extract_json(t_file)
    modify_test = {
        "name": data["name"],
        "config": data["config"],
        "message": data["message"],
        "options": data["options"],
        "type": data["type"],
        "locations": data["locations"],
        "steps": data["steps"]
    }
    with ApiClient(configuration) as api_client:
        API = SyntheticsApi(api_client)
        try:
            API.update_browser_test(data["public_id"], modify_test)
            print("Test '" + modify_test["name"] + "' modified!")
        except:
            API.create_synthetics_browser_test(modify_test)
            print("Test '" + modify_test["name"] + "' created!")
        fetch()
  
def main():
    if validate_api():
        print("API Working...")
        #fetch()
        #fetch("Example-Synthetic-55552", "9fm-q8m-3fj")
        throw("./tests/Example-Synthetic.json")

if __name__ == "__main__":
    main()