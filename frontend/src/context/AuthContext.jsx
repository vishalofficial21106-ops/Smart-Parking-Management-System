import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser as setStoredUser,
  removeUser,
  authAPI,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUser());
  const [token, setAuthToken] = useState(getToken());
  const [loading, setLoading] = useState(true);

  // Validate or refresh user session on mount
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setStoredUser(res.user);
          }
        } catch (err) {
          console.warn('[Session expired or server unavailable]:', err.message);
          // If token invalid, clear session
          if (err.message.includes('authorized') || err.message.includes('expired')) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.success) {
      setToken(res.token);
      setStoredUser(res.user);
      setAuthToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.success) {
      setToken(res.token);
      setStoredUser(res.user);
      setAuthToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    removeToken();
    removeUser();
    setAuthToken(null);
    setUser(null);
  };

  const updateUserProfile = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
    setStoredUser(updated);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUserProfile,
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
