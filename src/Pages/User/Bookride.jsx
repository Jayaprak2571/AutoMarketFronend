
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Footer from "../../Components/Footer";

const initialFormData = {
  vehicle_id: "",
  seller_id: "",
  scheduled_date: "",
  status: "Pending",
};

// ---- Helpers: date/time formatting & business rules ----

const BUSINESS_START_HOUR = 9;  // 09:00
const BUSINESS_END_HOUR = 19;   // 19:00 (7 PM)
const SLOT_MINUTES = 30;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDatetimeLocalString(d) {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hours = pad2(d.getHours());
  const minutes = pad2(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function roundUpToNextSlot(d, slotMinutes = SLOT_MINUTES) {
  const rounded = new Date(d);
  rounded.setSeconds(0, 0);
  const mins = rounded.getMinutes();
  const remainder = mins % slotMinutes;
  if (remainder !== 0) {
    const toAdd = slotMinutes - remainder;
    rounded.setMinutes(mins + toAdd);
  }
  // If still in the past by seconds/milliseconds, bump one slot
  if (rounded.getTime() <= Date.now()) {
    rounded.setMinutes(rounded.getMinutes() + slotMinutes);
  }
  return rounded;
}

function clampToBusinessHours(d) {
  const clamped = new Date(d);
  const h = clamped.getHours();
  if (h < BUSINESS_START_HOUR) {
    clamped.setHours(BUSINESS_START_HOUR, 0, 0, 0);
  } else if (h >= BUSINESS_END_HOUR) {
    // Move to next day start
    clamped.setDate(clamped.getDate() + 1);
    clamped.setHours(BUSINESS_START_HOUR, 0, 0, 0);
  }
  return clamped;
}

function getInitialSlot() {
  const now = new Date();
  return clampToBusinessHours(roundUpToNextSlot(now));
}

function buildSlotsForDay(baseDate) {
  // Generate slots from 9:00 to 19:00 at 30-min increments
  const slots = [];
  const d = new Date(baseDate);
  d.setHours(BUSINESS_START_HOUR, 0, 0, 0);
  while (d.getHours() < BUSINESS_END_HOUR) {
    slots.push(new Date(d));
    d.setMinutes(d.getMinutes() + SLOT_MINUTES);
  }
  return slots;
}

const TestDriveBookingForm = function TestDriveBookingForm() {
  const { vehicleId } = useParams();
  const { sellerId } = useParams();


  const [auth, setAuth] = useState({ userId: null, token: null });
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Precompute default slot / min allowed time
  const defaultSlot = useMemo(() => getInitialSlot(), []);
  const minDatetimeLocal = useMemo(() => toDatetimeLocalString(defaultSlot), [defaultSlot]);

  const todaySlots = useMemo(() => buildSlotsForDay(new Date()), []);
  const tomorrowSlots = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return buildSlotsForDay(t);
  }, []);

  // Decode token on mount
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

  // Prefill vehicle id from route param and scheduled_date to next slot
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      vehicle_id: vehicleId ? String(vehicleId) : "",
      seller_id : sellerId ? String(sellerId) : "",
      scheduled_date: toDatetimeLocalString(defaultSlot),
    }));
  }, [vehicleId, sellerId, defaultSlot]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function pickSlot(d) {
    setFormData(prev => ({ ...prev, scheduled_date: toDatetimeLocalString(d) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        user_id: Number(auth.userId),            // from JWT
        vehicle_id: Number(formData.vehicle_id), // from route param
        seller_id : Number(formData.seller_id),
        scheduled_date: formData.scheduled_date, // 'YYYY-MM-DDTHH:mm' (local); change to ISO if your API needs it
        status: formData.status || "Pending",
      };

      if (!payload.user_id) throw new Error("Please sign in to continue.");
      if (!payload.vehicle_id) throw new Error("Vehicle ID missing.");
      if (!payload.scheduled_date) throw new Error("Booking date & time is required.");

      const res = await axios.post("https://jayapraky.pythonanywhere.com/testdrive/test/", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: auth.token ? `Bearer ${auth.token}` : undefined,
        },
      });

      setMessage(`Test drive booked successfully! Booking #${res.data?.id ?? "—"}`);
      // Reset but keep vehicle prefilled for convenience
      setFormData({
        ...initialFormData,
        vehicle_id: String(vehicleId || ""),
        scheduled_date: toDatetimeLocalString(getInitialSlot()),
      });
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        (typeof err.response?.data === "string"
          ? err.response?.data
          : JSON.stringify(err.response?.data)) ||
        err.message ||
        "Booking failed. Please try again.";
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Book Test Drive</h2>
            <p className="mt-1 text-center text-gray-600 text-sm">
              Choose a convenient slot. We operate between <span className="font-semibold">09:00</span> and <span className="font-semibold">19:00</span>.
            </p>
          </div>

          {/* User warning if not signed in */}
          {!auth.userId && (
            <div className="mx-6 mt-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-md">
              Please <Link to="/login" className="font-semibold underline">sign in</Link> to book a test drive.
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Vehicle (disabled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="vehicle_id"
                  value={formData.vehicle_id}
                  disabled
                  readOnly
                  aria-readonly="true"
                  className="w-32 p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                />
                {formData.vehicle_id ? (
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    ID 
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">No vehicle selected</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Vehicle ID is fixed based on the car you selected.
              </p>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seller</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="seller_id"
                  value={formData.seller_id}
                  disabled
                  readOnly
                  aria-readonly="true"
                  className="w-32 p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                />
                {formData.seller_id ? (
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    ID 
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">No vehicle selected</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Seller ID is fixed based on the car you selected.
              </p>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Date &amp; Time
              </label>
              <input
                type="datetime-local"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                required
                disabled={loading}
                min={minDatetimeLocal}
                step={SLOT_MINUTES * 60} // 30-min increments
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-gray-500">
                Slots are available every {SLOT_MINUTES} minutes between 09:00 and 19:00.
              </p>
            </div>

            {/* Quick slot pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Today</div>
                <div className="flex flex-wrap gap-2">
                  {todaySlots.slice(0, 6).map((d, idx) => {
                    const val = toDatetimeLocalString(d);
                    const isSelected = formData.scheduled_date === val;
                    const isPast = d.getTime() < Date.now();
                    const disabled = loading || isPast;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => pickSlot(d)}
                        disabled={disabled}
                        className={`px-3 py-1.5 rounded-md text-sm border transition
                          ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}
                          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50"}
                        `}
                        title={val}
                      >
                        {pad2(d.getHours())}:{pad2(d.getMinutes())}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Tomorrow</div>
                <div className="flex flex-wrap gap-2">
                  {tomorrowSlots.slice(0, 6).map((d, idx) => {
                    const val = toDatetimeLocalString(d);
                    const isSelected = formData.scheduled_date === val;
                    const disabled = loading;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => pickSlot(d)}
                        disabled={disabled}
                        className={`px-3 py-1.5 rounded-md text-sm border transition
                          ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}
                          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50"}
                        `}
                        title={val}
                      >
                        {pad2(d.getHours())}:{pad2(d.getMinutes())}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hidden fields to keep API contract if needed */}
            <input type="hidden" name="status" value={formData.status} />
            <input type="hidden" name="user_id" value={auth.userId ?? ""} />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !auth.userId || !formData.vehicle_id}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              {loading ? "Booking..." : "Book Test Drive"}
            </button>

            {/* Alerts */}
            {message && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md">
                {message}
              </div>
            )}
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
                               {error}
              </div>
            )}
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};


export default TestDriveBookingForm;
