<img src="./fetch_logo.png" alt="drawing" height="200"/>

A multi-purpose script to 'fetch' and 'throw' Datadog tests.

> **Legacy.** This is the repo's original tool, kept for bulk download/backup of Datadog tests. The active
> project is the mobile suite in `legacy/Mobile/` — see the root `README.md`. Its data lives beside it: downloads in
> `legacy/dd_tests/`, backups in `legacy/dd_tests_backup/` (both git-ignored, local only). The kept backup is
> `dd_tests_backup/2026-08-12_1543_pre-delete/` — every browser test in the org before the Aug 12 deletions.
> It reads the Datadog keys from the repo-root `.env`, so it runs from anywhere (`python3 legacy/fetch.py`).

## Installation

- Have Python 3+ installed and run the following:

```
pip install datadog-api-client python-dotenv dotenv pytest pytest-cov
```

- Create or locate your Datadog API and Application keys for `fetch` to reference.
- If you are setting this up for the first time, see the following links:

  - https://docs.datadoghq.com/api/latest/synthetics
  - https://app.datadoghq.com/organization-settings/api-keys
  - https://app.datadoghq.com/organization-settings/application-keys

- Create a `.env` file with your App and API Datadog keys:

```
DD_API = "ENTER YOUR API KEY HERE"
DD_APP = "ENTER YOUR APP KEY HERE"
```

# Getting Started

[Fetch Documentation](DOCS.md)
[Datadog Documentation](https://docs.datadoghq.com/api/latest/)

# Running the Script

```
python3 legacy/fetch.py       # Run Fetch
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
pytest legacy/test.py         # Test without coverage
pytest --cov=fetch legacy/test.py  # Test with coverage
```

# Author

`caldwell-matthew`
