// BranchDashboard.jsx
import api from "../../services/api"; 
import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const STATUS = {
  PENDING:   { label: "รอดำเนินการ", color: "#D97706", bg: "#FEF3C7", dot: "#F59E0B" },
  APPROVED:  { label: "อนุมัติแล้ว", color: "#059669", bg: "#D1FAE5", dot: "#10B981" },
  REJECTED:  { label: "ปฏิเสธ",      color: "#DC2626", bg: "#FEE2E2", dot: "#EF4444" },
  ISSUED:    { label: "รับของแล้ว",  color: "#2563EB", bg: "#DBEAFE", dot: "#3B82F6" },
  CANCELLED: { label: "ยกเลิก",      color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
};

const METRICS = [
  { key: "total_requests",  label: "คำขอทั้งหมด",  icon: "📋", accent: "#64748B" },
  { key: "pending_count",   label: "รอดำเนินการ",   icon: "⏳", accent: "#F59E0B" },
  { key: "approved_count",  label: "อนุมัติแล้ว",   icon: "✅", accent: "#10B981" },
  { key: "issued_count",    label: "รับของแล้ว",    icon: "📦", accent: "#3B82F6" },
  { key: "rejected_count",  label: "ปฏิเสธ",        icon: "❌", accent: "#EF4444" },
  { key: "total_value",     label: "มูลค่ารวม",     icon: "💰", accent: "#8B5CF6", isCurrency: true },
];

const PER_PAGE = 15;

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("th-TH", {
    day: "2-digit", month: "short", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDay(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "2-digit", month: "short", year: "2-digit",
  });
}

function fmtCurrency(v) {
  if (v == null) return "—";
  return Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 }) + " ฿";
}

function initials(name = "") {
  return name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function delayColor(days) {
  if (days == null) return "#94A3B8";
  if (days <= 1) return "#10B981";
  if (days <= 3) return "#F59E0B";
  return "#EF4444";
}

function Badge({ status }) {
  const cfg = STATUS[status] || STATUS.PENDING;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 600, padding: "3px 9px",
      borderRadius: 20, background: cfg.bg, color: cfg.color,
      letterSpacing: "0.02em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name, size = 32 }) {
  const colors = ["#DBEAFE", "#D1FAE5", "#FEF3C7", "#FCE7F3", "#EDE9FE"];
  const textColors = ["#1D4ED8", "#065F46", "#92400E", "#9D174D", "#5B21B6"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: colors[idx], color: textColors[idx],
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      fontFamily: "'Sarabun', sans-serif",
    }}>
      {initials(name)}
    </div>
  );
}

function MetricCard({ icon, label, value, accent, isCurrency }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #F1F5F9",
      borderRadius: 12,
      padding: "1rem 1.1rem",
      display: "flex", 
      flexDirection: "column", 
      gap: 6,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      // แก้ไขจุดนี้: ใส่เครื่องหมาย Backticks ( ` ) ครอบสไตล์ของ borderTop ให้ถูกต้อง
      borderTop: `3px solid ${accent}`, 
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)" }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: isCurrency ? 16 : 24, fontWeight: 700, color: "#0F172A", lineHeight: 1 }}>
        {value == null ? <Skeleton w={60} h={20} /> : isCurrency ? fmtCurrency(value) : value.toLocaleString("th-TH")}
      </div>
    </div>
  );
}
function Skeleton({ w = "100%", h = 14 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

function DelayBadge({ days }) {
  if (days == null) return <span style={{ color: "#CBD5E1", fontSize: 12 }}>—</span>;
  const color = delayColor(days);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{days} วัน</span>
    </div>
  );
}

function ExpandedRow({ req, isManager }) {
  const colSpan = isManager ? 10 : 9;
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0, background: "#F8FAFC" }}>
        <div style={{ padding: "12px 16px 16px", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>รายการวัสดุ</p>
              {req.items?.length > 0 ? (
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["วัสดุ", "ขอ", "อนุมัติ"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "#64748B", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {req.items.map((item) => (
                      <tr key={item.mat_id} style={{ borderTop: "1px solid #E2E8F0" }}>
                        <td style={{ padding: "5px 8px", color: "#0F172A" }}>{item.mat_name}</td>
                        <td style={{ padding: "5px 8px", color: "#475569" }}>{item.req_qty}</td>
                        <td style={{ padding: "5px 8px", color: "#475569" }}>{item.approve_qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p style={{ fontSize: 12, color: "#CBD5E1" }}>ไม่มีรายการ</p>}
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>ไทม์ไลน์ขั้นตอน</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "ยื่นคำขอ", date: req.req_date, done: true },
                  { label: "อนุมัติ / ปฏิเสธ", date: req.approved_at || req.rejected_at, done: !!(req.approved_at || req.rejected_at), delay: req.days_to_approve },
                  { label: "จ่ายวัสดุ", date: req.issued_at, done: !!req.issued_at, delay: req.days_to_issue },
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      background: step.done ? "#3B82F6" : "#E2E8F0",
                      border: "2px solid",
                      borderColor: step.done ? "#3B82F6" : "#CBD5E1",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {step.done && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: step.done ? "#0F172A" : "#94A3B8", margin: 0 }}>{step.label}</p>
                      <p style={{ fontSize: 11, color: "#64748B", margin: "1px 0 0" }}>{fmt(step.date)}</p>
                      {step.delay != null && (
                        <p style={{ fontSize: 11, color: delayColor(step.delay), margin: "2px 0 0", fontWeight: 600 }}>
                          ใช้เวลา {step.delay} วัน
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function BranchDashboard({ user }) {
  const isManager = ["admin", "branch_manager"].includes(user?.role);

  const [status, setStatus]         = useState("");
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage]             = useState(1);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [expanded, setExpanded]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/branch-dashboard/requests", {
        params: { page, per_page: PER_PAGE, ...(status && { status }), ...(search && { search }) }
      });
      setData(res.data);
      setExpanded(null);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const stats = data?.stats;
  const rows  = data?.items ?? [];

  const chartData = [
    { name: "รอ",      value: stats?.pending_count  ?? 0, fill: "#F59E0B" },
    { name: "อนุมัติ", value: stats?.approved_count ?? 0, fill: "#10B981" },
    { name: "รับของ",  value: stats?.issued_count   ?? 0, fill: "#3B82F6" },
    { name: "ปฏิเสธ",  value: stats?.rejected_count ?? 0, fill: "#EF4444" },
  ];

  const delayData = [
    { name: "ยื่น → อนุมัติ", value: stats?.avg_days_to_approve ?? 0 },
    { name: "อนุมัติ → รับ",  value: stats?.avg_days_to_issue   ?? 0 },
  ];

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id);
  }

  const TH = ({ children, right }) => (
    <th style={{
      textAlign: right ? "right" : "left",
      padding: "10px 12px",
      fontSize: 11, fontWeight: 600, color: "#94A3B8",
      letterSpacing: "0.06em", textTransform: "uppercase",
      borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap",
      background: "#F8FAFC",
    }}>{children}</th>
  );

  const TD = ({ children, right, mono, muted }) => (
    <td style={{
      padding: "11px 12px",
      borderBottom: "1px solid #F1F5F9",
      fontSize: 13,
      textAlign: right ? "right" : "left",
      fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
      color: muted ? "#94A3B8" : "#1E293B",
      verticalAlign: "middle",
    }}>{children}</td>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .db-root * { box-sizing: border-box; font-family: 'Sarabun', sans-serif; }
        .db-root button { cursor: pointer; border: none; background: none; }
        .db-root input, .db-root select {
          font-family: 'Sarabun', sans-serif;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 7px 11px;
          font-size: 13px;
          color: #1E293B;
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .db-root input:focus, .db-root select:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .db-row { animation: fadeIn 0.2s ease; }
        .db-row:hover td { background: #F8FAFC !important; cursor: pointer; }
        .db-btn {
          padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
          transition: all 0.15s;
        }
        .db-btn-primary { background: #3B82F6; color: #fff; }
        .db-btn-primary:hover { background: #2563EB; }
        .db-btn-ghost { background: #F1F5F9; color: #64748B; }
        .db-btn-ghost:hover { background: #E2E8F0; }
        .db-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="db-root" style={{ padding: "1.5rem", maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
              ติดตามการเบิกวัสดุ
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
              🏢 {user?.branch_name ?? "สาขาของคุณ"}
              {isManager && (
                <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "#DBEAFE", color: "#1D4ED8", fontWeight: 600 }}>
                  ผู้จัดสาขา
                </span>
              )}
            </p>
          </div>
          <button className="db-btn db-btn-ghost" onClick={load} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            🔄 รีเฟรช
          </button>
        </div>

        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: 10 }}>
          {METRICS.map(m => (
            <MetricCard
              key={m.key}
              icon={m.icon}
              label={m.label}
              value={stats?.[m.key]}
              accent={m.accent}
              isCurrency={m.isCurrency}
            />
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
              📊 จำนวนคำขอตามสถานะ
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={v => [v + " รายการ", "จำนวน"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
              ⏱ เวลาเฉลี่ยแต่ละขั้นตอน (วัน)
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={delayData} layout="vertical" margin={{ top: 0, right: 16, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} unit=" วัน" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                  formatter={v => [v + " วัน", "เฉลี่ย"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {delayData.map((d, i) => (
                    <Cell key={i} fill={delayColor(d.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {stats && (
              <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                {[
                  { label: "≤1 วัน: เร็ว", color: "#10B981" },
                  { label: "≤3 วัน: ปกติ", color: "#F59E0B" },
                  { label: ">3 วัน: ล่าช้า", color: "#EF4444" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748B" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              📋 รายการคำขอเบิก
              {data && <span style={{ marginLeft: 8, fontWeight: 400, color: "#CBD5E1" }}>({data.total} รายการ)</span>}
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                <option value="">ทุกสถานะ</option>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <form onSubmit={handleSearch} style={{ display: "flex", gap: 6 }}>
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="ชื่อ หรือ รหัสคำขอ…"
                  style={{ width: 200 }}
                />
                <button type="submit" className="db-btn db-btn-primary">ค้นหา</button>
              </form>
            </div>
          </div>

          {error && (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ color: "#EF4444", marginBottom: 12, fontSize: 14 }}>⚠️ โหลดไม่สำเร็จ: {error}</p>
              <button className="db-btn db-btn-ghost" onClick={load}>ลองใหม่</button>
            </div>
          )}

          {!error && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>รหัสคำขอ</TH>
                    <TH>ผู้เบิก</TH>
                    {isManager && <TH>สาขา</TH>}
                    <TH>วันที่ขอเบิก</TH>
                    <TH>วันอนุมัติ/ปฏิเสธ</TH>
                    <TH>วันรับของ</TH>
                    <TH>รอ→อนุมัติ</TH>
                    <TH>อนุมัติ→รับ</TH>
                    <TH right>มูลค่า</TH>
                    <TH>สถานะ</TH>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: isManager ? 10 : 9 }).map((_, j) => (
                          <td key={j} style={{ padding: "11px 12px", borderBottom: "1px solid #F1F5F9" }}>
                            <Skeleton w={j === 0 ? 90 : j === 8 ? 60 : "80%"} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={isManager ? 10 : 9} style={{ textAlign: "center", padding: "3rem", color: "#CBD5E1" }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                        <p style={{ fontSize: 14, margin: 0 }}>ไม่พบรายการ</p>
                      </td>
                    </tr>
                  ) : rows.map(req => (
                    // ✅ ใช้ Fragment แทน <> เพื่อใส่ key ได้
                    <Fragment key={req.mat_req_id}>
                      <tr
                        className="db-row"
                        onClick={() => toggleExpand(req.mat_req_id)}
                      >
                        <TD mono muted>{req.mat_req_code}</TD>
                        <TD>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={req.requester_name} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{req.requester_name}</div>
                              <div style={{ fontSize: 11, color: "#94A3B8" }}>{req.requester_id}</div>
                            </div>
                          </div>
                        </TD>
                        {isManager && <TD muted>{req.branch_name}</TD>}
                        <TD muted>{fmtDay(req.req_date)}</TD>
                        <TD muted>{fmtDay(req.approved_at || req.rejected_at)}</TD>
                        <TD muted>{fmtDay(req.issued_at)}</TD>
                        <TD><DelayBadge days={req.days_to_approve} /></TD>
                        <TD><DelayBadge days={req.days_to_issue} /></TD>
                        <TD right>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{fmtCurrency(req.total_price)}</span>
                        </TD>
                        <TD><Badge status={req.req_status} /></TD>
                      </tr>
                      {expanded === req.mat_req_id && (
                        <ExpandedRow req={req} isManager={isManager} />
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total_pages > 1 && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#64748B" }}>
              <span>หน้า {data.page} จาก {data.total_pages} ({data.total} รายการ)</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="db-btn db-btn-ghost" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                  ‹ ก่อนหน้า
                </button>
                <button className="db-btn db-btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page >= data.total_pages}>
                  ถัดไป ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}