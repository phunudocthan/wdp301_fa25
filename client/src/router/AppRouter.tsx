

// === 📁 src/router/AppRouter.tsx ===
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../views/LoginPage';
import ProfilePage from '../views/ProfilePage';
import VerifyEmailPage from '../views/VerifyEmailPage';
import ResendVerificationPage from '../views/ResendVerificationPage';
import ResetPasswordPage from '../views/ResetPasswordPage';
import AdminNotificationPage from '../views/AdminNotificationPage';
import AdminProfile from '../pages/AdminProfile';
import AdminVoucherManagement from '../pages/AdminVoucherManagement';
import AdminProductManagement from '../pages/AdminProductManagement';
import AdminProductDetail from '../pages/AdminProductDetail';
import AdminProductEdit from '../pages/AdminProductEdit';
import Shop from '../pages/Shop';
import Register from '../pages/Register';
import ProductDetail from '../pages/ProductDetail';
import { useAuth } from '../components/context/AuthContext';
import ProtectedRoute from '../routes/ProtectedRoute';

const AppRouter: React.FC = () => {
  const { user } = useAuth(); 
  const isAuthenticated = !!user;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/shop" replace />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/profile"
        element={
          isAuthenticated ? (
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {isAuthenticated && user?.role === 'admin' && (
        <>
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/notifications" element={<AdminNotificationPage />} />
          <Route path="/admin/vouchers" element={<AdminVoucherManagement />} />
          <Route path="/admin/products" element={<AdminProductManagement />} />
          <Route path="/admin/products/:id" element={<AdminProductDetail />} />
          <Route path="/admin/products/edit/:id" element={<AdminProductEdit />} />
        </>
      )}

      <Route path="*" element={<Navigate to="/shop" replace />} />
    </Routes>
  );
};

export default AppRouter;
