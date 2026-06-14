import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartBar, FaSync, FaFilePdf, FaFileExcel,
  FaTrophy, FaBoxes, FaUsers, FaCalendarAlt,
  FaChevronDown, FaTimes, FaSearch, FaDownload, FaBuilding
} from "react-icons/fa";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, PieChart, Pie, Area, AreaChart,
} from "recharts";


const API_URL = import.meta.env.VITE_API_URL;
const COLORS = ["#2e7d32","#43a047","#66bb6a","#0369a1","#7e22ce","#d97706","#dc2626","#0891b2"];

const buildQuery = (params = {}) => {
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") acc[key] = value;
    return acc;
  }, {});
  return new URLSearchParams(cleanParams).toString();
};

if (!document.head.querySelector("#report-v2")) {
  const s = document.createElement("style");
  s.id = "report-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .report-root * { font-family: 'Sarabun', sans-serif; }
    .tab-chip { transition: background .15s, color .15s, box-shadow .15s; }
    .tab-chip.active { background:#2e7d32; color:#fff; box-shadow:0 2px 8px rgba(46,125,50,.3); }
    .tab-chip:not(.active):hover { background:#e8f5e9; color:#2e7d32; }
    .data-row { transition: background .15s; }
    .data-row:hover { background: #f4faf4 !important; }
    .modal-enter { animation: menter .2s ease; }
    @keyframes menter { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .no-scrollbar::-webkit-scrollbar{display:none;} .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
    .search-focus:focus-within { border-color:#2e7d32 !important; box-shadow:0 0 0 3px rgba(46,125,50,.1); }
  `;
  document.head.appendChild(s);
}

async function exportReport(endpoint, format, filename, params = {}) {
  const query = new URLSearchParams({ format, ...params }).toString();
  const res = await fetch(
    `${API_URL}/admin/report/${endpoint}/export?${query}`,
    { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}`, "ngrok-skip-browser-warning": "true" } }
  );
  if (!res.ok) throw new Error("ไม่สามารถ export ได้");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function GreenTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-4 py-3"
      style={{ boxShadow:"0 8px 24px rgba(0,0,0,.1)", border:"1px solid #e8f5e9" }}>
      <p className="text-xs mb-1.5 font-semibold" style={{ color:"#6b7280" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color || "#2e7d32" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

function ExportButtons({ onExcel, onPdf, onBoth }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={onExcel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-[#c8e6c9]"
        style={{ background:"#e8f5e9", color:"#2e7d32" }}>
        <FaFileExcel size={12}/> Excel
      </button>
      <button onClick={onPdf}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-[#fecaca]"
        style={{ background:"#fef2f2", color:"#dc2626" }}>
        <FaFilePdf size={12}/> PDF
      </button>
      <button onClick={onBoth}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-[#e5e7eb]"
        style={{ background:"#f3f4f6", color:"#374151" }}>
        <FaDownload size={11}/> ดาวน์โหลดทั้งคู่
      </button>
    </div>
  );
}

function BranchFilter({ value, options, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-white"
      style={{ border:"1.5px solid #c8e6c9" }}>
      <FaBuilding size={12} style={{ color:"#2e7d32", flexShrink:0 }}/>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-transparent outline-none text-sm font-semibold cursor-pointer min-w-[140px]"
        style={{ color:"#2e7d32" }}>
        <option value="">ทุกสาขา</option>
        {options.map(branch => (
          <option key={branch.id} value={branch.id}>{branch.name}</option>
        ))}
      </select>
    </div>
  );
}

function SectionCard({ title, icon, children, exportButtons }) {
  return (
    <div className="bg-white rounded-2xl p-6 mb-5"
      style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 rounded-full" style={{ background:"#2e7d32" }}/>
          <span style={{ color:"#2e7d32" }}>{icon}</span>
          <h2 className="font-bold text-sm" style={{ color:"#1a1a1a" }}>{title}</h2>
        </div>
        {exportButtons}
      </div>
      {children}
    </div>
  );
}

function DataTable({ headers, rows, emptyText = "ไม่มีข้อมูล" }) {
  return (
    <div className="overflow-x-auto mt-5 rounded-xl overflow-hidden"
      style={{ border:"1.5px solid #e8f5e9" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background:"#e8f5e9" }}>
            {headers.map((h, i) => (
              <th key={h} className={`py-2.5 px-4 text-xs font-bold ${i===0||i===1 ? "text-left":"text-center"}`}
                style={{ color:"#2e7d32" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={headers.length} className="py-12 text-center text-sm" style={{ color:"#9ca3af" }}>{emptyText}</td></tr>
            : rows}
        </tbody>
      </table>
    </div>
  );
}

function UserHistoryModal({ user, year, onClose }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const token = localStorage.getItem("access_token");
  const navigate = useNavigate();
  

  useEffect(() => {
    const queryString = year ? `?year=${year}` : "";
    setLoading(true);
    fetch(`${API_URL}/admin/report/by-user/${user.emp_code}/requests${queryString}`, {
      headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setRequests(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setRequests([]); setLoading(false); });
  }, [user.emp_code, year, token]);

  const ST = { ISSUED: "เบิกจ่ายแล้ว", REJECTED: "ไม่อนุมัติ" };
  const ST_STYLE = {
    ISSUED:   { bg: "#e0f2fe", text: "#0369a1" },
    REJECTED: { bg: "#fef2f2", text: "#dc2626" },
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col modal-enter"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ background:"#2e7d32" }}>
          <div>
            <h2 className="font-bold text-white text-base">{user.full_name}</h2>
            <p className="text-white/70 text-xs mt-0.5">{user.emp_code} · {requests.length} ครั้ง</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><FaTimes size={14}/></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2 no-scrollbar">
          {loading ? (
            <div className="py-16 text-center"><FaSync className="spin inline" style={{ color:"#2e7d32" }}/></div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color:"#9ca3af" }}>ไม่มีประวัติการเบิก</div>
          ) : requests.map(req => {
            const stCfg = ST_STYLE[req.req_status] || { bg:"#f3f4f6", text:"#6b7280" };
            return (
              <div key={req.mat_req_id} className="rounded-2xl overflow-hidden"
                style={{ border:"1.5px solid #e8f5e9" }}>
                <button
                  onClick={() => setExpandedId(expandedId===req.mat_req_id ? null : req.mat_req_id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition">
                  <div>
                    <p className="text-sm font-bold" style={{ color:"#1a1a1a" }}>{req.mat_req_code}</p>
                    <p className="text-xs mt-0.5" style={{ color:"#9ca3af" }}>
                      {new Date(req.req_date).toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit",year:"numeric"})}
                      {" · "}{req.items?.length || 0} รายการ
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{ background:stCfg.bg, color:stCfg.text }}>
                      {ST[req.req_status] || req.req_status}
                    </span>
                    <FaChevronDown size={11} style={{ color:"#9ca3af", transform: expandedId===req.mat_req_id ? "rotate(180deg)":"none", transition:"transform .2s" }}/>
                  </div>
                </button>

                {expandedId === req.mat_req_id && (
                  <div className="px-4 pb-3 border-t" style={{ background:"#f9fafb", borderColor:"#e8f5e9" }}>
                    <table className="w-full text-xs mt-2">
                      <thead>
                        <tr style={{ borderBottom:"1px solid #e8f5e9" }}>
                          {["ชื่อวัสดุ","ขอ","อนุมัติ","หน่วย"].map((h,i) => (
                            <th key={h} className={`py-2 font-bold ${i===0?"text-left":"text-center"}`} style={{ color:"#2e7d32" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(req.items||[]).map((item,i) => (
                          <tr key={i} className="border-t" style={{ borderColor:"#e8f5e9" }}>
                            <td className="py-2" style={{ color:"#374151" }}>{item.mat_name}</td>
                            <td className="py-2 text-center" style={{ color:"#6b7280" }}>{item.req_qty}</td>
                            <td className="py-2 text-center font-bold" style={{ color:"#2e7d32" }}>{item.approve_qty > 0 ? item.approve_qty : "–"}</td>
                            <td className="py-2 text-center" style={{ color:"#9ca3af" }}>{item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition"
            style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReport() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [tab, setTab] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");

  const [monthly, setMonthly] = useState(null);
  const [topMats, setTopMats] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [byUser, setByUser] = useState([]);
  const [branchUsers, setBranchUsers] = useState([]);
  const [branches, setBranches]   = useState([]); // ← ดึงจาก /branches

  const hdrs = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "ngrok-skip-browser-warning": "true"
  };

  useEffect(() => {
    fetch(`${API_URL}/branches`, { headers: hdrs })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data.map(b => ({
            id: String(b.branch_id),
            name: b.branch_name
          })));
        }
      })
      .catch(() => {});
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const reportParams = { year: selectedYear, branch_id: selectedBranch };

      const [m, t, inv, u, bu] = await Promise.all([
        fetch(`${API_URL}/admin/report/monthly?${buildQuery(reportParams)}`, { headers:hdrs }).then(r=>r.json()),
        fetch(`${API_URL}/admin/report/top-materials?${buildQuery({ ...reportParams, limit:10 })}`, { headers:hdrs }).then(r=>r.json()),
        fetch(`${API_URL}/admin/report/inventory-value`, { headers:hdrs }).then(r=>r.json()),
        fetch(`${API_URL}/admin/report/by-user?${buildQuery(reportParams)}`, { headers:hdrs }).then(r=>r.json()),
        fetch(`${API_URL}/admin/report/by-user?${buildQuery({ year: selectedYear })}`, { headers:hdrs }).then(r=>r.json()),
      ]);

      setMonthly(m);
      setTopMats(Array.isArray(t) ? t : []);
      setInventory(inv);
      setByUser(Array.isArray(u) ? u : []);
      setBranchUsers(Array.isArray(bu) ? bu : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedBranch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const years = Array.from({length:5}, (_,i) => currentYear - i);
  const reportParams = { year: selectedYear, branch_id: selectedBranch };

   const branchOptions = useMemo(() => {
    return [...branches].sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [branches]);

  const selectedBranchLabel = selectedBranch
    ? branchOptions.find(b => b.id === selectedBranch)?.name || "สาขาที่เลือก"
    : "ทุกสาขา";

  const TABS = [
    { key:"monthly", label:"รายเดือน", icon:<FaCalendarAlt size={13}/> },
    { key:"top", label:"วัสดุยอดนิยม", icon:<FaTrophy size={13}/> },
    { key:"inventory", label:"มูลค่าคงคลัง", icon:<FaBoxes size={13}/> },
    { key:"user", label:"รายบุคคล", icon:<FaUsers size={13}/> },
  ];

  const filteredUsers = byUser.filter(r => {
    const q = search.toLowerCase();
    return !q || r.full_name?.toLowerCase().includes(q) || r.emp_code?.toLowerCase().includes(q);
  });

  return (
    <div className="report-root min-h-screen" style={{ background:"#f5f7f5" }}>
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
              <FaChartBar size={17} color="#fff"/>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color:"#1a1a1a" }}>รายงานสถิติ</h1>
              <p className="text-xs" style={{ color:"#9ca3af" }}>ภาพรวมสถิติการเบิกวัสดุสำนักงาน</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {tab !== "inventory" && (
              <BranchFilter value={selectedBranch} options={branchOptions} onChange={setSelectedBranch}/>
            )}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none cursor-pointer"
              style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={fetchAll} disabled={loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition disabled:opacity-40"
              style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>
              <FaSync size={13} className={loading ? "spin" : ""}/>
            </button>
          </div>
        </div>

        <div className="px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`tab-chip flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold ${tab===t.key?"active":""}`}
              style={tab!==t.key ? { background:"#f3f4f6", color:"#6b7280" } : {}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-5">
        {loading && (
          <div className="flex flex-col items-center py-32 gap-4">
            <div className="w-12 h-12 border-4 rounded-full spin" style={{ borderColor:"#c8e6c9", borderTopColor:"#2e7d32" }}/>
            <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {!loading && (
          <>
            {tab === "monthly" && monthly && (
              <SectionCard title={`สถิติการเบิกรายเดือน ปี ${selectedYear} (${selectedBranchLabel})`} icon={<FaCalendarAlt size={14}/>}
                exportButtons={<ExportButtons
                  onExcel={() => exportReport("monthly","excel",`รายเดือน_${selectedYear}.xlsx`,reportParams)}
                  onPdf={() => exportReport("monthly","pdf",`รายเดือน_${selectedYear}.pdf`,reportParams)}
                  onBoth={() => {
                    exportReport("monthly","excel",`รายเดือน_${selectedYear}.xlsx`,reportParams);
                    exportReport("monthly","pdf",`รายเดือน_${selectedYear}.pdf`,reportParams);
                  }}
                />}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthly.items || []} margin={{ top:5, right:5, left:-10, bottom:0 }}>
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                    <XAxis dataKey="month" tick={{ fontSize:12, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                    <YAxis allowDecimals={false} tick={{ fontSize:12, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<GreenTooltip/>}/>
                    <Area type="monotone" dataKey="count" name="จำนวนเบิก (ครั้ง)"
                      stroke="#2e7d32" strokeWidth={2.5} fill="url(#greenGrad)"
                      dot={{ r:4, fill:"#fff", stroke:"#2e7d32", strokeWidth:2 }}/>
                  </AreaChart>
                </ResponsiveContainer>
                <DataTable
                headers={["เดือน","จำนวนเบิก (ครั้ง)","มูลค่ารวม (บาท)","รายละเอียด"]}
                rows={(monthly.items || []).map(r => (
                  <tr key={r.month_num} className="data-row border-t" style={{ borderColor:"#e8f5e9" }}>
                    <td className="py-3 px-4 font-semibold" style={{ color:"#1a1a1a" }}>{r.month}</td>
                    <td className="py-3 px-4 text-center font-bold" style={{ color:"#2e7d32" }}>{r.count.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center font-bold" style={{ color:"#d97706" }}>{r.total_price.toLocaleString()} ฿</td>
                    <td className="py-3 px-4 text-center">
                      {r.count > 0 ? (
                        <button
                          onClick={() => navigate(`/admin/report/monthly-detail?year=${selectedYear}&month=${r.month_num}${selectedBranch ? `&branch=${selectedBranch}` : ""}`)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          style={{ background:"#e8f5e9", color:"#2e7d32" }}
                          onMouseEnter={e => e.currentTarget.style.background="#c8e6c9"}
                          onMouseLeave={e => e.currentTarget.style.background="#e8f5e9"}>
                          ดูรายละเอียด
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color:"#d1d5db" }}>–</span>
                      )}
                    </td>
                  </tr>
                ))}
              />
              </SectionCard>
            )}

            {tab === "top" && (
              <SectionCard title={`วัสดุที่ถูกเบิกมากที่สุด ปี ${selectedYear} (${selectedBranchLabel})`} icon={<FaTrophy size={14}/>}
                exportButtons={<ExportButtons
                  onExcel={() => exportReport("top-materials","excel",`ยอดนิยม_${selectedYear}.xlsx`,{...reportParams,limit:10})}
                  onPdf={() => exportReport("top-materials","pdf",`ยอดนิยม_${selectedYear}.pdf`,{...reportParams,limit:10})}
                  onBoth={() => {
                    exportReport("top-materials","excel",`ยอดนิยม_${selectedYear}.xlsx`,{...reportParams,limit:10});
                    exportReport("top-materials","pdf",`ยอดนิยม_${selectedYear}.pdf`,{...reportParams,limit:10});
                  }}
                />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topMats.slice(0,8)} layout="vertical" margin={{ top:0, right:10, left:0, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
                      <XAxis type="number" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="mat_name" width={90}
                        tick={{ fontSize:11, fill:"#6b7280" }} axisLine={false} tickLine={false}
                        tickFormatter={v => v.length>11 ? v.slice(0,11)+"…" : v}/>
                      <Tooltip content={<GreenTooltip/>}/>
                      <Bar dataKey="total_qty" name="จำนวน" radius={[0,8,8,0]} maxBarSize={26}>
                        {topMats.slice(0,8).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={topMats.slice(0,6)} dataKey="total_qty" nameKey="mat_name"
                        cx="50%" cy="50%" outerRadius={100} innerRadius={40}>
                        {topMats.slice(0,6).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={v => [`${v} หน่วย`,"จำนวนเบิก"]}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <DataTable
                  headers={["#","ชื่อวัสดุ","ประเภท","จำนวนเบิก","จำนวนครั้ง"]}
                  rows={topMats.map((r,i) => (
                    <tr key={r.mat_code} className="data-row border-t" style={{ borderColor:"#e8f5e9" }}>
                      <td className="py-3 px-4 text-center">
                        <span className="w-7 h-7 rounded-full text-white text-xs font-bold inline-flex items-center justify-center"
                          style={{ background:COLORS[i%COLORS.length] }}>{i+1}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold" style={{ color:"#1a1a1a" }}>{r.mat_name}</td>
                      <td className="py-3 px-4 text-center text-xs" style={{ color:"#6b7280" }}>{r.mat_type}</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color:"#2e7d32" }}>{r.total_qty.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center" style={{ color:"#6b7280" }}>{r.req_count} ครั้ง</td>
                    </tr>
                  ))}
                />
              </SectionCard>
            )}

            {tab === "inventory" && inventory && (
              <SectionCard title="มูลค่าวัสดุคงคลัง" icon={<FaBoxes size={14}/>}
                exportButtons={<ExportButtons
                  onExcel={() => exportReport("inventory-value","excel","คงคลัง.xlsx")}
                  onPdf={() => exportReport("inventory-value","pdf","คงคลัง.pdf")}
                  onBoth={() => {
                    exportReport("inventory-value","excel","คงคลัง.xlsx");
                    exportReport("inventory-value","pdf","คงคลัง.pdf");
                  }}
                />}>
                <div className="rounded-2xl p-5 mb-5 flex items-center justify-between"
                  style={{ background:"linear-gradient(135deg, #e8f5e9, #c8e6c9)", border:"1.5px solid #c8e6c9" }}>
                  <div>
                    <p className="text-xs mb-1" style={{ color:"#2e7d32" }}>มูลค่าวัสดุคงคลังทั้งหมด</p>
                    <p className="text-3xl font-extrabold" style={{ color:"#1a3a1e" }}>
                      {inventory.grand_total.toLocaleString("th-TH",{minimumFractionDigits:2})} ฿
                    </p>
                  </div>
                  <FaBoxes size={44} style={{ color:"rgba(46,125,50,.2)" }}/>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={(inventory.items || []).slice(0,8)} layout="vertical" margin={{ right:10, left:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
                    <XAxis type="number" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                    <YAxis type="category" dataKey="mat_name" width={90} tick={{ fontSize:11, fill:"#6b7280" }} axisLine={false} tickLine={false} tickFormatter={v=>v.length>11?v.slice(0,11)+"…":v}/>
                    <Tooltip content={<GreenTooltip/>}/>
                    <Bar dataKey="total_value" name="มูลค่า (฿)" radius={[0,8,8,0]} maxBarSize={26}>
                      {(inventory.items || []).slice(0,8).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <DataTable
                  headers={["ชื่อวัสดุ","ประเภท","จำนวน","ราคา/หน่วย","มูลค่ารวม"]}
                  rows={(inventory.items || []).map(r => (
                    <tr key={r.mat_code} className="data-row border-t" style={{ borderColor:"#e8f5e9" }}>
                      <td className="py-3 px-4 font-semibold" style={{ color:"#1a1a1a" }}>{r.mat_name}</td>
                      <td className="py-3 px-4 text-center text-xs" style={{ color:"#6b7280" }}>{r.mat_type}</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color:"#1a1a1a" }}>{r.quantity.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center" style={{ color:"#6b7280" }}>{r.unit_price.toLocaleString()} ฿</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color:"#2e7d32" }}>{r.total_value.toLocaleString()} ฿</td>
                    </tr>
                  ))}
                />
              </SectionCard>
            )}

            {tab === "user" && (
              <SectionCard title={`สถิติผู้เบิกรายบุคคล ปี ${selectedYear} (${selectedBranchLabel})`} icon={<FaUsers size={14}/>}
                exportButtons={<ExportButtons
                  onExcel={() => exportReport("by-user","excel",`รายบุคคล_${selectedYear}.xlsx`,reportParams)}
                  onPdf={() => exportReport("by-user","pdf",`รายบุคคล_${selectedYear}.pdf`,reportParams)}
                  onBoth={() => {
                    exportReport("by-user","excel",`รายบุคคล_${selectedYear}.xlsx`,reportParams);
                    exportReport("by-user","pdf",`รายบุคคล_${selectedYear}.pdf`,reportParams);
                  }}
                />}>
                <div className="search-focus flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-white mb-4 max-w-xs"
                  style={{ border:"1.5px solid #e0e0e0", transition:"border-color .2s, box-shadow .2s" }}>
                  <FaSearch size={12} style={{ color:"#a5d6a7", flexShrink:0 }}/>
                  <input type="text" placeholder="ค้นหาชื่อ, รหัส..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent outline-none text-sm w-full placeholder-gray-400" style={{ color:"#1a1a1a" }}/>
                  {search && <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><FaTimes size={10}/></button>}
                </div>
                <DataTable
                  headers={["#","ชื่อพนักงาน","รหัส","สาขา","จำนวนครั้ง","ประวัติ"]}
                  rows={filteredUsers.map((r,i) => (
                    <tr key={r.emp_code} className="data-row border-t" style={{ borderColor:"#e8f5e9" }}>
                      <td className="py-3 px-4 text-center text-xs" style={{ color:"#c8e6c9" }}>{i+1}</td>
                      <td className="py-3 px-4 font-semibold" style={{ color:"#1a1a1a" }}>{r.full_name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"#f4f6f4", color:"#6b7280" }}>{r.emp_code}</span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs" style={{ color:"#6b7280" }}>{r.branch_name || r.branch_id || "–"}</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color:"#2e7d32" }}>{r.req_count} ครั้ง</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => setSelectedUser(r)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          style={{ background:"#e8f5e9", color:"#2e7d32" }}>
                          ดูประวัติ
                        </button>
                      </td>
                    </tr>
                  ))}
                />
              </SectionCard>
            )}
          </>
        )}
      </div>

      {selectedUser && (
        <UserHistoryModal
          user={selectedUser}
          year={selectedYear}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}