import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaSearch, FaShoppingCart, FaBoxOpen, FaPlus } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import Toast from "../../components/toast";
import api from "../../services/api";

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Global styles ──────────────────────────────────────────────────
if (!document.head.querySelector("#borrow-v2")) {
  const s = document.createElement("style");
  s.id = "borrow-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .borrow-root * { font-family: 'Sarabun', sans-serif; }
    .btn-green { background:#2e7d32; color:#fff; transition: background .18s, box-shadow .18s, transform .1s; }
    .btn-green:hover:not(:disabled) { background:#388e3c; box-shadow:0 4px 14px rgba(46,125,50,.35); }
    .btn-green:active:not(:disabled) { transform:scale(.97); }
    .btn-outline-green { border:1.5px solid #c8e6c9; color:#2e7d32; background:#fff; transition:background .18s; }
    .btn-outline-green:hover { background:#e8f5e9; }
    .search-box:focus-within { border-color:#2e7d32 !important; box-shadow:0 0 0 3px rgba(46,125,50,.1); }
    .type-chip { transition: background .15s, color .15s, box-shadow .15s; }
    .type-chip.active { background:#2e7d32; color:#fff; box-shadow:0 3px 10px rgba(46,125,50,.28); }
    .type-chip:not(.active):hover { background:#e8f5e9; color:#2e7d32; }
    .modal-enter { animation: menter .2s ease; }
    @keyframes menter { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }
    .no-scrollbar::-webkit-scrollbar { display:none; }
    .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
  `;
  document.head.appendChild(s);
}

// ── SafeImage ──────────────────────────────────────────────────────
function SafeImage({ src, alt, className }) {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    fetch(src, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then(r => r.blob())
      .then(blob => { if (!cancelled) setObjectUrl(URL.createObjectURL(blob)); })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!objectUrl) return null;
  return <img src={objectUrl} alt={alt} className={className} />;
}

// ── InfoRow ────────────────────────────────────────────────────────
function InfoRow({ label, value, last }) {
  return (
    <div className={`flex justify-between items-center py-2.5 ${!last ? "border-b" : ""}`}
      style={{ borderColor: "#f3f3f3" }}>
      <span className="text-sm" style={{ color: "#9ca3af" }}>{label}</span>
      <span className="text-sm font-semibold text-right" style={{ color: "#1a1a1a", maxWidth: "60%" }}>{value || "–"}</span>
    </div>
  );
}

// ── No Permission Modal ────────────────────────────────────────────
function NoPermissionModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-7 w-80 shadow-2xl text-center modal-enter" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#fef2f2" }}>
          <span className="text-3xl">🚫</span>
        </div>
        <h3 className="font-bold text-base mb-1" style={{ color: "#1a1a1a" }}>ไม่มีสิทธิ์เบิกพัสดุ</h3>
        <p className="text-sm mb-5" style={{ color: "#6b7280" }}>บัญชีของคุณไม่มีสิทธิ์เพิ่มสินค้าลงตะกร้า<br />กรุณาติดต่อผู้ดูแลระบบ</p>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold btn-green">ปิด</button>
      </div>
    </div>
  );
}

// ── Material Card ──────────────────────────────────────────────────
function MaterialCard({ item, canBorrow, onDetail, onAdd }) {
  const inStock = item.balance_qty > 0;
  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{ boxShadow: "0 2px 10px rgba(0,0,0,.07)", border: "1px solid #f0faf0" }}>

      {/* รูปภาพ */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 148, background: "#e8f5e9" }}>
        {item.image ? (
          <SafeImage
            src={`${BASE_URL}${item.image}`}
            alt={item.mat_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
            <FaBoxOpen size={30} style={{ color: "#a5d6a7" }} />
            <span className="text-xs" style={{ color: "#b0bec5" }}>ไม่มีรูปภาพ</span>
          </div>
        )}

        {/* Stock badge */}
        <span className="absolute top-2 left-2 text-xs font-bold px-2.5 py-0.5 rounded-full"
          style={{
            background: inStock ? "rgba(46,125,50,.82)" : "rgba(220,38,38,.75)",
            color: "#fff", backdropFilter: "blur(6px)",
          }}>
          {inStock ? `คงเหลือ ${item.balance_qty} ${item.mat_unit}` : "หมด"}
        </span>
      </div>

      {/* ข้อมูล */}
      <div className="flex flex-col gap-3 p-3.5 flex-1">
        <div className="flex-1">
          <p className="font-semibold text-sm leading-snug" style={{ color: "#1a1a1a" }}>{item.mat_name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#b0bec5" }}>{item.mat_code}</p>
        </div>

        <div className="flex gap-1.5">
          <button onClick={() => onDetail(item)} className="flex-1 py-2 rounded-xl text-xs font-semibold btn-outline-green">
            ดูรายละเอียด
          </button>
          <button
            onClick={() => onAdd(item)}
            disabled={!canBorrow || !inStock}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 btn-green disabled:opacity-40 disabled:cursor-not-allowed">
            <FaPlus size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function BorrowMaterialPage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canBorrow = user.can_request === true;

  const [materials, setMaterials] = useState([]);
  const [loadingMat, setLoadingMat] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [showNoPermission, setShowNoPermission] = useState(false);

  useEffect(() => {
    api.get("/materials/")
      .then(r => setMaterials(r.data))
      .catch(console.error)
      .finally(() => setLoadingMat(false));
  }, []);

  const types = useMemo(() => ["all", ...[...new Set(materials.map(m => m.mat_type))]], [materials]);

  const sections = useMemo(() => {
    const filtered = materials.filter(m => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || m.mat_name.toLowerCase().includes(q) || m.mat_type.toLowerCase().includes(q) || m.mat_code.toLowerCase().includes(q);
      const matchT = activeType === "all" || m.mat_type === activeType;
      return matchQ && matchT;
    });
    if (activeType !== "all") return [{ title: activeType, items: filtered }];
    const grouped = {};
    filtered.forEach(m => { (grouped[m.mat_type] ??= []).push(m); });
    return Object.keys(grouped).map(k => ({ title: k, items: grouped[k] }));
  }, [materials, query, activeType]);

  const totalShowing = sections.reduce((a, s) => a + s.items.length, 0);

  const handleAddToCart = (item) => {
    if (!canBorrow) { setShowNoPermission(true); return; }
    addToCart(item);
    setToastMsg(`เพิ่ม "${item.mat_name}" ลงตะกร้าแล้ว`);
    setShowToast(true);
  };

  return (
    <div className="borrow-root min-h-screen" style={{ background: "#f5f7f5" }}>

      {/* TOPBAR */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom: "1px solid #e8f5e9", boxShadow: "0 2px 10px rgba(46,125,50,.06)" }}>

        <div className="px-6 pt-4 pb-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#2e7d32" }}>
              <FaBoxOpen size={17} color="#fff" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: "#1a1a1a" }}>เบิกพัสดุ</h1>
              {!loadingMat && <p className="text-xs" style={{ color: "#9ca3af" }}>พบ {totalShowing} รายการ</p>}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="search-box flex items-center gap-2 flex-1 rounded-xl px-3.5 py-2.5 bg-white"
              style={{ border: "1.5px solid #e0e0e0", transition: "border-color .2s, box-shadow .2s" }}>
              <FaSearch size={12} style={{ color: "#a5d6a7", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัส, ประเภท..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                style={{ color: "#1a1a1a" }}
              />
              {query && (
                <button onClick={() => setQuery("")} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                  <FaTimes size={11} />
                </button>
              )}
            </div>

            <button
              onClick={() => navigate("/cart")}
              className="relative btn-green flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0">
              <FaShoppingCart size={14} />
              <span>ตะกร้า</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-white text-xs flex items-center justify-center font-bold shadow-md"
                  style={{ background: "#ff7043" }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Type filter chips */}
        {!loadingMat && types.length > 1 && (
          <div className="px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {types.map(t => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`type-chip flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold ${activeType === t ? "active" : ""}`}
                style={activeType !== t ? { background: "#f3f4f6", color: "#6b7280" } : {}}>
                {t === "all" ? "🗂 ทั้งหมด" : t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="px-6 py-6">

        {loadingMat && (
          <div className="flex flex-col items-center py-32 gap-4">
            <div className="w-12 h-12 rounded-full border-4 animate-spin"
              style={{ borderColor: "#c8e6c9", borderTopColor: "#2e7d32" }} />
            <p className="text-sm" style={{ color: "#6b7280" }}>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {!loadingMat && totalShowing === 0 && (
          <div className="flex flex-col items-center py-32 gap-3">
            <FaBoxOpen size={48} style={{ color: "#c8e6c9" }} />
            <p className="font-semibold" style={{ color: "#374151" }}>
              {query ? `ไม่พบ "${query}"` : "ไม่มีข้อมูลวัสดุ"}
            </p>
            {query && (
              <button onClick={() => setQuery("")} className="btn-outline-green text-sm px-4 py-1.5 rounded-xl">
                ล้างการค้นหา
              </button>
            )}
          </div>
        )}

        {!loadingMat && sections.map(sec => (
          <div key={sec.title} className="mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: "#2e7d32" }} />
              <h2 className="font-bold text-base" style={{ color: "#1a1a1a" }}>{sec.title}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                {sec.items.length} รายการ
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {sec.items.map(item => (
                <MaterialCard
                  key={item.mat_id}
                  item={item}
                  canBorrow={canBorrow}
                  onDetail={setSelectedItem}
                  onAdd={handleAddToCart}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
          onClick={() => setSelectedItem(null)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl modal-enter"
            onClick={e => e.stopPropagation()}>

            {/* Pull bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full" style={{ background: "#d1d5db" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5" style={{ background: "#2e7d32" }}>
              <h2 className="font-bold text-white text-sm">รายละเอียดวัสดุ</h2>
              <button className="text-white/70 hover:text-white" onClick={() => setSelectedItem(null)}>
                <FaTimes size={14} />
              </button>
            </div>

            {/* Image */}
            <div className="relative overflow-hidden flex items-center justify-center"
              style={{ height: 192, background: "#e8f5e9" }}>
              {selectedItem.image ? (
                <SafeImage
                  src={`${BASE_URL}${selectedItem.image}`}
                  alt={selectedItem.mat_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <FaBoxOpen size={44} style={{ color: "#a5d6a7" }} />
                  <span className="text-xs" style={{ color: "#a5d6a7" }}>ไม่มีรูปภาพ</span>
                </div>
              )}

              {/* Stock badge */}
              <span className="absolute bottom-3 right-3 text-xs font-bold px-3 py-1 rounded-full"
                style={{
                  background: selectedItem.balance_qty > 0 ? "rgba(46,125,50,.88)" : "rgba(220,38,38,.75)",
                  color: "#fff", backdropFilter: "blur(6px)",
                }}>
                {selectedItem.balance_qty > 0
                  ? `คงเหลือ ${selectedItem.balance_qty} ${selectedItem.mat_unit}`
                  : "หมดสต็อก"}
              </span>
            </div>

            {/* Info */}
            <div className="px-5 pt-4 pb-5">
              <InfoRow label="รหัสวัสดุ" value={selectedItem.mat_code} />
              <InfoRow label="ชื่อวัสดุ"  value={selectedItem.mat_name} />
              <InfoRow label="ประเภท"      value={selectedItem.mat_type} />
              <InfoRow label="หน่วยนับ"    value={selectedItem.mat_unit} last />

              <button
                onClick={() => { handleAddToCart(selectedItem); if (canBorrow) setSelectedItem(null); }}
                disabled={!canBorrow || selectedItem.balance_qty <= 0}
                className="mt-5 w-full py-3 rounded-xl text-sm font-bold btn-green disabled:opacity-40 disabled:cursor-not-allowed">
                {!canBorrow ? "ไม่มีสิทธิ์เบิก" : selectedItem.balance_qty <= 0 ? "หมดสต็อก" : "+ เพิ่มลงตะกร้า"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoPermission && <NoPermissionModal onClose={() => setShowNoPermission(false)} />}
      <Toast show={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
    </div>
  );
}