import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/context/AuthContext";
import { useTokenExpirationCheck } from "./hooks/useAuthHooks";
import { SessionNotifications } from "./components/SessionNotifications";
import Header from "./components/common/Header";
import AuthDemo from "./components/common/AuthDemo";
import HomePage from "./pages/Home";
import FeaturedPage from "./pages/FeaturedPage";
import PopularPage from "./pages/PopularPage";
import GamingPage from "./pages/GamingPage";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfilePage from "./views/ProfilePage";
import ProfileAdminPage from "./components/ProfileNew";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import FavoritesPage from "./pages/Favorites";
import VerifyEmailPage from "./views/VerifyEmailPage";
import ResendVerificationPage from "./views/ResendVerificationPage";
import ResetPasswordPage from "./views/ResetPasswordPage";
import ForgotPasswordPage from "./views/ForgotPasswordPage";
import AddressBookPage from "./views/AddressBookPage";
import NotificationsPage from "./views/NotificationsPage";
// ...existing code...
import AdminProductManagement from "./pages/AdminProductManagement";
import AdminCategoryManagement from "./pages/AdminCategoryManagement_new";
import AdminProductDetail from "./pages/AdminProductDetail";
import AdminProductEdit from "./pages/AdminProductEdit";
import AdminVoucherManagement from "./pages/AdminVoucherManagement";
import AdminProfile from "./pages/AdminProfile";
import AdminRevenueDashboard from "./views/AdminRevenueDashboard";
import AdminOrdersDashboard from "./views/AdminOrdersDashboard";
import AdminUsersPage from "./views/AdminUsersPage";
import AdminUserDetailPage from "./views/AdminUserDetailPage";
import OrdersList from "./pages/admin/OrdersList";
import OrderDetail from "./pages/admin/OrderDetail";
// ...existing code...
import ProtectedRoute from "./routes/ProtectedRoute";
import "bootstrap/dist/css/bootstrap.min.css";
import AdminNotificationPage from "./views/AdminNotificationPage";
import AdminVoucherStatistics from "./pages/AdminVoucherStatistics";
function ProfileAdminWrapper() {
  const { user } = useAuth();
  if (!user) return <div>Loading...</div>;
  return <ProfileAdminPage user={user} />;
}

function AppContent() {
  useTokenExpirationCheck();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const pagesWithoutHeader = [
    "/login",
    "/register",
    "/verify-email",
    "/resend-verification",
    "/forgot-password",
    "/reset-password",
    "/",
  ];
  const shouldShowHeader = !pagesWithoutHeader.includes(location.pathname);
  const redirectIfAdmin = (element: React.ReactElement) =>
    isAdmin ? <Navigate to="/admin" replace /> : element;

  return (
    <div>
      {isAdmin && shouldShowHeader && <Header />}
      <SessionNotifications />
      <main >
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={redirectIfAdmin(<HomePage />)} />
          <Route path="/home/featured" element={redirectIfAdmin(<FeaturedPage />)} />
          <Route path="/home/popular" element={redirectIfAdmin(<PopularPage />)} />
          <Route path="/home/gaming" element={redirectIfAdmin(<GamingPage />)} />
          <Route path="/product/:id" element={redirectIfAdmin(<ProductDetail />)} />
          <Route path="/shop" element={redirectIfAdmin(<Shop />)} />
          <Route path="/cart" element={redirectIfAdmin(<Cart />)} />
          <Route path="/checkout" element={redirectIfAdmin(<Checkout />)} />
          <Route path="/order-success" element={redirectIfAdmin(<OrderSuccess />)} />
          <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotificationPage /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/resend-verification" element={<ResendVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth-demo" element={<AuthDemo />} />
          <Route path="/profile" element={isAdmin ? (<Navigate to="/admin/profile" replace />) : (<ProtectedRoute><ProfilePage /></ProtectedRoute>)} />
          <Route path="/profileAdmin" element={<ProtectedRoute><ProfileAdminWrapper /></ProtectedRoute>} />
          <Route path="/addresses" element={redirectIfAdmin(<ProtectedRoute><AddressBookPage /></ProtectedRoute>)} />
          <Route path="/notifications" element={redirectIfAdmin(<ProtectedRoute><NotificationsPage /></ProtectedRoute>)} />
          <Route path="/favorites" element={redirectIfAdmin(<ProtectedRoute><FavoritesPage /></ProtectedRoute>)} />
          <Route path="/user" element={redirectIfAdmin(<ProtectedRoute><UserDashboard /></ProtectedRoute>)} />
          {/* Admin overview */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
          {/* Admin analytics */}
          <Route path="/admin/dashboard/revenue" element={<ProtectedRoute><AdminRevenueDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard/orders" element={<ProtectedRoute><AdminOrdersDashboard /></ProtectedRoute>} />
          {/* Admin user management */}
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={<ProtectedRoute><AdminUserDetailPage /></ProtectedRoute>} />
          {/* Admin notifications */}
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          {/* Admin orders */}
          <Route path="/admin/orders" element={<ProtectedRoute><OrdersList /></ProtectedRoute>} />
          <Route path="/admin/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          {/* Admin product management */}
          <Route path="/admin/products" element={<ProtectedRoute><AdminProductManagement /></ProtectedRoute>} />
          <Route path="/admin/vouchers" element={<ProtectedRoute><AdminVoucherManagement /></ProtectedRoute>} />
          <Route path="/admin/voucher-statistics" element={<ProtectedRoute><AdminVoucherStatistics /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute><AdminCategoryManagement /></ProtectedRoute>} />
          <Route path="/admin/products/edit/:id" element={<ProtectedRoute><AdminProductEdit /></ProtectedRoute>} />
          <Route path="/admin/products/:id" element={<ProtectedRoute><AdminProductDetail /></ProtectedRoute>} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
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
