import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../views/LoginPage';
import ProfilePage from '../views/ProfilePage';
import VerifyEmailPage from '../views/VerifyEmailPage';
import ResendVerificationPage from '../views/ResendVerificationPage';

interface AppRouterProps {
  isAuthenticated: boolean;
}

const AppRouter: React.FC<AppRouterProps> = ({ isAuthenticated }) => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          !isAuthenticated ? <LoginPage /> : <Navigate to="/profile" replace />
        } 
      />
      <Route 
        path="/profile" 
        element={
          isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />
        } 
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? '/profile' : '/login'} replace />} 
      />
    </Routes>
  );
};

export default AppRouter;


