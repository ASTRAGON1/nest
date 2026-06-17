import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { t } from '../utils/translations';

const LoginPassword = () => {
    const location = useLocation();
    const username = location.state?.username || '';

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
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
        setLoading(true);

        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || t(language, 'incorrectPassword'));
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
                    <div className="flex justify-between items-center mb-6">
                        {/* Back Button */}
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
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
                                onClick={() => setLanguage('fr')}
                                className={`font-medium transition-colors ${language === 'fr' ? 'text-[#40A45D] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                fr
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                type="button"
                                onClick={() => setLanguage('ar')}
                                className={`font-medium transition-colors ${language === 'ar' ? 'text-[#40A45D] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                ar
                            </button>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="mb-4">
                            <Logo size="lg" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {t(language, 'welcomeBackUser')}, {username}!
                        </h2>
                        <p className="text-gray-500 mt-1">{t(language, 'signInToManage')}</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t(language, 'password')}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#40A45D] focus:border-transparent transition-all outline-none"
                                    placeholder={t(language, 'enterPassword')}
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
                                t(language, 'signIn')
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

export default LoginPassword;
