import {
  FaChevronDown,
  FaHeart,
  FaSearch,
  FaShoppingBag,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import logo from "/logo.png";
import "../../styles/layout.scss";
import { Switch, Tooltip } from "antd";
import { BulbOutlined, MoonOutlined } from "@ant-design/icons";

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { cart } = useCart();
  const { favoriteIds } = useFavorites();

  const name = useMemo(
    () =>
      (user?.name as string | undefined) ||
      (localStorage.getItem("name") as string | null) ||
      "User",
    [user?.name]
  );
  const avatar = user?.avatar || localStorage.getItem("avatar");

  // --- Roles ---
  const role = user?.role ?? "guest";
  const isAdmin = role === "admin";
  const isEmployee = role === "employee";
  const isAdminSection = isAdmin || (isEmployee && location.pathname.startsWith("/admin"));

  // --- Dark mode ---
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const toggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
  };
  useEffect(() => {
    document.body.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // --- Close dropdown when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/shop?search=${encodeURIComponent(q)}`);
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
        {/* Logo */}
        <Link to="/home" className="brand" onClick={() => setShowDropdown(false)}>
          <img src={logo} alt="LEGO Logo" className="logo" />
          <span>LEGOs</span>
        </Link>

        {/* Navigation */}
        <nav className="nav">
          {isAdminSection ? (
            <>
              <NavLink to="/admin" end>Dashboard</NavLink>
              <NavLink to="/admin/dashboard/revenue">Revenue</NavLink>
              <NavLink to="/admin/dashboard/orders">Order Stats</NavLink>
              <NavLink to="/admin/orders">Orders</NavLink>
              <NavLink to="/admin/products">Products</NavLink>
              <NavLink to="/admin/categories">Categories</NavLink>
              <NavLink to="/admin/users">Users</NavLink>
              <NavLink to="/admin/notifications">Notifications</NavLink>
              <NavLink to="/admin/vouchers">Vouchers</NavLink>
              <NavLink to="/admin/reviews">Reviews</NavLink>
              <NavLink to="/admin/themes">Themes</NavLink>
              <NavLink to="/admin/characters">Characters</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/home">Home</NavLink>
              <NavLink to="/shop">Shop</NavLink>
              {(isEmployee || isAdmin) && <NavLink to="/employee/news">Manage News</NavLink>}
              <NavLink to="/news">News</NavLink>
              <NavLink to="/themes">Themes</NavLink>
              <NavLink to="/addresses">Address Book</NavLink>
              {user && user.role !== "admin" && <NavLink to="/orders">My Orders</NavLink>}
              <NavLink to="/history-orders">History Orders</NavLink>
              <NavLink to="/notifications">Notifications</NavLink>
            </>
          )}
        </nav>

        {/* RIGHT: search, theme, icons, user */}
        <div className="header-right" onClick={(e) => e.stopPropagation()}>
          {!isAdminSection && (
            <form className="search-box" onSubmit={handleSearchSubmit}>
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          )}

          {/* Dark / light toggle */}
          <div className="mx-2">
            <Tooltip title={isDarkMode ? "Dark mode" : "Light mode"}>
              <Switch
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<BulbOutlined />}
                checked={isDarkMode}
                onChange={toggleTheme}
              />
            </Tooltip>
          </div>

          {/* Icons */}
          <div className="icons">
            {!isAdminSection && (
              <>
                <div
                  className="notification-wrapper"
                  onClick={() => navigate("/favorites")}
                  title="Favourites"
                >
                  {favoriteIds?.length > 0 && (
                    <span className="notification-badge">{favoriteIds.length}</span>
                  )}
                  <FaHeart className="icon" />
                </div>
                <div className="icon cursor-pointer" onClick={() => navigate("/cart")}>
                  <FaShoppingBag />
                  <span className="cart-count">{cart?.items?.length ?? 0}</span>
                </div>
              </>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative user-menu" ref={dropdownRef}>
            <div
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-full px-2 py-1 transition"
              title="User Menu"
            >
              <div className="rounded-full overflow-hidden h-9 w-9">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="user-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="bg-blue-600 text-white flex items-center justify-center h-full w-full text-sm font-bold rounded-full">
                    {(name ?? "U").charAt(0)}
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
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  <p className="font-medium truncate">{name}</p>
                  <p className="text-gray-500 text-xs truncate">{user?.email ?? ""}</p>
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
