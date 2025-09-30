import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSignOutAlt } from "react-icons/fa";

interface LogoutButtonProps {
  className?: string;
  showIcon?: boolean;
  variant?: "button" | "link";
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = "",
  showIcon = true,
  variant = "button",
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const baseClasses =
    variant === "button"
      ? "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
      : "inline-flex items-center text-sm hover:underline";

  const variantClasses =
    variant === "button"
      ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
      : "text-red-600 hover:text-red-700";

  return (
    <button
      onClick={handleLogout}
      className={`${baseClasses} ${variantClasses} ${className}`}
      title="Đăng xuất"
    >
      {showIcon && (
        <FaSignOutAlt className={variant === "button" ? "mr-2" : "mr-1"} />
      )}
      Đăng xuất
    </button>
  );
};

export default LogoutButton;
