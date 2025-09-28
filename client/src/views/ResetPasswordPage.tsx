import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";

const gradientBackground = {
  background: "linear-gradient(135deg, #e0e7ff 0%, #fff 40%, #fde68a 100%)",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: "24px",
  boxShadow: "0 24px 45px rgba(15, 23, 42, 0.15)",
  width: "100%",
  maxWidth: "440px",
  padding: "48px 40px",
  position: "relative",
  overflow: "hidden",
};

const headingStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "24px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#111827",
  marginBottom: "6px",
};

const subtitleStyle: React.CSSProperties = {
  color: "#4B5563",
  fontSize: "15px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  color: "#1F2937",
  marginBottom: "6px",
};

const inputWrapperStyle: React.CSSProperties = {
  position: "relative",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 48px 16px 48px",
  borderRadius: "14px",
  border: "1px solid #E5E7EB",
  fontSize: "16px",
  transition: "all 0.2s ease",
  backgroundColor: "#F9FAFB",
};

const iconStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "16px",
  transform: "translateY(-50%)",
  color: "#9CA3AF",
};

const toggleButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: "16px",
  transform: "translateY(-50%)",
  border: "none",
  background: "transparent",
  color: "#6B7280",
  cursor: "pointer",
  padding: 0,
};

const submitButtonStyle: React.CSSProperties = {
  width: "100%",
  background: "linear-gradient(120deg, #2563EB 0%, #7C3AED 70%, #EC4899 100%)",
  color: "white",
  padding: "16px",
  borderRadius: "14px",
  fontWeight: 600,
  fontSize: "16px",
  border: "none",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  boxShadow: "0 18px 30px rgba(124, 58, 237, 0.35)",
};

const messageStyle = (type: "success" | "error"): React.CSSProperties => ({
  marginTop: "18px",
  textAlign: "center",
  fontWeight: 500,
  color: type === "success" ? "#047857" : "#DC2626",
});

const helperTextStyle: React.CSSProperties = {
  marginTop: "8px",
  color: "#6B7280",
  fontSize: "13px",
};

const linkStyle: React.CSSProperties = {
  color: "#2563EB",
  fontWeight: 600,
  textDecoration: "none",
};

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Reset token is missing. Please request a new password reset email.");
    }
  }, [token]);

  useEffect(() => {
    if (status === "success") {
      const timeout = setTimeout(() => navigate("/login", { replace: true }), 3500);
      return () => clearTimeout(timeout);
    }
  }, [status, navigate]);

  const validatePasswords = useCallback((): string | null => {
    if (!password || !confirmPassword) {
      return "Please enter the new password in both fields.";
    }
    if (password.length < 8) {
      return "Password must contain at least 8 characters.";
    }
    if (password !== confirmPassword) {
      return "Confirmation does not match the new password.";
    }
    return null;
  }, [password, confirmPassword]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading") return;

    const validationMessage = validatePasswords();
    if (validationMessage) {
      setStatus("error");
      setMessage(validationMessage);
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("Reset token is invalid or expired.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");
      const response = await resetPassword(token, password);
      setStatus("success");
      setMessage(response.message || response.msg || "Password updated successfully. Redirecting to login page...");
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Unable to reset password. Please try again.";
      setStatus("error");
      setMessage(errMessage);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        ...gradientBackground,
      }}
    >
      <div style={cardStyle}>
        <div style={{ position: "absolute", top: "-60px", right: "-40px", width: "180px", height: "180px", background: "#eef2ff", borderRadius: "50%", opacity: 0.6 }} />
        <div style={{ position: "absolute", bottom: "-70px", left: "-60px", width: "220px", height: "220px", background: "#fef3c7", borderRadius: "50%", opacity: 0.55 }} />

        <div style={headingStyle}>
          <h1 style={titleStyle}>Reset your password</h1>
          <p style={subtitleStyle}>Create a new password to keep your account secure.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px", position: "relative", zIndex: 1 }}>
          <div>
            <label style={labelStyle} htmlFor="password">
              New password
            </label>
            <div style={inputWrapperStyle}>
              <Lock size={20} style={iconStyle} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: status === "error" && message ? "#FCA5A5" : "#E5E7EB",
                }}
                placeholder="Enter a new password"
                disabled={status === "loading" || !token}
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={toggleButtonStyle}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p style={helperTextStyle}>Use at least 8 characters with a mix of letters, numbers and symbols.</p>
          </div>

          <div>
            <label style={labelStyle} htmlFor="confirmPassword">
              Confirm password
            </label>
            <div style={inputWrapperStyle}>
              <Lock size={20} style={iconStyle} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: status === "error" && message ? "#FCA5A5" : "#E5E7EB",
                }}
                placeholder="Re-enter the new password"
                disabled={status === "loading" || !token}
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                style={toggleButtonStyle}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...submitButtonStyle,
              opacity: status === "loading" || !token ? 0.6 : 1,
              cursor: status === "loading" || !token ? "not-allowed" : "pointer",
            }}
            disabled={status === "loading" || !token}
          >
            {status === "loading" ? "Updating password..." : "Update password"}
          </button>
        </form>

        {message && status !== "idle" && (
          <div style={messageStyle(status === "success" ? "success" : "error")}>{message}</div>
        )}

        <div style={{ marginTop: "24px", textAlign: "center", color: "#4B5563", position: "relative", zIndex: 1 }}>
          <span>Remember the old password? </span>
          <Link to="/login" style={linkStyle}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
