// src/components/common/Header.tsx
import { NavLink } from "react-router-dom";
import { FaSearch, FaHeart, FaShoppingBag } from "react-icons/fa";
import { useState } from "react";
import logo from "/logo.png";
import LoginModal from "../ui/LoginModal";
import "../../styles/layout.scss";

export default function Header() {
  const [query, setQuery] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // Lấy thông tin user từ localStorage
  const name = localStorage.getItem("name") || "A";
  const avatar = localStorage.getItem("avatar");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      window.location.href = `/shop?search=${encodeURIComponent(query)}`;
      setQuery("");
    }
  };

  return (
    <header className="header">
      <div className="container header-inner">
        {/* Logo + Brand */}
        <div
          className="brand"
          onClick={() => (window.location.href = "/new")}
          style={{ cursor: "pointer" }}
        >
          <img src={logo} alt="LEGO Logo" className="logo" />
          <span>LEGOs</span>
        </div>

        {/* Nav Menu */}
        <nav className="nav">
          <NavLink to="/shop">Cửa Hàng</NavLink>
          <NavLink to="/help">Về chúng tôi</NavLink>
          <NavLink to="/new">Trang chủ</NavLink>
        </nav>

        {/* Search + Icons */}
        <div className="header-right">
          <form className="search-box" onSubmit={handleSearchSubmit}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <div className="icons">
            <FaHeart className="icon" />
            <FaShoppingBag className="icon" />
          </div>

          {/* Avatar hoặc nút đăng nhập */}
          {avatar ? (
            <div
              onClick={() => (window.location.href = "/profile")}
              className="rounded-full overflow-hidden h-8 w-8 cursor-pointer hover:ring-2 hover:ring-blue-600 ml-4"
              title="Trang cá nhân"
            >
              <img
                src={avatar}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* Modal Login */}
<LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </header>
  );
}
