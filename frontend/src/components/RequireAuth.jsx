// src/components/RequireAuth.jsx
import { Navigate } from "react-router-dom";

function isTokenValid(token) {
  if (!token) return false;
  try {
    // ถอด payload ออกจาก JWT
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    // เช็คว่า token หมดอายุหรือยัง
    return payload.exp > now;
  } catch {
    return false;
  }
}

export default function RequireAuth({ children }) {
  const token = localStorage.getItem("access_token");

  if (!isTokenValid(token)) {
    // ✅ ลบ token ที่หมดอายุออกด้วย
    localStorage.removeItem("access_token");
    return <Navigate to="/login" replace />;
  }

  return children;
}