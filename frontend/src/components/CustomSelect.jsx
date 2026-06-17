import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const CustomSelect = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    icon: Icon = null,
    className = "",
    label = ""
}) => {
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-xl cursor-pointer transition-all duration-200 
                    ${isOpen
                        ? 'border-[#40A45D] ring-2 ring-[#40A45D]/10 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                    }
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon size={18} className="text-gray-400" />}
                    {selectedOption ? (
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedOption.label}</span>
                    ) : (
                        <span className="text-gray-400">{placeholder === "Select..." ? (t(language, 'select') || "Select...") : placeholder}</span>
                    )}
                </div>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#40A45D]' : ''}`}
                />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto w-full min-w-[200px] animate-in fade-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    <div className="p-1">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm
                                    ${value === option.value
                                        ? 'bg-green-50 dark:bg-green-900/20 text-[#40A45D] font-medium'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    {option.icon && <option.icon size={16} />}
                                    <span>{option.label}</span>
                                </div>
                                {value === option.value && <Check size={16} className="text-[#40A45D]" />}
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="px-3 py-3 text-sm text-gray-400 text-center">
                                {t(language, 'noOptions') || 'No options available'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
