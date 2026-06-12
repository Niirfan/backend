import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaBell, FaSignOutAlt, FaChevronDown, FaShieldAlt } from "react-icons/fa";

// ── Page label map ─────────────────────────────────────────────────
const PAGE_LABELS = {
  "/admin/dashboard":  { label: "ภาพรวมระบบ",               icon: "🗂" },
  "/admin/dashbord":   { label: "ภาพรวมระบบ",               icon: "🗂" },
  "/admin/materials":  { label: "รายการวัสดุสำนักงาน",      icon: "📦" },
  "/admin/history":    { label: "ประวัติการเข้าออกวัสดุ",   icon: "📋" },
  "/admin/inout":      { label: "ประวัติการเข้าออกวัสดุ",   icon: "📋" },
  "/admin/requests":   { label: "รายการเบิก",               icon: "✅" },
  "/admin/approve-requests": { label: "รายการเบิก",         icon: "✅" },
  "/admin/users":      { label: "รายการผู้ใช้",             icon: "👥" },
  "/admin/inventory":  { label: "รายงานคงคลัง",             icon: "📊" },
  "/admin/reports":    { label: "รายงานคงคลัง",             icon: "📊" },
  "/admin/report":     { label: "รายงานสถิติ",              icon: "📈" },
  "/admin/material/add": { label: "เพิ่มรายการวัสดุ",       icon: "➕" },
};

export default function AdminTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const page = PAGE_LABELS[location.pathname] || { label: "Admin Panel", icon: "🛡" };

  // ดึง admin info จาก localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user.full_name || user.name || user.emp_code || "Admin";
  const role = user.role || "Administrator";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header
      className="h-16 bg-white flex-shrink-0 sticky top-0 z-50"
      style={{ borderBottom: "1px solid #e8f5e9", boxShadow: "0 2px 10px rgba(46,125,50,.06)" }}
    >
      <style>{`
        .admin-topbar-menu { animation: tbanim .18s ease; }
        @keyframes tbanim { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:none} }
        .notif-btn { transition: background .15s; }
        .notif-btn:hover { background: #e8f5e9; }
        .profile-btn { transition: border-color .15s, box-shadow .15s; }
        .profile-btn:hover { border-color: #a5d6a7 !important; }
        .logout-item { transition: background .15s; }
        .logout-item:hover { background: #fef2f2; }
      `}</style>

      <div className="h-full flex items-center justify-between px-6 gap-4">

        {/* ── Left: breadcrumb / page title ── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Icon */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
            style={{ background: "#e8f5e9" }}
          >
            {page.icon}
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span style={{ color: "#9ca3af" }}>Admin</span>
            <span style={{ color: "#c8e6c9" }}>/</span>
            <span className="font-bold truncate" style={{ color: "#1a1a1a" }}>{page.label}</span>
          </div>
        </div>

        {/* ── Right: actions ── */}
        <div className="flex items-center gap-2 flex-shrink-0" ref={menuRef}>

          {/* Notification bell */}
          <button
            className="notif-btn w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ border: "1.5px solid #e8f5e9", background: "#fff" }}
            title="แจ้งเตือน"
          >
            <FaBell size={14} style={{ color: "#6b7280" }} />
          </button>

          {/* Profile button */}
          <button
            onClick={() => setIsMenuOpen(v => !v)}
            className="profile-btn flex items-center gap-2.5 pl-2 pr-3 h-9 rounded-xl cursor-pointer"
            style={{
              border: `1.5px solid ${isMenuOpen ? "#2e7d32" : "#e8f5e9"}`,
              background: "#fff",
              boxShadow: isMenuOpen ? "0 0 0 3px rgba(46,125,50,.1)" : "none",
            }}
          >
            {/* Avatar */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#e8f5e9" }}
            >
              <FaUserCircle size={16} style={{ color: "#2e7d32" }} />
            </div>

            <div className="flex flex-col items-start leading-none">
              <span className="text-xs font-bold" style={{ color: "#1a1a1a" }}>{displayName}</span>
              <span className="text-xs" style={{ color: "#9ca3af", fontSize: 10 }}>{role}</span>
            </div>

            <FaChevronDown
              size={10}
              style={{
                color: "#6b7280",
                transform: isMenuOpen ? "rotate(180deg)" : "rotate(0)",
                transition: "transform .2s",
              }}
            />
          </button>

          {/* ── Dropdown ── */}
          {isMenuOpen && (
            <div
              className="admin-topbar-menu absolute top-14 right-6 w-56 bg-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid #e8f5e9",
                boxShadow: "0 8px 32px rgba(46,125,50,.15), 0 2px 8px rgba(0,0,0,.08)",
                zIndex: 100,
              }}
            >
              {/* User info block */}
              <div
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ background: "#f4faf4", borderBottom: "1px solid #e8f5e9" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#e8f5e9" }}
                >
                  <FaShieldAlt size={16} style={{ color: "#2e7d32" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "#1a1a1a" }}>{displayName}</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>{role}</p>
                </div>
              </div>

              {/* Logout */}
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="logout-item w-full flex items-center justify-between px-3 py-2.5 rounded-xl"
                >
                  <span className="text-sm font-semibold" style={{ color: "#dc2626" }}>ออกจากระบบ</span>
                  <FaSignOutAlt size={13} style={{ color: "#dc2626" }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}