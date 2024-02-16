#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Fetch.py
#   Created By  : Matthew Caldwell
#   Created On  : 20240214
#   Description : Script to "fetch, return, and bulk edit" tests from DataDog
#   Changelog   :
#     20240214  MAT     INIT
#     20240215  MAT     Able to fetch/throw tests, formatting       
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

from datadog_api_client import ApiClient, Configuration
from datadog_api_client.v1.api.authentication_api import AuthenticationApi
from datadog_api_client.v1.api.synthetics_api import SyntheticsApi
import json
import os
import re

# Config/Setup
configuration = Configuration()
configuration.api_key["apiKeyAuth"] = "7014e4144493a636642d6d2b8c4a7b45"
configuration.api_key["appKeyAuth"] = "e9971fad36b67e5684b45e767156e6c764c51c14" 
os.makedirs("./tests", exist_ok=True)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Validate API is connected/working, should return 'True'
def validate_api():
    print("DataDog API Working...")
    with ApiClient(configuration) as api_client:
        return AuthenticationApi(api_client).validate()

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Process data into JSON files
def process_to_json(data, file_name):
    file_path = os.path.join("./tests/", file_name)
    json_data = json.dumps(data, indent=4)
    with open(file_path, "w") as file:
        file.write(json_data)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Extract data from a singular JSON file by test file name
def extract_single_json(file_name):
    with open("./tests/" + file_name + ".json", 'r') as file:
        return json.load(file)["details"]

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Bulk traversal/edit of every JSON file in a directory (default to ./tests)
def bulk_traversal_edit_json(dir = "./tests"):
    for file in os.listdir(dir):
        file_path = os.path.join(dir, file)

        with open(file_path, 'r') as file:
            data = json.load(file)
        bulk_edit(data)
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=4)

        file_name_full = os.path.basename(file_path)
        file_name = os.path.splitext(file_name_full)[0]
        
        throw(file_name)
        break # just do one first

def bulk_edit(data):
    for step in data["details"]["steps"]:
        user_specified_locator = step["params"]["element"]["userLocator"]["values"]
        for USL in user_specified_locator:
            if USL["type"] == "xpath":
                xpath = USL["value"]

                #DEBUGSTUFF
                print("Current XPATH: " + xpath)

                # Convert @data-tip -> contains()
                # EXAMPLE: //a[@data-tip=\"Admin & Setup\"] -> //a[contains(., \"Admin & Setup\")]
                if re.match(r'\/\/a\[@data-tip=\".*\"\]', xpath):
                    re_match_location = re.search(r'@data-tip="([^"]+)"', xpath)
                    location = re_match_location.group(1)

                    #DEBUGSTUFF
                    print("LOCATION! : " + location) 

                    USL["value"] = f"//a[contains(., \"{location}\")]"

                    #DEBUGSTUFF
                    print("NEW XPATH: " + xpath)

        break # just do one first


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Fetch DataDog tests and convert into JSON
def fetch():
    print("\nFetching tests...")
    with ApiClient(configuration) as api_client:
        API = SyntheticsApi(api_client)

    # Only fetch/process new tests that do not exist
    all_tests = API.list_tests().to_dict()["tests"]
    existing_files = [file[:-5] for file in os.listdir("./tests")]
    tests = [test for test in all_tests if test["name"] not in existing_files]

    # Convert to JSON
    if tests:
        for test in tests:
            t_name = test["name"]
            t_id = test["public_id"]
            t_details = API.get_browser_test(t_id).to_dict()
            formatted_test = {
                "test_name": t_name, 
                "details": t_details
            }
            process_to_json(formatted_test, f"{t_name}.json")
            print("Caught: " + formatted_test["test_name"])
    else: 
        print("No new tests to fetch...") 

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Throw (edit or create) a DataDog test from JSON, then fetch it
def throw(t_file):
    print("\nThrowing "+ t_file + "...")
    data = extract_single_json(t_file)
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
        print(modify_test["name"] + " modified!")
    except:
        API.create_synthetics_browser_test(modify_test)
        print(modify_test["name"] + " created!")
    fetch()

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Main
def main():
    if validate_api():
        fetch()
        #throw("Example-Synthetic")
        #throw("001.004.001 Mk_SL")
        #bulk_traversal_edit_json()

if __name__ == "__main__":
    main()