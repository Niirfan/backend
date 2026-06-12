import { Routes, Route, Navigate } from "react-router-dom";
import BorrowMaterialPage from "./pages/user/material";
import EquipmentPage from "./pages/user/equipment";
import CartPage from "./pages/user/cart";
import ReviewRequestPage from "./pages/user/review";
import RequestListPage from "./pages/user/request";
import RequestDetailPage from "./pages/user/requestdetail";
import HistoryPage from "./pages/user/history";
import ProfilePage from "./pages/user/profile";
import LoginPage from "./pages/auth/loginpage";
import AdminDashboard from "./pages/admin/dashboard";
import AdminMaterials from "./pages/admin/adminmaterial";
import AddMaterials from "./pages/admin/addmaterial";
import MaterialDetail from "./pages/admin/materialdetail";
import AdminUserManagement from "./pages/admin/usermanagement";
import AdminRequestListPage from "./pages/admin/requestlist";
import AdminRequestDetailPage from "./pages/admin/requestdetail";
import AdminInventoryPage from "./pages/admin/inventory";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminInoutPage from "./pages/admin/history";
import EditMaterial from "./pages/admin/editMaterial";
import AdminReport from "./pages/admin/AdminReport";
import LiffRegister from "./pages/user/LiffRegister";
import BranchDashboard from "./pages/branch/BranchDashboard";
import MonthlyDetailPage from "./pages/admin/MonthlyDetailPage";




export default function AppRoutes() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}"); //  ดึงข้อมูล user จาก localStorage เพื่อส่งเป็น prop ให้ BranchDashboard

  return (
    <Routes>

      {/* redirect */}
      <Route path="/" element={<Navigate to="/borrow-material" replace />} />

      {/* public */}
      <Route path="/login" element={<LoginPage />} />

      {/* user routes */}
      <Route path="/borrow-material" element={<BorrowMaterialPage />} />
      <Route path="/equipment" element={<EquipmentPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/cart/review" element={<ReviewRequestPage />} />  
      <Route path="/requests" element={<RequestListPage />} />
      <Route path="/requests/:id" element={<RequestDetailPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/liff/register" element={<LiffRegister />} />
      <Route path="/branch-dashboard" element={<BranchDashboard currentUser={currentUser} />} />
      <Route path="/admin/report/monthly-detail" element={<MonthlyDetailPage />} />
      

      {/* ================= ADMIN ================= */}

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="Admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/materials"
        element={
          <ProtectedRoute role="Admin">
            <AdminMaterials />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/material/add"
        element={
          <ProtectedRoute role="Admin">
            <AddMaterials />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/materials/:id"
        element={
          <ProtectedRoute role="Admin">
            <MaterialDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/material/edit/:id"
        element={
          <ProtectedRoute role="Admin">
            <EditMaterial />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute role="Admin">
            <AdminUserManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute role="Admin">
            <AdminRequestListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/request-detail/:id"
        element={
          <ProtectedRoute role="Admin">
            <AdminRequestDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/inventory"
        element={
          <ProtectedRoute role="Admin">
            <AdminInventoryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/history"
        element={
          <ProtectedRoute role="Admin">
            <AdminInoutPage />
          </ProtectedRoute> 
        }
      />
      <Route path="/admin/report" element={<AdminReport />} />
    </Routes>
    
  );
}
