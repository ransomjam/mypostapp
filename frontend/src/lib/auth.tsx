'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';
import { User } from './types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    login: async () => ({ success: false }),
    register: async () => ({ success: false }),
    logout: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = api.getToken();
        if (token) {
            api.getProfile().then((res) => {
                if (res.success && res.data) {
                    setUser(res.data);
                } else {
                    api.clearToken();
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.login(email, password);
        if (res.success && res.data) {
            api.setToken(res.data.token);
            setUser(res.data.user);
            return { success: true };
        }
        return { success: false, error: res.error || 'Login failed' };
    };

    const register = async (email: string, password: string) => {
        const res = await api.register(email, password);
        if (res.success && res.data) {
            api.setToken(res.data.token);
            setUser(res.data.user);
            return { success: true };
        }
        return { success: false, error: res.error || 'Registration failed' };
    };

    const logout = () => {
        api.clearToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
