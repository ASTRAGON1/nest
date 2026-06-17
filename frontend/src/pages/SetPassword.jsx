import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { t } from '../utils/translations';
import { authService } from '../services/api';

const SetPassword = () => {
    const location = useLocation();
    const username = location.state?.username || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { setAuthData } = useAuth();
    const { language, setLanguage } = useLanguage();
    const navigate = useNavigate();

    // Redirect if no username
    React.useEffect(() => {
        if (!username) {
            navigate('/');
        }
    }, [username, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password.length < 6) {
            setError(t(language, 'passwordTooShort'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t(language, 'passwordsDoNotMatch'));
            return;
        }

        setLoading(true);

        try {
            const result = await authService.setPassword(username, password);

            // Save token and user data
            localStorage.setItem('token', result.token);
            setAuthData(result.user);

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-300 relative">
                {/* Content with RTL support */}
                <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {/* Header Row: Back Button & Language Switcher */}
                    <div className="flex justify-between items-center mb-6" dir="ltr">
                        {/* Back Button */}
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="text-sm">{t(language, 'back')}</span>
                        </button>

                        {/* Language Switcher */}
                        <div className="flex items-center gap-2 text-sm" dir="ltr">
                            <button
                                type="button"
                                onClick={() => setLanguage('en')}
                                className={`font-medium transition-colors ${language === 'en' ? 'text-[#40A45D] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                en
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                type="button"
                                onClick={() => setLanguage('ar')}
                                className={`font-medium transition-colors ${language === 'ar' ? 'text-[#40A45D] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                ar
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                type="button"
                                onClick={() => setLanguage('fr')}
                                className={`font-medium transition-colors ${language === 'fr' ? 'text-[#40A45D] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                fr
                            </button>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="mb-4">
                            <Logo size="lg" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">{t(language, 'setYourPassword')}</h2>
                        <p className="text-gray-500 mt-1">{username}</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t(language, 'newPassword')}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#40A45D] focus:border-transparent transition-all outline-none"
                                    placeholder={t(language, 'enterNewPassword')}
                                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${language === 'ar' ? 'left-3' : 'right-3'}`}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t(language, 'confirmPassword')}</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#40A45D] focus:border-transparent transition-all outline-none"
                                    placeholder={t(language, 'confirmNewPassword')}
                                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${language === 'ar' ? 'left-3' : 'right-3'}`}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#40A45D] hover:bg-[#358a4d] text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                t(language, 'createAccount')
                            )}
                        </button>

                        <div className="text-center text-sm text-gray-400 mt-4">
                            {t(language, 'poweredBy')}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SetPassword;
