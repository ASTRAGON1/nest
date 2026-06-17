import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Logo = ({ size = 'md', className = '', variant = 'default' }) => {
    const { language } = useLanguage();

    // English size classes
    const sizeClasses = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-4xl',
        xl: 'text-5xl'
    };

    // Arabic needs to be larger to match visual weight of English
    const arabicSizeClasses = {
        sm: 'text-2xl',
        md: 'text-3xl',
        lg: 'text-5xl',
        xl: 'text-6xl'
    };

    // Color variants for different contexts
    const colorVariants = {
        default: {
            text: 'text-gray-900',
            accent: 'text-[#40A45D]'
        },
        navbar: {
            text: 'text-gray-900 dark:text-white',
            accent: 'text-[#40A45D]'
        }
    };

    const colors = colorVariants[variant];

    return (
        <div className={`flex flex-col items-center justify-center leading-none select-none ${className}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800 }}>
            {language !== 'ar' ? (
                <div className={`flex items-baseline ${sizeClasses[size]} tracking-tight ${colors.text}`}>
                    <span>Mosa</span>
                    <span className={colors.accent}>3</span>
                    <span>id</span>
                </div>
            ) : (
                <div className={`${arabicSizeClasses[size]} ${colors.text}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, letterSpacing: '0.05em' }}>
                    <span>مُسا</span>
                    <span className={colors.accent}>عِ</span>
                    <span>د</span>
                </div>
            )}
        </div>
    );
};

export default Logo;
