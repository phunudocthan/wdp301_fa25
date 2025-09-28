import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LegoLoginPage from "../components/LegoLoginPage";
import { useAuth } from "../components/context/AuthContext";
import {
  requestEmailVerification,
  requestPasswordReset,
} from "../api/auth";

const Login = () => {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const googleAuthUrl = useMemo(() => {
    const base = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:5000";
    return `${base.replace(/\/$/, "")}/api/auth/google`;
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      await login(email, password);
    },
    [login]
  );

  const handleLoginSuccess = useCallback(() => {
    const redirectTo = (
      (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname || "/profile"
    );
    navigate(redirectTo, { replace: true });
  }, [location.state, navigate]);

  const handleResendVerification = useCallback(async (email: string) => {
    const { msg, message } = await requestEmailVerification(email);
    return message || msg;
  }, []);

  const handleForgotPassword = useCallback(async (email: string) => {
    const { msg, message } = await requestPasswordReset(email);
    return message || msg || "Password reset email sent.";
  }, []);

  const handleGoogleToken = useCallback(
    async (token: string) => {
      await loginWithToken(token);
    },
    [loginWithToken]
  );

  const handleNavigateRegister = useCallback(() => {
    navigate("/register");
  }, [navigate]);

  return (
    <LegoLoginPage
      onLogin={handleLogin}
      onResendVerification={handleResendVerification}
      onForgotPassword={handleForgotPassword}
      onNavigateRegister={handleNavigateRegister}
      googleAuthUrl={googleAuthUrl}
      onLoginSuccess={handleLoginSuccess}
      onGoogleToken={handleGoogleToken}
    />
  );
};

export default Login;
