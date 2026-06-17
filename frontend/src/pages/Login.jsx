import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';
import { Loader2 } from 'lucide-react';
import { t } from '../utils/translations';
import { authService } from '../services/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { language, setLanguage } = useLanguage();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await authService.checkUsername(username);

            if (!result.exists) {
                setError(t(language, 'usernameNotFound'));
                setLoading(false);
                return;
            }

            // Navigate based on whether password is set
            if (result.passwordSet) {
                // Go to login password page
                navigate('/login-password', { state: { username } });
            } else {
                // Go to set password page
                navigate('/set-password', { state: { username } });
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to check username');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-300 relative">
                {/* Language Switcher - Always Top Right (LTR) */}
                <div className="absolute top-6 right-6 flex items-center gap-2 text-sm" dir="ltr">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`font-medium transition-colors ${language === 'en'
                            ? 'text-[#40A45D] font-semibold'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        en
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        onClick={() => setLanguage('ar')}
                        className={`font-medium transition-colors ${language === 'ar'
                            ? 'text-[#40A45D] font-semibold'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        ar
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        onClick={() => setLanguage('fr')}
                        className={`font-medium transition-colors ${language === 'fr'
                            ? 'text-[#40A45D] font-semibold'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        fr
                    </button>
                </div>

                {/* Content with RTL support */}
                <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="mb-4">
                            <Logo size="lg" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">{t(language, 'welcomeBack')}</h2>
                        <p className="text-gray-500 mt-1">{t(language, 'signInToManage')}</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t(language, 'username')}</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#40A45D] focus:border-transparent transition-all outline-none"
                                placeholder={t(language, 'enterUsername')}
                                dir={language === 'ar' ? 'rtl' : 'ltr'}
                            />
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
                                t(language, 'continue')
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

export default Login;
