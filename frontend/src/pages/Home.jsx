import React, { useState } from 'react';
import axios from 'axios';
import MapComponent from '../components/MapComponent';
import RouteForm from '../components/RouteForm';
import Toast from '../components/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Home = () => {
    const [routeData, setRouteData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [obstacles, setObstacles] = useState([]);
    const [blockedAreas, setBlockedAreas] = useState([]); // Store accumulated blocked areas
    const [error, setError] = useState(null);

    // Toast State
    const [toast, setToast] = useState(null);

    // Lifted state
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [profile, setProfile] = useState('foot');

    const showToast = (message, type = 'info') => {
        setToast({ message, type, id: Date.now() });
    };

    const closeToast = () => setToast(null);

    const handleRouteSubmit = async (formData) => {
        setOrigin(formData.origin);
        setDestination(formData.destination);
        setProfile(formData.profile);

        setIsLoading(true);
        setError(null);
        setObstacles([]);
        setBlockedAreas([]);
        try {
            const response = await axios.post(`${API_URL}/api/route`, {
                origin: formData.origin,
                destination: formData.destination,
                profile: formData.profile
            });
            setRouteData(response.data);
            saveToHistory(formData);
        } catch (err) {
            console.error("Error fetching route:", err);
            const msg = err.response?.data?.detail || "Failed to calculate route. Please check coordinates and try again.";
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const performAnalysis = async (currentRouteData) => {
        if (!currentRouteData || !currentRouteData.paths) return [];

        const path = currentRouteData.paths[0];
        const coordinates = path.points.coordinates;

        // Dynamic sampling: ~15-20 points max
        const targetSamples = 15;
        const totalPoints = coordinates.length;
        const step = Math.max(15, Math.floor(totalPoints / targetSamples));

        const samplePoints = coordinates.filter((_, index) => index % step === 0);

        console.log(`Analyzing ${samplePoints.length} points (Total: ${totalPoints}, Step: ${step})`);

        const promises = samplePoints.map(async (coord) => {
            const lat = coord[1];
            const lng = coord[0];
            try {
                const res = await axios.post(`${API_URL}/api/analyze?lat=${lat}&lng=${lng}`);
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
        return results.filter(r => r !== null);
    };

    const analyzeRoute = async () => {
        setIsAnalyzing(true);
        try {
            const validObstacles = await performAnalysis(routeData);
            setObstacles(validObstacles);

            if (validObstacles.length === 0) {
                showToast("Great news! No obstacles detected on this route.", "success");
            } else {
                showToast(`Found ${validObstacles.length} potential obstacles.`, "warning");
            }
        } catch (err) {
            console.error("Analysis error:", err);
            showToast("Failed to complete analysis.", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFindAlternative = async (obstacle) => {
        if (!origin || !destination) return;

        // REDUCED RADIUS: 50m -> 15m to avoid blocking the user's start point
        const newBlockArea = `${obstacle.lat},${obstacle.lng},15`;
        const updatedBlockedAreas = [...blockedAreas, newBlockArea];

        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/route`, {
                origin,
                destination,
                profile,
                block_areas: updatedBlockedAreas
            });
            setRouteData(response.data);
            setObstacles([]);
            setBlockedAreas(updatedBlockedAreas);
            showToast("Route recalculated avoiding the obstacle.", "success");
        } catch (err) {
            console.error("Error calculating alternative:", err);
            showToast("Could not find an alternative route.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvoidAll = async () => {
        if (!origin || !destination || obstacles.length === 0) return;

        // REDUCED RADIUS: 50m -> 15m
        const newBlockAreas = obstacles.map(obs => `${obs.lat},${obs.lng},15`);
        const updatedBlockedAreas = [...blockedAreas, ...newBlockAreas];

        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/route`, {
                origin,
                destination,
                profile,
                block_areas: updatedBlockedAreas
            });
            setRouteData(response.data);
            setObstacles([]);
            setBlockedAreas(updatedBlockedAreas);
            showToast(`Route recalculated avoiding all obstacles (Total avoided: ${updatedBlockedAreas.length}).`, "success");
        } catch (err) {
            console.error("Error calculating alternative:", err);
            showToast("Could not find an alternative route avoiding all obstacles.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoFix = async () => {
        if (!origin || !destination) return;

        setIsLoading(true);
        setIsAnalyzing(true);
        showToast("Starting Auto-Fix process...", "info");

        // Initialize "Best" tracking
        let currentBlockedAreas = [...blockedAreas];
        let currentRoute = routeData;

        let bestRoute = routeData;
        let bestObstacles = obstacles;
        let bestBlockedAreas = [...blockedAreas];
        let minObstacleCount = obstacles.length;

        // Initial blocks (Reduxing radius to 15m)
        if (obstacles.length > 0) {
            const newBlockAreas = obstacles.map(obs => `${obs.lat},${obs.lng},15`);
            currentBlockedAreas = [...currentBlockedAreas, ...newBlockAreas];
        }

        let attempts = 0;
        const maxAttempts = 5;
        let success = false;

        try {
            while (attempts < maxAttempts) {
                attempts++;

                if (attempts > 1) {
                    if (attempts === 3) showToast("Still searching... checking adjacent streets.", "info");
                }

                // 1. Get New Route
                try {
                    const response = await axios.post(`${API_URL}/api/route`, {
                        origin,
                        destination,
                        profile,
                        block_areas: currentBlockedAreas
                    });
                    currentRoute = response.data;
                    setRouteData(currentRoute);
                    setBlockedAreas(currentBlockedAreas);
                } catch (routeErr) {
                    console.warn("Auto-fix route fetch failed:", routeErr);
                    break;
                }

                // 2. Analyze New Route
                const foundObstacles = await performAnalysis(currentRoute);
                setObstacles(foundObstacles);

                // 3. Keep Best
                if (foundObstacles.length < minObstacleCount) {
                    minObstacleCount = foundObstacles.length;
                    bestRoute = currentRoute;
                    bestObstacles = foundObstacles;
                    bestBlockedAreas = [...currentBlockedAreas];
                }

                if (foundObstacles.length === 0) {
                    success = true;
                    bestRoute = currentRoute;
                    bestObstacles = [];
                    bestBlockedAreas = [...currentBlockedAreas];
                    break;
                }

                // 4. Prepare next blocks (15m radius)
                const newBlockAreas = foundObstacles.map(obs => `${obs.lat},${obs.lng},15`);
                currentBlockedAreas = [...currentBlockedAreas, ...newBlockAreas];
            }

            if (success) {
                showToast(`Success! Found a clean route after ${attempts} attempts.`, "success");
            } else {
                setRouteData(bestRoute);
                setObstacles(bestObstacles);
                setBlockedAreas(bestBlockedAreas);

                if (minObstacleCount < obstacles.length) {
                    showToast(`Could not find perfect path, reverted to best option with ${minObstacleCount} obstacles.`, "warning");
                } else {
                    showToast(`Could not find a better route after ${maxAttempts} attempts.`, "error");
                }
            }

        } catch (err) {
            console.error("Auto-fix error:", err);
            showToast("An error occurred during auto-fix.", "error");
            setRouteData(bestRoute);
            setObstacles(bestObstacles);
        } finally {
            setIsLoading(false);
            setIsAnalyzing(false);
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
                    }, ...(p.history || [])].slice(0, 10);
                    return { ...p, history: newHistory };
                }
                return p;
            });
            localStorage.setItem('greenroute_profiles', JSON.stringify(updatedProfiles));
        }
    };

    const handleExportGPX = async () => {
        if (!routeData || !origin || !destination || !profile) {
            showToast("Please calculate a route first.", "warning");
            return;
        }
        try {
            const response = await axios.post(`${API_URL}/api/route/gpx`, {
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
            showToast("GPX exported successfully!", "success");
        } catch (err) {
            console.error("Error exporting GPX:", err);
            showToast("Failed to export GPX.", "error");
        }
    };

    const handleSaveFavorite = () => {
        if (!routeData || !origin || !destination || !profile) {
            showToast("Please calculate a route first.", "warning");
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
            showToast("Route saved to Favorites!", "success");
        } else {
            showToast("Please create a profile first in the Profile page.", "warning");
        }
    };

    const openGoogleMaps = () => {
        if (!origin || !destination) return;
        let mode = 'walking';
        if (profile === 'car') mode = 'driving';
        if (profile === 'bike') mode = 'bicycling';

        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
        window.open(url, '_blank');
    };

    return (
        <div className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            <div className="mb-12 text-center animate-fade-in">
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                    Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400">Perfect Path</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-light">
                    Accessible, multimodal, and intelligent route planning tailored to your needs.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
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
                        <div className="animate-fade-in p-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300 rounded-r-xl shadow-sm">
                            <p>{error}</p>
                        </div>
                    )}

                    {routeData && routeData.paths && routeData.paths[0].instructions && (
                        <div className="glass-panel p-6 max-h-96 overflow-y-auto animate-fade-in animate-delay-100">
                            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 z-10">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Turn-by-Turn</h3>
                                <div className="flex gap-2">
                                    <button onClick={openGoogleMaps} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors" title="Open in Google Maps">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                    </button>
                                    <button onClick={handleSaveFavorite} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-yellow-500 hover:text-yellow-600 transition-colors" title="Save to Favorites">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    </button>
                                    <button onClick={handleExportGPX} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500 hover:text-blue-600 transition-colors" title="Export GPX">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    </button>
                                </div>
                            </div>
                            <ul className="space-y-4">
                                {routeData.paths[0].instructions.map((step, index) => (
                                    <li key={index} className="flex items-start gap-4 text-gray-600 dark:text-gray-300 group">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold mt-0.5 group-hover:bg-green-200 transition-colors">{index + 1}</span>
                                        <div>
                                            <p className="text-sm font-medium leading-relaxed">{step.text}</p>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{(step.distance).toFixed(0)}m</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {routeData && (
                        <div className="glass-panel p-6 animate-fade-in animate-delay-200">
                            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                AI Analysis
                            </h3>

                            {!isAnalyzing && obstacles.length === 0 && (
                                <button
                                    onClick={analyzeRoute}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    Analyze Route for Obstacles
                                </button>
                            )}

                            {isAnalyzing && (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
                                    <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">Scanning street view images...</p>
                                </div>
                            )}

                            {obstacles.length > 0 && (
                                <div className="space-y-4 mt-4">
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 flex justify-between items-center flex-wrap gap-3">
                                        <span className="font-bold flex items-center gap-2">
                                            ⚠️ Found {obstacles.length} obstacles
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAvoidAll}
                                                className="text-xs bg-white hover:bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm transition-colors font-semibold"
                                            >
                                                Avoid All
                                            </button>
                                            <button
                                                onClick={handleAutoFix}
                                                className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 font-bold flex items-center gap-1"
                                                title="Automatically find a completely clean route"
                                            >
                                                Auto-Fix ✨
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                        {obstacles.map((obs, idx) => (
                                            <div key={idx} className="bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl p-3 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                <p className="font-bold text-gray-800 dark:text-gray-200 capitalize mb-2">{obs.types.join(", ")}</p>
                                                <div className="flex gap-2 justify-between items-center">
                                                    <a href={obs.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                                        View Image ↗
                                                    </a>
                                                    <button
                                                        onClick={() => handleFindAlternative(obs)}
                                                        className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 font-medium transition-colors"
                                                    >
                                                        Reroute
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 animate-fade-in animate-delay-300">
                    <div className="glass-panel p-2 h-full min-h-[500px] shadow-2xl">
                        <MapComponent routeData={routeData} obstacles={obstacles} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
