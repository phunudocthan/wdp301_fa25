// src/router/AppRouter.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProfilePage from "../pages/AdminProfile";
import Shop from "../pages/Shop";
import NewPage from "../pages/Home";
import Register from "../pages/Register";
import ProtectedRoute from "../routes/ProtectedRoute";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/new" replace />} />
      <Route path="/new" element={<NewPage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<div className="p-6">404 - Trang không tồn tại</div>}
      />
    </Routes>
  );
}
