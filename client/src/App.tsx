import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/context/AuthContext";

// Common layout components
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

// Pages
import NewPage from "./pages/Home"; // d?i Home th�nh NewPage
import Login from "./pages/Login";
import ProfilePage from "./views/ProfilePage";
import Shop from "./pages/Shop";
import Register from "./pages/Register";
import VerifyEmailPage from "./views/VerifyEmailPage";
import ResendVerificationPage from "./views/ResendVerificationPage";

// Route protection
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        {/* Header hi?n th? c? d?nh */}
        <Header />

        {/* N?i dung ch�nh */}
        <main className="app-main">
          <Routes>
            {/* Redirect "/" v? "/new" */}
            <Route path="/" element={<Navigate to="/new" replace />} />

            {/* Trang Shop */}
            <Route path="/shop" element={<Shop />} />

            {/* Trang New (trang s?n ph?m ch�nh) */}
            <Route path="/new" element={<NewPage />} />

            {/* �ang nh?p/dang k� */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/resend-verification" element={<ResendVerificationPage />} />

            {/* Trang c� nh�n (ch? truy c?p khi login) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* N?u kh�ng kh?p route n�o */}
            <Route
              path="*"
              element={
                <div className="container">
                  <h2>404 - Not Found</h2>
                </div>
              }
            />
          </Routes>
        </main>

        {/* Footer hi?n th? c? d?nh */}
        <Footer />
      </div>
    </AuthProvider>
  );
}


