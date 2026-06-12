import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import {
  FaThLarge,
  FaShoppingCart,
  FaClipboardList,
  FaHistory,
  FaUser,
  FaSignOutAlt,
  FaBomb,
  FaChessBoard,
  FaLaptop,
} from "react-icons/fa";

const menu = [
  { to: "/branch-dashboard",       label: "Dashboard",        icon: <FaLaptop /> },
  { to: "/borrow-material", label: "เบิกวัสดุ",      icon: <FaThLarge /> },
  { to: "/cart",            label: "ตะกร้าเบิกของ",  icon: <FaShoppingCart /> },
  { to: "/requests",        label: "รายการคำขอ",      icon: <FaClipboardList /> },
  { to: "/history",         label: "ประวัติการเบิก",  icon: <FaHistory /> },
  { to: "/profile",         label: "บัญชีของฉัน",    icon: <FaUser /> },
  { to: "/liff/register",   label: "ผูกบัญชี LINE", icon: <FaUser /> },
  
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside
      className="w-64 h-screen flex flex-col"
      style={{
        background: "#fff",
        borderRight: "1px solid #e8f5e9",
        boxShadow: "2px 0 12px rgba(46,125,50,0.07)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center justify-center px-6 py-5"
        style={{ borderBottom: "1px solid #e8f5e9" }}
      >
        <img
          src={logo}
          alt="AiC Logo"
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* ── Label ── */}
      <div className="px-5 pt-5 pb-2">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#a5d6a7" }}
        >
          เมนูหลัก
        </p>
      </div>

      {/* ── Menu ── */}
      <nav className="px-3 space-y-1 flex-1">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={({ isActive }) =>
              isActive
                ? {
                    background: "#2e7d32",
                    color: "#fff",
                    boxShadow: "0 4px 12px rgba(46,125,50,0.25)",
                  }
                : { color: "#374151" }
            }
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains("active")) {
                e.currentTarget.style.background = "#e8f5e9";
                e.currentTarget.style.color = "#2e7d32";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.getAttribute("aria-current")) {
                e.currentTarget.style.background = "";
                e.currentTarget.style.color = "#374151";
              }
            }}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Logout ── */}
      <div className="px-3 pb-5" style={{ borderTop: "1px solid #e8f5e9", paddingTop: "12px" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition"
          style={{ color: "#dc2626" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fef2f2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "";
          }}
        >
          <FaSignOutAlt className="text-base flex-shrink-0" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}