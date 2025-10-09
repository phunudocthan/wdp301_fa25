import { useEffect } from "react";
import { useAuth } from "../components/context/AuthContext";
import { isTokenExpired } from "../utils/tokenUtils";
import { storage } from "../lib/storage";

/**
 * Hook to automatically handle token expiration
 * Checks token validity periodically and logs out user if expired
 */
export function useTokenExpirationCheck() {
  const { logout, user } = useAuth();

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = storage.getToken();

      // If user is logged in but token is expired
      if (user && token && isTokenExpired(token)) {
        console.warn("Token expired, logging out user");
        logout();
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiration, 30000);

    return () => clearInterval(interval);
  }, [user, logout]);
}

/**
 * Hook for components that require authentication
 * Automatically redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { user, booted } = useAuth();

  useEffect(() => {
    if (booted && !user) {
      // Redirect to login page
      window.location.href = "/login?required=true";
    }
  }, [user, booted]);

  return { user, isAuthenticated: !!user, isLoading: !booted };
}
