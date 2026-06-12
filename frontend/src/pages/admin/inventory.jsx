import { useState, useEffect, useCallback } from "react";
import { FaBox, FaSearch, FaFileExcel, FaFilePdf, FaSync, FaTimes, FaBoxOpen } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const POLLING_INTERVAL = 30000;

// ── Global styles ──────────────────────────────────────────────────
if (!document.head.querySelector("#inventory-v2")) {
  const s = document.createElement("style");
  s.id = "inventory-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .inv-root * { font-family: 'Sarabun', sans-serif; }
    .inv-row { transition: background .15s; }
    .inv-row:hover { background: #f4faf4 !important; }
    .search-focus:focus-within { border-color:#2e7d32 !important; box-shadow:0 0 0 3px rgba(46,125,50,.1); }
    .export-btn { transition: background .15s; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(s);
}

// ── Stock status badge ─────────────────────────────────────────────
function StockBadge({ stock }) {
  if (stock <= 0) return (
    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
      style={{ background:"#fef2f2", color:"#dc2626" }}>หมด</span>
  );
  if (stock <= 5) return (
    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
      style={{ background:"#fef3c7", color:"#d97706" }}>ใกล้หมด</span>
  );
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
      style={{ background:"#e8f5e9", color:"#2e7d32" }}>ปกติ</span>
  );
}

export default function InventoryList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const getToken = () => localStorage.getItem("access_token");

  const fetchInventory = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory`, {
        headers: { "ngrok-skip-browser-warning":"true", Authorization:`Bearer ${getToken()}` },
      });
      if (res.status === 401) throw new Error("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      setMaterials(await res.json());
      setLastUpdated(new Date()); setError(null);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลได้: " + err.message);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    const iv = setInterval(fetchInventory, POLLING_INTERVAL);
    return () => clearInterval(iv);
  }, [fetchInventory]);

  const download = async (type) => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/export/${type}`, {
        headers: { "ngrok-skip-browser-warning":"true", Authorization:`Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory_${new Date().toLocaleDateString("th-TH")}.${type === "excel" ? "xlsx" : "pdf"}`;
      a.click(); URL.revokeObjectURL(url);
    } catch {
      alert(`ไม่สามารถดาวน์โหลด ${type.toUpperCase()} ได้`);
    }
  };

  const filtered = materials.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary counts
  const outOfStock  = materials.filter(m => m.stock <= 0).length;
  const lowStock    = materials.filter(m => m.stock > 0 && m.stock <= 5).length;
  const normalStock = materials.filter(m => m.stock > 5).length;

  return (
    <div className="inv-root min-h-screen" style={{ background:"#f5f7f5" }}>

      {/* ══ TOPBAR ═══════════════════════════════════════════════════ */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
              <FaBox size={16} color="#fff"/>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color:"#1a1a1a" }}>รายการพัสดุคงคลัง</h1>
              {lastUpdated && (
                <p className="text-xs" style={{ color:"#9ca3af" }}>
                  อัปเดต {lastUpdated.toLocaleTimeString("th-TH")} · {filtered.length} รายการ
                </p>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="search-focus flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-white"
              style={{ border:"1.5px solid #e0e0e0", transition:"border-color .2s, box-shadow .2s", minWidth:220 }}>
              <FaSearch size={12} style={{ color:"#a5d6a7", flexShrink:0 }}/>
              <input type="text" placeholder="ค้นหาชื่อหรือรหัสพัสดุ..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                style={{ color:"#1a1a1a" }}/>
              {searchTerm && <button onClick={() => setSearchTerm("")} className="flex-shrink-0 text-gray-400 hover:text-gray-600"><FaTimes size={10}/></button>}
            </div>

            {/* Export */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl"
              style={{ background:"#f3f4f6", border:"1px solid #e5e7eb" }}>
              <button onClick={() => download("excel")}
                className="export-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ color:"#2e7d32" }}
                onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <FaFileExcel size={13}/> Excel
              </button>
              <button onClick={() => download("pdf")}
                className="export-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ color:"#dc2626" }}
                onMouseEnter={e => e.currentTarget.style.background="#fef2f2"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <FaFilePdf size={13}/> PDF
              </button>
            </div>

            {/* Refresh */}
            <button onClick={() => fetchInventory(true)} disabled={refreshing}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition disabled:opacity-40"
              style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}
              onMouseEnter={e => { if(!refreshing) e.currentTarget.style.background="#e8f5e9"; }}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}>
              <FaSync size={13} className={refreshing ? "spin" : ""}/>
            </button>
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════ */}
      <div className="px-6 py-5">

        {/* Summary strip */}
        {!loading && materials.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label:"ปกติ",     count:normalStock, bg:"#e8f5e9", color:"#2e7d32", border:"#c8e6c9" },
              { label:"ใกล้หมด", count:lowStock,    bg:"#fef3c7", color:"#d97706", border:"#fde68a" },
              { label:"หมดสต็อก",count:outOfStock,  bg:"#fef2f2", color:"#dc2626", border:"#fecaca" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3"
                style={{ border:`1.5px solid ${s.border}`, boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background:s.color }}/>
                <div>
                  <p className="text-2xl font-extrabold leading-tight" style={{ color:s.color }}>{s.count}</p>
                  <p className="text-xs" style={{ color:"#6b7280" }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

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
            <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-32 gap-4">
            <FaBoxOpen size={44} style={{ color:"#c8e6c9" }}/>
            <p className="font-semibold" style={{ color:"#374151" }}>ไม่พบรายการพัสดุ</p>
            {searchTerm && <button onClick={() => setSearchTerm("")}
              className="text-sm px-4 py-1.5 rounded-xl"
              style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>
              ล้างการค้นหา
            </button>}
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
                      { label:"รหัสวัสดุ", cls:"text-center w-28" },
                      { label:"ชื่อพัสดุ",  cls:"text-left" },
                      { label:"ประเภท",     cls:"text-left" },
                      { label:"คงเหลือ",    cls:"text-center w-24" },
                      { label:"สถานะ",      cls:"text-center w-28" },
                      { label:"หน่วย",      cls:"text-center w-20" },
                      { label:"อัปเดต",     cls:"text-center" },
                    ].map(h => (
                      <th key={h.label} className={`py-3 px-4 text-xs font-bold ${h.cls}`}
                        style={{ color:"#2e7d32" }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} className="inv-row border-t" style={{ borderColor:"#e8f5e9" }}>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"#f4f6f4", color:"#6b7280" }}>
                          {item.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold" style={{ color:"#1a1a1a" }}>{item.name}</td>
                      <td className="py-3.5 px-4" style={{ color:"#6b7280" }}>{item.type}</td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-base"
                        style={{ color: item.stock <= 0 ? "#dc2626" : item.stock <= 5 ? "#d97706" : "#1a1a1a" }}>
                        {item.stock}
                      </td>
                      <td className="py-3.5 px-4 text-center"><StockBadge stock={item.stock}/></td>
                      <td className="py-3.5 px-4 text-center text-xs" style={{ color:"#9ca3af" }}>{item.unit}</td>
                      <td className="py-3.5 px-4 text-center text-xs" style={{ color:"#9ca3af" }}>{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}