import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaFileAlt, FaArrowLeft, FaCheck, FaTimes, FaBoxOpen,
  FaCheckCircle, FaClock, FaMinus, FaPlus,
} from "react-icons/fa";
import api from "../../services/api";

if (!document.head.querySelector("#admin-reqdetail-v2")) {
  const s = document.createElement("style");
  s.id = "admin-reqdetail-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .adminreqd-root * { font-family: 'Sarabun', sans-serif; }
    .item-row { transition: background .15s; }
    .item-row:hover { background: #f4faf4 !important; }
    .qty-btn { transition: background .15s, transform .1s; }
    .qty-btn:hover:not(:disabled) { background: #e8f5e9 !important; }
    .qty-btn:active:not(:disabled) { transform: scale(.9); }
    .toast-enter { animation: tenter .25s ease; }
    @keyframes tenter { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:none} }
    .modal-enter { animation: menter .2s ease; }
    @keyframes menter { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:none} }
  `;
  document.head.appendChild(s);
}

const STATUS = {
  PENDING:   { bg:"#fdf4ff", text:"#7e22ce", border:"#e9d5ff", label:"รออนุมัติ",    dot:"#a855f7" },
  APPROVED:  { bg:"#e8f5e9", text:"#2e7d32", border:"#c8e6c9", label:"อนุมัติแล้ว", dot:"#2e7d32" },
  REJECTED:  { bg:"#fef2f2", text:"#dc2626", border:"#fecaca", label:"ไม่อนุมัติ",   dot:"#dc2626" },
  ISSUED:    { bg:"#e0f2fe", text:"#0369a1", border:"#bae6fd", label:"เบิกจ่ายแล้ว",dot:"#0369a1" },
  CANCELLED: { bg:"#f3f4f6", text:"#6b7280", border:"#e5e7eb", label:"ยกเลิกแล้ว",  dot:"#9ca3af" },
};

const CONFIRM_CFG = {
  approve: { emoji:"✅", title:"ยืนยันการอนุมัติ",    desc:"ระบบจะบันทึกจำนวนอนุมัติตามที่ท่านกำหนด",                                    btnBg:"#2e7d32", btnLabel:"อนุมัติคำขอ" },
  reject:  { emoji:"🚫", title:"ยืนยันการไม่อนุมัติ", desc:"คุณต้องการปฏิเสธคำขอเบิกนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้", btnBg:"#dc2626", btnLabel:"ไม่อนุมัติ"  },
  issue:   { emoji:"📦", title:"ยืนยันการเบิกจ่าย",   desc:"ยืนยันการเบิกจ่ายสินค้าออกจากคลัง? ระบบจะตัดสต็อกทันที",                 btnBg:"#0369a1", btnLabel:"เบิกจ่าย"   },
};

function ConfirmDialog({ action, onConfirm, onCancel, loading }) {
  const cfg = CONFIRM_CFG[action];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl modal-enter"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background:"#d1d5db" }}/>
        </div>
        <div className="px-6 py-6 text-center">
          <div className="text-4xl mb-3">{cfg.emoji}</div>
          <h2 className="font-bold text-base mb-1" style={{ color:"#1a1a1a" }}>{cfg.title}</h2>
          <p className="text-sm mb-6" style={{ color:"#6b7280" }}>{cfg.desc}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{ border:"1.5px solid #e5e7eb", color:"#374151", background:"#fff" }}>
              ยกเลิก
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: cfg.btnBg }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>กำลังดำเนินการ...</>
                : cfg.btnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b" style={{ borderColor:"#e8f5e9" }}>
      <span className="text-sm" style={{ color:"#9ca3af" }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color:"#1a1a1a" }}>{value || "–"}</span>
    </div>
  );
}

export default function AdminRequestDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [approveQty, setApproveQty] = useState({});
  const [confirm,    setConfirm]    = useState(null);
  const [acting,     setActing]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [adminNote,  setAdminNote]  = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await api.get(`/admin/requests/${id}`);
        setData(res.data);
        const init = {};
        res.data.items.forEach(item => { init[item.mat_id] = item.req_qty; });
        setApproveQty(init);
        setAdminNote(res.data.header?.admin_note || "");
      } catch {
        setError("ดึงข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleQtyChange = (matId, value, maxQty) => {
    const num = parseInt(value) || 0;
    setApproveQty(p => ({ ...p, [matId]: Math.min(Math.max(0, num), maxQty) }));
  };

  const handleApproveClick = () => {
    const allZero = data.items.every(
      (item) => (approveQty[item.mat_id] ?? item.req_qty) === 0
    );
    if (allZero) {
      showToast("error", "❌ ไม่สามารถอนุมัติได้ เนื่องจากทุกรายการมีจำนวน 0 กรุณาระบุจำนวนอย่างน้อย 1 รายการ");
      return;
    }
    setConfirm("approve");
  };

  const handleAction = async (action) => {
    setActing(true);
    try {
      if (action === "approve") {
        const items = data.items.map(item => ({
          mat_id:      item.mat_id,
          approve_qty: approveQty[item.mat_id] ?? item.req_qty,
        }));
        await api.post(`/admin/requests/${id}/approve`, {
          items,
          admin_note: adminNote || null,
        });
      } else if (action === "reject") {
        await api.post(`/admin/requests/${id}/reject`, {
          admin_note: adminNote || null,
        });
      } else if (action === "issue") {
        await api.post(`/admin/requests/${id}/issue`, {
          admin_note: adminNote || null,
        });
      }

      const newStatus =
        action === "approve" ? "APPROVED" :
        action === "reject"  ? "REJECTED" : "ISSUED";

      setData(p => ({
        ...p,
        header: { ...p.header, req_status: newStatus, admin_note: adminNote || null },
        items: action === "approve"
          ? p.items.map(item => ({ ...item, approve_qty: approveQty[item.mat_id] ?? item.req_qty }))
          : p.items,
      }));

      showToast("success",
        action === "approve" ? "✅ อนุมัติเรียบร้อยแล้ว" :
        action === "reject"  ? "🚫 ปฏิเสธคำขอแล้ว" :
                               "📦 เบิกจ่ายสินค้าสำเร็จ"
      );
    } catch (err) {
      showToast("error", err.response?.data?.detail || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setActing(false); setConfirm(null);
    }
  };

  const header = data?.header;
  const items  = data?.items ?? [];
  const status = header?.req_status;
  const st     = STATUS[status] || STATUS.CANCELLED;

  if (loading) return (
    <div className="adminreqd-root min-h-screen flex items-center justify-center" style={{ background:"#f5f7f5" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor:"#c8e6c9", borderTopColor:"#2e7d32" }}/>
        <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลด...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="adminreqd-root min-h-screen flex flex-col items-center justify-center gap-4" style={{ background:"#f5f7f5" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background:"#fef2f2" }}>
        <span className="text-3xl">⚠️</span>
      </div>
      <p className="font-bold" style={{ color:"#dc2626" }}>{error}</p>
      <button onClick={() => navigate("/admin/requests")}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background:"#2e7d32" }}>
        ย้อนกลับ
      </button>
    </div>
  );

  const STEPS = ["PENDING","APPROVED","ISSUED"];
  const currentIdx = STEPS.indexOf(status);
  const isTerminal = ["REJECTED","CANCELLED"].includes(status);

  return (
    <div className="adminreqd-root min-h-screen" style={{ background:"#f5f7f5" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold toast-enter"
          style={{ background: toast.type==="success" ? "#2e7d32" : "#dc2626", color:"#fff" }}>
          {toast.msg}
        </div>
      )}

      {/* Topbar */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin/requests")}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}
              onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}>
              <FaArrowLeft size={13}/>
            </button>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
              <FaFileAlt size={16} color="#fff"/>
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ color:"#1a1a1a" }}>
                {header?.mat_req_code || "รายละเอียดคำขอ"}
              </h1>
              <p className="text-xs" style={{ color:"#9ca3af" }}>ตรวจสอบและดำเนินการ</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
            style={{ background:st.bg, color:st.text, borderColor:st.border }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background:st.dot }}/>
            {st.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* Info card */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6"
            style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background:"#2e7d32" }}/>
              <h2 className="font-bold text-sm" style={{ color:"#1a1a1a" }}>ข้อมูลคำขอเบิก</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <MetaRow label="รหัสคำขอ"    value={header?.mat_req_code}/>
              <MetaRow label="วันที่ขอ"    value={header?.req_date ? new Date(header.req_date).toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit",year:"numeric"}) : "–"}/>
              <MetaRow label="เวลา"         value={header?.req_date ? new Date(header.req_date).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"}) : "–"}/>
              <MetaRow label="ผู้ขอ"        value={header?.full_name}/>
              <MetaRow label="รหัสพนักงาน" value={header?.user_id}/>
              <MetaRow label="จำนวนรายการ" value={`${items.length} รายการ`}/>
            </div>
          </div>

          {/* Action panel */}
          <div className="bg-white rounded-2xl p-6 flex flex-col"
            style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background:"#2e7d32" }}/>
              <h2 className="font-bold text-sm" style={{ color:"#1a1a1a" }}>สถานะและดำเนินการ</h2>
            </div>

            {/* Timeline */}
            <div className="space-y-1 mb-4">
              {[
                { s:"PENDING",  label:"รออนุมัติ"    },
                { s:"APPROVED", label:"อนุมัติแล้ว"  },
                { s:"ISSUED",   label:"เบิกจ่ายแล้ว" },
              ].map(({ s, label }, i) => {
                const stepIdx   = STEPS.indexOf(s);
                const isDone    = !isTerminal && currentIdx > stepIdx;
                const isCurrent = status === s;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: isCurrent ? "#2e7d32" : isDone ? "#e8f5e9" : "#f3f4f6",
                          color:      isCurrent ? "#fff"    : isDone ? "#2e7d32" : "#9ca3af",
                          border:     isCurrent ? "2px solid #2e7d32" : isDone ? "2px solid #c8e6c9" : "2px solid #e5e7eb",
                        }}>
                        {isDone ? <FaCheckCircle size={12}/> : isCurrent ? <FaClock size={11}/> : i+1}
                      </div>
                      {i < 2 && <div className="w-0.5 h-4" style={{ background: isDone ? "#c8e6c9" : "#e5e7eb" }}/>}
                    </div>
                    <span className="text-sm font-semibold"
                      style={{ color: isCurrent ? "#2e7d32" : isDone ? "#6b7280" : "#c8e6c9" }}>
                      {label}
                    </span>
                  </div>
                );
              })}
              {isTerminal && (
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background:st.bg, border:`2px solid ${st.border}` }}>
                    <FaTimes size={11} style={{ color:st.text }}/>
                  </div>
                  <span className="text-sm font-semibold" style={{ color:st.text }}>{st.label}</span>
                </div>
              )}
            </div>

            {/* Admin note */}
            <div className="mb-4">
              <label className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color:"#6b7280" }}>
                <span>📝</span> หมายเหตุ / เหตุผล
              </label>
              {status === "PENDING" ? (
                <textarea
                  rows={3}
                  placeholder="ระบุเหตุผลกรณีปฏิเสธ หรืออนุมัติไม่ครบจำนวน (ไม่บังคับ)"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2.5 resize-none outline-none"
                  style={{ border:"1.5px solid #c8e6c9", color:"#1a1a1a", background:"#fafffe", lineHeight:"1.6" }}
                />
              ) : adminNote ? (
                <div className="text-sm rounded-xl px-3 py-2.5"
                  style={{ border:"1.5px solid #e5e7eb", color:"#374151", background:"#f9fafb", lineHeight:"1.6", whiteSpace:"pre-wrap" }}>
                  {adminNote}
                </div>
              ) : (
                <div className="text-xs rounded-xl px-3 py-2"
                  style={{ color:"#c8e6c9", background:"#f9fafb", border:"1.5px solid #e5e7eb" }}>
                  ไม่มีหมายเหตุ
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-auto space-y-2 pt-4" style={{ borderTop:"1.5px solid #e8f5e9" }}>
              {status === "PENDING" && (
                <>
                  <button
                    onClick={handleApproveClick}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background:"#2e7d32" }}
                    onMouseEnter={e => e.currentTarget.style.background="#388e3c"}
                    onMouseLeave={e => e.currentTarget.style.background="#2e7d32"}>
                    <FaCheck size={11}/> อนุมัติคำขอ
                  </button>
                  <button onClick={() => setConfirm("reject")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                    style={{ border:"1.5px solid #fecaca", color:"#dc2626", background:"#fff" }}
                    onMouseEnter={e => e.currentTarget.style.background="#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                    <FaTimes size={11}/> ไม่อนุมัติ
                  </button>
                </>
              )}
              {status === "APPROVED" && (
                <button onClick={() => setConfirm("issue")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background:"#0369a1" }}
                  onMouseEnter={e => e.currentTarget.style.background="#0284c7"}
                  onMouseLeave={e => e.currentTarget.style.background="#0369a1"}>
                  <FaBoxOpen size={13}/> เบิกจ่ายสินค้า
                </button>
              )}
              {(isTerminal || status === "ISSUED") && (
                <div className="w-full rounded-xl py-3 text-xs font-semibold text-center"
                  style={{ background:st.bg, color:st.text }}>
                  {st.label} — ไม่มีการดำเนินการเพิ่มเติม
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom:"1.5px solid #e8f5e9" }}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background:"#2e7d32" }}/>
              <h2 className="font-bold text-sm" style={{ color:"#1a1a1a" }}>รายการวัสดุที่ขอเบิก</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                style={{ background:"#e8f5e9", color:"#2e7d32" }}>{items.length} รายการ</span>
            </div>
            {status === "PENDING" && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background:"#fdf4ff", color:"#7e22ce", border:"1px solid #e9d5ff" }}>
                ✏️ แก้ไขจำนวนก่อนกด "อนุมัติ"
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background:"#e8f5e9", borderBottom:"1.5px solid #c8e6c9" }}>
                  {[
                    { label:"#",             cls:"text-center w-12" },
                    { label:"ชื่อวัสดุ",     cls:"text-left" },
                    { label:"จำนวนขอเบิก",  cls:"text-center w-32" },
                    { label:"จำนวนอนุมัติ", cls:"text-center w-40" },
                    { label:"หน่วย",         cls:"text-center w-24" },
                  ].map(h => (
                    <th key={h.label} className={`py-3 px-5 text-xs font-bold ${h.cls}`}
                      style={{ color:"#2e7d32" }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <FaBoxOpen size={32} style={{ color:"#c8e6c9", margin:"0 auto 8px" }}/>
                      <p className="text-sm" style={{ color:"#9ca3af" }}>ไม่มีรายการ</p>
                    </td>
                  </tr>
                ) : items.map((item, idx) => (
                  <tr key={item.mat_id} className="item-row border-t" style={{ borderColor:"#e8f5e9" }}>
                    <td className="py-3.5 px-5 text-center text-xs" style={{ color:"#c8e6c9" }}>{idx+1}</td>
                    <td className="py-3.5 px-5 font-semibold" style={{ color:"#1a1a1a" }}>{item.mat_name}</td>
                    <td className="py-3.5 px-5 text-center font-bold" style={{ color:"#374151" }}>{item.req_qty}</td>
                    <td className="py-3.5 px-5 text-center">
                      {status === "PENDING" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleQtyChange(item.mat_id, (approveQty[item.mat_id]??item.req_qty)-1, item.req_qty)}
                            className="qty-btn w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>
                            <FaMinus size={9}/>
                          </button>
                          <input
                            type="number" min={0} max={item.req_qty}
                            value={approveQty[item.mat_id]??item.req_qty}
                            onChange={e => handleQtyChange(item.mat_id, e.target.value, item.req_qty)}
                            className="w-14 text-center text-sm font-bold outline-none rounded-lg"
                            style={{ border:"1.5px solid #c8e6c9", color:"#1a1a1a", padding:"4px" }}
                          />
                          <button
                            onClick={() => handleQtyChange(item.mat_id, (approveQty[item.mat_id]??item.req_qty)+1, item.req_qty)}
                            className="qty-btn w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>
                            <FaPlus size={9}/>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full font-bold"
                          style={item.approve_qty > 0
                            ? { background:"#e8f5e9", color:"#2e7d32" }
                            : { background:"#f3f4f6", color:"#9ca3af" }}>
                          {item.approve_qty > 0 ? item.approve_qty : "—"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center text-xs" style={{ color:"#9ca3af" }}>
                      {item.unit ?? "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          action={confirm}
          onConfirm={() => handleAction(confirm)}
          onCancel={() => !acting && setConfirm(null)}
          loading={acting}
        />
      )}
    </div>
  );
}
