import { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthed, booted } = useAuth();
  const loc = useLocation();

  // Khi app chưa boot (đang check token) -> không render gì cả
  if (!booted) return null;

  // Nếu chưa login -> redirect về login
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  // Nếu đã login -> render children
  return children;
}
