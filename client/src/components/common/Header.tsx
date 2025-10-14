import { NavLink, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaHeart,
  FaShoppingBag,
  FaBell,
  FaChevronDown,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import logo from "/logo.png";
import "../../styles/layout.scss";
import { fetchNotifications } from "../../api/notifications";

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [numberNotifications, setNumberNotifications] = useState(0);

  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const name = user?.name || localStorage.getItem("name") || "User";
  const avatar = user?.avatar || localStorage.getItem("avatar");

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lấy số thông báo chưa đọc
  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchNotifications();
        setNumberNotifications(
          list.filter((item) => item.status === "unread").length
        );
      } catch {
        console.warn("Unable to load notifications");
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      navigate(`/shop?search=${encodeURIComponent(query)}`);
      setQuery("");
    }
  };

  return (
    <header className="header">
      <div className="container header-inner">
        {/* --- LEFT: Logo --- */}
        <div className="brand" onClick={() => navigate("/home")}>
          <img src={logo} alt="LEGO Logo" className="logo" />
          <span>LEGOs</span>
        </div>

        {/* --- CENTER: Navigation --- */}
        <nav className="nav">
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/home">Home</NavLink>
          <NavLink to="/addresses">Address Book</NavLink>
          <NavLink to="/notifications">Notifications</NavLink>
        </nav>

        {/* --- RIGHT: Search, Icons, Avatar --- */}
        <div className="header-right">
          {/* Search box */}
          <form className="search-box" onSubmit={handleSearchSubmit}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          {/* Icons */}
          <div className="icons">
            <div
              className="notification-wrapper"
              onClick={() => navigate("/notifications")}
            >
              {numberNotifications > 0 && (
                <span className="notification-badge">
                  {numberNotifications}
                </span>
              )}
              <FaBell className="notification-icon" />
            </div>
            <FaHeart className="icon" />
            <FaShoppingBag className="icon" />
          </div>

          {/* Avatar & Dropdown */}
          <div className="relative user-menu" ref={dropdownRef}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-full px-2 py-1 transition"
              title="User Menu"
            >
              <div className="rounded-full overflow-hidden h-9 w-9">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="avatar"
                    className="user-avatar"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="bg-blue-600 text-white flex items-center justify-center h-full w-full text-sm font-bold rounded-full">
                    {name[0]}
                  </div>
                )}
              </div>
              <FaChevronDown
                className={`text-gray-600 text-xs transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </div>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  <p className="font-medium">{name}</p>
                  <p className="text-gray-500 text-xs">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/profileAdmin");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FaUser className="text-gray-500" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FaSignOutAlt className="text-red-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
