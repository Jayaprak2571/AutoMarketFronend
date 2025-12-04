import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar";
import Footer from "../../Components/Footer";
const api = axios.create({
  baseURL: "http://localhost:8002",
});

const MyCars = () => {
  const { sid } = useParams(); // route: /usercars/:sid
  const [items, setItems] = useState([]);     // should be an array
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = sid ?? localStorage.getItem("user_id");
    const token = localStorage.getItem("access_token");

    if (!userId || !token) {
      setError("Missing user id or access token");
      setLoading(false);
      return;
    }

    api
      .get(`/testdrive/getuserdrives/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Expect an array from the server (DRF should return serializer.data)
        const list = Array.isArray(res.data) ? res.data : [];
        setItems(list); // <-- set the array
      })
      .catch((err) => {
        const status = err.response?.status;
        const detail = err.response?.data?.detail || err.message;
        setError(`Request failed (${status || "?"}): ${detail}`);
      })
      .finally(() => setLoading(false));
  }, [sid]);

  if (loading) return <h1>Loading…</h1>;
  if (error) return <h1>Error: {error}</h1>;

  return (
    <div>
    <Navbar></Navbar>
      <h1>My Cars</h1>
      {!Array.isArray(items) || items.length === 0 ? (
        <p>No cars available.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.user_id} </strong>
              <div>Vehicle Id: {item.vehicle_id}</div>
              <div>Scheduled Date: {item.scheduled_date}</div>
              <div>Status: {item.status}</div>
              {item.status === "Pending" && (
                        <button  onClick={() => navigate(`/testdrive/change-status/${item.vehicle_id}`)}>Update</button>
                )}              
              <br />
              <br />
            </li>
          ))}
        </ul>
      )}
      <Footer></Footer>
    </div>
  );
};

export default MyCars;