import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar";
import Footer from "../../Components/Footer";

const cardStyles = {
  container: { maxWidth: 720, margin: "0 auto", padding: "24px" },
  card: {
    background: "linear-gradient(135deg, #e8f1ff 0%, #f3f8ff 100%)",
    borderRadius: 16,
    boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
    border: "1px solid #cfe2ff",
    overflow: "hidden",
  },
  header: {
    background: "#ffffff",
    borderBottom: "1px solid #e3e8ef",
    padding: "20px",
    textAlign: "center",
  },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#1f2937" },
  body: { padding: 20 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#1f2937", marginBottom: 6 },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    outline: "none",
  },
  inputReadOnly: {
    width: "100%",
    padding: "12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    backgroundColor: "#f1f5f9",
    outline: "none",
  },
  hint: { marginTop: 4, fontSize: 12, color: "#64748b" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  btn: (disabled) => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    fontWeight: 800,
    color: "#fff",
    backgroundColor: disabled ? "#65a30d" : "#16a34a",
    cursor: disabled ? "not-allowed" : "pointer",
  }),
  alertOk: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 8,
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontWeight: 600,
  },
  alertErr: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontWeight: 600,
  },
};

const carsApi = axios.create({ baseURL: "https://vjayap.pythonanywhere.com" });
const drivesApi = axios.create({ baseURL: "http://localhost:8002" });

const STATUS_OPTIONS = ["Pending", "Confirmed", "Cancelled"];

const TestDriveUpdateForm = function TestDriveUpdateForm() {
  const { vehicleId } = useParams(); 
  const token = localStorage.getItem("access_token");
  const loggedInSellerId = localStorage.getItem("user_id");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const [bookingData, setBookingData] = useState({
    user_id: "",
    seller_id: "",
    vehicle_id: "",
    scheduled_date: "",
    status: "Pending",
  });
  const [driveOptions, setDriveOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      setMessage("");

      if (!token || !loggedInSellerId) {
        setError("Missing access token or logged-in seller id.");
        setLoading(false);
        return;
      }

      try {
        const vehRes = await carsApi.get(`/cars/updatecar/${vehicleId}`, { headers });
        const vehicle = vehRes.data;
        const sellerId = String(vehicle?.seller_id);

        if (sellerId !== String(loggedInSellerId)) {
          setError(
            `You are not the seller of vehicle ${vehicleId}. Only the owner can change status.`
          );
          setLoading(false);
          return;
        }
        const drivesRes = await drivesApi.get(`/testdrive/test`, { headers });
        const all = Array.isArray(drivesRes.data) ? drivesRes.data : [];
        const forVehicle = all.filter(d => String(d.vehicle_id) === String(vehicleId));

        setDriveOptions(forVehicle);

        if (forVehicle.length > 0) {
          const d = forVehicle[0];
          setBookingData({
            id: `${d.user_id}-${d.vehicle_id}`,
            user_id: String(d.user_id),
            seller_id: String(vehicle.seller_id),
            vehicle_id: String(vehicleId),
            scheduled_date: d.scheduled_date || "",
            status: d.status || "Pending",
          });
        } else {
          
          setBookingData(prev => ({
            ...prev,
            seller_id: String(vehicle.seller_id),
            vehicle_id: String(vehicleId),
          }));
        }
      } catch (e) {
        const msg =
          e?.response?.data?.detail ||
          e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : "") ||
          e?.message ||
          "Failed to load data.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [vehicleId, token, loggedInSellerId, headers]);

  function handleStatusChange(event) {
    const next = event.target.value;
    setBookingData(prev => ({ ...prev, status: next }));
  }
  function handleDriveSelect(event) {
    const selectedUserId = event.target.value;
    const selected = driveOptions.find(d => String(d.user_id) === String(selectedUserId));
    if (!selected) {
      setError("Selected drive not found.");
      return;
    }
    setError("");
    setMessage("");
    setBookingData({
      id: `${selected.user_id}-${selected.vehicle_id}`,
      user_id: String(selected.user_id),
      seller_id: String(bookingData.seller_id || localStorage.getItem("user_id") || ""),
      vehicle_id: String(vehicleId),
      scheduled_date: selected.scheduled_date || "",
      status: selected.status || "Pending",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      if (!bookingData.user_id || !bookingData.vehicle_id) {
        setError("Please select a test drive (user) to update.");
        setSubmitting(false);
        return;
      }
      if (!token) {
        setError("You are not authenticated. Please log in again.");
        setSubmitting(false);
        return;
      }

      const url = `/testdrive/getdrives/${bookingData.user_id}/${bookingData.vehicle_id}`;
      const response = await drivesApi.put(
        url,
        { status: bookingData.status },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );

      setMessage(
        response?.data?.message ||
          response?.data?.detail ||
          `Status updated to "${bookingData.status}" for user ${bookingData.user_id}.`
      );
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        (typeof err.response?.data === "string" ? err.response?.data : "") ||
        err.message ||
        "Update failed. Please try again.";
      setError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  }

  const isLoaded = Boolean(bookingData.vehicle_id);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Navbar />

      <main style={cardStyles.container}>
        <section style={cardStyles.card}>
          <div style={cardStyles.header}>
            <h2 style={cardStyles.title}>Update Test Drive</h2>
          </div>

          <form onSubmit={handleSubmit} style={cardStyles.body}>
            {loading ? (
              <div style={cardStyles.hint}>Loading data…</div>
            ) : error ? (
              <div style={cardStyles.alertErr}>{error}</div>
            ) : (
              <>
                {/* Select the user's test drive for this vehicle */}
                <div>
                  <label style={cardStyles.label}>Select User (Drive)</label>
                  <select
                    name="user_id"
                    value={bookingData.user_id}
                    onChange={handleDriveSelect}
                    disabled={driveOptions.length === 0}
                    style={cardStyles.input}
                  >
                    {driveOptions.length === 0 ? (
                      <option value="">No test drives for this vehicle</option>
                    ) : (
                      driveOptions.map((d) => (
                        <option key={`user-${d.user_id}`} value={String(d.user_id)}>
                          User: {d.user_id} — Status: {d.status || "Pending"} ---- Date: {d.scheduled_date}
                        </option>
                      ))
                    )}
                  </select>
                  {driveOptions.length === 0 && (
                    <div style={cardStyles.hint}>
                      No test drives found for vehicle {vehicleId}.
                    </div>
                  )}
                </div>

                {/* Read-only booking fields */}
                <div style={cardStyles.row}>
                  <div>
                    <label style={cardStyles.label}>Seller ID</label>
                    <input
                      type="text"
                      name="seller_id"
                      value={bookingData.seller_id}
                      readOnly
                      style={cardStyles.inputReadOnly}
                    />
                  </div>
                  <div>
                    <label style={cardStyles.label}>Vehicle ID</label>
                    <input
                      type="text"
                      name="vehicle_id"
                      value={bookingData.vehicle_id}
                      readOnly
                      style={cardStyles.inputReadOnly}
                    />
                  </div>
                </div>

              

                {/* Editable status */}
                <div>
                  <label style={cardStyles.label}>
                    Status <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <select
                    name="status"
                    value={bookingData.status}
                    onChange={handleStatusChange}
                    required
                    disabled={!isLoaded || !bookingData.user_id}
                    style={cardStyles.input}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {!bookingData.user_id && (
                    <div style={cardStyles.hint}>
                      Select a user’s test drive first to edit its status.
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !isLoaded || !bookingData.user_id}
                  style={cardStyles.btn(submitting || !isLoaded || !bookingData.user_id)}
                >
                  {submitting ? "Updating..." : "Update Status"}
                </button>

                {/* Alerts */}
                {message && <div style={cardStyles.alertOk}>{message}</div>}
              </>
            )}
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TestDriveUpdateForm;