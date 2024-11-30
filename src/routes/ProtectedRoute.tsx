import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hasCookie = Cookies.get('auth_token');

  if (!hasCookie) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;