#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Fetch.py
#   Created By  : Matthew Caldwell
#   Created On  : 20240214
#   Description : Script to "fetch, return, and bulk edit" tests from DataDog
#   Changelog   :
#     20240214  MAT     INIT
#     20240215  MAT     Able to fetch/throw tests, formatting, xpath       
#     20240221  MAT     Full restore works
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

from datadog_api_client import ApiClient, Configuration
from datadog_api_client.v1.api.authentication_api import AuthenticationApi
from datadog_api_client.v1.api.synthetics_api import SyntheticsApi
from datadog_api_client.v1.model.synthetics_delete_tests_payload import SyntheticsDeleteTestsPayload

import json
import os
import re
import shutil

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Config/Setup
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
configuration = Configuration()
configuration.api_key["apiKeyAuth"] = "7014e4144493a636642d6d2b8c4a7b45"
configuration.api_key["appKeyAuth"] = "e9971fad36b67e5684b45e767156e6c764c51c14" 
os.makedirs("./tests", exist_ok=True)
os.makedirs("./tests-copy", exist_ok=True)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Validate API is connected/working, should return 'True'
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def validate_api():
    print("DataDog API Working...")
    with ApiClient(configuration) as api_client:
        return AuthenticationApi(api_client).validate()

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Process data into JSON files
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def process_to_json(data, file_name):
    file_path = os.path.join("./tests/", file_name)
    json_data = json.dumps(data, indent=4)
    with open(file_path, "w") as file:
        file.write(json_data)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Extract data from a JSON files
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def extract_json(file_name, dir="./tests/"):
    file_path = os.path.join(dir + "/", file_name + ".json")
    with open(file_path, 'r') as file:
        return json.load(file)["details"]

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Bulk edit of every JSON file within a directory, edit type varies
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def bulk_edit(data, type):
    # Regeneration Edit
    # Recursivly throws, fetches, and updates ids to rebuild all tests
    # See full_restore() for more information
    if type == "restore":
        test_name = data["details"]["name"]
        if fetch("single", test_name)["does_exist"]:
            return
        else:
            all_exist = False
            for step in data["details"]["steps"]:
                if step["type"] == "playSubTest":
                    bulk_edit(data, "id")
                    all_exist = fetch("single", step["name"])["does_exist"]
                    if not all_exist:
                        break
            if all_exist:
                throw(test_name)
                return
            print("\nRestoration of " + test_name + " in progress...")
            for step in data["details"]["steps"]:
                if step["type"] == "playSubTest":
                    print("  Subtest: " + str(step["name"]))                  
                    for layered_sub_test in extract_json(step["name"])["steps"]:
                        if layered_sub_test["type"] == "playSubTest":
                            print("    Nested Subtest: " + str(layered_sub_test["name"]))  
            fetch()       
            for step in data["details"]["steps"]:
                if step["type"] == "playSubTest":
                    bulk_edit(data, "id")
            
    # ID Edit
    # Converts 'OLD_ID' -> 'NEW_ID' 
    # Step through every reference to the subtest or nested test and update id      
    if type == "id":
        for step in data["details"]["steps"]:
            if step["type"] == "playSubTest":
                new_step_id = extract_json(step["name"])["public_id"]
                step["params"]["subtestPublicId"] = new_step_id
                for layered_sub_test in extract_json(step["name"])["steps"]:
                    if layered_sub_test["type"] == "playSubTest":
                        new_layered_step_id = extract_json(layered_sub_test["name"])["public_id"]
                        layered_sub_test["params"]["subtestPublicId"] = new_layered_step_id

    # Name Edit
    # Converts 'TEST_NAME' -> 'COPY_TEST_NAME'
    if type == "name":
        data["details"]["name"] = "COPY_" + data["details"]["name"]
    
    # Xpath Edit (CHANGE AS NEEDED)
    # Converts an XPATH statement into a new one such as @data-tip -> contains()
    # EXAMPLE: //a[@data-tip=\"Admin & Setup\"] -> //a[contains(., \"Admin & Setup\")]
    # Just add/comment out the ones you want to run
    if type == "xpath":
        modified = False
        for step in data["details"]["steps"]:
            if "params" in step and "element" in step["params"] and "userLocator" in step["params"]["element"]:
                user_specified_locator = step["params"]["element"]["userLocator"]["values"]
                for USL in user_specified_locator:
                    if USL["type"] == "xpath":
                        xpath = USL["value"]

                    # Placeholder
                        print("No XPATH modification set...")
                        return

                    # Convert //a[@data-tip] -> //a[contains()]
                        # RE_A = r'\/\/a\[@data-tip=\".*\"\]'
                        # if re.match(RE_A, xpath):
                        #     print("Found XPATH: " + xpath)
                        #     re_match_location = re.search(RE_A, xpath)
                        #     location = re_match_location.group(1)
                        #     USL["value"] = f'//a[contains(., "{location}")]'
                        #     print("XPATH Updated to: " + USL["value"])
                        #     modified = True
                        
                    # Convert data-tip -> data-tip-content
                        # RE_Data_Tip = r'data-tip'
                        # if re.search(RE_Data_Tip, xpath):
                        #     print("Found XPATH: " + xpath)
                        #     USL["value"] = re.sub(RE_Data_Tip, 'data-tooltip-content', xpath)
                        #     print("XPATH Updated to: " + USL["value"])
                        #     modified = True

                    # Simplify xpaths with */ul/li[contains()] by removal of excessive identifiers
                        # RE_Ul_Li = r'^.*\/ul\/li\[contains\(., "([^"]+)"\)]$'
                        # if re.search(RE_Ul_Li, xpath) and not re.match(r'//ul/li', xpath):
                        #     print("Found XPATH: " + xpath)
                        #     re_match_location = re.search(RE_Ul_Li, xpath)
                        #     location = re_match_location.group(1)
                        #     USL["value"] = f'//ul/li[contains(., "{location}")]'
                        #     print("XPATH Updated to: " + USL["value"])
                        #     modified = True

                    # Convert //a[contains()] -> //aside/a[contains()]
                        # RE_Aside_A = r'\/\/a\[contains\(., "([^"]+)"\)\]'
                        # if re.match(RE_Aside_A, xpath):
                        #     print("Found XPATH: " + xpath)
                        #     re_match_location = re.search(RE_Aside_A, xpath)
                        #     location = re_match_location.group(1)
                        #     USL["value"] = f'//aside/a[contains(., "{location}")]'
                        #     print("XPATH Updated to: " + USL["value"])
                        #     modified = True

                    # //p[@data-testid="dv-name"]
                    # //*[@id="role"]/*/div[contains(., "")]
                    # //*[text()='Captain']
                        
                    # Paragraph (The "Name" value on top of a detailview)
                    # //p[text()='TEXT']
                    
                    # //ul/li[contains(., "Estimated - Labor")]
                    # //*[@id="root"]/div[4]/div/div[2]/div[1]/div[3]/ul/li[contains(., "Estimated - Labor")]
        
        if modified:
            print("")

        return modified

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Throw (edit or create) a DataDog test from JSON, then fetch it
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def throw(t_file, dir="./tests/"):
    data = extract_json(t_file, dir)
    # if fetch("single", data["name"])["does_exist"]:
    #     return
    modify_test = {
        "name": data["name"],
        "config": data["config"],
        "message": data["message"],
        "options": data["options"],
        "type": data["type"],
        "locations": data["locations"],
        "steps": data["steps"],
        "tags": data["tags"]
    }
    with ApiClient(configuration) as api_client:
        API = SyntheticsApi(api_client)
    try:
        API.update_browser_test(data["public_id"], modify_test)
        print(modify_test["name"] + " modified!")
    except:
        try:
            API.create_synthetics_browser_test(modify_test)
            print("\nThrowing "+ t_file + "...")
            print(modify_test["name"] + " created!")
        except:
            pass
    fetch("single", modify_test["name"])

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Bulk traversal/edit of every JSON file in a directory
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def traversal_edit(dir="./tests", edit_function=bulk_edit, edit_type=""):
    for file in os.listdir(dir):
        file_path = os.path.join(dir, file)
        with open(file_path, 'r') as file:
            data = json.load(file)
        modified = edit_function(data, edit_type)
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=4)
        file_name_full = os.path.basename(file_path)
        file_name = os.path.splitext(file_name_full)[0]
        if edit_type == "restore" and fetch("single", data["name"])["does_exist"]:
            return
        if edit_type == "xpath" and not modified:
            pass
        else:
            throw(file_name, dir)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Make backup copies of every existing test from ./tests -> ./tests-copy
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def bulk_copy (dir_A="./tests", dir_B="./tests-copy"):  
    print("\nBeginning bulk name edit...")
    for file in os.listdir(dir_A):
        file = os.path.join(dir_A, file)
        copy_file_name = "COPY_" + os.path.basename(file)
        copy_file = os.path.join(dir_B, copy_file_name)
        shutil.copyfile(file, copy_file)
    traversal_edit(dir_B, bulk_edit, "name")

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Delete tests
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def delete(t_file, dir):
    print("\nDeleting tests...")
    data = extract_json(t_file, dir)
    with ApiClient(configuration) as api_client:
        API = SyntheticsApi(api_client)
    delete_me = SyntheticsDeleteTestsPayload(public_ids=[data["public_id"]]) 
    try:
        API.delete_tests(delete_me)
        os.remove(os.path.join(dir + "/", t_file + ".json"))
        print(data["name"] + " deleted.")
        print(f"Related JSON file '{t_file}' deleted from " + dir)
    except Exception as e:
        print("ERROR. Check if test is being used by a parent or if exists")
        print(os.path.join(dir + "/", t_file + ".json"))
        print(e)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Delete all tests and related JSON files in a directory (with/without a regex)       
# WARNING: INVOKE WITH EXTREME CAUTION!!!
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def nuke(dir, regex=r'^COPY_.*$'):
    print("\nPreparing to delete all related tests/files in " + dir + " ...")
    big_red_button = input("Are you absolutely sure? This cannot be undone. (Y/N): ")
    if big_red_button.upper() == "Y":
        print("Here we go...")
        for file in os.listdir(dir):
            f_name, ext = os.path.splitext(file)
            if re.match(regex, f_name):
                delete(f_name, dir)
    else: 
        print("Aborting...")
        return

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Completly rebuild, throw, and fetch all DataDog tests from JSON backup
# To fully restore parent, child-tests, and sub-child-tests, it has to run 3 times
# This takes a minute or so to work to reconstruct everything
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def full_restore(dir="./tests"):
    print("Beginning full restore...")
    L = ["Sub-Child", "Child", "Parent"]
    for layer in range(3):
        traversal_edit(dir, bulk_edit, "restore")
        print("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        print(L[layer] + " layer successfully restored!")
        print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        layer += 1

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Fetch DataDog tests and convert into JSON
# fetch() can be of type "full", "quick", or "single" (if given a testname)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def fetch(type="full", t_name="test_name"):
    with ApiClient(configuration) as api_client:
        API = SyntheticsApi(api_client)
    # Only fetch one test by name, also checks if it exists on DataDog site
    if type == "single":
        try:
            t_details = API.get_browser_test(extract_json(t_name)["public_id"])
            return {"data": t_details, "does_exist": True}
        except:
            return {"does_exist": False}
    # Only fetch/process new tests that do not exist
    if type == "quick":
        all_tests = API.list_tests().to_dict()["tests"]
        existing_files = [file[:-5] for file in os.listdir("./tests")]
        tests = [test for test in all_tests if test["name"] not in existing_files]
    # Otherwise do a full fetch (overwrites all files)
    else:
        tests = API.list_tests().to_dict()["tests"]
    # Convert to JSON
    if tests:
        print("\nFetching tests...")    
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

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Main
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def main():
    dir, dir2 = "./tests", "./tests-copy"
    if validate_api():
        #traversal_edit(dir, bulk_edit, "xpath")
        print("Nothing configured.")

if __name__ == "__main__":
    main()