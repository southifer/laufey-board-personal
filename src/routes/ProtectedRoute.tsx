import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hasCookie = Cookies.get('auth_token');
  const hasConfig = localStorage.getItem('userRecord');

  if (!hasCookie || !hasConfig) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;