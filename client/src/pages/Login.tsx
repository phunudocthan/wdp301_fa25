import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LegoLoginPage from "../components/LegoLoginPage";
import { useAuth } from "../components/context/AuthContext";
import { requestEmailVerification, requestPasswordReset } from "../api/auth";

const Login = () => {
  const { login, loginWithToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginResult, setLoginResult] = useState<{
    token: string;
    role: string;
  } | null>(null);

  const googleAuthUrl = useMemo(() => {
    const base =
      (import.meta.env.VITE_API_URL as string | undefined) ||
      "http://localhost:5000";
    return `${base.replace(/\/$/, "")}/api/auth/google`;
  }, []);

  const handleLogin = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ token: string; role: string }> => {
      // Sử dụng AuthContext login thay vì gọi API trực tiếp
      const result = await login(email, password);
      setLoginResult(result); // Lưu kết quả login
      return result;
    },
    [login]
  );

<<<<<<< HEAD
  const handleLoginSuccess = () => {
  console.log("Login successful, navigating...");
  };
=======
  const handleLoginSuccess = useCallback(() => {
    // Sử dụng role từ login result thay vì user state (để tránh timing issue)
    const role = loginResult?.role || user?.role;

    console.log(
      "handleLoginSuccess - loginResult:",
      loginResult,
      "user:",
      user,
      "role:",
      role
    ); // Debug log

    let redirectTo = "/profile"; // mặc định

    if (role === "admin") {
      redirectTo = "/admin";
    } else if (role === "customer" || role === "seller") {
      redirectTo = "/user";
    } else {
      // Nếu có from state (redirect sau login), ưu tiên từ location state
      redirectTo =
        (location.state as { from?: { pathname?: string } } | undefined)?.from
          ?.pathname || "/profile";
    }

    console.log("Navigating to:", redirectTo); // Debug log
    navigate(redirectTo, { replace: true });
  }, [loginResult, user, location.state, navigate]);
>>>>>>> d8ff730dacc697f5f429b7be7e95633ecd67bdbb

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
