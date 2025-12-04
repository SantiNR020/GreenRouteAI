# GreenRouteAI

GreenRouteAI is a multimodal route planner web application focused on accessibility for elderly and disabled users.

## Features
- **Route Planning**: Generate routes for walking, driving, biking, or wheelchair.
- **Accessibility Analysis**: Analyzes route segments for obstacles using AI (Mocked for prototype).
- **User Profile**: Save preferences and favorite routes.
- **Interactive Map**: Visualize routes on an interactive map.

## Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- API Keys for GraphHopper, OpenRouteService,Google Maps and Gemini.

## Setup

### Backend
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate virtual environment:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn requests python-dotenv google-generativeai Pillow
   ```
4. Configure `.env`:
   - Copy `.env.example` (or create one) and add your keys.
   ```env
   ORS_API_KEY=your_key
   GOOGLE_MAPS_API_KEY=your_key
   GEMINI_API_KEY=your_key
      ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   Server runs at `http://localhost:8000`.

### Frontend
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`.

## Usage
1. Open the frontend URL.
2. Enter coordinates or addresses for Origin and Destination.
3. Select a mode (e.g., "Wheelchair").
4. Click "Find Route".
5. View the route on the map.
6. **AI Analysis**: Click "Analyze Route for Obstacles" to scan the path for accessibility issues using Google Gemini.
7. **Review Obstacles**: If obstacles are found, they will be listed with images. Click "View Image" to verify.
8. **Avoid & Reroute**: Click "Avoid & Reroute" on an obstacle to calculate a new path avoiding that specific area.
9. **Additional Features**:
   - **Google Maps**: Open the route in Google Maps for navigation.
   - **Favorites**: Save the route to your profile (requires login).
   - **Export GPX**: Download the route as a GPX file for use in other devices.
