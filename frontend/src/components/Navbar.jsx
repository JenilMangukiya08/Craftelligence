import { Link } from "react-router-dom";
import "../styles/dashboard.css";

const Navbar = () => {
  const username = localStorage.getItem("firstname");

  return (
    <div className="navbar">
      <h2 className="logo">Craftilligence</h2>

      <div className="nav-right">
        <Link to="/cart">🛒 Cart</Link>
        <span className="username">Hi, {username}</span>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="logout-btn"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
