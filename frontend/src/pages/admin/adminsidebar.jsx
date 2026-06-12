import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaThLarge, FaBox, FaLaptop, FaCheckSquare,
  FaClipboardList, FaUsers, FaChartBar, FaBars,
  FaSignOutAlt, FaShieldAlt
} from "react-icons/fa";

const menuGroups = [
  {
    title: "ภาพรวม",
    items: [
      { name: "ภาพรวมระบบ", path: "/admin/dashboard", icon: <FaThLarge size={14}/> },
    ],
  },
  {
    title: "วัสดุสำนักงาน",
    items: [
      { name: "รายการวัสดุ",         path: "/admin/materials", icon: <FaBox size={14}/> },
      { name: "ประวัติการเข้าออก",   path: "/admin/history",   icon: <FaBars size={14}/> },
    ],
  },
  {
    title: "การอนุมัติ",
    items: [
      { name: "รายการเบิก", path: "/admin/requests", icon: <FaCheckSquare size={14}/> },
    ],
  },
  {
    title: "ผู้ใช้งาน",
    items: [
      { name: "รายการผู้ใช้", path: "/admin/users", icon: <FaUsers size={14}/> },
    ],
  },
  {
    title: "รายงาน",
    items: [
      { name: "รายงานคงคลัง", path: "/admin/inventory", icon: <FaChartBar size={14}/> },
      { name: "รายงานสถิติ",  path: "/admin/report",    icon: <FaLaptop size={14}/> },
    ],
  },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path ||
    (path === "/admin/dashboard" && location.pathname === "/admin/dashbord");

  return (
    <aside
      className="w-64 h-screen flex flex-col overflow-hidden"
      style={{ background: "#fff", borderRight: "1px solid #e8f5e9", boxShadow: "2px 0 12px rgba(46,125,50,.07)" }}
    >
      <style>{`
        .admin-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .admin-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb { background: #c8e6c9; border-radius: 99px; }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #a5d6a7; }
        .admin-nav-link { transition: background .15s, color .15s, box-shadow .15s; }
        .admin-nav-link:hover:not(.active) { background: #e8f5e9; color: #2e7d32; }
        .admin-nav-link.active { background: #a5d6a7; color: #fff; box-shadow: 0 4px 12px rgba(46,125,50,.25); }
        .admin-nav-link.active .nav-icon { color: #fff; }
        .admin-nav-link:not(.active) .nav-icon { color: #a5d6a7; }
        .admin-nav-link:hover:not(.active) .nav-icon { color: #2e7d32; }
        .logout-btn { transition: background .15s; }
        .logout-btn:hover { background: #fef2f2; }
      `}</style>

      {/* ── Logo / Brand ── */}
      <div className="flex-shrink-0 px-5 py-5" style={{ borderBottom: "1px solid #e8f5e9" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#2e7d32" }}
          >
            <FaShieldAlt size={16} color="#fff" />
          </div>
          <div>
            <p className="font-extrabold text-sm leading-tight" style={{ color: "#1a1a1a" }}>
              Admin Panel
            </p>
            <p className="text-xs" style={{ color: "#a5d6a7" }}>ระบบจัดการพัสดุ</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto admin-sidebar-scroll px-3 py-4 space-y-5">
        {menuGroups.map((group) => (
          <div key={group.title}>
            {/* Group label */}
            <p
              className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5"
              style={{ color: "#c8e6c9" }}
            >
              {group.title}
            </p>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`admin-nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${active ? "active" : ""}`}
                    style={!active ? { color: "#374151" } : {}}
                  >
                    <span className="nav-icon flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                    {active && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(255,255,255,.6)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Logout ── */}
      <div className="flex-shrink-0 px-3 py-4" style={{ borderTop: "1px solid #e8f5e9" }}>
        <button
          onClick={handleLogout}
          className="logout-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
          style={{ color: "#dc2626" }}
        >
          <FaSignOutAlt size={14} className="flex-shrink-0" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}