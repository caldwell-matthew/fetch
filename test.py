from fetch import validate_api
from fetch import process_to_json
from fetch import extract_json
from fetch import edit
from fetch import throw
from fetch import traversal_edit
from fetch import delete
from fetch import nuke
from fetch import full_restore
from fetch import fetch
import os

TESTING_DIR = './fetch_testing/'

def test_validate_api():
    assert validate_api()

def test_process_to_json():
    t_name = "TEST0"
    formatted_test = { "test_name": t_name, "details": "details" }
    process_to_json(formatted_test, f"{t_name}.json", TESTING_DIR)
    path = os.path.join(TESTING_DIR + "/", t_name + ".json")

    assert os.path.exists(path)
    os.remove(path)
    assert not os.path.exists(path) 

def test_extract_json():
    t_name = "TEST1"
    data = {}
    assert not data
    data = extract_json(t_name, TESTING_DIR)
    assert data