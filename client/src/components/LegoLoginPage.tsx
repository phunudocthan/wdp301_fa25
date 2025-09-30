import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/LegoLoginPage.css";

interface Styles {
  [key: string]: React.CSSProperties;
}
interface LoginResult {
  token: string;
  role: string;
}
interface LegoLoginPageProps {
  onLogin: (email: string, password: string) => Promise<LoginResult>;
  onResendVerification: (email: string) => Promise<string | void>;
  onForgotPassword: () => void | Promise<void>;
  onNavigateRegister: () => void;
  googleAuthUrl: string;
  onLoginSuccess?: () => void;
  onGoogleToken?: (token: string) => Promise<void>;
}

const LegoLoginPage: React.FC<LegoLoginPageProps> = ({
  onLogin,
  onResendVerification,
  onForgotPassword,
  onNavigateRegister,
  googleAuthUrl,
  onLoginSuccess,
  onGoogleToken,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"login" | "resend" | null>(null);
  const isLoading = loadingAction !== null;
  const [showResendOption, setShowResendOption] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    if (!token) return;

    let cancelled = false;

    const clearTokenParam = () => {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete("token");
      nextParams.delete("role");
      const query = nextParams.toString();
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
      window.history.replaceState({}, document.title, nextUrl);
    };

    (async () => {
      try {
        if (onGoogleToken) {
          await onGoogleToken(token);
        }
        if (!cancelled) {
          // Lưu token + role vào localStorage
          localStorage.setItem("token", token);
          if (role) localStorage.setItem("role", role);

          setError(null);
          setInfo("Google login successful!");

          // Điều hướng dựa trên role
          if (role === "admin") {
            navigate("/shop");
          } else {
            navigate("/home");
          }

          onLoginSuccess?.();
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to complete Google login.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          clearTokenParam();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onGoogleToken, onLoginSuccess, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setError(null);
    setInfo(null);
    setLoadingAction("login");

    try {
      // onLogin giờ sẽ return { token, role }
      await onLogin(email, password);

      setInfo("Login successful!");
      setShowResendOption(false);

      // Không navigate ở đây nữa, để onLoginSuccess xử lý
      // Callback sau khi login thành công sẽ handle navigation
      onLoginSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.";

      setError(message);

      // Nếu lỗi liên quan đến xác thực email thì hiển thị resend option
      const lower = message.toLowerCase();
      if (lower.includes("verify") || lower.includes("xac")) {
        setShowResendOption(true);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }
    setError(null);
    setInfo(null);
    setLoadingAction("resend");
    try {
      const message = await onResendVerification(email);
      setInfo(message || "Verification email sent. Please check your inbox.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to resend verification email.";
      setError(message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleForgotPassword = () => {
    setError(null);
    setInfo(null);
    onForgotPassword();
  };

  const handleGoogleLogin = () => {
    window.location.href = googleAuthUrl;
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundDecorations}>
        <div style={{ ...styles.legoBrick, ...styles.brick1 }}></div>
        <div style={{ ...styles.legoBrick, ...styles.brick2 }}></div>
        <div style={{ ...styles.legoBrick, ...styles.brick3 }}></div>
        <div style={{ ...styles.legoBrick, ...styles.brick4 }}></div>
        <div style={{ ...styles.legoBrick, ...styles.brick5 }}></div>
      </div>

      <div style={styles.loginCard}>
        <div style={styles.logoContainer}>
          <div style={styles.legoLogo}>
            <div style={styles.logoText}>LEGO</div>
          </div>
        </div>

        <h2 style={styles.title}>Login</h2>
        <p style={styles.subtitle}>Welcome back! Please sign in to continue.</p>

        {error && (
          <p
            style={{
              color: "#ef4444",
              textAlign: "center",
              marginBottom: "10px",
            }}
          >
            {error}
          </p>
        )}

        {info && (
          <p
            style={{
              color: "#16a34a",
              textAlign: "center",
              marginBottom: "10px",
            }}
          >
            {info}
          </p>
        )}

        <form style={styles.loginForm} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email or username</label>
            <input
              type="email"
              value={email}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(event.target.value)
              }
              style={styles.input}
              placeholder="Enter your email"
              disabled={isLoading}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(event.target.value)
                }
                style={{ ...styles.input, paddingRight: "50px" }}
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={styles.eyeButton}
                disabled={isLoading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={styles.rememberForgot}>
            <label style={styles.checkboxContainer}>
              <input
                type="checkbox"
                style={styles.checkbox}
                disabled={isLoading}
              />
              <span style={styles.checkboxText}>Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isLoading}
              style={{
                ...styles.forgotLink,
                background: "none",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            style={{
              ...styles.loginButton,
              ...(isLoading ? { opacity: 0.5, cursor: "not-allowed" } : {}),
            }}
            disabled={isLoading}
          >
            {loadingAction === "login" ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid white",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span>Signing in...</span>
              </div>
            ) : (
              <span>LOG IN</span>
            )}
          </button>
        </form>

        {showResendOption && (
          <div style={{ textAlign: "center", marginTop: "15px" }}>
            <p style={{ color: "#666", fontSize: "14px" }}>
              Need a new verification email?{" "}
              <button
                onClick={handleResendVerification}
                style={{
                  ...styles.forgotLink,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
                disabled={isLoading}
              >
                Resend verification email
              </button>
            </p>
          </div>
        )}

        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine}></div>
        </div>

        <div style={styles.socialButtons}>
          <button
            style={{ ...styles.socialButton, ...styles.googleButton }}
            onClick={handleGoogleLogin}
            disabled={isLoading}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "#f5f5f5";
              event.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "white";
              event.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span style={styles.socialIcon}>G</span>
            Continue with Google
          </button>
        </div>

        <p style={styles.signupText}>
          Don't have an account yet?
          <a
            href="/register"
            style={styles.signupLink}
            onClick={(event) => {
              event.preventDefault();
              onNavigateRegister();
            }}
          >
            {" "}
            Create one now
          </a>
        </p>
      </div>
    </div>
  );
};

const styles: Styles = {
  container: {
    minHeight: "100vh",
    height: "100%",
    width: "100%",
    background:
      "linear-gradient(135deg, #2C3E7A 0%, #1E2761 50%, #0F1A4A 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Comic Sans MS', cursive, Arial, sans-serif",
    position: "relative",
    padding: "20px",
    boxSizing: "border-box",
  },
  backgroundDecorations: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 1,
    pointerEvents: "none",
  },
  legoBrick: {
    position: "absolute",
    background: "#2C3E7A",
    borderRadius: "8px",
    opacity: 0.15,
    animation: "float 6s ease-in-out infinite",
  },
  brick1: {
    width: "60px",
    height: "40px",
    top: "10%",
    left: "10%",
  },
  brick2: {
    width: "80px",
    height: "50px",
    top: "20%",
    right: "15%",
  },
  brick3: {
    width: "70px",
    height: "45px",
    bottom: "20%",
    left: "5%",
  },
  brick4: {
    width: "90px",
    height: "60px",
    bottom: "10%",
    right: "10%",
  },
  brick5: {
    width: "50px",
    height: "35px",
    top: "50%",
    left: "2%",
  },
  loginCard: {
    background: "white",
    borderRadius: "20px",
    padding: "15px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 40px rgba(15,26,74,0.3), 0 0 0 4px #2C3E7A",
    position: "relative",
    zIndex: 2,
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "15px",
  },
  legoLogo: {
    background: "linear-gradient(45deg, #2C3E7A, #1E2761)",
    color: "white",
    padding: "15px 30px",
    borderRadius: "15px",
    fontWeight: "bold",
    fontSize: "24px",
    textAlign: "center",
    boxShadow:
      "0 6px 12px rgba(15,26,74,0.4), inset 0 2px 0 rgba(255,255,255,0.3)",
    border: "3px solid #0F1A4A",
  },
  logoText: {
    letterSpacing: "3px",
    textShadow: "2px 2px 0 rgba(0,0,0,0.3)",
  },
  title: {
    color: "#333",
    fontSize: "25px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "10px",
    textShadow: "3px 3px 0px #2C3E7A, 6px 6px 10px rgba(15,26,74,0.2)",
  },
  subtitle: {
    color: "#666",
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "16px",
    fontWeight: "500",
  },
  loginForm: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
  },
  label: {
    color: "#333",
    fontWeight: "bold",
    fontSize: "14px",
    margin: "0",
    paddingLeft: "0",
    alignSelf: "flex-start",
  },
  input: {
    padding: "16px",
    border: "3px solid #2C3E7A",
    borderRadius: "12px",
    fontSize: "16px",
    outline: "none",
    transition: "all 0.3s ease",
    background: "#FAFAFA",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  passwordContainer: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#2C3E7A",
    fontSize: "18px",
    padding: "5px",
    borderRadius: "50%",
    transition: "all 0.2s ease",
  },
  rememberForgot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    marginTop: "10px",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    accentColor: "#2C3E7A",
    cursor: "pointer",
  },
  checkboxText: {
    color: "#666",
    fontWeight: "500",
  },
  forgotLink: {
    color: "#2C3E7A",
    textDecoration: "none",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  loginButton: {
    background: "linear-gradient(45deg, #2C3E7A, #1E2761)",
    color: "white",
    padding: "18px",
    borderRadius: "15px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "2px",
    boxShadow:
      "0 8px 16px rgba(44, 62, 122, 0.4), inset 0 2px 0 rgba(255,255,255,0.2)",
    border: "3px solid #0F1A4A",
    marginTop: "10px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "10px 0",
    color: "#999",
  },
  dividerLine: {
    flex: 1,
    height: "2px",
    background: "linear-gradient(to right, transparent, #ddd, transparent)",
  },
  dividerText: {
    padding: "0 20px",
    background: "white",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#666",
  },
  socialButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  socialButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "14px",
    border: "3px solid",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "white",
  },
  googleButton: {
    borderColor: "#4285F4",
    color: "#4285F4",
  },
  facebookButton: {
    borderColor: "#1877F2",
    color: "#1877F2",
  },
  socialIcon: {
    fontSize: "20px",
  },
  signupText: {
    textAlign: "center",
    marginTop: "15px",
    color: "#666",
    fontSize: "15px",
    fontWeight: "500",
  },
  signupLink: {
    color: "#2C3E7A",
    fontWeight: "bold",
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
};

const styleSheet = document.styleSheets[0];
if (styleSheet) {
  styleSheet.insertRule(
    `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,
    styleSheet.cssRules.length
  );
}

export default LegoLoginPage;
