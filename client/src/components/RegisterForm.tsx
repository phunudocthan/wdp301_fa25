import React, { useState } from "react";

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  acceptTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  acceptTerms?: string;
}

interface RegisterFormProps {
  onRegister: (payload: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  onNavigateLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onNavigateLogin }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Email is not valid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = "Phone number must be 10-11 digits";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError(null);
    setStatusMessage(null);

    try {
      await onRegister({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
      });

      setStatusMessage("Account created! Please check your email to verify.");
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        acceptTerms: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setSubmitError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
    },
    card: {
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 8px 32px rgba(30, 58, 138, 0.3)",
      padding: "32px",
      width: "100%",
      maxWidth: "400px",
    },
    header: {
      textAlign: "center",
      marginBottom: "32px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1f2937",
      marginBottom: "8px",
    },
    subtitle: {
      color: "#4b5563",
      fontSize: "14px",
    },
    statusMessage: {
      background: "#ecfdf5",
      color: "#047857",
      padding: "12px",
      borderRadius: "8px",
      textAlign: "center",
      fontSize: "14px",
      fontWeight: "500",
      marginBottom: "16px",
    },
    errorMessage: {
      background: "#fef2f2",
      color: "#b91c1c",
      padding: "12px",
      borderRadius: "8px",
      textAlign: "center",
      fontSize: "14px",
      fontWeight: "500",
      marginBottom: "16px",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    },
    inputGroup: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
    },
    label: {
      fontSize: "14px",
      fontWeight: "bold",
      color: "#374151",
      minWidth: "120px",
      textAlign: "left",
    },
    input: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "2px solid #d1d5db",
      outline: "none",
      fontSize: "16px",
      transition: "border-color 0.3s ease",
    },
    inputError: {
      border: "2px solid #ef4444",
    },
    errorText: {
      color: "#ef4444",
      fontSize: "12px",
      marginTop: "4px",
    },
    checkboxContainer: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      color: "#374151",
    },
    checkbox: {
      width: "16px",
      height: "16px",
      border: "2px solid #d1d5db",
      borderRadius: "4px",
    },
    checkboxError: {
      border: "2px solid #ef4444",
    },
    link: {
      color: "#1e40af",
      textDecoration: "underline",
    },
    linkHover: {
      color: "#1e3a8a",
    },
    button: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "bold",
      background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
      boxShadow: "0 4px 15px rgba(30, 58, 138, 0.3)",
      transition: "all 0.2s ease",
      cursor: "pointer",
    },
    buttonLoading: {
      background: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
      opacity: 0.5,
      cursor: "not-allowed",
    },
    spinner: {
      width: "20px",
      height: "20px",
      border: "2px solid white",
      borderTop: "2px solid transparent",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    buttonContent: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    loginLink: {
      textAlign: "center",
      marginTop: "24px",
    },
    loginText: {
      color: "#4b5563",
      fontSize: "14px",
    },
    loginLinkText: {
      color: "#1e40af",
      fontWeight: "bold",
      textDecoration: "underline",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create your account</h2>
          <p style={styles.subtitle}>Join the LEGO world in just a few steps.</p>
        </div>

        {submitError && <div style={styles.errorMessage}>{submitError}</div>}
        {statusMessage && <div style={styles.statusMessage}>{statusMessage}</div>}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label htmlFor="fullName" style={styles.label}>
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              style={{
                ...styles.input,
                ...(errors.fullName ? styles.inputError : {}),
              }}
              placeholder="Your name"
              autoComplete="name"
            />
            {errors.fullName && (
              <p style={styles.errorText}>{errors.fullName}</p>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={{
                ...styles.input,
                ...(errors.email ? styles.inputError : {}),
              }}
              placeholder="example@email.com"
              autoComplete="username"
            />
            {errors.email && <p style={styles.errorText}>{errors.email}</p>}
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="phone" style={styles.label}>
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              style={{
                ...styles.input,
                ...(errors.phone ? styles.inputError : {}),
              }}
              placeholder="0123456789"
            />
            {errors.phone && <p style={styles.errorText}>{errors.phone}</p>}
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={{
                ...styles.input,
                ...(errors.password ? styles.inputError : {}),
              }}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
            {errors.password && (
              <p style={styles.errorText}>{errors.password}</p>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={{
                ...styles.input,
                ...(errors.confirmPassword ? styles.inputError : {}),
              }}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p style={styles.errorText}>{errors.confirmPassword}</p>
            )}
          </div>

          <div style={styles.checkboxContainer}>
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              style={{
                ...styles.checkbox,
                ...(errors.acceptTerms ? styles.checkboxError : {}),
              }}
            />
            <span>
              I agree with{" "}
              <a
                href="#"
                style={styles.link}
                onMouseEnter={(event) =>
                  (event.currentTarget.style.color =
                    styles.linkHover.color || "#1e40af")
                }
                onMouseLeave={(event) =>
                  (event.currentTarget.style.color = styles.link.color || "#1e40af")
                }
              >
                terms of service
              </a>{" "}and{" "}
              <a
                href="#"
                style={styles.link}
                onMouseEnter={(event) =>
                  (event.currentTarget.style.color =
                    styles.linkHover.color || "#1e40af")
                }
                onMouseLeave={(event) =>
                  (event.currentTarget.style.color = styles.link.color || "#1e40af")
                }
              >
                privacy policy
              </a>
            </span>
          </div>
          {errors.acceptTerms && (
            <p style={styles.errorText}>{errors.acceptTerms}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonLoading : {}),
            }}
          >
            {isLoading ? (
              <div style={styles.buttonContent}>
                <div style={styles.spinner} />
                <span>Processing...</span>
              </div>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div style={styles.loginLink}>
          <p style={styles.loginText}>
            Already have an account?{" "}
            <a
              href="/login"
              style={styles.loginLinkText}
              onClick={(event) => {
                event.preventDefault();
                onNavigateLogin();
              }}
              onMouseEnter={(event) =>
                (event.currentTarget.style.color =
                  styles.linkHover.color || "#1e40af")
              }
              onMouseLeave={(event) =>
                (event.currentTarget.style.color =
                  styles.loginLinkText.color || "#1e40af")
              }
            >
              Log in now
            </a>
          </p>
        </div>
      </div>
    </div>

  );
};

// Định nghĩa animation cho spinner
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

export default RegisterForm;






