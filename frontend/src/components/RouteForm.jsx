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
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700 ring-1 ring-gray-100 dark:ring-gray-700">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-green-600 dark:text-green-400" />
                Plan Route
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Origin</label>
                    <div className="relative group">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            placeholder="e.g., Avenida de las Ciencias, 36, Sevilla"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Destination</label>
                    <div className="relative group">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="e.g., Universidad Loyola"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Transport Mode</label>
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
                                className={`py-2 px-1 rounded-xl border transition-all flex flex-col items-center gap-1 ${profile === mode.id
                                    ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400 shadow-sm scale-105'
                                    : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-xl">{mode.icon}</span>
                                <span className="text-[10px] font-bold uppercase">{mode.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? 'Calculating...' : (
                        <>
                            <Search className="w-5 h-5" />
                            Find Route
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default RouteForm;
