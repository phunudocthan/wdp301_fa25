import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.scss";

const AuthDemo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🧱 LEGO Store</h1>
          <p>Trang đăng nhập sạch sẽ, không có header/footer</p>
        </div>

        <div className="auth-body">
          <div className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder="your@email.com"
                disabled
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Mật khẩu</label>
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                disabled
              />
            </div>

            <button className="auth-button" onClick={() => navigate("/new")}>
              Trở về trang chủ (có Header/Footer)
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Đây là demo trang auth.
              <br />
              <a href="/new" className="auth-link">
                Trang chủ
              </a>{" "}
              sẽ có Header/Footer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDemo;
