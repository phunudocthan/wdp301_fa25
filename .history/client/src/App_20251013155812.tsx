import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/context/AuthContext";

// Common UI
import Header from "./components/common/Header";
import AdminNav from "./views/AdminNav";
import AuthDemo from "./components/common/AuthDemo";

// Pages
import HomePage from "./pages/Home";
import FeaturedPage from "./pages/FeaturedPage";
import PopularPage from "./pages/PopularPage";
import GamingPage from "./pages/GamingPage";
import Shop from "./pages/Shop";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfilePage from "./views/ProfilePage";
import ProfileAdminPage from "./components/ProfileNew";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import VerifyEmailPage from "./views/VerifyEmailPage";
import ResendVerificationPage from "./views/ResendVerificationPage";
import ResetPasswordPage from "./views/ResetPasswordPage";
import ForgotPasswordPage from "./views/ForgotPasswordPage";
import AddressBookPage from "./views/AddressBookPage";
import NotificationsPage from "./views/NotificationsPage";
import AdminNotificationPage from "./views/AdminNotificationPage";
import OrdersList from "./pages/admin/OrdersList";
import OrderDetail from "./pages/admin/OrderDetail";

// Route protection
import ProtectedRoute from "./routes/ProtectedRoute";

// Styles
import "bootstrap/dist/css/bootstrap.min.css";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";

export default function App() {
  const { user } = useAuth();

  return (
    <AuthProvider>
      <div className="app-shell">
        {/* Header luôn hiển thị cho mọi trang */}

        <main className="app-main">
          <Routes>
            {/* 🔁 Điều hướng mặc định */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 🌍 Public routes */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/home/featured" element={<FeaturedPage />} />
            <Route path="/home/popular" element={<PopularPage />} />
            <Route path="/home/gaming" element={<GamingPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />            
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/resend-verification" element={<ResendVerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth-demo" element={<AuthDemo />} />

            {/* 👤 User protected routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profileAdmin"
              element={
                <ProtectedRoute>
                  {user ? (
                    <ProfileAdminPage user={user} />
                  ) : (
                    <div>User not found.</div>
                  )}
                </ProtectedRoute>
              }
            />

            <Route
              path="/addresses"
              element={
                <ProtectedRoute>
                  <AddressBookPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* 🛠️ Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute>
                  <AdminNotificationPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute>
                  <OrdersList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />

            {/* 👥 User dashboard */}
            <Route
              path="/user"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* 🚫 404 fallback */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
