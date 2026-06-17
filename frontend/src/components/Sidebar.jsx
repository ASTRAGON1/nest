import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import Logo from './Logo';
import {
    LayoutDashboard,
    Package,
    Tags,
    ShoppingCart,
    Users,
    Truck,
    FileBarChart,
    Settings,
    LogOut,
    Wallet,
    RotateCcw
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { logout } = useAuth();

    const { language } = useLanguage();

    const navItems = [
        { path: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
        { path: '/products', labelKey: 'products', icon: Package },
        { path: '/categories', labelKey: 'categories', icon: Tags },
        { path: '/sales', labelKey: 'sales', icon: ShoppingCart },
        { path: '/customers', labelKey: 'customers', icon: Users },
        { path: '/suppliers', labelKey: 'suppliers', icon: Truck },
        { path: '/expenses', labelKey: 'expenses', icon: Wallet },
        { path: '/returns', labelKey: 'returns', icon: RotateCcw },
        { path: '/reports', labelKey: 'reports', icon: FileBarChart },
        { path: '/settings', labelKey: 'settings', icon: Settings },
    ];

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white flex flex-col shadow-xl z-50 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ease-in-out ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
                }`}
        >
            {/* Header */}
            <div className="h-24 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <Logo size="lg" variant="navbar" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                            ${isActive
                                ? 'bg-[#40A45D] text-white shadow-lg'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <item.icon size={20} className="shrink-0" />
                        <span className="font-medium text-sm">{t(language, item.labelKey)}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors group"
                >
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    <span className="font-medium text-sm">{t(language, 'logout')}</span>
                </button>
            </div>
        </aside >
    );
};

export default Sidebar;
