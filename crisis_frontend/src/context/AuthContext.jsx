import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkToken = () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Default role to staff if not provided by mockup API yet
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({ 
            id: decoded.user_id, 
            role: decoded.role || 'guest', 
            username: decoded.username || 'User'
          });
        }
      } catch (err) {
        logout();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkToken();
  }, []);

  const login = async (username, password) => {
    const response = await api.post('token/', { username, password });
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    checkToken();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
