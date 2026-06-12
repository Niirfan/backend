import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaDownload, FaArrowLeft, FaFileAlt, FaUser,
  FaCalendarAlt, FaCheckCircle, FaClock, FaBan,
  FaTimes, FaBoxOpen, FaEdit, FaTrash, FaSave
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("access_token") || ""}`,
    "ngrok-skip-browser-warning": "true",
  };
}

// ── Global styles ──────────────────────────────────────────────────
if (!document.head.querySelector("#reqdetail-v2")) {
  const s = document.createElement("style");
  s.id = "reqdetail-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .reqdetail-root * { font-family: 'Sarabun', sans-serif; }
    .item-row { transition: background .15s; }
    .item-row:hover { background: #f4faf4 !important; }
    .item-row-removed { opacity: 0.45; }
    .dl-btn { transition: background .18s, box-shadow .18s; }
    .dl-btn:hover:not(:disabled) { background: rgba(255,255,255,.28) !important; box-shadow: 0 2px 12px rgba(0,0,0,.15); }
    .remove-btn { transition: background .15s, color .15s; border: 1.5px solid #fecaca; color: #dc2626; background: #fff; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 600; display:flex;align-items:center;gap:4px; cursor:pointer;}
    .remove-btn:hover { background: #fef2f2; }
    .restore-btn { transition: background .15s; border: 1.5px solid #c8e6c9; color: #2e7d32; background: #fff; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 600; display:flex;align-items:center;gap:4px; cursor:pointer;}
    .restore-btn:hover { background: #e8f5e9; }
    .modal-enter { animation: menter .2s ease; }
    @keyframes menter { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }
  `;
  document.head.appendChild(s);
}

// ── Status config ──────────────────────────────────────────────────
const STATUS = {
  PENDING:   { bg:"#fdf4ff", text:"#7e22ce", border:"#e9d5ff", label:"รอดำเนินการ", icon:<FaClock size={12}/>,       bar:"#a855f7" },
  APPROVED:  { bg:"#e8f5e9", text:"#2e7d32", border:"#c8e6c9", label:"อนุมัติแล้ว", icon:<FaCheckCircle size={12}/>, bar:"#2e7d32" },
  REJECTED:  { bg:"#fef2f2", text:"#dc2626", border:"#fecaca", label:"ไม่อนุมัติ",  icon:<FaBan size={12}/>,         bar:"#dc2626" },
  CANCELLED: { bg:"#f3f4f6", text:"#6b7280", border:"#e5e7eb", label:"ยกเลิกแล้ว", icon:<FaTimes size={12}/>,        bar:"#9ca3af" },
  ISSUED:    { bg:"#e0f2fe", text:"#0369a1", border:"#bae6fd", label:"เบิกจ่ายแล้ว",icon:<FaCheckCircle size={12}/>, bar:"#0369a1" },
};

// ── ConfirmRemoveDialog ────────────────────────────────────────────
function ConfirmRemoveDialog({ removedCount, totalCount, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl modal-enter" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background:"#d1d5db" }}/></div>

        <div className="px-6 py-4 flex items-center gap-3" style={{ background:"#fef2f2" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:"#fee2e2" }}>
            <FaTrash size={14} style={{ color:"#dc2626" }}/>
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ color:"#dc2626" }}>ยืนยันลบรายการที่เลือก</h2>
            <p className="text-xs" style={{ color:"#f87171" }}>การลบรายการไม่สามารถย้อนกลับได้</p>
          </div>
          <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={onCancel}><FaTimes size={14}/></button>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl p-3 mb-5 text-center" style={{ background:"#f9fafb", border:"1px solid #f3f4f6" }}>
            <p className="text-xs mb-1" style={{ color:"#9ca3af" }}>รายการที่จะถูกลบออก</p>
            <p className="font-bold text-2xl" style={{ color:"#dc2626" }}>{removedCount}</p>
            <p className="text-xs mt-0.5" style={{ color:"#9ca3af" }}>จากทั้งหมด {totalCount} รายการ</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ border:"1.5px solid #e5e7eb", color:"#374151", background:"#fff" }}>
              ยกเลิก
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background:"#dc2626" }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>กำลังบันทึก...</>
                : "ยืนยันลบรายการ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MetaCard ───────────────────────────────────────────────────────
function MetaCard({ icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3"
      style={{ border: "1.5px solid #e8f5e9", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: accent || "#e8f5e9" }}>
        <span style={{ color: "#2e7d32" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: "#9ca3af" }}>{label}</p>
        <p className="font-bold text-sm mt-0.5 leading-snug" style={{ color: "#1a1a1a" }}>{value || "–"}</p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [removedIds, setRemovedIds] = useState(new Set()); // mat_id ที่จะลบ
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/requests/${id}`, { headers: authHeaders() });
        if (!res.ok) throw new Error("ไม่พบข้อมูลคำขอ");
        setRequest(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleDownload = async () => {
    if (!request) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/requests/${id}/pdf`, {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")||""}`, "ngrok-skip-browser-warning":"true" },
      });
      if (!res.ok) throw new Error(`โหลดไฟล์ไม่สำเร็จ (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", request.header?.mat_req_code ? `request_${request.header.mat_req_code}.pdf` : `request_${id}.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการดาวน์โหลด PDF");
    } finally {
      setDownloading(false);
    }
  };

  // ── Toggle remove item ──
  const toggleRemove = (matId) => {
    setRemovedIds(prev => {
      const next = new Set(prev);
      if (next.has(matId)) next.delete(matId);
      else next.add(matId);
      return next;
    });
  };

  // ── Cancel edit mode ──
  const handleCancelEdit = () => {
    setEditMode(false);
    setRemovedIds(new Set());
  };

  // ── Confirm remove → call PATCH ──
  const handleConfirmRemove = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/items`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ remove_ids: Array.from(removedIds) }),
      });
      if (!res.ok) throw new Error(`บันทึกไม่สำเร็จ (${res.status})`);

      // Refresh data
      const updated = await fetch(`${API_BASE}/requests/${id}`, { headers: authHeaders() });
      setRequest(await updated.json());

      setShowConfirmRemove(false);
      setEditMode(false);
      setRemovedIds(new Set());
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──
  if (loading) return (
    <div className="reqdetail-root min-h-screen flex items-center justify-center" style={{ background:"#f5f7f5" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor:"#c8e6c9", borderTopColor:"#2e7d32" }}/>
        <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error || !request) return (
    <div className="reqdetail-root min-h-screen flex items-center justify-center" style={{ background:"#f5f7f5" }}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background:"#fef2f2" }}>
          <span className="text-4xl">⚠️</span>
        </div>
        <p className="font-bold text-base" style={{ color:"#1a1a1a" }}>{error || "ไม่พบข้อมูลคำขอ"}</p>
        <button onClick={() => navigate(-1)}
          className="mt-4 flex items-center gap-1.5 mx-auto text-sm font-semibold"
          style={{ color:"#2e7d32" }}>
          <FaArrowLeft size={12}/> กลับ
        </button>
      </div>
    </div>
  );

  const header = request.header;
  const items = request.items || [];
  const status = header.req_status;
  const st = STATUS[status] || STATUS.CANCELLED;
  const canDownload = status === "APPROVED" || status === "ISSUED";
  const isPending = status === "PENDING";

  // ต้องเหลืออย่างน้อย 1 รายการถึงจะบันทึกได้
  const remainingCount = items.length - removedIds.size;
  const canSave = removedIds.size > 0 && remainingCount > 0;

  const dateStr = header.req_date
    ? new Date(header.req_date).toLocaleDateString("th-TH", { day:"2-digit", month:"long", year:"numeric" })
    : "–";
  const timeStr = header.req_date
    ? new Date(header.req_date).toLocaleTimeString("th-TH", { hour:"2-digit", minute:"2-digit" })
    : "–";

  return (
    <div className="reqdetail-root min-h-screen" style={{ background:"#f5f7f5" }}>

      {/* ══ TOPBAR ═══════════════════════════════════════════════════ */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center justify-between gap-4">

          {/* Left: back + title */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition"
              style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}
              onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}>
              <FaArrowLeft size={13}/>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
                <FaFileAlt size={16} color="#fff"/>
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight" style={{ color:"#1a1a1a" }}>
                  {header.mat_req_code}
                </h1>
                <p className="text-xs" style={{ color:"#9ca3af" }}>รายละเอียดคำขอเบิก</p>
              </div>
            </div>
          </div>

          {/* Right: status badge */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
              style={{ background:st.bg, color:st.text, borderColor:st.border }}>
              {st.icon} {st.label}
            </span>
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════ */}
      <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">

        {/* ── Status timeline bar ── */}
        <div className="bg-white rounded-2xl p-5"
          style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
          <p className="text-xs font-semibold mb-4" style={{ color:"#9ca3af" }}>สถานะคำขอ</p>
          <div className="flex items-center gap-0">
            {[
              { key:"PENDING",  label:"รอดำเนินการ" },
              { key:"APPROVED", label:"อนุมัติ" },
              { key:"ISSUED",   label:"เบิกจ่าย" },
            ].map((step, i, arr) => {
              const statuses = ["PENDING","APPROVED","ISSUED"];
              const currentIdx = statuses.indexOf(status);
              const stepIdx = statuses.indexOf(step.key);
              const isCancelled = status === "CANCELLED" || status === "REJECTED";
              const isDone = !isCancelled && currentIdx >= stepIdx;
              const isCurrent = currentIdx === stepIdx && !isCancelled;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition"
                      style={{
                        background: isDone ? "#2e7d32" : "#f3f4f6",
                        borderColor: isDone ? "#2e7d32" : "#e5e7eb",
                        boxShadow: isCurrent ? "0 0 0 3px rgba(46,125,50,.2)" : "none",
                      }}>
                      {isDone
                        ? <FaCheckCircle size={14} color="#fff"/>
                        : <span className="w-2 h-2 rounded-full" style={{ background: isDone ? "#fff" : "#d1d5db" }}/>
                      }
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap" style={{ color: isDone ? "#2e7d32" : "#9ca3af" }}>
                      {step.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 mb-5 rounded-full"
                      style={{ background: !isCancelled && currentIdx > stepIdx ? "#2e7d32" : "#e5e7eb" }}/>
                  )}
                </div>
              );
            })}

            {(status === "CANCELLED" || status === "REJECTED") && (
              <div className="ml-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: st.bg, border:`1.5px solid ${st.border}` }}>
                {st.icon}
                <span className="text-xs font-semibold" style={{ color: st.text }}>{st.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Meta cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetaCard icon={<FaCalendarAlt size={15}/>} label="วันที่ขอ" value={`${dateStr} ${timeStr}`}/>
          <MetaCard icon={<FaUser size={15}/>} label="ผู้ขอ" value={header.full_name}/>
          <MetaCard icon={st.icon} label="สถานะปัจจุบัน" value={st.label} accent={st.bg}/>
        </div>

        {/* ── Items table ── */}
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>

          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom:"1.5px solid #e8f5e9" }}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background:"#2e7d32" }}/>
              <h2 className="font-bold text-sm" style={{ color:"#1a1a1a" }}>รายการสินค้า</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                style={{ background:"#e8f5e9", color:"#2e7d32" }}>
                {items.length} รายการ
              </span>
              {/* แสดงจำนวนที่จะลบ */}
              {editMode && removedIds.size > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                  style={{ background:"#fef2f2", color:"#dc2626" }}>
                  จะลบ {removedIds.size} รายการ
                </span>
              )}
            </div>

            {/* ปุ่มขวา */}
            <div className="flex items-center gap-2">
              {/* ปุ่ม Download (ถ้า approve แล้ว) */}
              {canDownload && !editMode && (
                <button onClick={handleDownload} disabled={downloading}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  style={{ background:"#e8f5e9", color:"#2e7d32" }}
                  onMouseEnter={e => e.currentTarget.style.background="#c8e6c9"}
                  onMouseLeave={e => e.currentTarget.style.background="#e8f5e9"}>
                  <FaDownload size={10}/>
                  {downloading ? "กำลังโหลด..." : "ดาวน์โหลด PDF"}
                </button>
              )}

              {/* ปุ่ม "แก้ไขรายการ" — เฉพาะ PENDING และยังไม่ได้ edit */}
              {isPending && !editMode && (
                <button onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  style={{ background:"#fff7ed", color:"#c2410c", border:"1.5px solid #fed7aa" }}
                  onMouseEnter={e => e.currentTarget.style.background="#ffedd5"}
                  onMouseLeave={e => e.currentTarget.style.background="#fff7ed"}>
                  <FaEdit size={10}/> แก้ไขรายการ
                </button>
              )}

              {/* ปุ่มขณะ Edit Mode */}
              {editMode && (
                <div className="flex items-center gap-2">
                  <button onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ border:"1.5px solid #e5e7eb", color:"#6b7280", background:"#fff" }}>
                    <FaTimes size={10}/> ยกเลิก
                  </button>
                  <button
                    onClick={() => canSave && setShowConfirmRemove(true)}
                    disabled={!canSave}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: canSave ? "#dc2626" : "#9ca3af" }}>
                    <FaSave size={10}/> บันทึก ({removedIds.size} รายการ)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Edit mode banner */}
          {editMode && (
            <div className="px-5 py-3 flex items-center gap-2 text-xs"
              style={{ background:"#fff7ed", borderBottom:"1.5px solid #fed7aa" }}>
              <span style={{ color:"#c2410c" }}>⚠️</span>
              <span style={{ color:"#9a3412" }}>
                กดปุ่ม <strong>ลบออก</strong> ที่รายการที่ไม่ต้องการ แล้วกด <strong>บันทึก</strong> เพื่อยืนยัน
                {remainingCount === 1 && removedIds.size > 0
                  ? " — ต้องเหลืออย่างน้อย 1 รายการ"
                  : ""}
              </span>
            </div>
          )}

          {/* Empty */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <FaBoxOpen size={36} style={{ color:"#c8e6c9" }}/>
              <p className="text-sm" style={{ color:"#9ca3af" }}>ไม่มีรายการสินค้า</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background:"#e8f5e9" }}>
                    {[
                      { label:"#",           cls:"w-12 text-center" },
                      { label:"รหัสวัสดุ",   cls:"text-left" },
                      { label:"ชื่อวัสดุ",    cls:"text-left" },
                      { label:"ขอ",          cls:"text-center w-20" },
                      { label:"อนุมัติ",     cls:"text-center w-24" },
                      ...(editMode ? [{ label:"", cls:"w-24 text-center" }] : []),
                    ].map(h => (
                      <th key={h.label} className={`py-3 px-4 font-semibold text-xs ${h.cls}`}
                        style={{ color:"#2e7d32" }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const isRemoved = removedIds.has(item.mat_id);
                    return (
                      <tr key={item.mat_id || i}
                        className={`item-row border-t ${isRemoved ? "item-row-removed" : ""}`}
                        style={{ borderColor:"#e8f5e9", background: isRemoved ? "#fef2f2" : "#fff" }}>
                        <td className="py-3.5 px-4 text-center text-xs font-medium" style={{ color:"#c8e6c9" }}>
                          {i + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background:"#f4f6f4", color:"#6b7280" }}>
                            {item.mat_id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold" style={{ color: isRemoved ? "#9ca3af" : "#1a1a1a" }}>
                          {isRemoved && (
                            <span className="inline-block mr-1.5 text-xs px-1.5 py-0.5 rounded font-bold"
                              style={{ background:"#fee2e2", color:"#dc2626" }}>
                              ลบออก
                            </span>
                          )}
                          {item.mat_name}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-sm" style={{ color: isRemoved ? "#9ca3af" : "#374151" }}>
                            {item.req_qty}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.approve_qty > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold"
                              style={{ background:"#e8f5e9", color:"#2e7d32" }}>
                              <FaCheckCircle size={9}/> {item.approve_qty}
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full"
                              style={{ background:"#f9fafb", color:"#9ca3af" }}>
                              รออนุมัติ
                            </span>
                          )}
                        </td>

                        {/* คอลัมน์ปุ่ม Edit Mode */}
                        {editMode && (
                          <td className="py-3.5 px-4 text-center">
                            {isRemoved ? (
                              <button className="restore-btn mx-auto" onClick={() => toggleRemove(item.mat_id)}>
                                ↩ คืนค่า
                              </button>
                            ) : (
                              <button
                                className="remove-btn mx-auto"
                                onClick={() => toggleRemove(item.mat_id)}
                                disabled={!isRemoved && remainingCount === 1}>
                                <FaTrash size={9}/> ลบออก
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>

                {/* Footer summary */}
                <tfoot>
                  <tr style={{ background:"#f9fafb", borderTop:"1.5px solid #e8f5e9" }}>
                    <td colSpan={editMode ? 4 : 3} className="py-3 px-4 text-xs font-semibold" style={{ color:"#6b7280" }}>
                      รวมทั้งหมด
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-sm" style={{ color:"#1a1a1a" }}>
                      {items.reduce((a, i) => a + (i.req_qty || 0), 0)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-sm" style={{ color:"#2e7d32" }}>
                      {items.reduce((a, i) => a + (i.approve_qty || 0), 0) || "–"}
                    </td>
                    {editMode && <td/>}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm remove dialog ── */}
      {showConfirmRemove && (
        <ConfirmRemoveDialog
          removedCount={removedIds.size}
          totalCount={items.length}
          onConfirm={handleConfirmRemove}
          onCancel={() => setShowConfirmRemove(false)}
          loading={saving}
        />
      )}
    </div>
  );
}