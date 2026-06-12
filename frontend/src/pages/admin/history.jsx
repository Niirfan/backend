import React, { useEffect, useState } from "react";
import { FaBars, FaSearch, FaTimes, FaBoxOpen, FaArrowDown, FaArrowUp } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;

// ── Global styles ──────────────────────────────────────────────────
if (!document.head.querySelector("#inout-v2")) {
  const s = document.createElement("style");
  s.id = "inout-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .inout-root * { font-family: 'Sarabun', sans-serif; }
    .inout-row { transition: background .15s; }
    .inout-row:hover { background: #f4faf4 !important; }
    .filter-chip { transition: background .15s, color .15s, box-shadow .15s; }
    .filter-chip.active-all { background:#2e7d32; color:#fff; box-shadow:0 2px 8px rgba(46,125,50,.3); }
    .filter-chip.active-in  { background:#0369a1; color:#fff; box-shadow:0 2px 8px rgba(3,105,161,.3); }
    .filter-chip.active-out { background:#dc2626; color:#fff; box-shadow:0 2px 8px rgba(220,38,38,.3); }
    .filter-chip:not([class*="active"]):hover { background:#e8f5e9; color:#2e7d32; }
    .search-focus:focus-within { border-color:#2e7d32 !important; box-shadow:0 0 0 3px rgba(46,125,50,.1); }
  `;
  document.head.appendChild(s);
}

export default function InOutPage() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true); setError(null);
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/admin/stock/history`, {
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHistoryData(await res.json());
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลได้: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = historyData.filter(item => {
    const matchFilter = filter === "ALL" || item.action_type === filter;
    const q = search.toLowerCase().trim();
    const matchSearch = !q || item.mat_name?.toLowerCase().includes(q) || String(item.history_id).includes(q);
    return matchFilter && matchSearch;
  });

  const counts = { ALL: historyData.length, IN: 0, OUT: 0 };
  historyData.forEach(i => { if (counts[i.action_type] !== undefined) counts[i.action_type]++; });

  const chips = [
    { value:"ALL", label:"ทั้งหมด",   activeClass:"active-all", icon:null },
    { value:"IN",  label:"นำเข้า",    activeClass:"active-in",  icon:<FaArrowDown size={9}/> },
    { value:"OUT", label:"นำออก",     activeClass:"active-out", icon:<FaArrowUp size={9}/> },
  ];

  return (
    <div className="inout-root min-h-screen" style={{ background:"#f5f7f5" }}>

      {/* ══ TOPBAR ═══════════════════════════════════════════════════ */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
              <FaBars size={16} color="#fff"/>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color:"#1a1a1a" }}>ประวัติการเข้าออกวัสดุ</h1>
              {!loading && <p className="text-xs" style={{ color:"#9ca3af" }}>พบ {filtered.length} รายการ</p>}
            </div>
          </div>

          {/* Search */}
          <div className="search-focus flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-white flex-1 max-w-xs"
            style={{ border:"1.5px solid #e0e0e0", transition:"border-color .2s, box-shadow .2s" }}>
            <FaSearch size={12} style={{ color:"#a5d6a7", flexShrink:0 }}/>
            <input type="text" placeholder="ค้นหารหัส, ชื่อวัสดุ..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
              style={{ color:"#1a1a1a" }}/>
            {search && <button onClick={() => setSearch("")} className="flex-shrink-0 text-gray-400 hover:text-gray-600"><FaTimes size={10}/></button>}
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-6 pb-3 flex gap-2">
          {chips.map(c => (
            <button key={c.value} onClick={() => setFilter(c.value)}
              className={`filter-chip flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${filter===c.value ? c.activeClass : ""}`}
              style={filter!==c.value ? { background:"#f3f4f6", color:"#6b7280" } : {}}>
              {c.icon} {c.label}
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: filter===c.value ? "rgba(255,255,255,.25)" : "#e8f5e9",
                  color: filter===c.value ? "#fff" : "#2e7d32",
                }}>
                {counts[c.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════ */}
      <div className="px-6 py-5">

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl p-4 flex items-center justify-between text-sm"
            style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626" }}>
            <span>⚠️ {error}</span>
            <button onClick={fetchHistory} className="font-bold underline ml-3">ลองใหม่</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-32 gap-4">
            <div className="w-12 h-12 border-4 rounded-full animate-spin"
              style={{ borderColor:"#c8e6c9", borderTopColor:"#2e7d32" }}/>
            <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center py-32 gap-4">
            <FaBoxOpen size={44} style={{ color:"#c8e6c9" }}/>
            <p className="font-semibold" style={{ color:"#374151" }}>ไม่มีข้อมูลประวัติ</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background:"#e8f5e9", borderBottom:"1.5px solid #c8e6c9" }}>
                    {["รหัส","ชื่อวัสดุ","อ้างอิง","วันที่/เวลา","สถานะ","จำนวน","คงเหลือ"].map((h, i) => (
                      <th key={h} className={`py-3 px-4 text-xs font-bold ${i >= 5 ? "text-center" : i === 0 ? "text-center" : "text-left"}`}
                        style={{ color:"#2e7d32" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const isIN = item.action_type === "IN";
                    return (
                      <tr key={item.history_id} className="inout-row border-t" style={{ borderColor:"#e8f5e9" }}>

                        {/* รหัส */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"#f4f6f4", color:"#6b7280" }}>
                            #{item.history_id}
                          </span>
                        </td>

                        {/* ชื่อ */}
                        <td className="py-3.5 px-4 font-semibold" style={{ color:"#1a1a1a" }}>{item.mat_name}</td>

                        {/* อ้างอิง */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs" style={{ color:"#9ca3af" }}>
                            {item.ref_table} #{item.ref_id}
                          </span>
                        </td>

                        {/* วันที่ */}
                        <td className="py-3.5 px-4 text-xs" style={{ color:"#6b7280" }}>
                          {new Date(item.created_at).toLocaleString("th-TH", {
                            day:"2-digit", month:"2-digit", year:"numeric",
                            hour:"2-digit", minute:"2-digit"
                          })}
                        </td>

                        {/* สถานะ */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                            style={isIN
                              ? { background:"#e0f2fe", color:"#0369a1", border:"1px solid #bae6fd" }
                              : { background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }
                            }>
                            {isIN ? <FaArrowDown size={9}/> : <FaArrowUp size={9}/>}
                            {isIN ? "นำเข้า" : "นำออก"}
                          </span>
                        </td>

                        {/* จำนวน */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-sm"
                            style={{ color: isIN ? "#0369a1" : "#dc2626" }}>
                            {isIN ? "+" : "-"}{item.quantity}
                          </span>
                        </td>

                        {/* คงเหลือ */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-xs px-2.5 py-1 rounded-full"
                            style={{ background:"#e8f5e9", color:"#2e7d32" }}>
                            {item.balance_after}
                          </span>
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