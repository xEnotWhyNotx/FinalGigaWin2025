import requests
import json

# Make sure your Flask app is running before executing this cell.
# You can run it from your terminal with: python backend/app.py

# URL of the endpoint
url = 'http://127.0.0.1:5001/mcd_data'

# Parameters for the request
# Using an example UNOM and timestamp from the notebook exploration
params = {
    'unom': 15109,
    'timestamp': '2025-09-05T05:00:00'
}

print(f"Requesting data from: {url}")
print(f"With parameters: {params}")

try:
    # Make the GET request
    response = requests.get(url, params=params)

    # Print the status code
    print(f"Status Code: {response.status_code}")

    # Check if the request was successful
    if response.status_code == 200:
        # Pretty print the JSON response
        print("Response JSON:")
        # Use ensure_ascii=False to correctly display Russian characters if any
        print(json.dumps(response.json(), indent=4, ensure_ascii=False))
    else:
        print("Error response from server:")
        print(response.text)

except requests.exceptions.ConnectionError as e:
    print(f"\nConnection Error: Failed to establish a connection to {url}.")
    print("Please ensure that the Flask server ('backend/app.py') is running in a separate terminal.")

import requests
import json

# Make sure your Flask app is running before executing this cell.

# URL of the ctp_data endpoint
ctp_url = 'http://127.0.0.1:5001/ctp_data'

# Parameters for the request
# Using an example CTP ID and the same timestamp
ctp_params = {
    'ctp_id': '04-07-0212/031',  # Example CTP ID from notebook
    'timestamp': '2025-09-05T05:00:00'
}

print(f"Requesting data from: {ctp_url}")
print(f"With parameters: {ctp_params}")

try:
    # Make the GET request
    ctp_response = requests.get(ctp_url, params=ctp_params)

    # Print the status code
    print(f"Status Code: {ctp_response.status_code}")

    # Check if the request was successful
    if ctp_response.status_code == 200:
        # Pretty print the JSON response
        print("Response JSON:")
        print(json.dumps(ctp_response.json(), indent=4, ensure_ascii=False))
    else:
        print("Error response from server:")
        print(ctp_response.text)

except requests.exceptions.ConnectionError as e:
    print(f"\nConnection Error: Failed to establish a connection to {ctp_url}.")
    print("Please ensure that the Flask server ('backend/app.py') is running.")

