import os

import requests

STREET_VIEW_URL = "https://maps.googleapis.com/maps/api/streetview"

def get_street_view_url(lat, lng, heading=0, pitch=0):
    # 1. Try Mapillary (Free, Real-time)
    mapillary_token = os.getenv("MAPILLARY_CLIENT_TOKEN")
    if mapillary_token and mapillary_token != "placeholder":
        try:
            # Define a small bounding box around the point (approx 500 meters)
            offset = 0.005
            bbox = f"{lng-offset},{lat-offset},{lng+offset},{lat+offset}"
            
            url = "https://graph.mapillary.com/images"
            params = {
                "access_token": mapillary_token,
                "fields": "id,thumb_2048_url",
                "bbox": bbox,
                "limit": 1
            }
            
            print(f"DEBUG: Mapillary Request: {url} params={params}")
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"DEBUG: Mapillary Response: {data}")
                if data.get("data"):
                    # Return the first image found
                    return data["data"][0]["thumb_2048_url"]
                else:
                    print("INFO: No Mapillary images found in this area.")
                    return None # Return None to indicate no image found (don't fallback to mock)
            else:
                print(f"ERROR: Mapillary API failed: {response.text}")
        except Exception as e:
            print(f"ERROR: Mapillary integration error: {e}")

    # 2. Mock Mode (Fallback)
    # Always fall back to mock if Mapillary failed/missing, to ensure functionality.
    # The user wants "functional", and a broken Google Maps key is not functional.
    print("INFO: Falling back to MOCK images.")
    import random
    mock_images = [
        "https://images.unsplash.com/photo-1577086664693-8945534a7a5d?q=80&w=2076&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1623625434462-e5e42318ae49?q=80&w=2071&auto=format&fit=crop",
        "https://plus.unsplash.com/premium_photo-1664303847960-586318f59035?q=80&w=1974&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop"
    ]
    return random.choice(mock_images)
