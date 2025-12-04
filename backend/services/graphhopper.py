import requests
import os

GRAPHHOPPER_URL = "https://graphhopper.com/api/1/route"

def get_route(origin_lat, origin_lng, dest_lat, dest_lng, profile="foot", block_area=None):
    GRAPHHOPPER_API_KEY = os.getenv("GRAPHHOPPER_API_KEY")
    if not GRAPHHOPPER_API_KEY:
        raise ValueError("GRAPHHOPPER_API_KEY is not set")

    params = {
        "point": [f"{origin_lat},{origin_lng}", f"{dest_lat},{dest_lng}"],
        "vehicle": profile,
        "locale": "en",
        "key": GRAPHHOPPER_API_KEY,
        "points_encoded": False, # Get actual coordinates
        "elevation": True
    }

    if block_area:
        # block_area format for GraphHopper: "lat,lng,radius" (radius in meters, optional but not standard param)
        # Actually GraphHopper uses 'ch.disable=true' and 'block_area=lat,lon,radius'
        # Or 'avoid=...' depending on the API version. 
        # For standard Routing API, 'ch.disable=true' is often needed for 'block_area'.
        params["ch.disable"] = "true"
        params["block_area"] = block_area

    response = requests.get(GRAPHHOPPER_URL, params=params)
    
    if response.status_code != 200:
        raise Exception(f"GraphHopper API Error: {response.text}")

    return response.json()

def geocode(query):
    GRAPHHOPPER_API_KEY = os.getenv("GRAPHHOPPER_API_KEY")
    if not GRAPHHOPPER_API_KEY:
        raise ValueError("GRAPHHOPPER_API_KEY is not set")
        
    url = "https://graphhopper.com/api/1/geocode"
    params = {
        "q": query,
        "locale": "en",
        "limit": 1,
        "key": GRAPHHOPPER_API_KEY
    }
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise Exception(f"Geocoding Error: {response.text}")
        
    data = response.json()
    if not data.get("hits"):
        raise ValueError(f"No results found for address: {query}")
        
    point = data["hits"][0]["point"]
    return point["lat"], point["lng"]

def get_route_gpx(origin_lat, origin_lng, dest_lat, dest_lng, profile="foot"):
    GRAPHHOPPER_API_KEY = os.getenv("GRAPHHOPPER_API_KEY")
    if not GRAPHHOPPER_API_KEY:
        raise ValueError("GRAPHHOPPER_API_KEY is not set")

    params = {
        "point": [f"{origin_lat},{origin_lng}", f"{dest_lat},{dest_lng}"],
        "vehicle": profile,
        "locale": "en",
        "key": GRAPHHOPPER_API_KEY,
        "type": "gpx",
        "elevation": True
    }

    response = requests.get(GRAPHHOPPER_URL, params=params)
    
    if response.status_code != 200:
        raise Exception(f"GraphHopper API Error: {response.text}")

    return response.content # Return raw XML bytes


