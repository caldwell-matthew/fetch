from fetch import validate_api
from fetch import process_to_json
from fetch import extract_json
from fetch import throw
from fetch import fetch
from fetch import edit
from fetch import throw
from fetch import traversal_edit
from fetch import delete
from fetch import nuke
from fetch import full_restore
import os

TESTING_DIR = './fetch_testing/'

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
    data = {}
    assert not data
    data = extract_json("TEST1", TESTING_DIR)
    assert data

def test_throw_fetch(): 
    t_name = "TEST1"

    no_test_exists = fetch("single", "NO_TEST", TESTING_DIR)
    assert not no_test_exists

    test_exists = fetch("single", t_name, TESTING_DIR)
    assert not test_exists 

    throw(t_name, TESTING_DIR)
    # need to do a fetch here or after the throw.

    test_exists2 = fetch("single", t_name, TESTING_DIR)
    assert test_exists2
    
    # fetch('quick')
    # fetch() # type='full' as default


# def fetch(type="full", t_name="test_name"):
#     with ApiClient(configuration) as api_client:
#         API = SyntheticsApi(api_client)
#     # Only fetch one test by name, also checks if it exists on DataDog site
#     if type == "single":
#         try:
#             t_details = API.get_browser_test(extract_json(t_name)["public_id"])
#             return {"data": t_details, "does_exist": True}
#         except:
#             return {"does_exist": False}
#     # Only fetch/process new tests that do not exist
#     if type == "quick":
#         all_tests = API.list_tests().to_dict()["tests"]
#         existing_files = [file[:-5] for file in os.listdir(MAIN_DIR)]
#         tests = [test for test in all_tests if test["name"] not in existing_files]
#     # Otherwise do a full fetch (overwrites all files)
#     else:
#         tests = API.list_tests().to_dict()["tests"]
#     # Convert to JSON
#     if tests:
#         print("\nFetching tests...")    
#         for test in tests:
#             t_name = test["name"]
#             t_id = test["public_id"]
#             t_details = API.get_browser_test(t_id).to_dict()
#             formatted_test = {
#                 "test_name": t_name, 
#                 "details": t_details
#             }
#             process_to_json(formatted_test, f"{t_name}.json")
#             print("Caught: " + formatted_test["test_name"])

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Main
def main():
    test_validate_api()
    test_process_to_json()
    test_extract_json()
    test_throw_fetch()
    # test_fetch()
    
if __name__ == "__main__":
    main()