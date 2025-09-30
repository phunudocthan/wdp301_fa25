import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LegoLoginPage from "../components/LegoLoginPage";
import { useAuth } from "../components/context/AuthContext";
import { requestEmailVerification } from "../api/auth";

const Login = () => {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const googleAuthUrl = useMemo(() => {
    const base = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:5001";
    return `${base.replace(/\/$/, "")}/api/auth/google`;
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      await login(email, password);
    },
    [login]
  );

  const handleLoginSuccess = () => {
  console.log("Login successful, navigating...");
  };

  const handleResendVerification = useCallback(async (email: string) => {
    const { msg, message } = await requestEmailVerification(email);
    return message || msg;
  }, []);

  const handleForgotPassword = useCallback(() => {
    navigate("/forgot-password");
  }, [navigate]);

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
