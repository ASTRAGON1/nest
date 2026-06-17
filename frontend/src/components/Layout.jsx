import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import Calculator from './Calculator';
import DarkModeToggle from './DarkModeToggle';
import LanguageToggle from './LanguageToggle';
import Logo from './Logo';
import {
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen w-full bg-white dark:bg-gray-900 overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Main Content */}
            <main
                className={`flex-1 h-screen overflow-y-auto transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 ${isSidebarOpen ? 'ml-64' : 'ml-0'
                    }`}
            >
                {/* Top Bar with Notifications */}
                <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-8 py-4 flex justify-between items-center transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                        >
                            {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                        </button>

                        {/* Left side content if any */}
                        {!isSidebarOpen && (
                            <div className="flex items-center gap-2">
                                <Logo size="sm" variant="navbar" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <Calculator />
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
                        <DarkModeToggle />
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
                        <LanguageToggle />
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
                        <NotificationBell />
                    </div>
                </div>
                <div className="max-w-7xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
