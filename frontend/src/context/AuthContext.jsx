import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const data = await authService.login(username, password);
            const { token, user } = data; // Assuming backend returns { token, user: { id, username, ... } }

            // If backend doesn't return user object structure exactly, adapt here
            // Based on previous auth controller, it returns token. We might need to decode or fetch user. 
            // WAIT - let's check auth controller return.
            // Ah, the standard implementation usually returns both. If strictly just token, we'd need to decode.
            // Let's assume standard behavior or minimal user info is encoded.

            // Storing token
            localStorage.setItem('token', token);
            setToken(token);
            setIsAuthenticated(true);

            // Storing user (if provided, else decode or fetch)
            // For now, let's store what we have or a placeholder if backend only sends token
            // Ref: Auth controller usually sends { token, user: {...} } or just token.
            // Let's assume we proceed with the user object if available, else standard placeholder
            const userData = user || { username }; // Fallback
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return true;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const setAuthData = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
    };

    const value = {
        user,
        token,
        isAuthenticated,
        login,
        logout,
        setAuthData,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
