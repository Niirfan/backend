import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MyLogo from "../../assets/mylogo.png";
import api from '../../services/api';

export default function LoginPage() {
  // 1. สร้าง State เพื่อเลือกว่าเป็น Admin หรือ User (ค่าเริ่มต้นเป็น User)
  const [empCode, setEmpCode] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await api.post('/auth/login', {
      emp_code: empCode,
      password: password
    });

    console.log("Response ทั้งหมด:", response.data); // ดูว่า role ชื่ออะไร

    const token = response.data.access_token;
    const roleFromBackend = response.data.role;

    localStorage.setItem('access_token', token);
    
    // ✅ เพิ่มบรรทัดนี้ — เซฟ user object ให้ RequireAdmin อ่านได้
    localStorage.setItem('user', JSON.stringify({ role: roleFromBackend }));

    alert("ล็อกอินสำเร็จ! 🎉");

    if (roleFromBackend === "Admin" || roleFromBackend === "Superadmin") {
      navigate('/admin/dashboard');
    } else {
      navigate('/user/home');
    }

  } catch (error) {
    const msg = error.response?.data?.detail || "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง";
    alert(msg);
  }
};
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4 relative">
      <div className="mb-3 flex flex-col items-center">
      <img 
        src={MyLogo} 
        alt="AIC Logo" 
        className="h-30 w-auto object-contain" 
      />
    </div>

      {/* --- การ์ด Login --- */}
      <div className="w-full max-w-[350px] bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">เข้าสู่ระบบ</h2>
          
          <form onSubmit={handleLogin} className="space-y- text-left">
            {/* Input EMP */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 ml-1">รหัสพนักงาน</label>
              <input
                type="text"
                placeholder="EMP001"
                value={empCode}
                onChange={(e) => setEmpCode(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-[#F8F9FA] border-none outline-none focus:ring-2 focus:ring-black/5 text-sm"
                required
              />
            </div>

            {/* Input รหัสผ่าน */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 ml-1">รหัสผ่าน</label>
              <input
                type="password"
                placeholder=".........."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-[#F8F9FA] border-none outline-none focus:ring-2 focus:ring-black/5 text-sm"
                required
              />
            </div>

            {/* ปุ่มเข้าสู่ระบบ */}
            <button
              type="submit"
              className="w-full py-3 mt-4 bg-[#1A1A1A] text-white rounded-2xl font-bold text-sm hover:bg-black transition-colors shadow-lg"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}