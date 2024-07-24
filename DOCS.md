# Documentation

## Basic Usage / Tips

- The very first thing you shoud do is download all Datadog tests and make a backup of your test files.
- Afterwards, modify the `main()` function to reference whichever function you wish to run.

```
def main():
  if validate_api():
    fetch()
    # do something else...
```

- Start small. Don't try and modify every single one of your tests at once.
- Just try modifying one to see if you are doing what you want to do.

## WARNING

- **Backup. Your. Files.**
- I am not responsible for any losses, damages, or issues that may arise with the useage of this program.
- Please backup your tests so that you can make a `full_restore()` if the worst happens.
- I have deleted all of my tests many times due to misusing my own program.
- The very first thing you should be using this script for is to perform a full `fetch()` and make a **backup** as soon as possible.

## Function Guide

### `validate_api()`

- Checks if Datadog's API configuration is valid.

### `process_to_json()`

- Converts online test data into raw JSON format.

### `extract_json()`

- Reads raw JSON test data from a directory.

### `fetch()`

- 'Fetches' (or downloads) tests from Datadog and converts them into JSON.
- Fetch types:
  - "full" : Fetch all existing tests from Datadog and update all files.
  - "quick" : Only fetch new tests that do not exist in directory.
  - "single" : Only fetch one test by name.

### `throw()`

- 'Throws' (or uploads) a new test to Datadog.
- Also calls the `fetch()` function to ensure the JSON file is updated.

### `traversal_edit()`

- Wrapper to traverse all files in a directory while performing an edit().

### `edit()`

- Edits content within a JSON file based on the specified edit type. (Change/Modify/Add as needed)
- Editable fields within `test["details"]`:
  - "name"
  - "config"
  - "message"
  - "options"
  - "type"
  - "locations"
  - "steps"
  - "tags"
- Currently Existing Edit types (Add More!):
  - "id" : Don't use directly. Used with `edit("restore")`
  - "restore" : Don't use directly. Used with `full_restore()`
  - "xpath" : Converts and/or edits existing XPATH statements by REGEX
  - "steps" : Adds a new parameter, element, xpath, or otherwise modifies something within a test step. If you just need an existing XPATH changed and nothing else, use `edit("xpath")` instead.

### `full_restore()`

- Rebuilds, throws, and fetches all Datadog tests from a JSON backup directory.

### `delete()`

- Deletes a singular test file from a specified directory and Datadog.com.

### `nuke()`

- WARNING: INVOKE WITH EXTREME CAUTION!!!
- Deletes ALL tests and related JSON files in a specified directory and on Datadog, optionally using a regex.
- Default regex targets files starting with "COPY\_".
- This should rarely need to be done, if ever...

## TESTING

- Make/clone three empty Datadog tests called: `TEST_TEST`, `TEST_TEST_LAYER1`, `TEST_TEST_LAYER2`.
- Create the following nested test structure as follows.

```
└── TEST_TEST (Main)
    └── TEST_TEST_LAYER1 (Subtest)
        └── TEST_TEST_LAYER2 (Sub-Subtest)
```

- Fetch `TEST_TEST` and use that for any testing you wish.
- The reason why this needs to be done is for testing `full_restore()` and regenerating test layers.
