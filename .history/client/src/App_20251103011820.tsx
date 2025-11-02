import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/context/AuthContext";
import { useTokenExpirationCheck } from "./hooks/useAuthHooks";
import { SessionNotifications } from "./components/SessionNotifications";

// Headers
import Header from "./components/common/Header";
import EmployeeHeader from "./components/common/EmployeeHeader";

// Auth / guard
import ProtectedRoute from "./routes/ProtectedRoute";
import "bootstrap/dist/css/bootstrap.min.css";

// Auth pages
import Login from "./components/LegoLoginPage";
import Register from "./pages/Register";
import VerifyEmailPage from "./views/VerifyEmailPage";
import ResendVerificationPage from "./views/ResendVerificationPage";
import ResetPasswordPage from "./views/ResetPasswordPage";
import ForgotPasswordPage from "./views/ForgotPasswordPage";

// User pages
import HomePage from "./pages/Home";
import FeaturedPage from "./pages/FeaturedPage";
import PopularPage from "./pages/PopularPage";
import GamingPage from "./pages/GamingPage";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutReorder from "./pages/CheckoutReorder";
import OrderSuccess from "./pages/OrderSuccess";
import ProfilePage from "./views/ProfilePage";
import AddressBookPage from "./views/AddressBookPage";
import NotificationsPage from "./views/NotificationsPage";
import FavoritesPage from "./pages/Favorites";
import UserDashboard from "./pages/UserDashboard";
import OrderListUser from "./pages/OrderListUser";
import OrderHistoryListUser from "./pages/OrderHistoryList";
import OrderDetailUser from "./pages/OrderDetailUser";

// Content pages
import NewsList from "./pages/NewsList";
import NewsDetail from "./pages/NewsDetail";
import ThemesPage from "./pages/ThemesPage";
import ThemeDetailPage from "./pages/ThemeDetailPage";
import CharacterDetailPage from "./pages/CharacterDetailPage";

// Employee pages
import EmployeeNews from "./pages/EmployeeNews";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import ProfileAdminPage from "./components/ProfileNew";
import AdminProfile from "./pages/AdminProfile";
import AdminRevenueDashboard from "./views/AdminRevenueDashboard";
import AdminOrdersDashboard from "./views/AdminOrdersDashboard";
import AdminUsersPage from "./views/AdminUsersPage";
import AdminUserDetailPage from "./views/AdminUserDetailPage";
import OrdersList from "./pages/admin/OrdersList";
import OrderDetail from "./pages/admin/OrderDetail";
import AdminProductManagement from "./pages/AdminProductManagement";
import AdminProductDetail from "./pages/AdminProductDetail";
import AdminProductEdit from "./pages/AdminProductEdit";
import AdminVoucherManagement from "./pages/AdminVoucherManagement";
import AdminVoucherStatistics from "./pages/AdminVoucherStatistics";
import AdminNotificationPage from "./views/AdminNotificationPage";
import AdminThemeManagement from "./pages/AdminThemeManagement";
import AdminCharacterManagement from "./pages/AdminCharacterManagement";


import AIChatWidget from "./components/ai/AIChatWidget";
import AdminCategoryManagement from "./pages/AdminCategoryManagement_new";
function ProfileAdminWrapper() {
  const { user } = useAuth();
  if (!user) return <div>Loading...</div>;
  return <ProfileAdminPage user={user} />;
}

function AppContent() {
  useTokenExpirationCheck();
  const location = useLocation();
  const { user } = useAuth();

  const role = user?.role ?? "guest";
  const isAdmin = role === "admin";
  const isEmployee = role === "employee";

  // Các trang không hiển thị Header
  const pagesWithoutHeader = new Set([
    "/login",
    "/register",
    "/verify-email",
    "/resend-verification",
    "/forgot-password",
    "/reset-password",
    "/",
  ]);

  const shouldShowHeader = !pagesWithoutHeader.has(location.pathname);
const shouldShowChat = !pagesWithoutHeader.has(location.pathname);
  // --- Nhánh EMPLOYEE: chỉ cho phép EmployeeNews + EmployeeHeader ---
  if (isEmployee) {
    return (
      <div>
        {shouldShowHeader && <EmployeeHeader />}
        <SessionNotifications />
        <main>
          <Routes>
            <Route
              path="/employee/news"
              element={
                <ProtectedRoute>
                  <EmployeeNews />
                </ProtectedRoute>
              }
            />
            {/* mọi path khác chuyển về employee/news */}
            <Route path="*" element={<Navigate to="/employee/news" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Helper: nếu là admin, chuyển người dùng khỏi các trang client
  const redirectIfAdmin = (element: React.ReactElement) =>
    isAdmin ? <Navigate to="/admin" replace /> : element;

  return (
    <div>
      {/* Admin & User đều dùng Header đầy đủ (ẩn trên trang auth) */}
      {shouldShowHeader && <Header />}
      <SessionNotifications />
      <main>
        <Routes>
          {/* Common redirects */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Client routes (user thường) */}
          <Route path="/home" element={redirectIfAdmin(<HomePage />)} />
          <Route path="/home/featured" element={redirectIfAdmin(<FeaturedPage />)} />
          <Route path="/home/popular" element={redirectIfAdmin(<PopularPage />)} />
          <Route path="/home/gaming" element={redirectIfAdmin(<GamingPage />)} />
          <Route path="/shop" element={redirectIfAdmin(<Shop />)} />
          <Route path="/product/:id" element={redirectIfAdmin(<ProductDetail />)} />
          <Route path="/cart" element={redirectIfAdmin(<Cart />)} />
          <Route path="/checkout" element={redirectIfAdmin(<Checkout />)} />
          <Route path="/checkout-reorder/:reorderId" element={redirectIfAdmin(<CheckoutReorder />)} />
          <Route path="/order-success" element={redirectIfAdmin(<OrderSuccess />)} />

          {/* Orders (user) */}
          <Route path="/orders" element={redirectIfAdmin(<OrderListUser />)} />
          <Route path="/history-orders" element={redirectIfAdmin(<OrderHistoryListUser />)} />
          <Route path="/orders/detail/:id" element={redirectIfAdmin(<OrderDetailUser />)} />

          {/* Content: themes/characters/news (client) */}
          <Route path="/themes" element={redirectIfAdmin(<ThemesPage />)} />
          <Route path="/themes/:id" element={redirectIfAdmin(<ThemeDetailPage />)} />
          <Route path="/characters/:id" element={redirectIfAdmin(<CharacterDetailPage />)} />
          <Route path="/news" element={redirectIfAdmin(<NewsList />)} />
          <Route path="/news/:id" element={redirectIfAdmin(<NewsDetail />)} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/resend-verification" element={<ResendVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* User profile & protected client features */}
          <Route
            path="/profile"
            element={
              isAdmin ? (
                <Navigate to="/admin/profile" replace />
              ) : (
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              )
            }
          />
          <Route
            path="/addresses"
            element={redirectIfAdmin(
              <ProtectedRoute>
                <AddressBookPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/notifications"
            element={redirectIfAdmin(
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/favorites"
            element={redirectIfAdmin(
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/user"
            element={redirectIfAdmin(
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            )}
          />

          {/* --- ADMIN ROUTES --- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute>
                <AdminProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profileAdmin"
            element={
              <ProtectedRoute>
                <ProfileAdminWrapper />
              </ProtectedRoute>
            }
          />
          {/* analytics */}
          <Route
            path="/admin/dashboard/revenue"
            element={
              <ProtectedRoute>
                <AdminRevenueDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard/orders"
            element={
              <ProtectedRoute>
                <AdminOrdersDashboard />
              </ProtectedRoute>
            }
          />
          {/* users */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute>
                <AdminUserDetailPage />
              </ProtectedRoute>
            }
          />
          {/* notifications (admin) */}
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute>
                <AdminNotificationPage />
              </ProtectedRoute>
            }
          />
          {/* orders (admin) */}
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
          {/* products / categories / vouchers */}
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute>
                <AdminProductManagement />
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
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <AdminCategoryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vouchers"
            element={
              <ProtectedRoute>
                <AdminVoucherManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/voucher-statistics"
            element={
              <ProtectedRoute>
                <AdminVoucherStatistics />
              </ProtectedRoute>
            }
          />
          {/* themes / characters (admin) */}
          <Route
            path="/admin/themes"
            element={
              <ProtectedRoute>
                <AdminThemeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/characters"
            element={
              <ProtectedRoute>
                <AdminCharacterManagement />
              </ProtectedRoute>
            }
          />

          {/* Employee (nếu ai đó cố truy cập, non-employee sẽ bị đá sang login) */}
          <Route
            path="/employee/news"
            element={
              isAdmin || isEmployee ? (
                <ProtectedRoute>
                  <EmployeeNews />
                </ProtectedRoute>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
      {shouldShowChat && <AIChatWidget />}
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
