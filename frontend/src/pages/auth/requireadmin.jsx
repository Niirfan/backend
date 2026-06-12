import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== "Admin" && user.role !== "Superadmin") {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
