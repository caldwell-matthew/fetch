import os
from fetch import validate_api
from fetch import fetch
from fetch import throw
from fetch import full_restore
# from fetch import process_to_json
# from fetch import extract_json
# from fetch import delete
# from fetch import edit
# from fetch import traversal_edit
# from fetch import nuke

TESTING_DIR = "./fetch_testing/"
TEST_NAME = "TEST_TEST"
os.makedirs(TESTING_DIR, exist_ok=True)

def test_validate_api():
    assert validate_api()

def test_fetch(): # This also tests extract_json() as a result
    # Single Fetch, should only fetch one specific test
    assert fetch("single", TEST_NAME, TESTING_DIR)
    
    # Quick Fetch, should only fetch what is not in dir
    # assert fetch("quick", "_", TESTING_DIR)

    # Full Fetch, should fetch every exisiting test online
    # assert fetch("full", "_", TESTING_DIR)

# def test_throw(): # This also tests process_to_json() as a result
#     assert throw(TEST_NAME, TESTING_DIR)

# def test_full_restore():
#     assert full_restore(TESTING_DIR)

# def test_delete():
#     assert delete(TEST_NAME, TESTING_DIR)

# Due to the variety of edit() and traversal_edit(), I have ommited testing.
#     def test_edit():
#     def test_traversal_editing(): 

# Due to the catoonishly dangerous nature of this function, I have ommited testing.
#     def test_nuke();
