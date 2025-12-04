import os
from dotenv import load_dotenv
import requests

load_dotenv()

ORS_API_KEY = os.getenv("ORS_API_KEY")
if not ORS_API_KEY:
    print("ORS_API_KEY not set")
    exit(1)

url = "https://api.openrouteservice.org/geocode/search"
params = {
    "api_key": ORS_API_KEY,
    "text": "Universidad Loyola Sevilla",
    "size": 1
}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json()
    if data['features']:
        lng, lat = data['features'][0]['geometry']['coordinates']
        print(f"Coordinates: {lat}, {lng}")
    else:
        print("Address not found")
else:
    print(f"Error: {response.text}")
