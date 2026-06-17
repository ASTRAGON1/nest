import React, { useState, useEffect } from 'react';
import { Lock, Save, Store, Phone, MapPin, Mail, Hash, AlertTriangle, CheckCircle } from 'lucide-react';
import { settingsService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const Settings = () => {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState('store'); // store, security
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Store Info
    const [storeInfo, setStoreInfo] = useState({
        storeName: '',
        storeAddress: '',
        storePhone: '',
        storeEmail: '',
        storeICE: '',
    });

    // Password
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await settingsService.getSettings();
            // Populate store info if available in user object or settings response
            // The API returns { username, storeName, ... }
            setStoreInfo({
                storeName: data.storeName || '',
                storeAddress: data.storeAddress || '',
                storePhone: data.storePhone || '',
                storeEmail: data.storeEmail || '',
                storeICE: data.storeICE || '',
            });
        } catch (err) {
            console.error('Failed to fetch settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStore = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await settingsService.updateStore(storeInfo);
            setSuccessMsg(t(language, 'settingsSaved') || 'Settings saved successfully');

            // Update local storage user if needed (optional, if store name is displayed globally)
            const user = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...user, ...storeInfo }));

        } catch (err) {
            console.error('Update failed', err);
            setErrorMsg(t(language, 'updateFailed') || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setErrorMsg(t(language, 'passwordMismatch') || 'Passwords do not match');
            return;
        }
        if (passwords.newPassword.length < 6) {
            setErrorMsg(t(language, 'passwordTooShort') || 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await settingsService.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setSuccessMsg(t(language, 'passwordChanged') || 'Password changed successfully');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error('Password change failed', err);
            setErrorMsg(err.response?.data?.error || (t(language, 'passwordChangeFailed') || 'Failed to change password'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t(language, 'settings') || 'Settings'}</h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="flex border-b border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => { setActiveTab('store'); setSuccessMsg(''); setErrorMsg(''); }}
                        className={`flex-1 py-4 text-center font-medium transition-colors border-b-2 ${activeTab === 'store' ? 'border-[#40A45D] text-[#40A45D] bg-green-50/50 dark:bg-green-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Store size={20} />
                            {t(language, 'storeInfo') || 'Store Information'}
                        </div>
                    </button>
                    <button
                        onClick={() => { setActiveTab('security'); setSuccessMsg(''); setErrorMsg(''); }}
                        className={`flex-1 py-4 text-center font-medium transition-colors border-b-2 ${activeTab === 'security' ? 'border-[#40A45D] text-[#40A45D] bg-green-50/50 dark:bg-green-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Lock size={20} />
                            {t(language, 'security') || 'Security'}
                        </div>
                    </button>
                </div>

                <div className="p-8">
                    {successMsg && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-lg mb-6 flex items-center gap-2">
                            <CheckCircle size={20} />
                            {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6 flex items-center gap-2">
                            <AlertTriangle size={20} />
                            {errorMsg}
                        </div>
                    )}

                    {activeTab === 'store' ? (
                        <form onSubmit={handleUpdateStore} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'storeName') || 'Store Name'}</label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={storeInfo.storeName}
                                            onChange={(e) => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'phone') || 'Phone'}</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={storeInfo.storePhone}
                                            onChange={(e) => setStoreInfo({ ...storeInfo, storePhone: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'email') || 'Email'}</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            value={storeInfo.storeEmail}
                                            onChange={(e) => setStoreInfo({ ...storeInfo, storeEmail: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'address') || 'Address'}</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={storeInfo.storeAddress}
                                            onChange={(e) => setStoreInfo({ ...storeInfo, storeAddress: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'storeICE') || 'ICE'}</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={storeInfo.storeICE}
                                            onChange={(e) => setStoreInfo({ ...storeInfo, storeICE: e.target.value })}
                                            placeholder={t(language, 'enterICE') || 'Enter your ICE number'}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-[#40A45D] text-white px-6 py-2 rounded-lg hover:bg-[#368f50] transition-colors disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    {loading ? (t(language, 'saving') || 'Saving...') : (t(language, 'saveChanges') || 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-6 max-w-md mx-auto">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'currentPassword') || 'Current Password'}</label>
                                <input
                                    type="password"
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'newPassword') || 'New Password'}</label>
                                <input
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(language, 'passwordMinLength') || 'Minimum 6 characters'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'confirmPassword') || 'Confirm Password'}</label>
                                <input
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-[#40A45D] text-white px-6 py-2 rounded-lg hover:bg-[#368f50] transition-colors disabled:opacity-50"
                                >
                                    <Lock size={18} />
                                    {loading ? (t(language, 'processing') || 'Processing...') : (t(language, 'changePassword') || 'Change Password')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
