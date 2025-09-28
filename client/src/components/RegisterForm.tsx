import React, { useState } from "react";
import axios from "axios";

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

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Họ và tên là bắt buộc";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!formData.phone) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Bạn phải đồng ý với điều khoản sử dụng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register", // URL cố định tạm thời
        {
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }
      );
      alert(response.data.message);
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        acceptTerms: false,
      });
    } catch (error: any) {
      console.error("Error details:", error.response?.data || error.message);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra, vui lòng thử lại!"
      );
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
          <h2 style={styles.title}>Đăng Ký</h2>
          <p style={styles.subtitle}>Tạo tài khoản mới của bạn</p>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={styles.inputGroup}>
            <label htmlFor="fullName" style={styles.label}>
              Họ và Tên *
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
              placeholder="Nhập họ và tên"
            />
            {errors.fullName && (
              <p style={styles.errorText}>{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
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
              autoComplete="username" // Thêm thuộc tính này
            />
            {errors.email && <p style={styles.errorText}>{errors.email}</p>}
          </div>

          {/* Phone */}
          <div style={styles.inputGroup}>
            <label htmlFor="phone" style={styles.label}>
              Số Điện Thoại *
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

          {/* Password */}
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>
              Mật Khẩu *
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
              placeholder="Ít nhất 6 ký tự"
              autoComplete="new-password"
            />
            {errors.password && (
              <p style={styles.errorText}>{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Xác Nhận Mật Khẩu *
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
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p style={styles.errorText}>{errors.confirmPassword}</p>
            )}
          </div>

          {/* Terms and Conditions */}
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
              Tôi đồng ý với{" "}
              <a
                href="#"
                style={styles.link}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color =
                    styles.linkHover.color || "#1e40af")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = styles.link.color || "#1e40af")
                }
              >
                điều khoản sử dụng
              </a>{" "}
              và{" "}
              <a
                href="#"
                style={styles.link}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color =
                    styles.linkHover.color || "#1e40af")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = styles.link.color || "#1e40af")
                }
              >
                chính sách bảo mật
              </a>
            </span>
          </div>
          {errors.acceptTerms && (
            <p style={styles.errorText}>{errors.acceptTerms}</p>
          )}

          {/* Submit Button */}
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
                <span>Đang xử lý...</span>
              </div>
            ) : (
              "Đăng Ký"
            )}
          </button>
        </form>

        {/* Login Link */}
        <div style={styles.loginLink}>
          <p style={styles.loginText}>
            Đã có tài khoản?{" "}
            <a
              href="/login"
              style={styles.loginLinkText}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color =
                  styles.linkHover.color || "#1e40af")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color =
                  styles.loginLinkText.color || "#1e40af")
              }
            >
              Đăng nhập ngay
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
