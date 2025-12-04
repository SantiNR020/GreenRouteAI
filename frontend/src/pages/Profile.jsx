import React, { useState, useEffect } from 'react';
import { User, Star, MapPin, Trash2, History, Plus, Users } from 'lucide-react';

const Profile = () => {
    const [profiles, setProfiles] = useState([]);
    const [currentProfileId, setCurrentProfileId] = useState(null);
    const [user, setUser] = useState({
        name: 'Guest User',
        email: 'guest@example.com',
        mobilityNeeds: 'None'
    });

    const [favorites, setFavorites] = useState([]);
    const [history, setHistory] = useState([]);

    // Load data on mount
    useEffect(() => {
        const savedProfiles = JSON.parse(localStorage.getItem('greenroute_profiles') || '[]');
        const savedCurrentId = localStorage.getItem('greenroute_current_profile_id');

        if (savedProfiles.length > 0) {
            setProfiles(savedProfiles);
            const activeProfile = savedProfiles.find(p => p.id === Number(savedCurrentId)) || savedProfiles[0];
            loadProfileData(activeProfile);
        } else {
            // Init default profile
            const defaultProfile = {
                id: Date.now(),
                name: 'Guest User',
                email: 'guest@example.com',
                mobilityNeeds: 'None',
                favorites: [],
                history: []
            };
            setProfiles([defaultProfile]);
            loadProfileData(defaultProfile);
        }
    }, []);

    const loadProfileData = (profile) => {
        setCurrentProfileId(profile.id);
        setUser({
            name: profile.name,
            email: profile.email,
            mobilityNeeds: profile.mobilityNeeds
        });
        setFavorites(profile.favorites || []);
        setHistory(profile.history || []);
        localStorage.setItem('greenroute_current_profile_id', profile.id);
    };

    const saveCurrentProfile = (updatedData = {}) => {
        const updatedProfiles = profiles.map(p => {
            if (p.id === currentProfileId) {
                return { ...p, ...updatedData };
            }
            return p;
        });
        setProfiles(updatedProfiles);
        localStorage.setItem('greenroute_profiles', JSON.stringify(updatedProfiles));
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        saveCurrentProfile({ ...user });
        alert('Profile saved!');
    };

    const handleDeleteFavorite = (favId) => {
        const updatedFavorites = favorites.filter(f => f.id !== favId);
        setFavorites(updatedFavorites);
        saveCurrentProfile({ favorites: updatedFavorites });
    };

    const handleCreateProfile = async () => {
        const name = prompt("Enter new profile name:");
        if (!name) return;

        const email = prompt("Enter email for notifications (optional):");

        const newProfile = {
            id: Date.now(),
            name: name,
            email: email || '',
            mobilityNeeds: 'None',
            favorites: [],
            history: []
        };

        const updatedProfiles = [...profiles, newProfile];
        setProfiles(updatedProfiles);
        localStorage.setItem('greenroute_profiles', JSON.stringify(updatedProfiles));
        loadProfileData(newProfile);

        // Call Backend to Register/Send Email
        if (email) {
            try {
                // Import axios if not already imported or use fetch
                await fetch('http://localhost:8000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email })
                });
                alert(`Profile created! A welcome email has been sent to ${email} (if SMTP is configured).`);
            } catch (err) {
                console.error("Failed to register:", err);
                alert("Profile created, but failed to send email.");
            }
        }
    };

    const handleDeleteProfile = () => {
        if (profiles.length <= 1) {
            alert("Cannot delete the last profile.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this profile? This cannot be undone.")) return;

        const updatedProfiles = profiles.filter(p => p.id !== currentProfileId);
        setProfiles(updatedProfiles);
        localStorage.setItem('greenroute_profiles', JSON.stringify(updatedProfiles));

        // Switch to the first available profile
        loadProfileData(updatedProfiles[0]);
    };

    const handleSwitchProfile = (e) => {
        const profileId = Number(e.target.value);
        const profile = profiles.find(p => p.id === profileId);
        if (profile) loadProfileData(profile);
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
                    <p className="text-gray-500 mt-1">Manage your preferences, history, and favorites.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <select
                        value={currentProfileId || ''}
                        onChange={handleSwitchProfile}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    >
                        {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <button onClick={handleCreateProfile} className="p-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200" title="Create Profile">
                        <Plus className="w-5 h-5" />
                    </button>
                    {profiles.length > 1 && (
                        <button onClick={handleDeleteProfile} className="p-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200" title="Delete Current Profile">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Settings */}
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Settings</h2>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={user.name}
                                onChange={(e) => setUser({ ...user, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={user.email}
                                onChange={(e) => setUser({ ...user, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobility Needs</label>
                            <select
                                value={user.mobilityNeeds}
                                onChange={(e) => setUser({ ...user, mobilityNeeds: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            >
                                <option value="None">None</option>
                                <option value="Wheelchair">Wheelchair</option>
                                <option value="Visual Impairment">Visual Impairment</option>
                                <option value="Elderly">Elderly</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors">
                            Save Profile
                        </button>
                    </form>
                </div>

                <div className="space-y-8">
                    {/* Favorites */}
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                            Favorite Routes
                        </h2>
                        <div className="space-y-4 max-h-60 overflow-y-auto">
                            {favorites.map(fav => (
                                <div key={fav.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{fav.name}</h3>
                                        <div className="text-sm text-gray-500 flex flex-col gap-1 mt-1">
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> From: {fav.origin}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> To: {fav.destination}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteFavorite(fav.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {favorites.length === 0 && <p className="text-gray-500">No favorites yet.</p>}
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-500" />
                            Search History
                        </h2>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {history.map((item, idx) => (
                                <div key={idx} className="text-sm border-b border-gray-50 pb-2 last:border-0">
                                    <div className="font-medium text-gray-700">{item.origin} ➝ {item.destination}</div>
                                    <div className="text-xs text-gray-400">{new Date(item.date).toLocaleString()}</div>
                                </div>
                            ))}
                            {history.length === 0 && <p className="text-gray-500">No history yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default Profile;
