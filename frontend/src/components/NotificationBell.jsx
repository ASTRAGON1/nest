import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, Trash2, Package, DollarSign, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const NotificationBell = () => {
    const { language } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            setUnreadCount(res.data.count || 0);
        } catch (err) {
            console.error('Failed to fetch unread count', err);
        }
    }, []);

    const triggerCheck = useCallback(async () => {
        try {
            await api.post('/notifications/check');
            fetchUnreadCount();
        } catch (err) {
            console.error('Failed to trigger notification check', err);
        }
    }, [fetchUnreadCount]);

    useEffect(() => {
        fetchUnreadCount();
        triggerCheck();

        const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount, triggerCheck]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            const notification = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Failed to delete notification', err);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'low_stock':
                return <Package size={16} className="text-orange-500" />;
            case 'unpaid_sale':
                return <DollarSign size={16} className="text-red-500" />;
            default:
                return <AlertCircle size={16} className="text-blue-500" />;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getTranslatedTitle = (title) => {
        if (title === 'Unpaid Sale Reminder') return t(language, 'unpaidSaleReminder');
        if (title === 'Low Stock Alert') return t(language, 'lowStockAlert');
        return title;
    };

    const getTranslatedMessage = (notification) => {
        if (notification.type === 'unpaid_sale') {
            const match = notification.message.match(/Sale (.*?) \((.*?)\) has (.*?) DH due/);
            if (match) {
                return t(language, 'unpaidSaleMsg')
                    .replace('{receipt}', match[1])
                    .replace('{customer}', match[2])
                    .replace('{amount}', match[3]);
            }
        } else if (notification.type === 'low_stock') {
            const match = notification.message.match(/(.*?) has only (.*?) units left \(min: (.*?)\)/);
            if (match) {
                return t(language, 'lowStockMsg')
                    .replace('{name}', match[1])
                    .replace('{qty}', match[2])
                    .replace('{min}', match[3]);
            }
        }
        return notification.message;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t(language, 'notifications') || 'Notifications'}</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-[#40A45D] hover:underline"
                            >
                                {t(language, 'markAllRead') || 'Mark all read'}
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                <p>{t(language, 'noNotifications') || 'No notifications'}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1">{getTypeIcon(notification.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-gray-800 dark:text-gray-200`}>
                                                    {getTranslatedTitle(notification.title)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                    {getTranslatedMessage(notification)}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatTime(notification.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="p-1 text-gray-400 hover:text-green-500"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(notification.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
