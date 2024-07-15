#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Fetch.py
#   Created By  : Matthew Caldwell
#   Created On  : 20240214
#   Description : Script to 'fetch' and 'throw' DataDog tests
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

import json, os, re, certifi
from dotenv import dotenv_values
from datadog_api_client import ApiClient
from datadog_api_client.v1 import Configuration
from datadog_api_client.v1.api.authentication_api import AuthenticationApi
from datadog_api_client.v1.api.synthetics_api import SyntheticsApi
from datadog_api_client.v1.model.synthetics_delete_tests_payload import SyntheticsDeleteTestsPayload

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Config/Setup (See https://docs.datadoghq.com/api/latest/synthetics/)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
configuration = Configuration(ssl_ca_cert=certifi.where())
env = dotenv_values(".env")
configuration.api_key["apiKeyAuth"] = env.get("DD_API") 
configuration.api_key["appKeyAuth"] = env.get("DD_APP") 
main_dir = './tests/'
backup_dir = './tests-copy'
os.makedirs(main_dir, exist_ok=True)
os.makedirs(backup_dir, exist_ok=True)

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
    file_path = os.path.join(dir, file_name + ".json")
    with open(file_path, 'r') as file:
        return json.load(file)["details"]

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Edit content within a JSON file, edit type varies
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def edit(data, type):
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
                    edit(data, "id")
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
                    edit(data, "id")
            
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
                    
        if modified:
            print("")
        return modified
    
    if type == "steps":
        modified = False
        RE_ESC = re.compile(r'.*x\sesc.*', re.IGNORECASE)

        for step in data["details"]["steps"]:
            if step["type"] != "playSubTest":
                if re.match(RE_ESC, step["name"]):
                    print("Found step: " + step["name"])
                    print(step)
                    modified = True
                    input('asdf')

        if modified:
            print("")
        return modified
    
        # {
        #     "allow_failure": false,
        #     "is_critical": true,
        #     "name": "Press key",
        #     "no_screenshot": false,
        #     "params": {
        #         "value": "Escape"
        #     },
        #     "type": "pressKey"
        # },
        
        # {
        #     "allow_failure": false,
        #     "is_critical": true,
        #     "name": "Click on X esc",
        #     "no_screenshot": false,
        #     "params": {
        #         "element": {
        #             "url": "https://dev.mentorapm.com/apm/myprofile",
        #             "userLocator": {
        #                 "values": [
        #                     {
        #                         "type": "xpath",
        #                         "value": "//div[contains(@class, \"apm-modal-actions\")]"
        #                     }
        #                 ],
        #                 "failTestOnCannotLocate": true
        #             },
        #             "multiLocator": {
        #                 "ab": "/*[local-name()=\"html\"][1]/*[local-name()=\"body\"][1]/*[local-name()=\"div\"][3]/*[local-name()=\"div\"][1]/*[local-name()=\"div\"][1]/*[local-name()=\"div\"][1]",
        #                 "at": "",
        #                 "cl": "/descendant::*[contains(concat(' ', normalize-space(@class), ' '), \" apm-modal-actions \")]",
        #                 "co": "[{\"relation\":\"BEFORE\",\"tagName\":\"DIV\",\"text\":\"formatmark updelete export\",\"textType\":\"innerText\"},{\"text\":\"formatmark up\",\"textType\":\"innerText\",\"relation\":\"PARENT OF\",\"tagName\":\"UL\",\"isNegativeAnchor\":true},{\"relation\":\"BEFORE\",\"tagName\":\"LI\",\"text\":\"mark up\",\"textType\":\"innerText\"}]",
        #                 "ro": "//*[contains(concat(' ', normalize-space(@class), ' '), \" apm-modal-actions \")]",
        #                 "clt": "/descendant::*[contains(concat(' ', normalize-space(@class), ' '), \" apm-modal-actions \")]"
        #             },
        #             "targetOuterHTML": "<div class=\"apm-modal-actions\"><svg aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"times\" class=\"svg-inline--fa fa-times fa-w-11 close-modal\" role=\"img\" xmlns=\"http://www.w3.org/200"
        #         }
        #     },
        #     "type": "click"
        # },

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
def traversal_edit(dir="./tests", edit_function=edit, edit_type=""):
    # for file in os.listdir(dir):
    #     file_path = os.path.join(dir, file)
    #     with open(file_path, 'r') as file:
    #         data = json.load(file)
    #     modified = edit_function(data, edit_type)
    #     with open(file_path, 'w') as file:
    #         json.dump(data, file, indent=4)
    #     file_name_full = os.path.basename(file_path)
    #     file_name = os.path.splitext(file_name_full)[0]
    #     if edit_type == "restore":
    #         print(data["test_name"])
    #         input('asdf')
    #         if fetch("single", data["test_name"])["does_exist"]:
    #             pass
    #     elif edit_type == "xpath" and not modified:
    #         pass
    #     elif edit_type == "steps" and not modified:
    #         pass
    #     else:
    #         throw(file_name, dir)
    for file in os.listdir(dir):
        file_path = os.path.join(dir, file)
        with open(file_path, 'r') as file:
            data = json.load(file)
        edit_function(data, edit_type)
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=4)
        file_name_full = os.path.basename(file_path)
        file_name = os.path.splitext(file_name_full)[0]
        throw(file_name, dir)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Make backup copies of every existing test from ./tests -> ./tests-copy
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def bulk_copy (dir_A="./tests", dir_B="./tests-copy"):  
    print("BROKEN. DO NOT USE RIGHT NOW")
    print("NEED TO MAKE CHANGES TO ID/NAME")
    # print("\nBeginning bulk name edit...")
    # for file in os.listdir(dir_A):
    #     file = os.path.join(dir_A, file)
    #     copy_file_name = "COPY_" + os.path.basename(file)
    #     copy_file = os.path.join(dir_B, copy_file_name)
    #     shutil.copyfile(file, copy_file)
    # traversal_edit(dir_B, edit, "name")

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
#   WARNING: INVOKE WITH EXTREME CAUTION!!!
#   I HAVE LOST ALL MY TESTS TWICE BY MISHANDLING THIS. (PLEASE BACKUP YOUR FILES)
#   YOU SHOULD ALMOST NEVER EVER EVER NEED TO USE THIS.
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
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
# Completly rebuild, throw, and fetch all DataDog tests from JSON backup
#   To fully restore parent, child-tests, and sub-child-tests, it has to run 3 times
#   This takes a minute or so to work to reconstruct everything
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
def full_restore(dir="./tests"):
    print("Beginning full restore...")
    L = ["Sub-Child", "Child", "Parent"]
    for layer in range(3):
        traversal_edit(dir, edit, "restore")
        print("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        print(L[layer] + " layer successfully restored!")
        print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        layer += 1

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Fetch DataDog tests and convert into JSON
#   fetch() can be of type "full", "quick", or "single" (if given a testname)
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
    if validate_api():
        # full_restore()
        fetch()
        #traversal_edit(dir, edit, "steps")
        #bulk_copy() // NEED TO CHANGE ID ON THE COPIES.
        #throw('000.000.000 CSV_Bulk_Transaction')

if __name__ == "__main__":
    main()