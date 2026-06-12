import { useEffect, useState, useCallback } from "react";
import {
  FaBox, FaArrowAltCircleUp, FaCheckCircle,
  FaExclamationTriangle, FaTimesCircle, FaLayerGroup,
  FaSync, FaTrophy
} from "react-icons/fa";
import {
  ResponsiveContainer, ComposedChart, CartesianGrid,
  XAxis, YAxis, Tooltip, Bar, Line,
} from "recharts";

const POLL_INTERVAL = 30_000;

// ── Stat card config ───────────────────────────────────────────────
const CARD_CONFIG = [
  { key: "total_inventory_value", label: "มูลค่าวัสดุคงเหลือ",     icon: <FaBox />,                fmt: v => `${Number(v).toLocaleString("th-TH")} ฿`, color: "#2e7d32", bg: "#e8f5e9" },
  { key: "pending_requests",      label: "รอดำเนินการ",              icon: <FaArrowAltCircleUp />,   fmt: v => `${v} รายการ`,                             color: "#7e22ce", bg: "#f3e8ff" },
  { key: "approved_this_month",   label: "เบิกสำเร็จเดือนนี้",      icon: <FaCheckCircle />,        fmt: v => `${v} รายการ`,                             color: "#0369a1", bg: "#e0f2fe" },
  { key: "low_stock_count",       label: "พัสดุใกล้หมด",            icon: <FaExclamationTriangle />, fmt: v => `${v} รายการ`,                             color: "#d97706", bg: "#fef3c7" },
  { key: "rejected_requests",     label: "ไม่ได้รับการอนุมัติ",    icon: <FaTimesCircle />,        fmt: v => `${v} รายการ`,                             color: "#dc2626", bg: "#fef2f2" },
  { key: "total_equipment",       label: "ครุภัณฑ์ทั้งหมด",         icon: <FaLayerGroup />,         fmt: v => `${v} รายการ`,                             color: "#0369a1", bg: "#e0f2fe" },
];

// ── Custom Tooltip ─────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-4 py-3" style={{ boxShadow:"0 4px 20px rgba(0,0,0,.1)", border:"1px solid #e8f5e9" }}>
      <p className="text-xs font-semibold mb-1" style={{ color:"#6b7280" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color:"#2e7d32" }}>{payload[0].value} รายการ</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [topMaterials, setTopMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [statsRes, graphRes, topRes] = await Promise.all([
        fetch("/api/dashboard/stats", { headers }),
        fetch("/api/dashboard/withdrawal-graph", { headers }),
        fetch("/api/dashboard/top-materials", { headers }),
      ]);
      if (!statsRes.ok || !graphRes.ok || !topRes.ok) throw new Error("API error");
      const [statsData, graphData, topData] = await Promise.all([
        statsRes.json(), graphRes.json(), topRes.json(),
      ]);
      setStats(statsData); setGraphData(graphData); setTopMaterials(topData);
      setLastUpdated(new Date()); setError(null);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    const handleVisibility = () => { if (!document.hidden) fetchAll(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [fetchAll]);

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"#f5f7f5" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor:"#c8e6c9", borderTopColor:"#2e7d32" }}/>
        <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background:"#f5f7f5" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background:"#fef2f2" }}>
        <span className="text-3xl">⚠️</span>
      </div>
      <p className="font-semibold" style={{ color:"#dc2626" }}>{error}</p>
      <button onClick={fetchAll}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background:"#2e7d32" }}>
        <FaSync size={12}/> ลองใหม่
      </button>
    </div>
  );

  const maxVal = graphData.length ? Math.max(...graphData.map(i => i.value), 1) : 1;

  return (
    <div className="min-h-screen p-6" style={{ background:"#f5f7f5" }}>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color:"#1a1a1a" }}>ภาพรวมระบบ</h1>
          <p className="text-xs mt-0.5" style={{ color:"#9ca3af" }}>ข้อมูลสรุปและสถิติการใช้งาน</p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
            style={{ background:"#e8f5e9", color:"#2e7d32" }}>
            <FaSync size={9}/>
            อัปเดต {lastUpdated.toLocaleTimeString("th-TH")}
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {CARD_CONFIG.map(cfg => {
          const val = stats?.[cfg.key] ?? "–";
          return (
            <div key={cfg.key} className="bg-white rounded-2xl p-4 flex items-center gap-4"
              style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-extrabold leading-tight truncate" style={{ color: cfg.color }}>
                  {cfg.fmt(val)}
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color:"#6b7280" }}>{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Chart ── */}
      <div className="bg-white rounded-2xl p-6 mb-5"
        style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-base" style={{ color:"#1a1a1a" }}>จำนวนการเบิก (รายเดือน)</h2>
            <p className="text-xs mt-0.5" style={{ color:"#9ca3af" }}>6 เดือนล่าสุด</p>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color:"#9ca3af" }}>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ background:"#a5d6a7" }}/> จำนวนเบิก
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-0.5" style={{ background:"#ff7043" }}/> แนวโน้ม
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={graphData} margin={{ top:10, right:10, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
            <XAxis dataKey="month" tick={{ fontSize:12, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
            <YAxis allowDecimals={false} tick={{ fontSize:12, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={28}/>
            <Tooltip content={<CustomTooltip/>} cursor={{ fill:"#f0faf0" }}/>
            <Bar dataKey="value" fill="#a5d6a7" radius={[8,8,0,0]} maxBarSize={44}/>
            <Line type="monotone" dataKey="value" stroke="#ff7043" strokeWidth={2.5}
              dot={{ r:4, fill:"#ff7043", strokeWidth:0 }} activeDot={{ r:6 }}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top materials ── */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>

        <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom:"1.5px solid #e8f5e9" }}>
          <div className="w-1 h-5 rounded-full" style={{ background:"#2e7d32" }}/>
          <h2 className="font-bold text-sm" style={{ color:"#1a1a1a" }}>วัสดุที่ถูกเบิกมากที่สุด</h2>
          <FaTrophy size={13} style={{ color:"#d97706" }}/>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ background:"#e8f5e9" }}>
              {["อันดับ","รหัสวัสดุ","ชื่อวัสดุ","จำนวนที่เบิก"].map((h, i) => (
                <th key={h} className={`py-3 px-5 text-xs font-bold ${i >= 3 ? "text-center" : "text-left"}`}
                  style={{ color:"#2e7d32" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topMaterials.map((item, i) => (
              <tr key={i} className="border-t transition"
                style={{ borderColor:"#e8f5e9" }}
                onMouseEnter={e => e.currentTarget.style.background="#f4faf4"}
                onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                <td className="py-3.5 px-5">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold"
                    style={{
                      background: i === 0 ? "#fef3c7" : i === 1 ? "#f3f4f6" : i === 2 ? "#fef2f2" : "#f9fafb",
                      color:      i === 0 ? "#d97706" : i === 1 ? "#6b7280" : i === 2 ? "#dc2626" : "#9ca3af",
                      display:"inline-flex"
                    }}>
                    {i + 1}
                  </span>
                </td>
                <td className="py-3.5 px-5">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"#f4f6f4", color:"#6b7280" }}>
                    {item.id}
                  </span>
                </td>
                <td className="py-3.5 px-5 font-semibold" style={{ color:"#1a1a1a" }}>{item.name}</td>
                <td className="py-3.5 px-5 text-center">
                  <span className="text-sm font-extrabold px-3 py-1 rounded-full"
                    style={{ background:"#e8f5e9", color:"#2e7d32" }}>
                    {item.total}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}