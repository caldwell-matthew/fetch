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
import os

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
    # Full Fetch, should fetch every exisiting test online
    assert fetch("full", "_", TESTING_DIR)

    # Quick Fetch, should only fetch what is not in dir
    assert fetch("quick", "_", TESTING_DIR)

    # Single Fetch, should only fetch one specific test
    assert fetch("single", "TEST1", TESTING_DIR)

    # There is not a super good way to assert these but
    # it should be abundantly clear that it is working or not
    # and all return True

def test_throw(): 
    assert True

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Main
def main_test():
    test_validate_api()
    test_process_to_json()
    test_extract_json()
    test_fetch()
    
if __name__ == "__main_test__":
    main_test()