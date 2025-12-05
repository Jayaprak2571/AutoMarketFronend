
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Footer from "../../Components/Footer";

/** Use same origin as your Python calls */
const api = axios.create({
  baseURL: "https://vjayap.pythonanywhere.com",
});

const API_ORIGIN = api.defaults.baseURL?.replace(/\/+$/, "") || "";

/** Turn a possibly relative image path into an absolute URL */
function toAbsolute(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src; // already absolute
  if (!API_ORIGIN) return src; // best effort
  return src.startsWith("/") ? `${API_ORIGIN}${src}` : `${API_ORIGIN}/${src}`;
}

function normalizeCars(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.cars)) return data.cars;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeImages(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.images)) return payload.images;
  if (Array.isArray(payload.image)) return payload.image;

  if (typeof payload === "object") {
    if (payload.image) {
      return Array.isArray(payload.image) ? payload.image : [payload.image];
    }
    if (
      payload.url ||
      payload.image_url ||
      payload.src ||
      payload.imageUrl ||
      payload.href
    ) {
      return [payload];
    }
  }

  if (typeof payload === "string") return [payload];
  return [];
}

/** Extract a URL from different shapes (string or object) */
function getImageSrc(img) {
  if (!img) return "";
  if (typeof img === "string") return img;

  if (typeof img === "object") {
    const direct =
      img.url ??
      img.image_url ??
      img.src ??
      img.imageUrl ??
      img.href;

    if (typeof direct === "string") return direct;

    if (img.image) {
      if (typeof img.image === "string") return img.image;
      if (typeof img.image === "object") {
        const nested =
          img.image.url ??
          img.image.image_url ??
          img.image.src ??
          img.image.imageUrl ??
          img.image.href;
        if (typeof nested === "string") return nested;
      }
    }
  }

  return "";
}

/** Throttle concurrent requests */
async function inBatches(items, batchSize, worker) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize).map(worker);
    const resolved = await Promise.all(batch);
    results.push(...resolved);
    await new Promise((r) => setTimeout(r, 50)); // small pause
  }
  return results;
}

/** Limit to max 4 images and add placeholders for alignment */
function makeFourTiles(imageUrls) {
  const imgs = Array.isArray(imageUrls) ? imageUrls.slice(0, 4) : [];
  const placeholders = Math.max(0, 4 - imgs.length);
  return [...imgs, ...Array(placeholders).fill(null)];
}

const AllCars = () => {
  const [items, setItems] = useState([]); // enriched cars with images
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Missing access token");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    const headers = { Authorization: `Bearer ${token}` };

    let cancelled = false;

    (async () => {
      try {
        // 1) Fetch ALL cars
        const carsRes = await api.get(`/cars/addcars/`, { headers, signal });
        const cars = normalizeCars(carsRes.data);

        if (!Array.isArray(cars) || cars.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }

        // 2) Fetch images for each car id (throttled)
        const MAX_CONCURRENCY = 8;
        
        const loggedInUserId = localStorage.getItem('user_id'); // or 'userId' based on your app


        const enriched = await inBatches(cars, MAX_CONCURRENCY, async (car) => {
          try {
            const sellerId = Number(car.seller_id);
            const carId = Number(car.id);

            const imgRes = await api.get(
              `/cars/getusercarimages/${sellerId}/${carId}`,
              { headers, signal }
            );

            const rawImages = normalizeImages(imgRes.data);
            const imageUrls = rawImages
              .map((img) => {
                const src = getImageSrc(img);
                return toAbsolute(src || (typeof img === "string" ? img : ""));
              })
              .filter(Boolean);

            return { ...car, images: imageUrls };
          } catch (e) {
            const hint = e?.response?.status
              ? `HTTP ${e.response.status}`
              : e?.message || "images fetch failed";
            return { ...car, images: [], imagesError: hint };
          }
        });

        if (!cancelled) setItems(enriched);
      } catch (err) {
        if (axios.isCancel(err)) return;
        const status = err.response?.status;
        const detail = err.response?.data?.detail || err.message;
        if (!cancelled) setError(`Request failed (${status || "?"}): ${detail}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);
  

  if (loading)
    return (
      <div style={ui.container}>
        <Navbar />
        <div style={ui.loading}>Loading…</div>
        <Footer />
      </div>
    );
  if (error)
    return (
      <div style={ui.container}>
        <Navbar />
        <h1 style={ui.error}>Error: {error}</h1>
        <Footer />
      </div>
    );

  return (
    <div style={ui.container}>
      <Navbar />
      <main style={ui.main}>
        <h1 style={ui.pageTitle}>All Cars</h1>

        {items.length === 0 ? (
          <p style={ui.muted}>No cars available.</p>
        ) : (
          <div style={ui.grid}>
            {items.map((item) => {
              const tiles = makeFourTiles(item.images);
              return (
                <article key={item.id} style={ui.card}>
                  {/* Left: details */}
                  <div style={ui.details}>
                    <h2 style={ui.title}>
                      {item.make} {item.model}
                    </h2>

                    <div style={ui.metaRow}>
                      <span style={ui.meta}>
                        <strong>Year:</strong> {item.year}
                      </span>
                      <span style={ui.meta}>
                        <strong>Condition:</strong> {item.condition}
                      </span>
                    </div>

                    <div style={ui.priceRow}>
                      <span style={ui.priceLabel}>Price</span>
                      <span style={ui.priceValue}>{item.price} ₹</span>
                    </div>

                    {item.description && (
                      <p style={ui.desc}>{item.description}</p>
                    )}

                    <div style={ui.infoRow}>
                      <span style={ui.infoBadge}>Seller: {item.seller_id}</span>
                      <span style={ui.infoBadge}>Vehicle ID: {item.id}</span>
                    </div>

                    <div>
                      {item.seller_id !== parseInt(localStorage.getItem('user_id')) && (
                        <div style={ui.actions}>
                          <button
                            onClick={() => navigate(`/bookride/${item.id}/${item.seller_id}`)}
                            style={ui.btnPrimary}
                          >
                            Book
                          </button>
                          <button
                            onClick={() => navigate(`/usercars/${item.seller_id}`)}
                            style={ui.btnSecondary}
                              >
                            View Seller Cars
                          </button>
                        </div>
                      )}
                      </div>
                    {item.imagesError && (
                      <div style={ui.errorInline}>
                        Images error: {item.imagesError}
                      </div>
                    )}
                  </div>

                  {/* Right: 2×2 images grid */}
                  <div style={ui.gallery}>
                    <div style={ui.imageGrid}>
                      {tiles.map((src, idx) =>
                        src ? (
                          <img
                            key={idx}
                            src={src}
                            alt={`car-${item.id}-img-${idx}`}
                            loading="lazy"
                            style={ui.imageTile}
                          />
                        ) : (
                          <div key={idx} style={ui.placeholderTile}>
                            <span style={ui.placeholderText}>No image</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

/** UI styles */
const ui = {
  container: { backgroundColor: "#F8F9FA", minHeight: "100vh" },
  main: { maxWidth: 1200, margin: "0 auto", padding: "24px 20px" },
  pageTitle: { margin: "0 0 12px", fontSize: 24, fontWeight: 800, color: "#212121" },
  muted: { color: "#6c757d" },
  loading: { maxWidth: 1200, margin: "0 auto", padding: "24px 20px", color: "#212121" },
  error: { maxWidth: 1200, margin: "0 auto", padding: "24px 20px", color: "#DC3545" },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  },

  /* ORG
  card: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr", // left details, right images
    gap: 0, // seam-less; right panel has its own padding
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    border: "1px solid #eee",
    overflow: "hidden",
  },
  */

  card: {
    display: "grid",
    gridTemplateColumns: "0.8fr 1fr", // left details, right images
    gap: 0, // seam-less; right panel has its own padding
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    border: "1px solid #eee",
    overflow: "hidden",
  },

  /*
  card: {
    display: "grid",
    gridTemplateColumns: "0.8fr 1.2fr", // shrink left info, enlarge right images
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
    border: "1px solid #eee",
    overflow: "hidden",
  },
  */

  /** Left panel */
  details: { padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: "#212121" },
  metaRow: { display: "flex", gap: 12, color: "#495057", flexWrap: "wrap" },
  meta: { fontSize: 14 },
  priceRow: {
    marginTop: 6,
    display: "flex",
    alignItems: "baseline",
    gap: 6,
  },
  priceLabel: { fontSize: 13, color: "#6c757d" },
  priceValue: { fontSize: 20, fontWeight: 800, color: "#0D6EFD" },
  desc: { marginTop: 8, color: "#495057", lineHeight: 1.5 },
  infoRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
  infoBadge: {
    backgroundColor: "#e9ecef",
    color: "#343a40",
    padding: "4px 8px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
  },
  actions: { display: "flex", gap: 10, marginTop: 12 },
  btnPrimary: {
    backgroundColor: "#0D6EFD",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnSecondary: {
    backgroundColor: "#212529",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  },
  errorInline: { color: "#DC3545", marginTop: 6, fontWeight: 600 },

  /** Right panel */
  gallery: {
    padding: 16,
    backgroundColor: "#fdfdfd",
    borderLeft: "1px solid #f1f3f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  imageGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1fr", // 2 columns
    gridAutoRows: "minmax(0, 1fr)", // keep rows equal height
    gap: 10,
  },
  imageTile: {
    width: "100%",
    aspectRatio: "4 / 3",
    objectFit: "cover",
    borderRadius: 10,
    border: "1px solid #e9ecef",
    backgroundColor: "#fff",
    display: "block",
  },
  placeholderTile: {
    width: "100%",
    aspectRatio: "4 / 3",
    borderRadius: 10,
    border: "1px dashed #dee2e6",
    backgroundColor: "#fafafa",
    color: "#6c757d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
   },
  placeholderText: { fontSize: 12 },

  // To support media queries, consider moving styles to a CSS file
};

export default AllCars;