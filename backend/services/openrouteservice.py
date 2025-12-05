import requests
import os
import json

ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions"

def get_route(origin_lat, origin_lng, dest_lat, dest_lng, profile="foot-walking", block_area=None, block_areas=None):
    """
    Calculates a route using OpenRouteService.
    
    Args:
        profile: 'foot-walking', 'driving-car', 'cycling-regular', 'wheelchair'
        block_area: String "lat,lng,radius" (Single area)
        block_areas: List of Strings ["lat,lng,radius"] (Multiple areas)
    """
    ORS_API_KEY = os.getenv("ORS_API_KEY")
    if not ORS_API_KEY:
        raise ValueError("ORS_API_KEY is not set")

    # Map simple profiles to ORS profiles
    profile_map = {
        "foot": "foot-walking",
        "car": "driving-car",
        "bike": "cycling-regular",
        "wheelchair": "wheelchair"
    }
    ors_profile = profile_map.get(profile, profile)

    headers = {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json; charset=utf-8'
    }

    body = {
        "coordinates": [
            [origin_lng, origin_lat],
            [dest_lng, dest_lat]
        ],
        "elevation": "true",
        "instructions": "true",
        "preference": "recommended"
    }

    # Handle Avoidance (Block Area)
    polygons = []
    
    # Helper to create polygon from lat,lng,radius
    def create_polygon(area_str):
        try:
            lat, lng, radius = map(float, area_str.split(','))
            offset = radius / 111320.0 # Rough approximation
            p1 = [lng - offset, lat - offset]
            p2 = [lng + offset, lat - offset]
            p3 = [lng + offset, lat + offset]
            p4 = [lng - offset, lat + offset]
            p5 = [lng - offset, lat - offset] # Close the loop
            return [p1, p2, p3, p4, p5]
        except Exception as e:
            print(f"Error parsing block_area {area_str}: {e}")
            return None

    if block_area:
        poly = create_polygon(block_area)
        if poly: polygons.append(poly)
        
    if block_areas:
        for area in block_areas:
            poly = create_polygon(area)
            if poly: polygons.append(poly)

    if polygons:
        if len(polygons) == 1:
             body["options"] = {
                "avoid_polygons": {
                    "type": "Polygon",
                    "coordinates": polygons
                }
            }
        else:
             body["options"] = {
                "avoid_polygons": {
                    "type": "MultiPolygon",
                    "coordinates": [ [p] for p in polygons ] # MultiPolygon format: [[[[x,y]...]]]
                }
            }

    url = f"{ORS_BASE_URL}/{ors_profile}/geojson"
    
    print(f"Calling ORS: {url}")
    response = requests.post(url, json=body, headers=headers)

    if response.status_code != 200:
        raise Exception(f"OpenRouteService Error ({response.status_code}): {response.text}")

    return response.json()

def geocode(address):
    """
    Geocodes an address using OpenRouteService Geocoding API.
    """
    ORS_API_KEY = os.getenv("ORS_API_KEY")
    if not ORS_API_KEY:
        raise ValueError("ORS_API_KEY is not set")

    url = "https://api.openrouteservice.org/geocode/search"
    params = {
        "api_key": ORS_API_KEY,
        "text": address,
        "size": 1
    }
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise Exception(f"ORS Geocoding Error: {response.text}")
        
    data = response.json()
    if not data['features']:
        raise Exception("Address not found")
        
    # ORS returns [lng, lat]
    lng, lat = data['features'][0]['geometry']['coordinates']
    return lat, lng

def get_route_gpx(origin_lat, origin_lng, dest_lat, dest_lng, profile="foot-walking"):
    """
    Fetches route from ORS and converts it to GPX format.
    """
    # Reuse get_route to get the geometry
    route_json = get_route(origin_lat, origin_lng, dest_lat, dest_lng, profile)
    
    try:
        coordinates = route_json['features'][0]['geometry']['coordinates']
        
        # Build simple GPX XML
        gpx = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n'
        gpx += '<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="GreenRouteAI">\n'
        gpx += '  <trk>\n'
        gpx += '    <name>GreenRouteAI Path</name>\n'
        gpx += '    <trkseg>\n'
        
        for lng, lat in coordinates:
            # ORS returns [lng, lat, elevation(optional)]
            # We handle 2D or 3D coordinates
            gpx += f'      <trkpt lat="{lat}" lon="{lng}"></trkpt>\n'
            
        gpx += '    </trkseg>\n'
        gpx += '  </trk>\n'
        gpx += '</gpx>'
        
        return gpx.encode('utf-8')
    except Exception as e:
        raise Exception(f"Failed to generate GPX: {str(e)}")
