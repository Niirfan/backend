import { useState, useEffect } from "react";
import { FaFileAlt, FaTimes, FaClipboardList, FaClock, FaCheckCircle, FaBan, FaChevronRight, FaTrash } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";

// ── Global styles ──────────────────────────────────────────────────
if (!document.head.querySelector("#reqlist-v2")) {
  const s = document.createElement("style");
  s.id = "reqlist-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .reqlist-root * { font-family: 'Sarabun', sans-serif; }


    .filter-chip { transition: background .15s, color .15s, box-shadow .15s; cursor: pointer; }
    .filter-chip.active { background:#2e7d32; color:#fff; box-shadow:0 3px 10px rgba(46,125,50,.3); }
    .filter-chip:not(.active):hover { background:#e8f5e9; color:#2e7d32; }

    .btn-red { border:1.5px solid #fecaca; color:#dc2626; background:#fff; transition:background .15s; }
    .btn-red:hover { background:#fef2f2; }
    .btn-green { background:#2e7d32; color:#fff; transition:background .18s; }
    .btn-green:hover { background:#388e3c; }

    .modal-enter { animation: menter .2s ease; }
    @keyframes menter { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }
  `;
  document.head.appendChild(s);
}

// ── Status config ──────────────────────────────────────────────────
const STATUS = {
  PENDING:   { bg:"#fdf4ff", text:"#7e22ce", border:"#e9d5ff", label:"รอดำเนินการ", icon:<FaClock size={10}/> },
  APPROVED:  { bg:"#e8f5e9", text:"#2e7d32", border:"#c8e6c9", label:"อนุมัติแล้ว", icon:<FaCheckCircle size={10}/> },
  REJECTED:  { bg:"#fef2f2", text:"#dc2626", border:"#fecaca", label:"ไม่อนุมัติ",  icon:<FaBan size={10}/> },
  CANCELLED: { bg:"#f3f4f6", text:"#6b7280", border:"#e5e7eb", label:"ยกเลิกแล้ว", icon:<FaTimes size={10}/> },
};

const filterOptions = [
  { label: "ทั้งหมด",      value: "all",       icon: "🗂" },
  { label: "รอดำเนินการ", value: "PENDING",    icon: "" },
  { label: "อนุมัติแล้ว", value: "APPROVED",   icon: "" },
  { label: "ยกเลิกแล้ว",  value: "CANCELLED",  icon: "" },
];

// ── ConfirmDialog ──────────────────────────────────────────────────
function ConfirmDialog({ reqCode, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4" onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl modal-enter" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background:"#d1d5db" }}/></div>

        <div className="px-6 py-4 flex items-center gap-3" style={{ background:"#fef2f2" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:"#fee2e2" }}>
            <FaTrash size={14} style={{ color:"#dc2626" }}/>
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ color:"#dc2626" }}>ยืนยันการยกเลิก</h2>
            <p className="text-xs" style={{ color:"#f87171" }}>การยกเลิกไม่สามารถย้อนกลับได้</p>
          </div>
          <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={onCancel}><FaTimes size={14}/></button>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl p-3 mb-5 text-center" style={{ background:"#f9fafb", border:"1px solid #f3f4f6" }}>
            <p className="text-xs mb-1" style={{ color:"#9ca3af" }}>คำขอที่จะยกเลิก</p>
            <p className="font-bold text-base" style={{ color:"#1a1a1a" }}>{reqCode}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ border:"1.5px solid #e5e7eb", color:"#374151", background:"#fff" }}>
              ไม่ใช่
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background:"#dc2626" }}>
              {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>กำลังยกเลิก...</> : "ยืนยันยกเลิก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RequestCard ────────────────────────────────────────────────────
function RequestCard({ request, onCancelSuccess }) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const st = STATUS[request.req_status] || STATUS.CANCELLED;
  const isPending = request.req_status === "PENDING";

  const reqDate = new Date(request.req_date);
  const dateStr = reqDate.toLocaleDateString("th-TH", { day:"2-digit", month:"short", year:"numeric" });
  const timeStr = reqDate.toLocaleTimeString("th-TH", { hour:"2-digit", minute:"2-digit" });

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/requests/${request.mat_req_id}/cancel`);
      setShowConfirm(false);
      onCancelSuccess(request.mat_req_id);
    } catch {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className=" bg-white rounded-2xl overflow-hidden"
        style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>

        {/* Status strip top */}
        <div className="h-1 w-full" style={{ background: st.text, opacity: 0.7 }}/>

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: st.bg }}>
                <FaFileAlt size={16} style={{ color: st.text }}/>
              </div>
              <div>
                <p className="font-bold text-base leading-tight" style={{ color:"#1a1a1a" }}>
                  {request.mat_req_code}
                </p>
                <p className="text-xs mt-0.5" style={{ color:"#9ca3af" }}>{request.full_name}</p>
              </div>
            </div>

            {/* Status badge */}
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0"
              style={{ background:st.bg, color:st.text, borderColor:st.border }}>
              {st.icon} {st.label}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-xl p-3" style={{ background:"#f9fafb" }}>
              <p className="text-xs mb-0.5" style={{ color:"#9ca3af" }}>วันที่ขอ</p>
              <p className="text-sm font-semibold" style={{ color:"#1a1a1a" }}>{dateStr}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background:"#f9fafb" }}>
              <p className="text-xs mb-0.5" style={{ color:"#9ca3af" }}>เวลา</p>
              <p className="text-sm font-semibold" style={{ color:"#1a1a1a" }}>{timeStr}</p>
            </div>
            <div className="col-span-2 rounded-xl p-3" style={{ background:"#f9fafb" }}>
              <p className="text-xs mb-0.5" style={{ color:"#9ca3af" }}>จำนวนรายการ</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color:"#1a1a1a" }}>
                  {request.items_count ?? "-"} รายการ
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: st.bg, color: st.text }}>
                  {st.label}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {isPending && (
              <button onClick={() => setShowConfirm(true)}
                className="btn-red rounded-xl py-2.5 text-sm font-semibold flex items-center gap-1.5 px-4">
                <FaTrash size={11}/> ยกเลิก
              </button>
            )}
            <button onClick={() => navigate(`/requests/${request.mat_req_id}`)}
              className="btn-green flex-1 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5">
              ดูรายละเอียด <FaChevronRight size={11}/>
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog reqCode={request.mat_req_code} onConfirm={handleCancel}
          onCancel={() => setShowConfirm(false)} loading={cancelling}/>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function RequestListPage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetch = async () => {
      setRequests([]); setLoading(true);
      try {
        const res = await api.get("/requests/mine");
        setRequests((res.data.items ?? []).filter(r => !["ISSUED","REJECTED"].includes(r.req_status)));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [location.key]);

  const handleCancelSuccess = id => setRequests(p => p.filter(r => r.mat_req_id !== id));

  const filtered = filter === "all" ? requests : requests.filter(r => r.req_status === filter);

  // Count per status for chips
  const counts = requests.reduce((a, r) => { a[r.req_status] = (a[r.req_status]||0)+1; return a; }, {});

  return (
    <div className="reqlist-root min-h-screen" style={{ background:"#f5f7f5" }}>

      {/* ══ TOPBAR ═══════════════════════════════════════════════════ */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
            <FaClipboardList size={17} color="#fff"/>
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color:"#1a1a1a" }}>รายการคำขอ</h1>
            <p className="text-xs" style={{ color:"#9ca3af" }}>ทั้งหมด {requests.length} รายการ</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {filterOptions.map(opt => {
            const count = opt.value === "all" ? requests.length : (counts[opt.value]||0);
            return (
              <button key={opt.value} onClick={() => setFilter(opt.value)}
                className={`filter-chip flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${filter===opt.value?"active":""}`}
                style={filter!==opt.value ? { background:"#f3f4f6", color:"#6b7280" } : {}}>
                <span>{opt.icon}</span>
                {opt.label}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: filter===opt.value ? "rgba(255,255,255,.25)" : "#e8f5e9", color: filter===opt.value ? "#fff" : "#2e7d32" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════ */}
      <div className="px-6 py-6 max-w-5xl mx-auto">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-32 gap-4">
            <div className="w-12 h-12 rounded-full border-4 animate-spin"
              style={{ borderColor:"#c8e6c9", borderTopColor:"#2e7d32" }}/>
            <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลด...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-32 gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background:"#e8f5e9" }}>
              <FaClipboardList size={32} style={{ color:"#a5d6a7" }}/>
            </div>
            <div className="text-center">
              <p className="font-bold" style={{ color:"#374151" }}>ยังไม่มีรายการคำขอ</p>
              <p className="text-sm mt-1" style={{ color:"#9ca3af" }}>
                {filter !== "all" ? "ไม่มีคำขอในสถานะนี้" : "คำขอที่ส่งแล้วจะปรากฏที่นี่"}
              </p>
            </div>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(req => (
              <RequestCard key={req.mat_req_id} request={req} onCancelSuccess={handleCancelSuccess}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}