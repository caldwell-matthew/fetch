<img src="./fetch_logo.png" alt="drawing" height="200"/>

A multi-purpose script to 'fetch' and 'throw' Datadog tests.

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
python3 fetch.py              # Run Fetch
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
pytest test.py                # Test without coverage
pytest --cov=fetch test.py    # Test with coverage
```

# Author

`caldwell-matthew`
