import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LegoLoginPage from "../components/LegoLoginPage";
import { useAuth } from "../components/context/AuthContext";
import { requestEmailVerification } from "../api/auth";
import {
  getApiBaseURL,
  subscribeApiBaseURL,
} from "../api/axiosInstance";

interface LoginResult {
  token: string;
  role: string;
}

const Login = () => {
  const { login, loginWithToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const toGoogleAuthUrl = (baseURL: string) =>
    `${baseURL.replace(/\/api$/, "")}/auth/google`;
  const [googleAuthUrl, setGoogleAuthUrl] = useState(() =>
    toGoogleAuthUrl(getApiBaseURL())
  );

  useEffect(() => {
    const unsubscribe = subscribeApiBaseURL((url) => {
      setGoogleAuthUrl(toGoogleAuthUrl(url));
    });
    return unsubscribe;
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const result = await login(email, password);
      setLoginResult(result);
      return result;
    },
    [login]
  );

  const handleLoginSuccess = useCallback(() => {
    const role = loginResult?.role;
    let redirectTo;
    console.log("Login success, role:", role);
    if (role === "admin") {
      redirectTo = "/admin";
    } else if (role === "customer" || role === "seller") {
      redirectTo = "/home";
    }

    navigate(redirectTo || location.state?.from || "/home");
  }, [loginResult, location.state, navigate]);
  useEffect(() => {
    if (loginResult?.role) {
      handleLoginSuccess();
    }
  }, [loginResult, handleLoginSuccess]);

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
