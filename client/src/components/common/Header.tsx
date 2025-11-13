import {
  FaChevronDown,
  FaHeart,
  FaSearch,
  FaShoppingBag,
  FaSignOutAlt,
  FaUser,
  FaBell,
  FaHistory,
} from "react-icons/fa";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import logo from "/logo.png";
import "../../styles/layout.scss";

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [portalPos, setPortalPos] = useState<{ top: number; left: number } | null>(null);

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

  // DEBUG: log when the dropdown render state changes so we can trace
  // whether the dropdown is being mounted but possibly clipped/hidden.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("Header: showDropdown =>", showDropdown);
  }, [showDropdown]);

  // --- Roles ---
  const role = user?.role ?? "guest";
  const isAdmin = role === "admin";
  const isEmployee = role === "employee";
  const isAdminSection =
    isAdmin || (isEmployee && location.pathname.startsWith("/admin"));

  // --- Apply persisted dark mode at startup (no toggle UI) ---
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    document.body.setAttribute("data-theme", stored === "dark" ? "dark" : "light");
  }, []);

  // --- Close dropdown when clicking outside ---
  // We attach the document click listener only when the dropdown is open.
  // Doing so ensures the listener is added after the opening click and
  // therefore won't see the event that opened the menu (avoids the open-then-
  // immediately-close race).
  useEffect(() => {
    if (!showDropdown) return undefined;

    const handleClickOutside = (e: MouseEvent) => {
      try {
        const target = e.target as Node;

        // If click is inside the trigger button, ignore
        if (triggerRef.current && triggerRef.current.contains(target)) return;

        // If click is inside the portal menu, ignore
        if (portalRef.current && portalRef.current.contains(target)) return;

        // Otherwise close
        setShowDropdown(false);
      } catch (err) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showDropdown]);

  // compute portal position when the dropdown opens
  useEffect(() => {
    if (!showDropdown) {
      setPortalPos(null);
      return;
    }

    const node = triggerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const menuWidth = 200;
    const padding = 8;
    const top = rect.bottom + padding; // viewport coords
    let left = rect.right - menuWidth;
    // clamp within viewport with small padding
    left = Math.min(Math.max(padding, left), window.innerWidth - menuWidth - padding);
    setPortalPos({ top, left });
  }, [showDropdown]);

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
    <header className={`header ${isSearchActive ? "search-active" : ""}`}>
      <div className="container header-inner">
        {/* Logo */}
        <Link
          to="/home"
          className="brand"
          onClick={() => setShowDropdown(false)}
        >
          <img src={logo} alt="LEGO Logo" className="logo" />
          <span>LEGOs</span>
        </Link>

        {/* Navigation */}
        <nav className="nav">
          {isAdminSection ? (
            <>
              <NavLink to="/admin" end>
                Dashboard
              </NavLink>
              <NavLink to="/admin/dashboard/revenue">Revenue</NavLink>
              <NavLink to="/admin/dashboard/orders">Order Stats</NavLink>
              {/* <NavLink to="/admin/orders">Orders</NavLink> */}
              <NavLink to="/admin/products">Products</NavLink>
              <NavLink to="/admin/categories">Categories</NavLink>
              <NavLink to="/admin/users">Users</NavLink>
              <NavLink to="/admin/notifications">Notifications</NavLink>
              {/* removed public notifications nav to avoid duplicate link left of search */}
              <NavLink to="/admin/vouchers">Vouchers</NavLink>
              <NavLink to="/admin/reviews">Reviews</NavLink>
              {/* <NavLink to="/admin/themes">Themes</NavLink> */}
              {/* <NavLink to="/admin/characters">Characters</NavLink> */}
            </>
          ) : (
            <>
              <NavLink to="/home">Home</NavLink>
              <NavLink to="/shop">Shop</NavLink>
              {(isEmployee || isAdmin) && (
                <NavLink to="/employee/news">Manage News</NavLink>
              )}
              <NavLink to="/news">News</NavLink>
              <NavLink to="/themes">Themes</NavLink>
              <NavLink to="/addresses">Address Book</NavLink>
              {user && user.role !== "admin" && (
                <NavLink to="/orders">My Orders</NavLink>
              )}
              {/* removed public notifications nav to avoid duplicate link left of search */}
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
                onFocus={() => setIsSearchActive(true)}
                onBlur={() => setIsSearchActive(false)}
              />
            </form>
          )}


          {/* quick icons: history & notifications (always visible) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 6 }}>
            <button type="button" onClick={() => navigate('/history-orders')} title="History Orders" className="icon" style={{ background: 'transparent', border: 'none', color: '#fff' }}>
              <FaHistory />
            </button>
            <button type="button" onClick={() => navigate('/notifications')} title="Notifications" className="icon" style={{ background: 'transparent', border: 'none', color: '#fff' }}>
              <FaBell />
            </button>
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
                    <span className="notification-badge">
                      {favoriteIds.length}
                    </span>
                  )}
                  <FaHeart className="icon" />
                </div>
                <div
                  className="icon cursor-pointer"
                  onClick={() => navigate("/cart")}
                >
                  <FaShoppingBag />
                  {(cart?.items?.length ?? 0) > 0 && (
                    <span className="cart-count">{cart!.items.length}</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative user-menu" ref={dropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // debug log to ensure click handler fires
                // eslint-disable-next-line no-console
                console.log('avatar trigger clicked, showDropdown=', showDropdown);
                setShowDropdown((prev) => !prev);
              }}
              onMouseDown={(e) => e.stopPropagation()} /* prevent document click race */
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-full px-2 py-1 transition user-trigger"
              ref={triggerRef}
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
                    {(name ?? "U").charAt(0)}
                  </div>
                )}
              </div>
              <FaChevronDown
                className={`text-gray-600 text-xs transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showDropdown && portalPos &&
              createPortal(
                <div
                  ref={portalRef}
                  className="dropdown-menu-portal"
                  style={{
                    position: "fixed",
                    top: portalPos.top,
                    left: portalPos.left,
                    width: 200,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb",
                    padding: 8,
                    zIndex: 12000,
                  }}
                >
                  <div className="user-info" style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                    <p className="user-name" style={{ fontWeight: 600, color: "#374151", fontSize: 14 }}>{name}</p>
                    <p className="user-email" style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{user?.email ?? ""}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="dropdown-item"
                    style={{ width: "100%", padding: "10px 16px", textAlign: "left", background: "none", border: "none", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <FaUser className="text-gray-500" />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="dropdown-item logout"
                    style={{ width: "100%", padding: "10px 16px", textAlign: "left", background: "none", border: "none", display: "flex", alignItems: "center", gap: 8, color: "#dc2626" }}
                  >
                    <FaSignOutAlt className="text-red-500" />
                    <span>Logout</span>
                  </button>
                </div>,
                document.body
              )}
          </div>

          {/* theme toggle removed per request */}
        </div>
      </div>
    </header>
  );
}
