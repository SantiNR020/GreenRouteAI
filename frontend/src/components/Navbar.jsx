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
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                <img src="/icon.png" alt="GreenRouteAI" className="w-8 h-8 object-contain" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                GreenRoute<span className="text-green-600 dark:text-green-400">AI</span>
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle Dark Mode"
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Link
                            to="/"
                            className={`px - 3 py - 2 rounded - md text - sm font - medium transition - colors ${isActive('/')
                                    ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-green-400 dark:hover:bg-gray-800'
                                } `}
                        >
                            Home
                        </Link>
                        <Link
                            to="/profile"
                            className={`px - 3 py - 2 rounded - md text - sm font - medium transition - colors flex items - center gap - 1 ${isActive('/profile')
                                    ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-green-400 dark:hover:bg-gray-800'
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
