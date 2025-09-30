// src/components/common/Header.tsx
import { NavLink, useNavigate } from "react-router-dom";
import { FaSearch, FaHeart, FaShoppingBag, FaBell } from "react-icons/fa";
import { useState } from "react";
import logo from "/logo.png";
import LoginModal from "../ui/LoginModal";
import "../../styles/layout.scss";

export default function Header() {
  const [query, setQuery] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const name = localStorage.getItem("name") || "A";
  const avatar = localStorage.getItem("avatar");

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
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

        <nav className="nav">
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/new">Home</NavLink>
          <NavLink to="/addresses">Address Book</NavLink>
          <NavLink to="/notifications">Notifications</NavLink>
        </nav>

        <div className="header-right">
          <form className="search-box" onSubmit={handleSearchSubmit}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>

          <div className="icons">
            <FaBell
              className="icon"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/notifications')}
            />
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
