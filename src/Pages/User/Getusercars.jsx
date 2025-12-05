import Navbar from "../../Components/Navbar";
import Footer from "../../Components/Footer";

import React, { useEffect, useState ,useMemo} from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";



// import Navbar, Footer, and your `ui` style object

const api = axios.create({ baseURL: "https://vjayap.pythonanywhere.com" });

function toAbsolute(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  const origin = api.defaults.baseURL?.replace(/\/+$/, "") || "";
  if (!origin) return src;
  return src.startsWith("/") ? `${origin}${src}` : `${origin}/${src}`;
}

function normalizeCars(data) {
  if (Array.isArray(data) && Array.isArray(data[0])) return data[0];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.cars)) return data.cars;
  return [];
}

function normalizeImages(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.images)) return payload.images;
  if (Array.isArray(payload.image)) return payload.image;
  if (typeof payload === "object") {
    if (payload.image) return Array.isArray(payload.image) ? payload.image : [payload.image];
    if (payload.url || payload.image_url || payload.src || payload.imageUrl || payload.href) {
      return [payload];
    }
  }
  if (typeof payload === "string") return [payload];
  return [];
}

function getImageSrc(img) {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object") {
    const direct = img.url ?? img.image_url ?? img.src ?? img.imageUrl ?? img.href;
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

async function inBatches(items, batchSize, worker) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize).map(worker);
    const resolved = await Promise.all(batch);
    results.push(...resolved);
    await new Promise((r) => setTimeout(r, 50));
  }
  return results;
}

function makeFourTiles(imageUrls) {
  const imgs = Array.isArray(imageUrls) ? imageUrls.slice(0, 4) : [];
  const placeholders = Math.max(0, 4 - imgs.length);
  return [...imgs, ...Array(placeholders).fill(null)];
}

const UserCars = () => {
  const { sid } = useParams(); // route: /usercars/:sid
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedFiles, setSelectedFiles] = useState({}); // { [carId]: File | undefined }
  const [uploading, setUploading] = useState({});         // { [carId]: boolean }
  const [uploadErrors, setUploadErrors] = useState({});    // { [carId]: string }

  // user id + token from localStorage (or sid from route)
  const userId = useMemo(() => sid ?? localStorage.getItem("user_id"), [sid]);
  const token = useMemo(() => localStorage.getItem("access_token"), []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!userId || !token) {
      setError("Missing user id or access token");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    let cancelled = false;

    (async () => {
      try {
        const carsRes = await api.get(`/cars/getcars/${userId}`, { headers, signal });
        const cars = normalizeCars(carsRes.data);
        if (!Array.isArray(cars) || cars.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }

        const MAX_CONCURRENCY = 8;
        const enriched = await inBatches(cars, MAX_CONCURRENCY, async (car) => {
          try {
            const imgRes = await api.get(
              `/cars/getusercarimages/${userId}/${car.id}`,
              { headers, signal }
            );
            const raw = normalizeImages(imgRes.data);
            const imageUrls = raw
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
      controller.abort();
      cancelled = true;
    };
  }, [sid, userId, token, headers]);

  const loggedInSellerId = localStorage.getItem("user_id");
  const sameAsLoggedIn = (sellerId) => String(sellerId) === String(loggedInSellerId);

  const handleFileChange = (carId, e) => {
    const file = e.target.files?.[0];
    setSelectedFiles((prev) => ({ ...prev, [carId]: file }));
    setUploadErrors((prev) => ({ ...prev, [carId]: "" }));
  };

  const handleUpload = async (userIdParam, carId) => {
    const file = selectedFiles[carId];
    if (!file) {
      setUploadErrors((prev) => ({ ...prev, [carId]: "Please select an image file." }));
      return;
    }
    if (!token) {
      setUploadErrors((prev) => ({ ...prev, [carId]: "Missing access token." }));
      return;
    }

    setUploading((prev) => ({ ...prev, [carId]: true }));
    setUploadErrors((prev) => ({ ...prev, [carId]: "" }));

    try {
      const form = new FormData();
      form.append("image", file);         // files={"image": f}
      form.append("car", String(carId));  // data={"car": carId}
      // If backend expects user/seller id, align and uncomment:
      // form.append("user", String(userIdParam)); // or "seller_id"

      await api.post(`/cars/addcarimages/`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh images for this car
      const imgRes = await api.get(`/cars/getusercarimages/${userIdParam}/${carId}`, { headers });
      const raw = normalizeImages(imgRes.data);
      const imageUrls = raw
        .map((img) => {
          const src = getImageSrc(img);
          return toAbsolute(src || (typeof img === "string" ? img : ""));
        })
        .filter(Boolean);

      setItems((prev) =>
        prev.map((c) => (c.id === carId ? { ...c, images: imageUrls, imagesError: undefined } : c))
      );
      setSelectedFiles((prev) => ({ ...prev, [carId]: undefined }));
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.message || "Upload failed";
      setUploadErrors((prev) => ({
        ...prev,
        [carId]: `Upload failed (${status || "?"}): ${detail}`,
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [carId]: false }));
    }
  };

  return (
    <div style={ui.container}>
      <Navbar />
      <main style={ui.main}>
        <h1 style={ui.pageTitle}>My Cars</h1>
        {loading && <p style={ui.muted}>Loading…</p>}
        {error && <div style={ui.errorInline}>{error}</div>}

        {!loading && items.length === 0 ? (
          <p style={ui.muted}>No cars available.</p>
        ) : (
          <div style={ui.grid}>
            {items.map((item) => {
              const tiles = makeFourTiles(item.images);
              const imageCount = Array.isArray(item.images) ? item.images.length : 0;

              // Show upload only when THIS car has fewer than 4 images
              const canAddMoreImages = imageCount < 4;
              const showUpload = sameAsLoggedIn(item.seller_id) && canAddMoreImages;

              return (
                <div key={item.id} style={ui.card}>
                  {item.description && <p style={ui.desc}>{item.description}</p>}

                  <div style={ui.infoRow}>
                    <span style={ui.infoBadge}>Vehicle: {item.id}</span>
                    <span style={ui.infoBadge}>Seller: {item.seller_id}</span>
                    <span style={ui.infoBadge}>Created On: {item.created_at}</span>
                  </div>

                  {item.imagesError && (
                    <div style={ui.errorInline}>Images error: {item.imagesError}</div>
                  )}

                  <div style={ui.right}>
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

                    {/* Upload controls (appear only when images < 4) */}
                    {showUpload && (
                      <div style={ui.uploadBox}>
                        <label style={ui.uploadLabel}>
                          Add an image for Vehicle {item.id}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(item.id, e)}
                          style={ui.fileInput}
                        />
                        <button
                          type="button"
                          onClick={() => handleUpload(loggedInSellerId, item.id)}
                          data-user-id={loggedInSellerId}
                          data-vehicle-id={item.id}
                          disabled={uploading[item.id] || !selectedFiles[item.id]}
                          style={ui.primaryBtn}
                        >
                          {uploading[item.id] ? "Uploading…" : "Add Image"}
                        </button>
                        {uploadErrors[item.id] && (
                          <div style={ui.errorInline}>{uploadErrors[item.id]}</div>
                        )}
                      </div>
                    )}

                    {/* Optional: show a note when max images reached */}
                    {!canAddMoreImages && sameAsLoggedIn(item.seller_id) && (
                      <div style={ui.mutedSmall}>
                        
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};







const ui = {
  container: { backgroundColor: "#F8F9FA", minHeight: "100vh" },
  main: { maxWidth: 1200, margin: "0 auto", padding: "24px 20px" },
  pageTitle: { margin: "0 0 12px", fontSize: 26, fontWeight: 800, color: "#212121" },
  muted: { color: "#6c757d" },
  loading: { maxWidth: 1200, margin: "0 auto", padding: "24px 20px", color: "#212121" },
  error: { maxWidth: 1200, margin: "0 auto", padding: "24px 20px", color: "#DC3545" },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 20,
  },

  card: {
    display: "grid",
    gridTemplateColumns: "0.8fr 1.2fr", // shrink left info, enlarge right images
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
    border: "1px solid #eee",
    overflow: "hidden",
  },

  /** Left (compact details) */
  left: { padding: 18, display: "flex", flexDirection: "column", gap: 8 },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: "#212121" },
  metaRow: { display: "flex", gap: 12, color: "#495057", flexWrap: "wrap" },
  meta: { fontSize: 13 },
  priceRow: { display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 },
  priceLabel: { fontSize: 12, color: "#6c757d" },
  priceValue: { fontSize: 22, fontWeight: 800, color: "#0D6EFD" },
  desc: { marginTop: 8, color: "#495057", lineHeight: 1.5, fontSize: 14 },
  infoRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
  infoBadge: {
    backgroundColor: "#e9ecef",
    color: "#343a40",
    padding: "5px 9px",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
  },
  actions: { display: "flex", gap: 10, marginTop: 12 },
  btnPrimary: {
    backgroundColor: "#0D6EFD",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: "#212529",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
  },
  errorInline: { color: "#DC3545", marginTop: 8, fontWeight: 600 },

  /** Right (LARGE 2×2 gallery) */
  right: {
    padding: 18,
    backgroundColor: "#fdfdfd",
    borderLeft: "1px solid #f1f3f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  imageGrid: {
    width: "100%",
    maxWidth: 720,          // <-- larger overall width
    display: "grid",
    gridTemplateColumns: "1fr 1fr", // 2 columns
    gridAutoRows: "minmax(0, 1fr)",
    gap: 14,                // spacing between tiles
  },
  imageTile: {
    width: "100%",
    aspectRatio: "16 / 10", // larger aspect ratio for clarity
    objectFit: "cover",
    borderRadius: 14,
    border: "1px solid #e9ecef",
    backgroundColor: "#fff",
    display: "block",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  },
  placeholderTile: {
    width: "100%",
    aspectRatio: "16 / 10",
    borderRadius: 14,
    border: "1px dashed #dee2e6",
    backgroundColor: "#fafafa",
    color: "#6c757d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { fontSize: 12 },
};


export default  UserCars;