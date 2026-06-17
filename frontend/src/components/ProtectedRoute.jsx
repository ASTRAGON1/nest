import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuspendedScreen = ({ onLogout }) => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
            <div style={{ width: 64, height: 64, backgroundColor: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <svg width="28" height="28" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 10 }}>Account Suspended</h1>
            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 32 }}>
                Your account has been suspended by the platform administrator. You cannot access any features at this time. Please contact support if you believe this is a mistake.
            </p>
            <button
                onClick={onLogout}
                style={{ padding: '11px 28px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
                Log Out
            </button>
        </div>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading, user, logout } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Suspended users can log in but cannot access the app
    if (user && user.isActive === false) {
        return <SuspendedScreen onLogout={logout} />;
    }

    return children;
};

export default ProtectedRoute;
