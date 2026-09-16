
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiClient, ApiError, setAccessToken } from '@/lib/apiClient.js';

const AuthContext = createContext(null);

// Routes that render without a session (see App.jsx) — a failed session
// refresh on one of these must not bounce the visitor to /login, since
// they were never expected to be signed in there in the first place.
const isPublicPath = (pathname) => (
  pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname.startsWith('/invoice/')
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const refreshRes = await apiClient.post('/api/auth/refresh');
        setAccessToken(refreshRes.data.accessToken);
        setCurrentUser(refreshRes.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        setAccessToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
        if (!isPublicPath(window.location.pathname)) {
          toast.error('Your session has expired. Please log in again.');
          navigate('/login');
        }
      }
      setInitialLoading(false);
    };

    initAuth();
  }, [navigate]);

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/api/auth/login', { email, password });
      setAccessToken(res.data.accessToken);
      setCurrentUser(res.data.user);
      setIsAuthenticated(true);
      return res.data.user;
    } catch (error) {
      setAccessToken(null);
      setIsAuthenticated(false);
      console.error('Login failed:', error);

      if (error instanceof ApiError && error.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  };

  const signup = async (email, password, passwordConfirm, name, role, phone) => {
    try {
      const res = await apiClient.post('/api/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        passwordConfirm,
        name: name.trim(),
        role,
        phone: phone ? phone.trim() : undefined,
      });
      setAccessToken(res.data.accessToken);
      setCurrentUser(res.data.user);
      setIsAuthenticated(true);
      return res.data.user;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // best-effort — clear local state regardless
    }
    setAccessToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    isAuthenticated,
    initialLoading,
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
