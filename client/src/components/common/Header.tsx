import {
  FaBell,
  FaChevronDown,
  FaHeart,
  FaSearch,
  FaShoppingBag,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { fetchNotifications } from "../../api/notifications";
import logo from "/logo.png";
import "../../styles/layout.scss";

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const [numberNotifications, setNumberNotifications] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { cart } = useCart();

  const name = useMemo(
    () => user?.name || localStorage.getItem("name") || "User",
    [user?.name]
  );
  const avatar = user?.avatar || localStorage.getItem("avatar");
  const isAdmin = user?.role === "admin";
  const isAdminSection = isAdmin && location.pathname.startsWith("/admin");

  // Close dropdown when clicking outside
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

  // Load unread notifications count
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const list = await fetchNotifications();
        setNumberNotifications(
          list.filter((item) => item.status === "unread").length
        );
      } catch {
        console.warn("Unable to load notifications");
      }
    };
    loadNotifications();
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    navigate(isAdmin ? "/profileAdmin" : "/profile");
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
          {isAdminSection ? (
            <>
              <NavLink
                to="/admin"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/dashboard/revenue"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Revenue
              </NavLink>
              <NavLink
                to="/admin/dashboard/orders"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Order Stats
              </NavLink>
              <NavLink
                to="/admin/orders"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Orders
              </NavLink>
              <NavLink
                to="/admin/products"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Products
              </NavLink>
              <NavLink
                to="/admin/categories"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Categories
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Users
              </NavLink>
              <NavLink
                to="/admin/notifications"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Notifications
              </NavLink>

              <button
                onClick={() => navigate("/shop")}
                className="shop-toggle-btn"
                title="Switch to Customer Shop View"
              >
                Shop View
              </button>
            </>
          ) : (
            <>
              <NavLink to="/shop">Shop</NavLink>
              <NavLink to="/home">Home</NavLink>
              <NavLink to="/addresses">Address Book</NavLink>
              <NavLink to="/notifications">Notifications</NavLink>

              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="admin-toggle-btn"
                  title="Switch to Admin Dashboard"
                >
                  Admin Panel
                </button>
              )}
            </>
          )}
        </nav>

        {/* --- RIGHT: Search, Icons, Avatar --- */}
        <div className="header-right" onClick={(e) => e.stopPropagation()}>
          <form className="search-box" onSubmit={handleSearchSubmit}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

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
            <div
              className="icon cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/cart");
              }}
            >
              <FaShoppingBag />
              <span className="cart-count">{cart.items.length}</span>
            </div>
          </div>

          <div className="relative user-menu" ref={dropdownRef}>
            <div
              onClick={() => setShowDropdown((prev) => !prev)}
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
                  onClick={handleProfileClick}
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
