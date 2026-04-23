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

        const token = response.data.access_token;
        localStorage.setItem('access_token', token);

        // 🟢 1. ดึงข้อมูลสิทธิ์ (Role) จาก Backend มาเช็ก
        // (ปกติ Backend ของเราส่งสิทธิ์กลับมาใน Token หรือเพิ่ม Field role มาให้)
       const roleFromBackend = response.data.role; 

        alert("ล็อกอินสำเร็จ! 🎉");
        
        // 🟢 2. สั่งเปลี่ยนหน้า (Navigate) ตามสิทธิ์
        if (roleFromBackend === "Admin" || roleFromBackend === "Superadmin") {
            navigate('/admin/dashboard'); // 👈 ใส่ Path หน้า Admin ของรุ่นพี่
        } else {
            navigate('/user/home'); // 👈 ใส่ Path หน้าพนักงานทั่วไป
        }

    } catch (error) {
        console.error("Login failed:", error);
        alert("รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง");
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