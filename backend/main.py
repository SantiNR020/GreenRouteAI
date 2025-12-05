from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from services import openrouteservice, streetview, vision

load_dotenv()

app = FastAPI(title="GreenRouteAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RouteRequest(BaseModel):
    origin: str
    destination: str
    profile: str = "foot" # foot, car, bike
    block_area: Optional[str] = None # format: "lat,lng,radius" (Legacy, keep for backward compat)
    block_areas: Optional[List[str]] = None # List of "lat,lng,radius"

@app.get("/")
def read_root():
    return {"message": "Welcome to GreenRouteAI API"}

@app.post("/api/route")
def get_route(request: RouteRequest):
    print(f"DEBUG: Received profile={request.profile}") # Debug print
    try:
        # 1. Get route from OpenRouteService
        # Check if input looks like coordinates (lat,lng) or address
        def resolve_location(loc_str):
            try:
                lat, lng = map(float, loc_str.split(","))
                return lat, lng
            except ValueError:
                # Not coordinates, try geocoding
                return openrouteservice.geocode(loc_str)

        origin_lat, origin_lng = resolve_location(request.origin)
        dest_lat, dest_lng = resolve_location(request.destination)

        print(f"DEBUG: Resolved Origin: {origin_lat}, {origin_lng}")
        print(f"DEBUG: Resolved Destination: {dest_lat}, {dest_lng}")

        # Validate distance to prevent ORS 400 errors
        import math
        def haversine_distance(lat1, lon1, lat2, lon2):
            R = 6371000  # Radius of Earth in meters
            phi1, phi2 = math.radians(lat1), math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lon2 - lon1)
            a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c

        dist = haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
        print(f"DEBUG: Calculated distance: {dist} meters")
        
        if dist > 6000000: # 6000km limit
             raise HTTPException(status_code=400, detail=f"Route is too long ({int(dist/1000)}km). Maximum allowed is 6000km.")

        # Call OpenRouteService
        try:
            ors_response = openrouteservice.get_route(
                origin_lat, origin_lng, 
                dest_lat, dest_lng, 
                request.profile,
                request.block_area,
                request.block_areas
            )
        except Exception as ors_err:
             print(f"ORS Error with resolved coords: {origin_lat},{origin_lng} -> {dest_lat},{dest_lng}")
             raise HTTPException(status_code=500, detail=f"OpenRouteService failed: {str(ors_err)}")
        
        # Transform ORS GeoJSON response to match GraphHopper structure for Frontend compatibility
        feature = ors_response['features'][0]
        coordinates = feature['geometry']['coordinates']
        properties = feature['properties']
        
        # Extract instructions if available
        instructions = []
        if 'segments' in properties:
            for segment in properties['segments']:
                for step in segment.get('steps', []):
                    instructions.append({
                        "text": step.get('instruction', ''),
                        "distance": step.get('distance', 0),
                        "time": step.get('duration', 0)
                    })

        response_data = {
            "paths": [{
                "distance": properties['summary']['distance'],
                "time": properties['summary']['duration'],
                "points": {
                    "coordinates": coordinates # ORS is already [lng, lat]
                },
                "instructions": instructions
            }]
        }

        return response_data
    except Exception as e:
        print(f"ERROR in /api/route: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
def analyze_route(lat: float, lng: float):
    try:
        url = streetview.get_street_view_url(lat, lng)
        if url is None:
             return {
                 "image_url": None, 
                 "obstacles": ["Obstáculo encontrado pero no imagen disponible para el usuario"]
             }
             
        obstacles = vision.analyze_image(url)
        return {"image_url": url, "obstacles": obstacles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/route/gpx")
def get_route_gpx(request: RouteRequest):
    try:
        # Resolve locations (reuse logic or refactor, duplicating for now for speed)
        # Resolve locations
        def resolve_location(loc_str):
            try:
                lat, lng = map(float, loc_str.split(","))
                return lat, lng
            except ValueError:
                return openrouteservice.geocode(loc_str)

        origin_lat, origin_lng = resolve_location(request.origin)
        dest_lat, dest_lng = resolve_location(request.destination)

        gpx_content = openrouteservice.get_route_gpx(origin_lat, origin_lng, dest_lat, dest_lng, request.profile)
        
        # Return as a file response
        from fastapi.responses import Response
        return Response(content=gpx_content, media_type="application/gpx+xml", headers={"Content-Disposition": "attachment; filename=route.gpx"})
    except Exception as e:
        print(f"ERROR in /api/route/gpx: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel




