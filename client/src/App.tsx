import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/context/AuthContext";
import { useTokenExpirationCheck } from "./hooks/useAuthHooks";
import { SessionNotifications } from "./components/SessionNotifications";

// Common UI
import AuthDemo from "./components/common/AuthDemo";

// Pages
import HomePage from "./pages/Home";
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
import AdminProductManagement from "./pages/AdminProductManagement";
import AdminCategoryManagement from "./pages/AdminCategoryManagement";
import AdminProductDetail from "./pages/AdminProductDetail";
import AdminProductEdit from "./pages/AdminProductEdit";

// Route protection
import ProtectedRoute from "./routes/ProtectedRoute";
import "bootstrap/dist/css/bootstrap.min.css";

// Wrapper for ProfileAdminPage to provide user prop
function ProfileAdminWrapper() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return <ProfileAdminPage user={user} />;
}

function AppContent() {
  // Use hooks inside the AuthProvider
  useTokenExpirationCheck();

  return (
    <div className="app-shell">
      <SessionNotifications />

      {/* Navigation */}

      <main className="app-main">
        <Routes>
          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/resend-verification"
            element={<ResendVerificationPage />}
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
          {/* Protected routes */}
          <Route
            path="/profileAdmin"
            element={
              <ProtectedRoute>
                <ProfileAdminWrapper />
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

          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute>
                <AdminNotificationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/products"
            element={
              <ProtectedRoute>
                <AdminProductManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <AdminCategoryManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/products/edit/:id"
            element={
              <ProtectedRoute>
                <AdminProductEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/products/:id"
            element={
              <ProtectedRoute>
                <AdminProductDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
