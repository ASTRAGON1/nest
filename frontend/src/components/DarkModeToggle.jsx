import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DarkModeToggle = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors duration-200 ${isDarkMode
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

export default DarkModeToggle;
