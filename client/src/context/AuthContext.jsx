import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const u = JSON.parse(stored);
                if (u && u.id) return u;
            }
            return null;
        } catch (e) {
            console.error("Failed to parse user from local storage", e);
            return null;
        }
    });

    const [loading, setLoading] = useState(false);

    const login = (userData, sessionToken) => {
        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
            if (sessionToken) {
                localStorage.setItem('sessionToken', sessionToken);
            }
            setUser(userData);
        }
    };

    const logout = (callback) => {
        localStorage.removeItem('user');
        localStorage.removeItem('sessionToken');
        setUser(null);
        if (callback) callback();
    };

    const updateUser = (data) => {
        setUser(prev => {
            const updated = { ...prev, ...data };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, setUser: login, logout, updateUser, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
