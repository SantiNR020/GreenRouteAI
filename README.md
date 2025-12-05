# GreenRouteAI

GreenRouteAI is an intelligent, multimodal route planner designed to make city navigation accessible for everyone. It leverages AI to analyze street-level imagery in real-time, detecting obstacles like stairs, construction, or narrow paths, and automatically finding cleaner alternatives.

## Key Features

### Intelligent Routing
- **Multimodal Support**: Optimized routes for **Walking**, **Driving**, **Biking**, and **Wheelchair**.
- **Turn-by-Turn Navigation**: Clear instructions with distance markers.
- **Interactive Map**: Visualize your path with dynamic markers and route lines.

### AI-Powered Accessibility (The "Magic")
- **Real-Time Analysis**: Uses **Google Gemini Vision AI** to analyze street view images from **Mapillary**.
- **Obstacle Detection**: Identifies barriers like stairs, construction zones, poor paving, and more.
- **Smart Avoidance**:
    - **Avoid & Reroute**: Click any detected obstacle to find an immediate alternative.
    - **Avoid All**: One-click to recalculate avoiding *every* currently detected obstacle.
    - **Auto-Fix**: Recursively analyzes and reroutes until a completely obstacle-free path is found. Now includes **Best Route Fallback**: if a perfect route isn't possible, it intelligently reverts to the path with the fewest obstacles.

### Premium Experience
- **Glassmorphism UI**: A modern, sleek interface with frosted glass panels and rich gradients.
- **Smooth Animations**: Engaging transitions and hover effects.
- **Toast Notifications**: Elegant, non-intrusive alerts for system status.
- **Dark Mode**: Fully supported system-aware dark theme.

## Prerequisites

- **Node.js** (v18+)
- **Python** (v3.10+)
- **API Keys**:
    - **OpenRouteService (ORS)**: For routing data.
    - **Mapillary**: For free street-level imagery.
    - **Google Gemini**: For AI image analysis.

## Setup Guide

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn requests python-dotenv google-generativeai Pillow
   ```
4. Configure Environment Variables:
   Create a `.env` file in `backend/` and add your keys:
   ```env
   ORS_API_KEY=your_ors_key_here
   MAPILLARY_CLIENT_TOKEN=your_mapillary_token_here
   GEMINI_API_KEY=your_gemini_key_here
   ```
5. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
   *Server running at `http://localhost:8000`*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Questions (Optional):
   Create a `.env` file in `frontend/` if you need to point to a different backend (e.g., Docker or production URL):
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *App running at `http://localhost:5173`*

## How to Use

1. **Plan a Route**: Enter your Origin and Destination (e.g., specific addresses in your city).
2. **Choose Mode**: Select your transport mode (Walking, Wheelchair, etc.).
3. **Analyze**: Click **"Analyze Route for Obstacles"**. The AI will scan sample points along your path.
4. **Review & Fix**:
    - If obstacles are found, you'll see them listed with images.
    - Click **"Auto-Fix"** to let the AI automatically find a clean path for you.
5. **Navigate**: Use the turn-by-turn instructions or open the route in Google Maps.
6. **Save**: Save your favorite routes to your profile (stored locally).

## License
MIT License - Free to use and modify.
