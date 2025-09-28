import { NavLink, useNavigate } from "react-router-dom";
import { FaSearch, FaHeart, FaShoppingBag, FaBell } from "react-icons/fa";
import { useState } from "react";
import logo from "/logo.png";
import "./../../styles/layout.scss";

export default function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const name = localStorage.getItem("name") || "A";
  const avatar = localStorage.getItem("avatar");

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim().length > 0) {
      navigate(`/shop?search=${encodeURIComponent(query)}`);
      setQuery("");
    }
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand" onClick={() => navigate("/new")}> 
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

          <div
            onClick={() => navigate("/profile")}
            className="rounded-full overflow-hidden h-8 w-8 cursor-pointer hover:ring-2 hover:ring-blue-600 ml-4"
            title="Profile"
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="bg-blue-600 text-white flex items-center justify-center h-full w-full text-sm rounded-full">
                {name[0]}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
