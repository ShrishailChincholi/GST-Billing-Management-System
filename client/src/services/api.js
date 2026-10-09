import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import api, { authAPI, tokenStorage, getErrorMessage } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== Check for existing token on mount =====
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.get();

      if (!token) {
        setLoading(false);
        return;
      }

      // Set default Authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const { data } = await authAPI.getMe();
        setUser(data.data);
      } catch (error) {
        // Token invalid or expired
        tokenStorage.remove();
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ===== Login =====
  const login = async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });

      const { token, ...userData } = data.data;

      tokenStorage.set(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);

      toast.success(`Welcome back, ${userData.name}!`);
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // ===== Register =====
  const register = async (userData) => {
    try {
      const { data } = await authAPI.register(userData);

      const { token, ...user } = data.data;

      tokenStorage.set(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // ===== Logout =====
  const logout = () => {
    tokenStorage.remove();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  // ===== Update User =====
  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  // ===== Refresh User =====
  const refreshUser = async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
      return data.data;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};