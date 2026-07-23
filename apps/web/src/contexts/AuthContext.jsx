
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      if (pb.authStore.isValid && pb.authStore.model) {
        try {
          // Refresh session to ensure token is still valid
          const authData = await pb.collection('users').authRefresh({ $autoCancel: false });
          setCurrentUser(authData.record);
        } catch (error) {
          console.error('Session expired or invalid:', error);
          pb.authStore.clear();
          setCurrentUser(null);
          // Only show toast if we were previously logged in and session actually expired
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            toast.error('Your session has expired. Please log in again.');
            navigate('/login');
          }
        }
      }
      setInitialLoading(false);
    };

    initAuth();
  }, [navigate]);

  const login = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      
      const userRole = authData.record.role;
      const validRoles = ['owner', 'designer', 'crew', 'design_reviewer']; // Added design_reviewer
      
      if (!validRoles.includes(userRole)) {
        pb.authStore.clear();
        throw new Error('Invalid user role assigned. Please contact administrator.');
      }
      
      setCurrentUser(authData.record);
      return authData.record;
    } catch (error) {
      console.error('Login failed:', error);
      pb.authStore.clear();
      
      // Better error mapping
      if (error.status === 400 || error.message.includes('Failed to authenticate')) {
        throw new Error('Invalid email or password');
      }
      
      throw error;
    }
  };

  const signup = async (email, password, passwordConfirm, name, role, phone) => {
    try {
      const record = await pb.collection('users').create({
        email: email.trim().toLowerCase(),
        password,
        passwordConfirm,
        name: name.trim(),
        role,
        phone: phone ? phone.trim() : ''
      }, { $autoCancel: false });
      
      // Auto-login after signup
      await login(email, password);
      return record;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    isAuthenticated: pb.authStore.isValid
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
