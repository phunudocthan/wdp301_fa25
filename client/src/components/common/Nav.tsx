import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  "link " + (isActive ? "active" : "");

export default function Nav() {
  return (
    <nav className="nav">
      <NavLink to="/" className={linkClass}>Home</NavLink>
      <NavLink to="/products" className={linkClass}>Products</NavLink>
      <NavLink to="/cart" className={linkClass}>Cart</NavLink>
      <NavLink to="/community" className={linkClass}>Community</NavLink>
    </nav>
  );
}
