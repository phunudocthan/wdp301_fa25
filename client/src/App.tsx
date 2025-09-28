import React from 'react';
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider } from './stores/AuthContext';

// Common layout components
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

// Pages
import NewPage from "./pages/Home";  // đổi Home thành NewPage
import Login from "./pages/Login";
import Profile from "./pages/AdminProfile";
import Shop from "./pages/Shop";
import Register from "./pages/Register";

// Route protection
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        {/* Header hiển thị cố định */}
        <Header />

        {/* Nội dung chính */}
        <main className="app-main">
          <Routes>
            {/* Redirect "/" về "/new" */}
            <Route path="/" element={<Navigate to="/new" replace />} />

            {/* Trang Shop */}
            <Route path="/shop" element={<Shop />} />

            {/* Trang New (trang sản phẩm chính) */}
            <Route path="/new" element={<NewPage />} />

            {/* Đăng nhập */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Trang cá nhân (chỉ truy cập khi login) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Nếu không khớp route nào */}
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

        {/* Footer hiển thị cố định */}
        <Footer />
      </div>
    </AuthProvider>
  );
}
