import React from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // Danh sách các routes không cần Header/Footer
  const authRoutes = [
    "/login",
    "/register",
    "/auth-demo",
    "/verify-email",
    "/resend-verification",
    "/reset-password",
  ];

  const isAuthRoute = authRoutes.includes(location.pathname);

  // Nếu là auth route, chỉ render children
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Ngược lại, render với Header và Footer
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
