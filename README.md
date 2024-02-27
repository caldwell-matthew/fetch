# Fetch.py

A script to 'fetch' and 'throw' DataDog tests.

## Installation Guide

- Have Python 3+ installed with dependencies (datadog_api_client and dotenv).
- Enter DataDog configuration variables `DD_API` and `DD_APP` in a file named `.env`.
- Modify the `main()` function to reference whichever function you want to run.
- Run the script using Python 3: `py ./fetch.py`

## Functions

### `validate_api()`
- Checks if DataDog's API configuration is valid.

### `process_to_json()`
- Converts online test data into raw JSON format.

### `extract_json()`
- Reads raw JSON test data from a directory (default: `./tests/`).

### `traversal_edit()`
- Wrapper to traverse all files in a directory while performing an edit function.

### `edit()`
- Edits content within a JSON file based on the specified edit type.
- Edit types:
  - "restore" : See `full_restore()`
  - "id"      : Converts `'OLD_ID'` -> `'NEW_ID'`
  - "name"    : Converts `'TEST_NAME'` -> `'COPY_TEST_NAME'`
  - "xpath"   : Converts `'OLD_XPATH'` -> `'NEW_XPATH'`

### `throw()`
- Creates or edits a DataDog test from JSON in a directory.
- Also calls the `fetch()` function to ensure the JSON file is updated.

### `fetch()`
- Pulls or fetches tests from DataDog.com and converts them into JSON.
- Fetch types:
  - "full"
  - "quick"
  - "single"

### `bulk_copy()`
- Creates a backup copy of every existing test from the source directory.

### `delete()`
- Deletes a test file from a specified directory.

### `nuke()`
- Deletes ALL tests and related JSON files in a specified directory, optionally using a regex.
- Default regex targets files starting with "COPY_".

### `full_restore()`
- Rebuilds, throws, and fetches all DataDog tests from a JSON backup directory.