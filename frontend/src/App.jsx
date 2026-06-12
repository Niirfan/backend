import { CartProvider } from "./context/CartContext";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import AdminSidebar from "./pages/admin/adminsidebar";
import AdminTopbar from "./pages/admin/admintopbar";
import AppRoutes from "./AppRoutes";
import RequireAuth from "./components/RequireAuth";
import { useLocation } from "react-router-dom";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <CartProvider>
      {isLoginPage ? (
        /* 1. หน้า Login */
        <AppRoutes />
      ) : isAdminPage ? (
        /* 2. Admin */
        <RequireAuth>
          <div className="flex h-screen overflow-hidden">
            <AdminSidebar />
            <div className="flex flex-1 flex-col">
              <AdminTopbar />
              <main className="flex-1 overflow-y-auto bg-gray-100">
                <AppRoutes />
              </main>
            </div>
          </div>
        </RequireAuth>
      ) : (
        /* 3. User */
        <RequireAuth>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              <Topbar />
              <main className="flex-1 overflow-y-auto bg-gray-50">
                {/* ✅ key={location.key} ทำให้ re-mount ใหม่ทุกครั้งที่ navigate */}
                <AppRoutes key={location.key} />
              </main>
            </div>
          </div>
        </RequireAuth>
      )}
    </CartProvider>
  );
}