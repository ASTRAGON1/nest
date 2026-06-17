import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${language === 'en'
                    ? 'bg-white dark:bg-gray-700 text-[#40A45D] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
            >
                English
            </button>
            <button
                onClick={() => setLanguage('ar')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${language === 'ar'
                    ? 'bg-white dark:bg-gray-700 text-[#40A45D] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
            >
                العربية
            </button>
            <button
                onClick={() => setLanguage('fr')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${language === 'fr'
                    ? 'bg-white dark:bg-gray-700 text-[#40A45D] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
            >
                Français
            </button>
        </div>
    );
};

export default LanguageToggle;
