// pages/ProfilePage.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import {
  HiOutlineUser,
  HiOutlineBriefcase,
  HiOutlineOfficeBuilding,
  HiOutlineIdentification,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineKey,
  HiOutlinePencil,
  HiOutlineShieldCheck,
  HiOutlineDeviceMobile,
} from "react-icons/hi";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    "ngrok-skip-browser-warning": "true",
  };
}

function SafeImage({ src, alt, className }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const prevUrl = useRef(null);

  useEffect(() => {
    if (!src) {
      setObjectUrl(null);
      return;
    }

    // ถ้าเป็น base64 (preview ทันทีก่อน upload เสร็จ) ใช้ตรงได้เลย
    if (src.startsWith("data:")) {
      setObjectUrl(src);
      return;
    }

    let cancelled = false;
    fetch(src, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((r) => r.blob())
      .then((blob) => {
        if (!cancelled) {
          // revoke URL เก่าก่อน
          if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
          const url = URL.createObjectURL(blob);
          prevUrl.current = url;
          setObjectUrl(url);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    return () => {
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
    };
  }, []);

  if (!objectUrl) return null;
  return <img src={objectUrl} alt={alt} className={className} />;
}

export default function ProfilePage() {
  const [profileImage, setProfileImage] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data = await res.json();
        console.log("🔍 /auth/me response:", data);
        setProfileImage(
          data.profile_image ? `${API_BASE}${data.profile_image}` : null,
        );
        setUserData({
          name: data.full_name || data.name || "-",
          position: data.position || data.job_title || "-",
          branch: data.branch_name || data.branch_id || data.branch || "-",
          employeeId: data.emp_code || "-",
          phone: data.phone || "-",
          email: data.email || "-",
          role: data.user_role || data.role || "-",
        });
      } catch {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          setProfileImage(
            u.profile_image ? `${API_BASE}${u.profile_image}` : null,
          );
          setUserData({
            name: u.full_name || u.name || "-",
            position: u.position || "-",
            branch: u.branch_name || u.branch_id || u.branch || "-",
            employeeId: u.emp_code || "-",
            phone: u.phone || "-",
            email: u.email || "-",
            role: u.user_role || u.role || "-",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset error
    setUploadError(null);

    // Preview ทันทีด้วย base64
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);

    // Upload ไปที่ server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profile_image", file); // ตรงกับ backend: profile_image: UploadFile // ปรับชื่อ field ให้ตรงกับ backend

      const res = await fetch(`${API_BASE}/users/me/avatar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
          "ngrok-skip-browser-warning": "true",
          // ❌ ห้ามใส่ Content-Type ตรงนี้ ให้ browser จัดการ boundary เอง
        },
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const data = await res.json();

      // ใช้ URL จาก server response (UserResponse มี profile_image)
      const newImageUrl = `${API_BASE}${data.profile_image}`;
      setProfileImage(newImageUrl);

      // Sync ลง localStorage
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        u.profile_image = data.profile_image;
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
      // ยังคง preview รูปที่เลือกไว้ แต่จะหายเมื่อ refresh เพราะไม่ได้บันทึก
    } finally {
      setUploading(false);
      // reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("");

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f0f4f0" }}
      >
        <div className="text-center">
          <div
            className="h-10 w-10 border-4 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: "#c8e6c9", borderTopColor: "#2e7d32" }}
          />
          <p className="text-sm" style={{ color: "#6b7280" }}>
            กำลังโหลดข้อมูลผู้ใช้...
          </p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-sm"
        style={{ background: "#f0f4f0", color: "#9ca3af" }}
      >
        ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่
      </div>
    );
  }

  const initials = getInitials(userData.name);

  return (
    <div className="min-h-screen p-7" style={{ background: "#f0f4f0" }}>
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>
            ข้อมูลของฉัน
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
            ดูและจัดการข้อมูลส่วนตัวของคุณ
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          style={{
            border: "1.5px solid #c8e6c9",
            color: uploading ? "#9ca3af" : "#2e7d32",
            background: "#fff",
            cursor: uploading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!uploading) e.currentTarget.style.background = "#f4faf4";
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        >
          {uploading ? (
            <>
              <div
                className="h-3.5 w-3.5 border-2 rounded-full animate-spin"
                style={{ borderColor: "#c8e6c9", borderTopColor: "#2e7d32" }}
              />
              กำลังอัปโหลด...
            </>
          ) : (
            <>
              <HiOutlinePencil size={15} />
              แก้ไขโปรไฟล์
            </>
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* ── Upload Error Banner ── */}
      {uploadError && (
        <div
          className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center justify-between"
          style={{ background: "#fee2e2", color: "#dc2626" }}
        >
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="ml-3 font-bold"
            style={{ color: "#dc2626" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Profile strip ── */}
      <div
        className="rounded-2xl p-5 flex items-center gap-5 mb-4"
        style={{ background: "#2e7d32" }}
      >
        {/* Avatar */}
        <div
          className="relative cursor-pointer group flex-shrink-0"
          onClick={() => !uploading && fileInputRef.current.click()}
        >
          <div
            className="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              background: "#fff",
              border: "2px solid rgba(255,255,255,0.5)",
            }}
          >
            {uploading ? (
              <div
                className="h-6 w-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "#c8e6c9", borderTopColor: "#2e7d32" }}
              />
            ) : profileImage ? (
              <SafeImage
                src={profileImage}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : initials ? (
              <span
                className="text-2xl font-semibold"
                style={{ color: "#2e7d32" }}
              >
                {initials}
              </span>
            ) : (
              <FaUserCircle
                className="h-full w-full"
                style={{ color: "#a5d6a7" }}
              />
            )}
          </div>
          {!uploading && (
            <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <HiOutlinePencil className="text-white" size={18} />
            </div>
          )}
        </div>

        {/* Name & meta */}
        <div>
          <p className="text-lg font-semibold text-white">{userData.name}</p>
          <p
            className="text-sm mt-0.5"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {userData.position}
            {userData.branch && userData.branch !== "-"
              ? ` สาขา ${userData.branch}`
              : ""}
            {userData.employeeId && userData.employeeId !== "-"
              ? ` ${userData.employeeId}`
              : ""}
          </p>
          <span
            className="inline-flex items-center gap-1 text-xs mt-2 px-3 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
          >
            <HiOutlineShieldCheck size={12} />
            {userData.role}
          </span>
        </div>
      </div>

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "สาขา", value: userData.branch },
          { label: "ประเภทงาน", value: "เต็มเวลา" },
          { label: "สถานะ", value: "ปกติ", green: true },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl text-center py-4"
            style={{ background: "#fff", border: "1px solid #e8f5e9" }}
          >
            <p
              className="text-sm font-semibold truncate px-2"
              style={{ color: s.green ? "#2e7d32" : "#1a1a1a" }}
            >
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ข้อมูลพนักงาน */}
        <div>
          <SectionLabel
            icon={<HiOutlineUser size={13} />}
            title="ข้อมูลพนักงาน"
          />
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid #e8f5e9" }}
          >
            <InfoRow
              icon={<HiOutlineIdentification size={16} />}
              label="ชื่อ-นามสกุล"
              value={userData.name}
            />
            <InfoRow
              icon={<HiOutlineBriefcase size={16} />}
              label="ตำแหน่ง"
              value={userData.position}
            />
            <InfoRow
              icon={<HiOutlineOfficeBuilding size={16} />}
              label="สาขา"
              value={userData.branch}
            />
            <InfoRow
              icon={<HiOutlineIdentification size={16} />}
              label="รหัสพนักงาน"
              value={userData.employeeId}
              last
            />
          </div>
        </div>

        {/* ติดต่อ & ความปลอดภัย */}
        <div>
          <SectionLabel
            icon={<HiOutlinePhone size={13} />}
            title="ติดต่อ & ความปลอดภัย"
          />
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid #e8f5e9" }}
          >
            <InfoRow
              icon={<HiOutlinePhone size={16} />}
              label="เบอร์โทร"
              value={userData.phone}
            />
            <InfoRow
              icon={<HiOutlineMail size={16} />}
              label="อีเมล"
              value={userData.email}
            />
            <InfoRow
              icon={<HiOutlineKey size={16} />}
              label="รหัสผ่าน"
              action={
                <button
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: "#e8f5e9", color: "#2e7d32" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#c8e6c9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#e8f5e9")
                  }
                >
                  เปลี่ยนรหัสผ่าน
                </button>
              }
            />
            <InfoRow
              icon={<HiOutlineDeviceMobile size={16} />}
              label="การยืนยันตัวตน"
              action={
                <span
                  className="text-xs font-medium px-3 py-1 rounded-lg"
                  style={{ background: "#e8f5e9", color: "#2e7d32" }}
                >
                  เปิดใช้งาน
                </span>
              }
              last
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SectionLabel({ icon, title }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest mb-2.5 flex items-center gap-1.5"
      style={{ color: "#2e7d32" }}
    >
      {icon}
      {title}
    </p>
  );
}

function InfoRow({ icon, label, value, action, last = false }) {
  return (
    <div
      className="flex items-center px-5 py-3.5"
      style={!last ? { borderBottom: "1px solid #f0f8f0" } : {}}
    >
      {/* Icon box */}
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mr-3"
        style={{ background: "#f4faf4" }}
      >
        <span style={{ color: "#4caf50" }}>{icon}</span>
      </div>

      {/* Label */}
      <span className="text-sm flex-1" style={{ color: "#6b7280" }}>
        {label}
      </span>

      {/* Value or action */}
      {action ? (
        action
      ) : (
        <span className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
          {value}
        </span>
      )}
    </div>
  );
}