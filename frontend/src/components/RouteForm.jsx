import React, { useState } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';

const RouteForm = ({ onRouteSubmit, isLoading, origin, setOrigin, destination, setDestination, profile, setProfile }) => {
    // If props are not provided (legacy usage), use internal state (not recommended but safe)
    // But since we updated Home, we assume props are passed.

    const handleSubmit = (e) => {
        e.preventDefault();
        onRouteSubmit({ origin, destination, profile });
    };

    return (
        <div className="glass-panel p-6 animate-fade-in">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Navigation className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                Plan Route
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Origin</label>
                    <div className="relative group">
                        <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            placeholder="e.g., Avenida de las Ciencias, 36, Sevilla"
                            className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white outline-none transition-all placeholder-gray-400"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Destination</label>
                    <div className="relative group">
                        <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="e.g., Universidad Loyola"
                            className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white outline-none transition-all placeholder-gray-400"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Transport Mode</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'foot', label: 'Walk', icon: '🚶' },
                            { id: 'car', label: 'Car', icon: '🚗' },
                            { id: 'bike', label: 'Bike', icon: '🚲' },
                            { id: 'wheelchair', label: 'Wheelchair', icon: '♿' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                type="button"
                                onClick={() => setProfile(mode.id)}
                                className={`py-3 px-1 rounded-xl border transition-all flex flex-col items-center gap-1 ${profile === mode.id
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 shadow-md scale-105'
                                    : 'bg-white/50 dark:bg-gray-800/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className="text-xl filter drop-shadow-sm">{mode.icon}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wide">{mode.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/30 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <>
                            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Find Perfect Route
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default RouteForm;
