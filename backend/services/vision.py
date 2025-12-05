import os
import google.generativeai as genai
from dotenv import load_dotenv
import requests
from PIL import Image
from io import BytesIO

load_dotenv()

def analyze_image(image_url):
    """
    Analyzes an image URL for accessibility obstacles using Google Gemini Vision.
    Returns a list of detected obstacles.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY not set. Using mock data.")
        # Fallback to mock if no key
        import random
        obstacles = []
        if random.random() < 0.3: obstacles.append("stairs")
        return obstacles

    try:
        genai.configure(api_key=api_key)
        
        # Dynamically find a working model
        working_model_name = None
        
        # 1. Try to find a model from the user's available list
        try:
            print("Listing available models to find a match...")
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    # Prefer flash or pro models
                    if 'flash' in m.name or 'pro' in m.name or 'vision' in m.name:
                        working_model_name = m.name
                        print(f"Found available model: {working_model_name}")
                        break
        except Exception as e:
            print(f"Failed to list models: {e}")

        # 2. Fallback list if listing fails or returns nothing useful
        if not working_model_name:
            candidate_models = [
                'gemini-1.5-flash',
                'gemini-1.5-pro',
                'gemini-2.0-flash-exp', 
                'gemini-pro-vision'
            ]
        else:
            candidate_models = [working_model_name]

        # Download image once
        response = requests.get(image_url)
        image = Image.open(BytesIO(response.content))

        prompt = """
        Analyze this street view image for accessibility obstacles for a wheelchair user.
        Identify if any of the following are present and clearly blocking the path:
        - stairs
        - steep_slope
        - construction
        - narrow_sidewalk
        - pole_blocking_path
        
        Return ONLY a JSON list of strings, e.g., ["stairs", "construction"]. 
        If no obstacles are found, return [].
        Do not include markdown formatting.
        """

        for model_name in candidate_models:
            try:
                print(f"Trying Gemini model: {model_name}...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([prompt, image])
                text = response.text.strip()
                
                # Clean up potential markdown code blocks
                if text.startswith("```"):
                    text = text.split("\n", 1)[1]
                    if text.endswith("```"):
                        text = text.rsplit("\n", 1)[0]
                
                import json
                obstacles = json.loads(text)
                return obstacles
            except Exception as e:
                print(f"Model {model_name} failed: {e}")
                continue
        
        print(f"All models failed.")
        return ["potential_obstacle_check_required"]

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return ["potential_obstacle_check_required"]
