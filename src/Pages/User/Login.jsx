import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Footer from "../../Components/Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        "http://127.0.0.1:8000/users/login/",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      setSuccess("Login successful!");

      // Save tokens & ids
      localStorage.setItem("access_token", data.access);
      if (data?.user?.id) {
        localStorage.setItem("user_id", String(data.user.id));
      }

      // Redirect to user cars or home
      navigate(`/mycars/${data.user.id}`);
    } catch (err) {
      setError("Invalid email or password");
      setSuccess("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={page.container}>
      <Navbar />

      <main style={page.main}>
        <section style={card.wrapper}>
          <h2 style={card.title}>Welcome back</h2>
          <p style={card.subtitle}>
            Login to buy or sell cars with confidence.
          </p>

          <form onSubmit={handleLogin} style={card.form}>
            <label style={card.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={card.input}
              placeholder="you@example.com"
            />

            <label style={card.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={card.input}
              placeholder="••••••••"
            />

            <button type="submit" style={card.button} disabled={submitting}>
              {submitting ? "Logging in..." : "Login"}
            </button>

            <div style={card.actions}>
              <Link to="/registration" style={card.link}>
                Create an account
              </Link>
              <a>
              #Forgot password?
              </a>
            </div>

            {error && <p style={card.error}>{error}</p>}
            {success && <p style={card.success}>{success}</p>}
          </form>
        </section>

        {/* Optional: Right-side hero */}
        <section style={hero.wrapper}>
          <h3 style={hero.title}>Find your next ride</h3>
          <p style={hero.text}>
            Explore top-rated cars, verified sellers, and transparent pricing.
          </p>
          <div style={hero.ctaRow}>
            <Link to="/allcars" style={hero.btnPrimary}>Browse Cars</Link>
            <Link to="/sell" style={hero.btnSecondary}>Sell Your Car</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Login;

const page = {
  container: { backgroundColor: "#F8F9FA", minHeight: "100vh" },
  main: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 20px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
};

const card = {
  wrapper: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    padding: 24,
    border: "1px solid #eee",
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#212121",
  },
  subtitle: { marginTop: 6, color: "#666" },
  form: { marginTop: 16, display: "flex", flexDirection: "column", gap: 12 },
  label: { fontWeight: 600, color: "#212121" },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ced4da",
    outline: "none",
    fontSize: 14,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#0D6EFD",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  },
  actions: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
  },
  link: { color: "#0D6EFD", textDecoration: "none", fontWeight: 600 },
  error: { color: "#DC3545", marginTop: 8, fontWeight: 600 },
  success: { color: "#28A745", marginTop: 8, fontWeight: 600 },
};

const hero = {
  wrapper: {
    background:
      "linear-gradient(135deg, rgba(13,110,253,0.1) 0%, rgba(255,87,34,0.08) 100%)",
    borderRadius: 12,
    padding: 24,
    border: "1px solid #e9ecef",
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: "#212121" },
  text: { marginTop: 8, color: "#555" },
  ctaRow: { display: "flex", gap: 12, marginTop: 16 },
  btnPrimary: {
    backgroundColor: "#0D6EFD",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 700,
  },
  btnSecondary: {
    backgroundColor: "#212529",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
       textDecoration: "none",
    fontWeight: 700,
  },
};

