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
    // Header removed globally per request — render nothing so imports still work.
    return null;
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
            </div>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  <p className="font-medium truncate">{name}</p>
                  <p className="text-gray-500 text-xs truncate">
                    {user?.email ?? ""}
                  </p>
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
