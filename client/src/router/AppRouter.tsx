import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../views/LoginPage';
import ProfilePage from '../views/ProfilePage';
import VerifyEmailPage from '../views/VerifyEmailPage';
import ResendVerificationPage from '../views/ResendVerificationPage';
import ResetPasswordPage from '../views/ResetPasswordPage';
import AdminNotificationPage from '../views/AdminNotificationPage';
import { useAuth } from '../components/context/AuthContext';

interface AppRouterProps {
  isAuthenticated: boolean;
}

const AppRouter: React.FC<AppRouterProps> = ({ isAuthenticated }) => {
  const { user } = useAuth();

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
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? '/profile' : '/login'} replace />} 
      />
      {isAuthenticated && user?.role === 'admin' && (
        <Route path="/admin/notifications" element={<AdminNotificationPage />} />
      )}
    </Routes>
  );
};

export default AppRouter;


