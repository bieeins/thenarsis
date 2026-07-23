import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    // If user doesn't have required role, redirect to their appropriate dashboard
    switch (currentUser.role) {
      case 'owner':
        return <Navigate to="/owner-dashboard" replace />;
      case 'designer':
        return <Navigate to="/designer-dashboard" replace />;
      case 'crew':
        return <Navigate to="/crew-dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;