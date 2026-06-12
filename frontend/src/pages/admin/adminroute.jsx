import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  // ❌ ยังไม่ login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ ไม่ใช่ Superadmin
  if (user.role !== "Superadmin") {
    return <Navigate to="/user" replace />;
  }

  // ✅ ผ่าน
  return children;
}
