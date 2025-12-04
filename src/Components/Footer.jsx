
import React from "react";

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.left}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>🚗</span>
            <span>AutoMarket</span>
          </div>
          <small style={styles.muted}>
            © {new Date().getFullYear()} AutoMarket. All rights reserved.
          </small>
        </div>
        <div style={styles.right}>
          <a>#Privacy</a>
          <a>#Terms</a>
          <a>#Support</a>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: { backgroundColor: "#212529", color: "#fff", marginTop: 40 },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  left: { display: "flex", flexDirection: "column", gap: 6 },
  brand: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700 },
  brandIcon: { fontSize: 18 },
  muted: { color: "#adb5bd" },
  right: { display: "flex", gap: 16 },
  link: { color: "#0D6EFD", textDecoration: "none" },
};

export default Footer;

