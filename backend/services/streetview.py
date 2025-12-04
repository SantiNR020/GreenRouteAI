import os

STREET_VIEW_URL = "https://maps.googleapis.com/maps/api/streetview"

def get_street_view_url(lat, lng, heading=0, pitch=0):
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
    if not GOOGLE_MAPS_API_KEY:
        raise ValueError("GOOGLE_MAPS_API_KEY is not set")

    params = f"?size=600x400&location={lat},{lng}&heading={heading}&pitch={pitch}&key={GOOGLE_MAPS_API_KEY}"
    return STREET_VIEW_URL + params
