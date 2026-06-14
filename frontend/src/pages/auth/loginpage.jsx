// pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MyLogo from "../../assets/mylogo.png";
import api from '../../services/api';
import { useToast } from "../../context/ToastContext";

export default function LoginPage() {
  const [empCode, setEmpCode] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', {
        emp_code: empCode,
        password: password
      });

      console.log("Response ทั้งหมด:", response.data);

      const token = response.data.access_token;
      const roleFromBackend = response.data.role;
      const canRequest = response.data.can_request;

      localStorage.clear();
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify({
        role: roleFromBackend,
        can_request: response.data.can_request,
        emp_code: empCode
      }));

      showSuccess("ล็อกอินสำเร็จ!");

      if (roleFromBackend === "Admin" || roleFromBackend === "Superadmin") {
        navigate('/admin/dashboard');
      } else {
        navigate('/borrow-material');
      }

    } catch (error) {
      const msg = error.response?.data?.detail || "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง";
      showError(msg);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{ background: "linear-gradient(160deg, #e8f5e9 0%, #f4f6f4 50%, #c8e6c9 100%)" }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-20"
          style={{ background: "#2e7d32", filter: "blur(80px)" }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-15"
          style={{ background: "#43a047", filter: "blur(100px)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[380px]">

        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <img
            src={MyLogo}
            alt="AIC Logo"
            className="h-30 w-auto object-contain drop-shadow-sm"
          />
        </div>

        {/* Card */}
        <div
          className="w-full bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 8px 40px rgba(46,125,50,0.15), 0 2px 12px rgba(0,0,0,0.08)" }}
        >
          {/* Green top accent */}
          <div style={{ background: "#2e7d32", height: "5px" }} />

          <div className="p-8">
            {/* Title */}
            <div className="mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>
                เข้าสู่ระบบ
              </h2>
              <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                ระบบเบิกพัสดุสหกรณ์อิสลามอัศศิดดีก
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">

              {/* รหัสพนักงาน */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold ml-1" style={{ color: "#374151" }}>
                  รหัสพนักงาน
                </label>
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 transition"
                  style={{ background: "#f4f6f4", border: "1.5px solid transparent" }}
                  onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#2e7d32")}
                  onBlurCapture={(e) => (e.currentTarget.style.borderColor = "transparent")}
                >
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#a5d6a7" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                  </svg>
                  <input
                    type="text"
                    placeholder="EMP001"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                    style={{ color: "#1a1a1a" }}
                    required
                  />
                </div>
              </div>

              {/* รหัสผ่าน */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold ml-1" style={{ color: "#374151" }}>
                  รหัสผ่าน
                </label>
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 transition"
                  style={{ background: "#f4f6f4", border: "1.5px solid transparent" }}
                  onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#2e7d32")}
                  onBlurCapture={(e) => (e.currentTarget.style.borderColor = "transparent")}
                >
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#a5d6a7" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                    style={{ color: "#1a1a1a" }}
                    required
                  />
                </div>
              </div>

              {/* ปุ่มเข้าสู่ระบบ */}
              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-2xl font-bold text-sm text-white transition"
                style={{ background: "#2e7d32", boxShadow: "0 4px 16px rgba(46,125,50,0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#43a047")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#2e7d32")}
              >
                เข้าสู่ระบบ
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-center" style={{ color: "#9ca3af" }}>
          © สหกรณ์อิสลามอัศศิดดีก จำกัด
        </p>
      </div>
    </div>
  );
}