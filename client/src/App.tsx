import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/context/AuthContext";

import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

// Pages
import HomePage from "./pages/Home";
import Shop from "./pages/Shop";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfilePage from "./views/ProfilePage";
import VerifyEmailPage from "./views/VerifyEmailPage";
import ResendVerificationPage from "./views/ResendVerificationPage";
import ResetPasswordPage from "./views/ResetPasswordPage";
import AddressBookPage from "./views/AddressBookPage";
import NotificationsPage from "./views/NotificationsPage";

// Route protection
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/new" replace />} />

            <Route path="/new" element={<HomePage />} />
            <Route path="/shop" element={<Shop />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/resend-verification" element={<ResendVerificationPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

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

            <Route
              path="*"
              element={
                <div className="container py-12 text-center text-slate-500">
                  <h2 className="text-2xl font-semibold">404 - Not Found</h2>
                  <p className="mt-2">The page you are looking for could not be found.</p>
                </div>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
