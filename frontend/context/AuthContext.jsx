import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser } from '../services/api';
import api from '../services/api';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);

  // Try to refresh access token silently using the stored refresh token
  const tryRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    try {
      const res = await api.post('/api/auth/refresh', { refreshToken });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      const payload = decodeToken(newToken);
      setToken(newToken);
      setUser(payload);
      return newToken;
    } catch {
      // Refresh failed — clear session
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setToken(null);
      return null;
    }
  }, []);

  // Hydrate session on mount
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      if (!isTokenExpired(stored)) {
        const payload = decodeToken(stored);
        setUser(payload);
        setToken(stored);
      } else {
        // Access token expired — try refresh
        tryRefresh();
      }
    }
  }, [tryRefresh]);

  // Add axios response interceptor to auto-refresh on 401
  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await tryRefresh();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptorId);
  }, [tryRefresh]);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const { token: t, refreshToken: rt, user: u } = res.data;
    localStorage.setItem('token', t);
    localStorage.setItem('refreshToken', rt);
    const payload = decodeToken(t);
    setToken(t);
    setUser(payload);
    return u;
  };

  const register = async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    const { token: t, refreshToken: rt, user: u } = res.data;
    localStorage.setItem('token', t);
    localStorage.setItem('refreshToken', rt);
    const payload = decodeToken(t);
    setToken(t);
    setUser(payload);
    return u;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/api/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
