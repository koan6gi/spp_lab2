import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logout as apiLogout, getMe } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('notes_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('notes_access_token'));

  const login = useCallback((authData) => {
    if (authData.accessToken) {
      localStorage.setItem('notes_access_token', authData.accessToken);
      setToken(authData.accessToken);
    }
    if (authData.refreshToken) {
      localStorage.setItem('notes_refresh_token', authData.refreshToken);
    }
    if (authData.user) {
      localStorage.setItem('notes_user', JSON.stringify(authData.user));
      setUser(authData.user);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('notes_refresh_token');
    if (refreshToken) {
      await apiLogout(refreshToken);
    }
    localStorage.removeItem('notes_access_token');
    localStorage.removeItem('notes_refresh_token');
    localStorage.removeItem('notes_user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleAuthLogout = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth_logout', handleAuthLogout);
    return () => window.removeEventListener('auth_logout', handleAuthLogout);
  }, []);

  useEffect(() => {
    if (token && !user) {
      getMe()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('notes_user', JSON.stringify(userData));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token, user, logout]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator' || user?.role === 'admin',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
