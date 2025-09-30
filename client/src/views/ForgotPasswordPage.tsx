import React, { useCallback, useState } from "react";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";

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
  padding: "16px 16px 16px 48px",
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

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "loading") return;

      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setStatus("error");
        setMessage("Please enter the email tied to your account.");
        return;
      }

      try {
        setStatus("loading");
        setMessage("");
        const response = await requestPasswordReset(trimmedEmail);
        setStatus("success");
        setMessage(response.message || response.msg || "If an account exists for that email, you'll receive reset instructions shortly.");
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Unable to send reset instructions. Please try again.";
        setStatus("error");
        setMessage(errMessage);
      }
    },
    [email, status]
  );

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
          <h1 style={titleStyle}>Forgot your password?</h1>
          <p style={subtitleStyle}>Enter your email to receive a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px", position: "relative", zIndex: 1 }}>
          <div>
            <label style={labelStyle} htmlFor="email">
              Email address
            </label>
            <div style={inputWrapperStyle}>
              <Mail size={20} style={iconStyle} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: status === "error" && message ? "#FCA5A5" : "#E5E7EB",
                }}
                placeholder="you@example.com"
                disabled={status === "loading"}
                autoComplete="email"
              />
            </div>
            <p style={helperTextStyle}>We'll send password reset instructions to this email.</p>
          </div>

          <button
            type="submit"
            style={{
              ...submitButtonStyle,
              opacity: status === "loading" ? 0.6 : 1,
              cursor: status === "loading" ? "not-allowed" : "pointer",
            }}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>

        {message && status !== "idle" && (
          <div style={messageStyle(status === "success" ? "success" : "error")}>{message}</div>
        )}

        <div style={{ marginTop: "24px", textAlign: "center", color: "#4B5563", position: "relative", zIndex: 1 }}>
          <span>Remembered your password? </span>
          <Link to="/login" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
