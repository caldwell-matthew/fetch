# Fetch.py

<img src="./fetch_logo.png" alt="drawing" height="300"/>

A multi-purpose script to 'fetch' and 'throw' Datadog tests.

## Installation Guide

- Have Python 3+ installed with dependencies (datadog_api_client, dotenv, pytest, pytest-cov).
- Create or locate your Datadog API and Application keys for `fetch` to reference.

  - If you are setting this up for the first time, create new keys with the links below.
  - https://docs.datadoghq.com/api/latest/synthetics
  - https://app.datadoghq.com/organization-settings/api-keys
  - https://app.datadoghq.com/organization-settings/application-keys

- Create a `.env` file with the two Datadog keys `DD_API` and `DD_APP` as shown below.

  - DD_API = "ENTER YOUR API KEY HERE"
  - DD_APP = "ENTER YOUR APP KEY HERE"

- Modify the `main()` function to reference whichever function you want to run.
- Run the script using: `python3 fetch.py`
- Rum testing script using `pytest test.py` or `pytest --cov=fetch test.py`

## Functions

### `validate_api()`

- Checks if Datadog's API configuration is valid.

### `process_to_json()`

- Converts online test data into raw JSON format.

### `extract_json()`

- Reads raw JSON test data from a directory (default: `./tests/`).

### `traversal_edit()`

- Wrapper to traverse all files in a directory while performing an edit function.

### `edit()`

- Edits content within a JSON file based on the specified edit type.
- Edit types:
  - "test-working" : Test to see if traversal_edit() and edit() are working
  - "restore" : See `full_restore()`
  - "id" : Converts `'OLD_ID'` -> `'NEW_ID'`
  - "name" : Converts `'TEST_NAME'` -> `'COPY_TEST_NAME'`
  - "xpath" : Converts `'OLD_XPATH'` -> `'NEW_XPATH'`
  - "steps" : Way of stepping through subtests and edit Y/N? (WIP)

### `throw()`

- Creates or edits a Datadog test from JSON in a directory.
- Also calls the `fetch()` function to ensure the JSON file is updated.

### `fetch()`

- Pulls or fetches tests from Datadog.com and converts them into JSON.
- Fetch types:
  - "full" : Fetch all existing tests from Datadog and update all files.
  - "quick" : Only fetch new tests that do not exist in directory.
  - "single" : Only fetch one test by name provided name if exists.

### `bulk_copy()`

- Creates a backup copy of every existing test from the source directory.

### `delete()`

- Deletes a singular test file from a specified directory and Datadog.com.

### `nuke()`

- Deletes ALL tests and related JSON files in a specified directory and on Datadog.com, optionally using a regex.
- Default regex targets files starting with "COPY\_".
- This should rarely need to be done, if ever. Use with extreme caution.

### `full_restore()`

- Rebuilds, throws, and fetches all Datadog tests from a JSON backup directory.
