import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";

export default function Topbar({ onNotifClick }) {
  const [showLogoutCard, setShowLogoutCard] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    setShowLogoutCard(false);
    navigate("/login");
  };

  // ดึงชื่อผู้ใช้จาก localStorage ถ้ามี
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user.full_name || user.name || user.emp_code || "User";

  return (
    <header
      className="w-full sticky top-0 z-30"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e8f5e9",
        boxShadow: "0 2px 12px rgba(46,125,50,0.07)",
      }}
    >
      <div className="h-16 px-6 flex items-center justify-end">
        <div className="flex items-center gap-2.5">

          {/* ── ปุ่มแจ้งเตือน ── */}
          <button
            onClick={onNotifClick}
            className="h-9 w-9 rounded-xl flex items-center justify-center transition text-base"
            style={{ border: "1.5px solid #c8e6c9", background: "#fff" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f5e9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            title="แจ้งเตือน"
          >
            🔔
          </button>

          {/* ── ปุ่ม User ── */}
          <div className="relative">
            <button
              onClick={() => setShowLogoutCard(!showLogoutCard)}
              className="h-9 px-3 rounded-xl flex items-center gap-2 transition"
              style={{ border: "1.5px solid #c8e6c9", background: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f5e9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              title="บัญชีผู้ใช้"
            >
              <FaUserCircle style={{ color: "#2e7d32" }} size={16} />
              <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                {displayName}
              </span>
              {/* chevron */}
              <svg
                className="w-3 h-3 transition-transform"
                style={{
                  color: "#6b7280",
                  transform: showLogoutCard ? "rotate(180deg)" : "rotate(0deg)",
                }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* ── Dropdown ── */}
            {showLogoutCard && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLogoutCard(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl p-2 z-20"
                  style={{
                    boxShadow: "0 8px 32px rgba(46,125,50,0.15), 0 2px 8px rgba(0,0,0,0.08)",
                    border: "1px solid #e8f5e9",
                    animation: "fadeDown 0.15s ease",
                  }}
                >
                  {/* User info */}
                  <div
                    className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-xl"
                    style={{ background: "#f4f6f4" }}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#e8f5e9" }}
                    >
                      <FaUserCircle style={{ color: "#2e7d32" }} size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>
                        {displayName}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#6b7280" }}>
                        {user.role || "ผู้ใช้งาน"}
                      </p>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition group"
                    style={{ color: "#dc2626" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <span className="text-sm font-semibold">ออกจากระบบ</span>
                    <FaSignOutAlt
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                </div>

                <style>{`
                  @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                `}</style>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}