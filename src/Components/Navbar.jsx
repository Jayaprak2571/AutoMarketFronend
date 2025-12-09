
import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("access_token");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    navigate("/");
  };
  const userId = localStorage.getItem('user_id')

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.brand} onClick={() => navigate("/")}>
          <span style={styles.brandIcon}>🚗</span>
          <span>AutoMarket</span>
        </div>

        <ul style={styles.links}>
          <li><Link to="/" style={styles.link}>Home</Link></li>
          <li><Link to="/allcars" style={styles.link}>Browse Cars</Link></li>
          <li>
            {userId ? (
              <Link to={`/addcars/${userId}`} style={styles.link}>Sell Car</Link>
            ) : (
              <button type="button" disabled style={{ ...styles.link, opacity: 0.6, cursor: "not-allowed" }}>
                Sell Car
              </button>
            )}
          </li>
          <li>
            {userId ? (
              <Link to={`/myvehiclesstatus/${userId}`} style={styles.link}>Check Status</Link>
            ) : (
              <button type="button" disabled style={{ ...styles.link, opacity: 0.6, cursor: "not-allowed" }}>
                Check Status
              </button>
            )}
          </li>

        </ul>

        <div>
          {isLoggedIn ? (
            <button onClick={handleLogout} style={styles.btnOutline}>
              Logout
            </button>
          ) : (
            <Link to="/" style={styles.btnPrimary}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
const styles = {
  nav: {
    backgroundColor: "#212529",
    color: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    fontSize: 18,
    cursor: "pointer",
  },
  brandIcon: { fontSize: 20 },
  links: {
    listStyle: "none",
    display: "flex",
    gap: 16,
    margin: 0,
    padding: 0,
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    padding: "8px 10px",
    borderRadius: 6,
  },
  btnPrimary: {
    backgroundColor: "#0D6EFD",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 6,
    textDecoration: "none",
    fontWeight: 600,
  },
  btnOutline: {
    backgroundColor: "transparent",
    color: "#fff",
    border: "1px solid #fff",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
};

