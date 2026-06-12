import { useNavigate } from "react-router-dom";
import { FaFileAlt, FaSearch, FaTimes, FaChevronRight, FaClock, FaCheckCircle, FaBan, FaBoxOpen } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../services/api";

// ── Global styles ──────────────────────────────────────────────────
if (!document.head.querySelector("#admin-reqlist-v2")) {
  const s = document.createElement("style");
  s.id = "admin-reqlist-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .adminreq-root * { font-family: 'Sarabun', sans-serif; }
    .req-row { transition: background .15s; }
    .req-row:hover { background: #f4faf4 !important; }
    .filter-chip { transition: background .15s, color .15s, box-shadow .15s; }
    .filter-chip.active { background:#2e7d32; color:#fff; box-shadow:0 2px 8px rgba(46,125,50,.3); }
    .filter-chip:not(.active):hover { background:#e8f5e9; color:#2e7d32; }
    .search-focus:focus-within { border-color:#2e7d32 !important; box-shadow:0 0 0 3px rgba(46,125,50,.1); }
    .no-scrollbar::-webkit-scrollbar{display:none;} .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
  `;
  document.head.appendChild(s);
}

// ── Status config ──────────────────────────────────────────────────
const STATUS = {
  PENDING:   { bg:"#fdf4ff", text:"#7e22ce", border:"#e9d5ff", label:"รออนุมัติ",    icon:<FaClock size={9}/> },
  APPROVED:  { bg:"#e8f5e9", text:"#2e7d32", border:"#c8e6c9", label:"อนุมัติแล้ว", icon:<FaCheckCircle size={9}/> },
  REJECTED:  { bg:"#fef2f2", text:"#dc2626", border:"#fecaca", label:"ไม่อนุมัติ",   icon:<FaBan size={9}/> },
  CANCELLED: { bg:"#f3f4f6", text:"#6b7280", border:"#e5e7eb", label:"ยกเลิกแล้ว",  icon:<FaTimes size={9}/> },
  ISSUED:    { bg:"#e0f2fe", text:"#0369a1", border:"#bae6fd", label:"เบิกจ่ายแล้ว",icon:<FaBoxOpen size={9}/> },
};

const STATUS_FILTER_CHIPS = [
  { value:"",          label:"ทั้งหมด",    icon:"" },
  { value:"PENDING",   label:"รออนุมัติ",   icon:"" },
  { value:"APPROVED",  label:"อนุมัติแล้ว", icon:"" },
  { value:"ISSUED",    label:"เบิกจ่ายแล้ว",icon:"" },
  { value:"REJECTED",  label:"ไม่อนุมัติ",  icon:"" },
  { value:"CANCELLED", label:"ยกเลิกแล้ว",  icon:"" },
];

export default function AdminRequestListPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [searchId, setSearchId]       = useState("");
  const [searchName, setSearchName]   = useState("");
  const [searchDate, setSearchDate]   = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await api.get("/admin/requests/all", {
  params: { all_items: true }
});
        setRequests(res.data.items ?? []);
      } catch { setError("ดึงข้อมูลไม่สำเร็จ กรุณาลองใหม่"); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = requests.filter(req => {
    const dateStr = req.req_date ? new Date(req.req_date).toISOString().slice(0,10) : "";
    return (
      req.mat_req_code.toLowerCase().includes(searchId.toLowerCase()) &&
      req.full_name.toLowerCase().includes(searchName.toLowerCase()) &&
      (searchStatus === "" || req.req_status === searchStatus) &&
      (searchDate === "" || dateStr === searchDate)
    );
  });

  const counts = requests.reduce((a,r) => { a[r.req_status] = (a[r.req_status]||0)+1; return a; }, {});
  const hasFilter = searchId || searchName || searchDate || searchStatus;

  const clearFilters = () => { setSearchId(""); setSearchName(""); setSearchDate(""); setSearchStatus(""); };

  return (
    <div className="adminreq-root min-h-screen" style={{ background:"#f5f7f5" }}>

      {/* ══ TOPBAR ═══════════════════════════════════════════════════ */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>

        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
              <FaFileAlt size={16} color="#fff"/>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color:"#1a1a1a" }}>รายการคำขอเบิก</h1>
              <p className="text-xs" style={{ color:"#9ca3af" }}>
                {loading ? "กำลังโหลด..." : `พบ ${filtered.length} รายการ`}
              </p>
            </div>
          </div>

          {/* Search inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* รหัสคำขอ */}
            <div className="search-focus flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-white"
              style={{ border:"1.5px solid #e0e0e0", minWidth:170, transition:"border-color .2s, box-shadow .2s" }}>
              <FaSearch size={11} style={{ color:"#a5d6a7", flexShrink:0 }}/>
              <input type="text" placeholder="รหัสคำขอ..." value={searchId}
                onChange={e => setSearchId(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                style={{ color:"#1a1a1a" }}/>
              {searchId && <button onClick={() => setSearchId("")} className="flex-shrink-0 text-gray-400 hover:text-gray-600"><FaTimes size={10}/></button>}
            </div>

            {/* ชื่อผู้ขอ */}
            <div className="search-focus flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-white"
              style={{ border:"1.5px solid #e0e0e0", minWidth:150, transition:"border-color .2s, box-shadow .2s" }}>
              <FaSearch size={11} style={{ color:"#a5d6a7", flexShrink:0 }}/>
              <input type="text" placeholder="ชื่อผู้ขอ..." value={searchName}
                onChange={e => setSearchName(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                style={{ color:"#1a1a1a" }}/>
              {searchName && <button onClick={() => setSearchName("")} className="flex-shrink-0 text-gray-400 hover:text-gray-600"><FaTimes size={10}/></button>}
            </div>

            {/* วันที่ */}
            <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)}
              className="rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ border:"1.5px solid #e0e0e0", color: searchDate ? "#1a1a1a" : "#9ca3af", background:"#fff" }}/>

            {/* ล้าง */}
            {hasFilter && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl transition"
                style={{ border:"1.5px solid #fecaca", color:"#dc2626", background:"#fff" }}
                onMouseEnter={e => e.currentTarget.style.background="#fef2f2"}
                onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                <FaTimes size={9}/> ล้าง
              </button>
            )}
          </div>
        </div>

        {/* Status filter chips */}
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {STATUS_FILTER_CHIPS.map(c => {
            const cnt = c.value === "" ? requests.length : (counts[c.value]||0);
            return (
              <button key={c.value} onClick={() => setSearchStatus(c.value)}
                className={`filter-chip flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${searchStatus===c.value ? "active" : ""}`}
                style={searchStatus!==c.value ? { background:"#f3f4f6", color:"#6b7280" } : {}}>
                {c.icon} {c.label}
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: searchStatus===c.value ? "rgba(255,255,255,.25)" : "#e8f5e9", color: searchStatus===c.value ? "#fff" : "#2e7d32" }}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════ */}
      <div className="px-6 py-5">

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl p-4 text-sm flex items-center gap-2"
            style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-32 gap-4">
            <div className="w-12 h-12 border-4 rounded-full animate-spin"
              style={{ borderColor:"#c8e6c9", borderTopColor:"#2e7d32" }}/>
            <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลด...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-32 gap-4">
            <FaFileAlt size={40} style={{ color:"#c8e6c9" }}/>
            <p className="font-semibold" style={{ color:"#374151" }}>ไม่พบรายการคำขอ</p>
            {hasFilter && (
              <button onClick={clearFilters} className="text-sm px-4 py-1.5 rounded-xl transition"
                style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>
                ล้างตัวกรอง
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background:"#e8f5e9", borderBottom:"1.5px solid #c8e6c9" }}>
                    {[
                      { label:"รหัสคำขอ",    cls:"text-left" },
                      { label:"วันที่",       cls:"text-left" },
                      { label:"ผู้ขอ",        cls:"text-left" },
                      { label:"จำนวนรายการ", cls:"text-center w-28" },
                      { label:"สถานะ",        cls:"text-center w-32" },
                      { label:"จัดการ",       cls:"text-center w-28" },
                    ].map(h => (
                      <th key={h.label} className={`py-3 px-5 text-xs font-bold ${h.cls}`}
                        style={{ color:"#2e7d32" }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(req => {
                    const st = STATUS[req.req_status] || STATUS.CANCELLED;
                    return (
                      <tr key={req.mat_req_id} className="req-row border-t"
                        style={{ borderColor:"#e8f5e9" }}>

                        {/* รหัสคำขอ */}
                        <td className="py-3.5 px-5">
                          <span className="font-bold" style={{ color:"#1a1a1a" }}>{req.mat_req_code}</span>
                        </td>

                        {/* วันที่ */}
                        <td className="py-3.5 px-5 text-xs" style={{ color:"#6b7280" }}>
                          {new Date(req.req_date).toLocaleDateString("th-TH", {
                            day:"2-digit", month:"2-digit", year:"numeric"
                          })}
                        </td>

                        {/* ผู้ขอ */}
                        <td className="py-3.5 px-5" style={{ color:"#374151" }}>{req.full_name}</td>

                        {/* จำนวนรายการ */}
                        <td className="py-3.5 px-5 text-center">
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                            style={{ background:"#e8f5e9", color:"#2e7d32" }}>
                            {req.items_count} รายการ
                          </span>
                        </td>

                        {/* สถานะ */}
                        <td className="py-3.5 px-5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                            style={{ background:st.bg, color:st.text, borderColor:st.border }}>
                            {st.icon} {st.label}
                          </span>
                        </td>

                        {/* จัดการ */}
                        <td className="py-3.5 px-5 text-center">
                          <button onClick={() => navigate(`/admin/request-detail/${req.mat_req_id}`)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                            style={{ background:"#e8f5e9", color:"#2e7d32" }}
                            onMouseEnter={e => e.currentTarget.style.background="#c8e6c9"}
                            onMouseLeave={e => e.currentTarget.style.background="#e8f5e9"}>
                            ดูรายละเอียด <FaChevronRight size={9}/>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}