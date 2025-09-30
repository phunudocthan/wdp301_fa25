import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/context/AuthContext";

// Common UI
import Header from "./components/common/Header";
import AdminNav from "./views/AdminNav";
import AuthDemo from "./components/common/AuthDemo";

// Pages
import HomePage from "./pages/Home";
import Shop from "./pages/Shop";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfilePage from "./views/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import VerifyEmailPage from "./views/VerifyEmailPage";
import ResendVerificationPage from "./views/ResendVerificationPage";
import ResetPasswordPage from "./views/ResetPasswordPage";
import AddressBookPage from "./views/AddressBookPage";
import NotificationsPage from "./views/NotificationsPage";
import AdminNotificationPage from "./views/AdminNotificationPage";

// Route protection
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  const { user } = useAuth();

  return (
    <AuthProvider>
      <div className="app-shell">
        {/* Navigation */}
        {user?.role === "admin" ? <AdminNav /> : <Header />}

        <main className="app-main">
          <Routes>
            {/* Redirect root */}
            <Route path="/" element={<Navigate to="/home" replace />} />

            {/* Public routes */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/resend-verification" element={<ResendVerificationPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth-demo" element={<AuthDemo />} />

            {/* Protected routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
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

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            {user?.role === "admin" && (
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedRoute>
                    <AdminNotificationPage />
                  </ProtectedRoute>
                }
              />
            )}

            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="container py-12 text-center text-slate-500">
                  <h2 className="text-2xl font-semibold">404 - Not Found</h2>
                  <p className="mt-2">
                    The page you are looking for could not be found.
                  </p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
