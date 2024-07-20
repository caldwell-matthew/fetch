# Documentation

## Basic Usage / Tips

- Modify the `main()` function to reference whichever function you wish to run.
- Start small. Don't try and modify every single one of your tests at once. Just try modifying one to see if you are doing what you want to do.

## WARNING

- **Backup. Your. Files.**
- I am not responsible for any losses, damages, or issues that may arise with the useage of this program. Please backup your tests so that you can make a `full_restore()` if the worst happens. I have deleted all of my tests many times due to misusing my own program. The very first thing you should be using this script for is to perform a full `fetch()` and make a **backup** as soon as possible.

## Function Guide

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
