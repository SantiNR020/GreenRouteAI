import React, { useState } from 'react';
import axios from 'axios';
import MapComponent from '../components/MapComponent';
import RouteForm from '../components/RouteForm';

const Home = () => {
    const [routeData, setRouteData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [obstacles, setObstacles] = useState([]);
    const [error, setError] = useState(null);

    // Lifted state
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [profile, setProfile] = useState('foot');

    const handleRouteSubmit = async (formData) => {
        // Update state with form data (though they should be synced via props)
        setOrigin(formData.origin);
        setDestination(formData.destination);
        setProfile(formData.profile);

        setIsLoading(true);
        setError(null);
        setObstacles([]); // Reset obstacles on new search
        try {
            // Use full URL for now, assuming backend is on port 8000
            const response = await axios.post('http://localhost:8000/api/route', {
                origin: formData.origin,
                destination: formData.destination,
                profile: formData.profile
            });
            setRouteData(response.data);

            // Save to History (New Profile Structure)
            saveToHistory(formData);
        } catch (err) {
            console.error("Error fetching route:", err);
            const msg = err.response?.data?.detail || "Failed to calculate route. Please check coordinates and try again.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const analyzeRoute = async () => {
        if (!routeData || !routeData.paths) return;

        setIsAnalyzing(true);
        const path = routeData.paths[0];
        const coordinates = path.points.coordinates; // [lng, lat]

        // Sample points: Check every 20th point (approx every 100-200m depending on density)
        // to avoid hitting API limits and long wait times.
        const samplePoints = coordinates.filter((_, index) => index % 20 === 0);

        const foundObstacles = [];

        try {
            // Process in parallel (limit concurrency if needed, but for now simple Promise.all)
            // Note: Real world would need queueing to avoid rate limits.
            const promises = samplePoints.map(async (coord) => {
                const lat = coord[1];
                const lng = coord[0];
                try {
                    const res = await axios.post(`http://localhost:8000/api/analyze?lat=${lat}&lng=${lng}`);
                    if (res.data.obstacles && res.data.obstacles.length > 0) {
                        return {
                            lat,
                            lng,
                            types: res.data.obstacles,
                            imageUrl: res.data.image_url
                        };
                    }
                } catch (e) {
                    console.warn("Analysis failed for point", lat, lng);
                }
                return null;
            });

            const results = await Promise.all(promises);
            const validObstacles = results.filter(r => r !== null);
            setObstacles(validObstacles);

            if (validObstacles.length === 0) {
                alert("Great news! No obstacles detected on this route.");
            } else {
                alert(`Found ${validObstacles.length} potential obstacles.`);
            }

        } catch (err) {
            console.error("Analysis error:", err);
            alert("Failed to complete analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFindAlternative = async (obstacle) => {
        if (!origin || !destination) return;

        const blockArea = `${obstacle.lat},${obstacle.lng},50`; // 50m radius
        setIsLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/api/route', {
                origin,
                destination,
                profile,
                block_area: blockArea
            });
            setRouteData(response.data);
            setObstacles([]); // Clear obstacles as we have a new route (should re-analyze if needed)
            alert("Route recalculated avoiding the obstacle.");
        } catch (err) {
            console.error("Error calculating alternative:", err);
            alert("Could not find an alternative route.");
        } finally {
            setIsLoading(false);
        }
    };

    const saveToHistory = (data) => {
        const savedProfiles = JSON.parse(localStorage.getItem('greenroute_profiles') || '[]');
        const currentId = localStorage.getItem('greenroute_current_profile_id');

        if (savedProfiles.length > 0 && currentId) {
            const updatedProfiles = savedProfiles.map(p => {
                if (p.id === Number(currentId)) {
                    const newHistory = [{
                        origin: data.origin,
                        destination: data.destination,
                        date: new Date().toISOString()
                    }, ...(p.history || [])].slice(0, 10); // Keep last 10
                    return { ...p, history: newHistory };
                }
                return p;
            });
            localStorage.setItem('greenroute_profiles', JSON.stringify(updatedProfiles));
        }
    };

    const handleExportGPX = async () => {
        if (!routeData || !origin || !destination || !profile) {
            alert("Please calculate a route first.");
            return;
        }
        try {
            const response = await axios.post('http://localhost:8000/api/route/gpx', {
                origin,
                destination,
                profile
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'route.gpx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error exporting GPX:", err);
            alert("Failed to export GPX.");
        }
    };

    const handleSaveFavorite = () => {
        if (!routeData || !origin || !destination || !profile) {
            alert("Please calculate a route first.");
            return;
        }
        const newFavorite = {
            id: Date.now(),
            name: `${origin} to ${destination}`,
            origin,
            destination,
            profile
        };

        const savedProfiles = JSON.parse(localStorage.getItem('greenroute_profiles') || '[]');
        const currentId = localStorage.getItem('greenroute_current_profile_id');

        if (savedProfiles.length > 0 && currentId) {
            const updatedProfiles = savedProfiles.map(p => {
                if (p.id === Number(currentId)) {
                    return { ...p, favorites: [...(p.favorites || []), newFavorite] };
                }
                return p;
            });
            localStorage.setItem('greenroute_profiles', JSON.stringify(updatedProfiles));
            alert("Route saved to Favorites!");
        } else {
            alert("Please create a profile first in the Profile page.");
        }
    };

    const openGoogleMaps = () => {
        if (!origin || !destination) return;
        // Simple heuristic for travel mode
        let mode = 'walking';
        if (profile === 'car') mode = 'driving';
        if (profile === 'bike') mode = 'bicycling';

        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
        window.open(url, '_blank');
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                    Find Your <span className="text-green-600 dark:text-green-400">Perfect Path</span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Accessible, multimodal, and intelligent route planning tailored to your needs.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <RouteForm
                        onRouteSubmit={handleRouteSubmit}
                        isLoading={isLoading}
                        origin={origin}
                        setOrigin={setOrigin}
                        destination={destination}
                        setDestination={setDestination}
                        profile={profile}
                        setProfile={setProfile}
                    />
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300 rounded shadow-sm">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Route Instructions */}
                    {routeData && routeData.paths && routeData.paths[0].instructions && (
                        <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Turn-by-Turn Instructions</h3>
                                <div className="flex gap-2">
                                    <button onClick={openGoogleMaps} className="text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400" title="Open in Google Maps">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                    </button>
                                    <button onClick={handleSaveFavorite} className="text-yellow-500 hover:text-yellow-600" title="Save to Favorites">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    </button>
                                    <button onClick={handleExportGPX} className="text-blue-500 hover:text-blue-600" title="Export GPX">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    </button>
                                </div>
                            </div>
                            <ul className="space-y-3">
                                {routeData.paths[0].instructions.map((step, index) => (
                                    <li key={index} className="flex items-start gap-3 text-gray-600 dark:text-gray-300 border-b border-gray-50 dark:border-gray-700 pb-2 last:border-0">
                                        <span className="font-bold text-green-600 dark:text-green-400 min-w-[24px]">{index + 1}.</span>
                                        <div>
                                            <p>{step.text}</p>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">{(step.distance).toFixed(0)}m</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* AI Analysis Section */}
                    {routeData && (
                        <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                AI Accessibility Analysis
                            </h3>

                            {!isAnalyzing && obstacles.length === 0 && (
                                <button
                                    onClick={analyzeRoute}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                                >
                                    Analyze Route for Obstacles
                                </button>
                            )}

                            {isAnalyzing && (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-2"></div>
                                    <p className="text-gray-600 dark:text-gray-300">Analyzing street view images...</p>
                                </div>
                            )}

                            {obstacles.length > 0 && (
                                <div className="space-y-4 mt-4">
                                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                                        ⚠️ Found {obstacles.length} potential obstacles.
                                    </div>
                                    {obstacles.map((obs, idx) => (
                                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize mb-1">{obs.types.join(", ")}</p>
                                            <div className="flex gap-2 mt-2">
                                                <a href={obs.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline dark:text-blue-400">View Image</a>
                                                <button
                                                    onClick={() => handleFindAlternative(obs)}
                                                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                                                >
                                                    Avoid & Reroute
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2">
                    <MapComponent routeData={routeData} obstacles={obstacles} />
                </div>
            </div>
        </div>
    );
};

export default Home;
