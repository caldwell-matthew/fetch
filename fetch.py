#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Fetch.py
#   Created By  : Matthew Caldwell
#   Description : Script to 'fetch' and 'throw' Datadog tests

import json, os, re, certifi
from dotenv import dotenv_values
from datadog_api_client import ApiClient
from datadog_api_client.v1 import Configuration
from datadog_api_client.v1.api.authentication_api import AuthenticationApi
from datadog_api_client.v1.api.synthetics_api import SyntheticsApi
from datadog_api_client.v1.model.synthetics_delete_tests_payload import SyntheticsDeleteTestsPayload

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Config/Setup (See README for instructions)
configuration = Configuration(ssl_ca_cert=certifi.where())
env = dotenv_values(".env")
configuration.api_key["apiKeyAuth"] = env.get("DD_API") 
configuration.api_key["appKeyAuth"] = env.get("DD_APP") 

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Directory Setup
MAIN_DIR = "./dd_tests/"
BACKUP_DIR = "./dd_tests_copy/"
os.makedirs(MAIN_DIR, exist_ok=True)
os.makedirs(BACKUP_DIR, exist_ok=True)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Validate API
#   Confirm that Datadog API is connected/working. Should return True, otherwise False
def validate_api():
    print("Datadog API Working...")
    with ApiClient(configuration) as api_client:
        return AuthenticationApi(api_client).validate()

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# JSON Processing and Extracting 
def process_to_json(data, file_name, dir=MAIN_DIR):
    file_path = os.path.join(dir, file_name)
    with open(file_path, "w") as file:
        file.write(json.dumps(data, indent=4))

def extract_json(file_name, dir=MAIN_DIR):
    file_path = os.path.join(dir, file_name + ".json")
    with open(file_path, 'r') as file:
        return json.load(file)["details"]

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Fetch Datadog tests and convert into JSON
#   fetch() can be of type "full", "quick", or "single" (if given a testname)
def fetch(type="full", t_name="_", dir=MAIN_DIR):
    with ApiClient(configuration) as api_client:
        API = SyntheticsApi(api_client)

    # Get all existing tests on Datadog
    tests = API.list_tests().to_dict()["tests"]
    
    # Only fetch/process new tests that do not exist
    if type == "quick":
        existing_files = [file[:-5] for file in os.listdir(dir)]
        tests = [test for test in tests if test["name"] not in existing_files]

    # Convert to JSON
    print("\nFetching tests...")    
    for test in tests:
        test_name = test["name"]
        # Only fetch one specific test by name if type "single"
        if type == "single" and test_name != t_name:
            continue
        # Otherwise fetch everything
        try:
            test_details = API.get_browser_test(test["public_id"]).to_dict()
            formatted_test = {
                "test_name": test_name, 
                "details": test_details
            }
            process_to_json(formatted_test, f"{test_name}.json", dir)
            print("Caught: " + formatted_test["test_name"])
        except Exception as e:
            print("ERROR. Check if test " + test_name + " exists")
            print(os.path.join(dir + "/", test_name + ".json"))
            print(e)
            return False

    print("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    print("Completed " + type + " fetch of " + str(len(tests)) + " tests.")
    print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n")
    return True

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Throw (edit or create) a Datadog test from JSON, then fetch it
def throw(t_file, dir=MAIN_DIR):
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
    fetch("single", modify_test["name"], dir)
    return True

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Bulk traversal/edit of every JSON file in a directory
def traversal_edit(edit_type="", dir=MAIN_DIR):
    for file in os.listdir(dir):
        file_path = os.path.join(dir, file)
        with open(file_path, 'r') as file:
            data = json.load(file)
        edit(data, edit_type, dir)
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=4)
        file_name_full = os.path.basename(file_path)
        file_name = os.path.splitext(file_name_full)[0]
        throw(file_name, dir)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Edit content within a JSON file, edit type varies
def edit(data, type, dir=MAIN_DIR):
    # ID Edit (Don't use directly. Used with edit("restore")
    #   Converts 'OLD_ID' -> 'NEW_ID' 
    #   Step through every reference to the subtest or nested test and update id      
    if type == "id":
        for step in data["details"]["steps"]:
            if step["type"] == "playSubTest":
                new_step_id = extract_json(step["name"], dir)["public_id"]
                step["params"]["subtestPublicId"] = new_step_id
                for layered_sub_test in extract_json(step["name"], dir)["steps"]:
                    if layered_sub_test["type"] == "playSubTest":
                        new_layered_step_id = extract_json(layered_sub_test["name"], dir)["public_id"]
                        layered_sub_test["params"]["subtestPublicId"] = new_layered_step_id

    # Regeneration Edit
    #   Recursivly throws, fetches, and updates ids to rebuild all tests on Datadog.com
    #   See full_restore() for more information
    if type == "restore":
        test_name = data["details"]["name"]
        if fetch("single", test_name, dir):
            return
        else:
            all_exist = False
            for step in data["details"]["steps"]:
                if step["type"] == "playSubTest":
                    edit(data, "id", dir)
                    all_exist = fetch("single", step["name"])["does_exist"]
                    if not all_exist:
                        break
            if all_exist:
                throw(test_name, dir)
                return
            print("\nRestoration of " + test_name + " in progress...")
            for step in data["details"]["steps"]:
                if step["type"] == "playSubTest":
                    print("  Subtest: " + str(step["name"]))                  
                    for layered_sub_test in extract_json(step["name"])["steps"]:
                        if layered_sub_test["type"] == "playSubTest":
                            print("    Nested Subtest: " + str(layered_sub_test["name"]))  
            fetch("full", "_", dir)       
            for step in data["details"]["steps"]:
                if step["type"] == "playSubTest":
                    edit(data, "id", dir)
            
    # Xpath Edit (CHANGE AS NEEDED)
    #   Converts an XPATH statement into a new one such as @data-tip -> contains()
    #   EXAMPLE: //a[@data-tip=\"Admin & Setup\"] -> //a[contains(., \"Admin & Setup\")]
    #   Just add/comment out the ones you want to run
    if type == "xpath":

        # Placeholder - Comment this out when ready to use
        print("No XPATH modification set...")
        return
    
        for step in data["details"]["steps"]:
            if "params" in step and "element" in step["params"] and "userLocator" in step["params"]["element"]:
                user_specified_locator = step["params"]["element"]["userLocator"]["values"]
                for USL in user_specified_locator:
                    if USL["type"] == "xpath":
                        xpath = USL["value"]
                    
                    # Convert //a[@data-tip] -> //a[contains()]
                        RE_A = r'\/\/a\[@data-tip=\".*\"\]'
                        if re.match(RE_A, xpath):
                            print("Found XPATH: " + xpath)
                            re_match_location = re.search(RE_A, xpath)
                            location = re_match_location.group(1)
                            USL["value"] = f'//a[contains(., "{location}")]'
                            print("XPATH Updated to: " + USL["value"])
                        
                    # Convert data-tip -> data-tip-content
                        RE_Data_Tip = r'data-tip'
                        if re.search(RE_Data_Tip, xpath):
                            print("Found XPATH: " + xpath)
                            USL["value"] = re.sub(RE_Data_Tip, 'data-tooltip-content', xpath)
                            print("XPATH Updated to: " + USL["value"])

                    # Simplify xpaths with */ul/li[contains()] by removal of excessive identifiers
                        RE_Ul_Li = r'^.*\/ul\/li\[contains\(., "([^"]+)"\)]$'
                        if re.search(RE_Ul_Li, xpath) and not re.match(r'//ul/li', xpath):
                            print("Found XPATH: " + xpath)
                            re_match_location = re.search(RE_Ul_Li, xpath)
                            location = re_match_location.group(1)
                            USL["value"] = f'//ul/li[contains(., "{location}")]'
                            print("XPATH Updated to: " + USL["value"])

                    # Convert //a[contains()] -> //aside/a[contains()]
                        RE_Aside_A = r'\/\/a\[contains\(., "([^"]+)"\)\]'
                        if re.match(RE_Aside_A, xpath):
                            print("Found XPATH: " + xpath)
                            re_match_location = re.search(RE_Aside_A, xpath)
                            location = re_match_location.group(1)
                            USL["value"] = f'//aside/a[contains(., "{location}")]'
                            print("XPATH Updated to: " + USL["value"])
                    
    # Step Edit (CHANGE AS NEEDED)
    #   Adds a new parameter, element, xpath, or otherwise modifies something within a test step
    #   If you just need an existing XPATH changed and nothing else, see edit("xpath")
    #   edit("steps) should only be used when you need to insert/create an entirely new obj within a test step
    #   Just add/comment out the ones you want to run
    if type == "steps":

        # Placeholder - Comment this out when ready to use
        print("No Step modification set...")
        return
        
        RE_NEXT_BTN = r'<button class="apm-btn nav-btn" data-testid="next-btn" type="button">'
        RE_SUBMIT_BTN = r'<button id="submit-btn" class="apm-btn apm-btn-success nav-btn-submit" type="submit" role="submit">'
        
        for step in data["details"]["steps"]:
            if step["type"] != "playSubTest":
                if "element" in step["params"]:
                    if "targetOuterHTML" in step["params"]["element"]:
                        htmlElm = step["params"]["element"]["targetOuterHTML"]
                        if re.findall(RE_NEXT_BTN, htmlElm):
                            step["params"]["element"]["userLocator"] = {
                                "values": [
                                    {
                                        "type": "xpath",
                                        "value": "//button[@data-testid=\"next-btn\"]"
                                    }
                                ],
                                "failTestOnCannotLocate": True
                            }
                        
                        if re.findall(RE_SUBMIT_BTN, htmlElm):
                            step["params"]["element"]["userLocator"] = {
                                "values": [
                                    {
                                        "type": "xpath",
                                        "value": "//button[@role=\"submit\"]"
                                    }
                                ],
                                "failTestOnCannotLocate": True
                            }

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Completly rebuild, throw, and fetch all Datadog tests from JSON backup
#   To fully restore parent, child-tests, and sub-child-tests, it has to run 3 times
#   This takes a minute or so to work to reconstruct everything
def full_restore(dir=MAIN_DIR):
    print("Beginning full restore...")
    L = ["Sub-Child", "Child", "Parent"]
    for layer in range(3):
        traversal_edit("restore", dir)
        print("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        print(L[layer] + " layer successfully restored!")
        print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        layer += 1

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Delete tests
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
        return True
    except Exception as e:
        print("ERROR. Check if test " + t_file + " is being used by a parent or if exists")
        print(os.path.join(dir + "/", t_file + ".json"))
        print(e)
        return False

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Delete all tests and related JSON files in a directory (with/without a regex)    
#   WARNING: INVOKE WITH EXTREME CAUTION!!!
def nuke(dir, regex=r'^COPY_.*$'):
    print("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    print("Preparing to delete all related tests/files in " + dir + " ...")
    print("REGEX pattern is currently set to : '" + regex + "' ...")
    print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n")
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
# Main
def main():
    if validate_api():
        fetch("single", "TEST_TEST", MAIN_DIR)
        # do something else...
        
if __name__ == "__main__":
    main()