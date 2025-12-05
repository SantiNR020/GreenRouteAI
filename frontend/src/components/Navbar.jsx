import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, User, Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed w-full z-50 top-4 px-4">
            <div className="max-w-7xl mx-auto glass rounded-2xl px-4 sm:px-6 lg:px-8 transition-all duration-300">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                            <div className="bg-white/50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-white/20 shadow-sm transition-transform group-hover:scale-110">
                                <img src="/icon.png" alt="GreenRouteAI" className="w-8 h-8 object-contain" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                GreenRoute<span className="text-green-600 dark:text-green-400">AI</span>
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-800/50 transition-colors"
                            aria-label="Toggle Dark Mode"
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Link
                            to="/"
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${isActive('/')
                                ? 'text-white bg-green-600 shadow-lg shadow-green-500/30'
                                : 'text-gray-600 hover:text-green-600 hover:bg-white/50 dark:text-gray-300 dark:hover:text-green-400 dark:hover:bg-gray-800/50'
                                } `}
                        >
                            Home
                        </Link>
                        <Link
                            to="/profile"
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-1 ${isActive('/profile')
                                ? 'text-white bg-green-600 shadow-lg shadow-green-500/30'
                                : 'text-gray-600 hover:text-green-600 hover:bg-white/50 dark:text-gray-300 dark:hover:text-green-400 dark:hover:bg-gray-800/50'
                                } `}
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
