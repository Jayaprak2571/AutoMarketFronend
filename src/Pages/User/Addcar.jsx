import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Navbar from "../../Components/Navbar";
import Footer from "../../Components/Footer";

const AddCarForm = () => {
  const [auth, setAuth] = useState({ userId: null, token: null });
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    price: "",
    condition: "Used",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setAuth({ userId: null, token: null });
        return;
      }
      const decoded = jwtDecode(token);
      const userId = decoded?.user_id ?? decoded?.sub ?? decoded?.id ?? null;
      setAuth({ userId, token });
    } catch (e) {
      console.error("Failed to decode JWT:", e);
      setAuth({ userId: null, token: null });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        price: String(form.price),
        condition: form.condition,
        description: form.description.trim(),
        seller_id: Number(auth.userId),
      };

      if (!payload.make || !payload.model) throw new Error("Make and Model are required.");
      if (!payload.year || payload.year < 1900 || payload.year > 2100)
        throw new Error("Enter a valid year between 1900 and 2100.");
      if (!payload.price || Number(payload.price) <= 0)
        throw new Error("Enter a valid price greater than 0.");
      if (!["New", "Used"].includes(payload.condition))
        throw new Error("Condition must be New or Used.");
      if (!payload.seller_id) throw new Error("No user ID found. Please sign in.");

      const res = await axios.post("http://127.0.0.1:8001/cars/addcars/", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: auth.token ? `Bearer ${auth.token}` : undefined,
        },
      });

      setSuccess(`Car created successfully (ID: ${res.data?.id ?? "unknown"})`);
      setForm({ make: "", model: "", year: "", price: "", condition: "Used", description: "" });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === "string"
          ? err.response?.data
          : JSON.stringify(err.response?.data)) ||
        err.message ||
        "Failed to create car.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const signedIn = !!auth.userId;

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#eff6ff", // blue-50
  },
  container: {
    maxWidth: "48rem", // ~max-w-2xl
    margin: "0 auto",
    padding: "2rem 1rem", // px-4 py-8
  },
  card: {
    background: "#fff",
    borderRadius: "12px", // rounded-xl
    boxShadow:
      "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)", // shadow-lg
    border: "1px solid #e5e7eb", // gray-200
    overflow: "hidden",
  },
  cardHeader: {
    padding: "1.5rem", // p-6
    borderBottom: "1px solid #e5e7eb",
    textAlign: "center",
  },
  title: {
    fontSize: "1.875rem", // text-3xl
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  },
  subtitle: {
    marginTop: "0.5rem",
    color: "#4b5563",
    fontSize: "0.875rem",
  },
  topInfoWrap: {
    padding: "1.5rem 1.5rem 0",
  },
  alertWarn: {
    marginBottom: "1rem",
    padding: "0.75rem",
    background: "#fffbeb",
    border: "1px solid #fef3c7",
    color: "#78350f",
    borderRadius: "8px",
    fontSize: "0.875rem",
  },
  signInInfo: {
    marginBottom: "1rem",
    fontSize: "0.875rem",
    color: "#047857", // green tone
  },
  signInStrong: {
    fontWeight: 600,
  },
  form: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem", // space-y-5/6
  },
  sectionTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "0.25rem",
  },
  sectionSub: {
    fontSize: "0.75rem",
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gap: "1rem",
  },
  gridCols2: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "1fr 1fr",
  },
  label: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "0.25rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    outline: "none",
  },
  inputFocus: {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 2px rgba(59,130,246,0.4)",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    outline: "none",
    resize: "vertical",
  },
  helper: {
    marginTop: "0.25rem",
    fontSize: "0.75rem",
    color: "#6b7280",
  },
  btnPrimary: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    fontWeight: 600,
    color: "#fff",
    backgroundColor: "#2563eb",
    border: "none",
    cursor: "pointer",
  },
  btnPrimaryHover: {
    backgroundColor: "#1d4ed8",
  },
  btnDisabled: {
    backgroundColor: "#60a5fa",
    cursor: "not-allowed",
  },
  alertOk: {
    marginTop: "0.75rem",
    padding: "0.75rem",
    background: "#ecfdf5",
    border: "1px solid #d1fae5",
    color: "#065f46",
    borderRadius: "8px",
    fontSize: "0.875rem",
  },
  alertErr: {
    marginTop: "0.75rem",
    padding: "0.75rem",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "8px",
    fontSize: "0.875rem",
  },
}
return (
  <div style={styles.page}>
    <Navbar />

    <main style={styles.container}>
      <section style={styles.card}>
        {/* <div style={styles.cardHeader}>
          <h2 style={styles.title}>Add a Car</h2>
          <p style={styles.subtitle}>
            Fill in the details below to list your car for sale.
          </p>
        </div> */}

        <div style={styles.topInfoWrap}>
          {!signedIn ? (
            <div style={styles.alertWarn}>
              You’re not signed in. Please log in to add a car.
            </div>
          ) : (
            <div style={styles.signInInfo}>
              Signed in as{" "}
              <span style={styles.signInStrong}>user #{auth.userId}</span>.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Section: Car Details */}
          <div>
            {/* <div style={styles.sectionTitle}>Car Details</div>
            <div style={styles.sectionSub}>Basic information about the car.</div> */}

            {/* Make / Model */}
            <div
              style={
                // fallback to single-column on small screens (inline can't do media queries)
                window.innerWidth >= 768 ? styles.gridCols2 : styles.grid
              }
            >
              <div>
                <label style={styles.label}>
                  Make <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  name="make"
                  value={form.make}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Tata"
                  style={styles.input}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = styles.inputFocus.boxShadow,
                    (e.target.style.borderColor = styles.inputFocus.borderColor))
                  }
                  onBlur={(e) =>
                    (e.target.style.boxShadow = "none",
                    (e.target.style.borderColor = "#d1d5db"))
                  }
                />
                {/* <p style={styles.helper}>
                  Manufacturer brand (e.g., Tata, Maruti).
                </p> */}
              </div>

              <div>
                <label style={styles.label}>
                  Model <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Nexon EV"
                  style={styles.input}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = styles.inputFocus.boxShadow,
                    (e.target.style.borderColor = styles.inputFocus.borderColor))
                  }
                  onBlur={(e) =>
                    (e.target.style.boxShadow = "none",
                    (e.target.style.borderColor = "#d1d5db"))
                  }
                />
                {/* <p style={styles.helper}>Specific model and variant.</p> */}
              </div>
            </div>
          </div>

          {/* Section: Pricing & Condition */}
          <div>
            {/* <div style={styles.sectionTitle}>Pricing &amp; Condition</div>
            <div style={styles.sectionSub}>
              Set the price and current condition.
            </div> */}

            {/* Year / Price */}
            <div
              style={
                window.innerWidth >= 768 ? styles.gridCols2 : styles.grid
              }
            >
              <div>
                <label style={styles.label}>
                  Year <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  min="1900"
                  max="2100"
                  required
                  placeholder="e.g., 2022"
                  style={styles.input}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = styles.inputFocus.boxShadow,
                    (e.target.style.borderColor = styles.inputFocus.borderColor))
                  }
                  onBlur={(e) =>
                    (e.target.style.boxShadow = "none",
                    (e.target.style.borderColor = "#d1d5db"))
                  }
                />
              </div>

              <div>
                <label style={styles.label}>
                  Price (₹) <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 1200000.00"
                  style={styles.input}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = styles.inputFocus.boxShadow,
                    (e.target.style.borderColor = styles.inputFocus.borderColor))
                  }
                  onBlur={(e) =>
                    (e.target.style.boxShadow = "none",
                    (e.target.style.borderColor = "#d1d5db"))
                  }
                />
                {/* <p style={styles.helper}>
                  Set a realistic price; decimals allowed.
                </p> */}
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={styles.label}>
                Condition <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select
                name="condition"
                value={form.condition}
                onChange={handleChange}
                required
                style={styles.input}
                onFocus={(e) =>
                  (e.target.style.boxShadow = styles.inputFocus.boxShadow,
                  (e.target.style.borderColor = styles.inputFocus.borderColor))
                }
                onBlur={(e) =>
                  (e.target.style.boxShadow = "none",
                  (e.target.style.borderColor = "#d1d5db"))
                }
              >
                <option value="New">New</option>
                <option value="Used">Used</option>
              </select>
            </div>
          </div>

          {/* Section: Description */}
          <div>
            <div style={styles.sectionTitle}>Description</div>
            {/* <div style={styles.sectionSub}>
              Highlight condition, features, and any notes.
            </div> */}

            <div style={{ marginTop: "0.75rem" }}>
              {/* <label style={styles.label}>
                Description <span style={{ color: "#dc2626" }}>*</span>
              </label> */}
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                placeholder="Brief condition and highlights"
                rows={4}
                style={styles.textarea}
                onFocus={(e) =>
                  (e.target.style.boxShadow = styles.inputFocus.boxShadow,
                  (e.target.style.borderColor = styles.inputFocus.borderColor))
                }
                onBlur={(e) =>
                  (e.target.style.boxShadow = "none",
                  (e.target.style.borderColor = "#d1d5db"))
                }
              />
              {/* <p style={styles.helper}>
                Example: “Single owner, company serviced, new tires, no
                accidents.”
              </p> */}
            </div>
          </div>

          {/* Submit */}
          <div style={{ paddingTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={submitting || !signedIn}
              style={{
                ...styles.btnPrimary,
                ...(submitting || !signedIn ? styles.btnDisabled : null),
              }}
              onMouseEnter={(e) => {
                if (!(submitting || !signedIn)) {
                  e.currentTarget.style.backgroundColor =
                    styles.btnPrimaryHover.backgroundColor;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  styles.btnPrimary.backgroundColor;
              }}
            >
              {submitting ? "Submitting…" : "Create Car"}
            </button>
          </div>

          {/* Alerts */}
          {success && <div style={styles.alertOk}>{success}</div>}
          {error && <div style={styles.alertErr}>{error}</div>}
        </form>
      </section>
    </main>

    <Footer />
  </div>
);


};






export default AddCarForm;
