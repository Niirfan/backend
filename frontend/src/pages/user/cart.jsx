import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaTrash, FaArrowLeft, FaBoxOpen, FaPlus, FaMinus, FaCheckCircle } from "react-icons/fa";
import { useCart } from "../../context/CartContext";

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Global styles ──────────────────────────────────────────────────
if (!document.head.querySelector("#cart-v2")) {
  const s = document.createElement("style");
  s.id = "cart-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .cart-root * { font-family: 'Sarabun', sans-serif; }
    .cart-item-row { transition: box-shadow .2s, border-color .2s; }
    .cart-item-row:hover { box-shadow: 0 6px 24px rgba(46,125,50,.12) !important; border-color: #a5d6a7 !important; }
    .qty-btn { transition: background .15s, transform .1s; }
    .qty-btn:not(:disabled):hover { background: #e8f5e9 !important; }
    .qty-btn:not(:disabled):active { transform: scale(.9); }
    .btn-green { background:#2e7d32; color:#fff; transition: background .18s, box-shadow .18s; }
    .btn-green:hover:not(:disabled) { background:#388e3c; box-shadow:0 4px 14px rgba(46,125,50,.3); }
    .btn-green:disabled { background:#d1d5db; cursor:not-allowed; }
    .btn-outline { border:1.5px solid #c8e6c9; color:#2e7d32; background:#fff; transition: background .18s; }
    .btn-outline:hover { background:#e8f5e9; }
    .modal-enter { animation: mslide .22s ease; }
    @keyframes mslide { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
    .delete-btn { transition: background .15s, color .15s; }
    .delete-btn:hover { background: #fee2e2 !important; color: #dc2626 !important; }
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

// ── CartItem ───────────────────────────────────────────────────────
function CartItem({ item, onQuantityChange, onRemove }) {
  const handleDecrease = () => { if (item.quantity > 1) onQuantityChange(item.id, item.quantity - 1); };
  const handleIncrease = () => { if (item.quantity < item.maxStock) onQuantityChange(item.id, item.quantity + 1); };
  const handleInput = (e) => {
    const v = parseInt(e.target.value) || 1;
    onQuantityChange(item.id, Math.min(Math.max(1, v), item.maxStock));
  };

  const pct = Math.round((item.quantity / item.maxStock) * 100);

  return (
    <div className="cart-item-row bg-white rounded-2xl overflow-hidden"
      style={{ border: "1.5px solid #e8f5e9", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
      <div className="flex items-center gap-4 p-4">

        {/* รูป */}
        <div className="relative rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ width: 72, height: 72, background: "#e8f5e9", minWidth: 72 }}>
          {item.image ? (
            <SafeImage
              src={`${BASE_URL}${item.image}`}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FaBoxOpen size={24} style={{ color: "#a5d6a7" }} />
          )}
          {item.quantity > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
              style={{ background: "#2e7d32", fontSize: 10 }}>
              {item.quantity}
            </span>
          )}
        </div>

        {/* ชื่อ + stock */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug" style={{ color: "#1a1a1a" }}>{item.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>สต็อก {item.maxStock} {item.unit}</p>
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "#e8f5e9", width: 80 }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct > 80 ? "#ef4444" : "#2e7d32" }} />
          </div>
        </div>

        {/* Qty control */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={handleDecrease} disabled={item.quantity <= 1}
            className="qty-btn w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ border: "1.5px solid #c8e6c9", color: "#2e7d32", background: "#fff" }}>
            <FaMinus size={10} />
          </button>
          <input
            type="number" value={item.quantity} onChange={handleInput}
            min={1} max={item.maxStock}
            className="w-12 h-8 rounded-lg text-center text-sm font-bold outline-none"
            style={{ border: "1.5px solid #c8e6c9", color: "#1a1a1a" }}
          />
          <button onClick={handleIncrease} disabled={item.quantity >= item.maxStock}
            className="qty-btn w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ border: "1.5px solid #c8e6c9", color: "#2e7d32", background: "#fff" }}>
            <FaPlus size={10} />
          </button>
        </div>

        {/* ลบ */}
        <button onClick={() => onRemove(item.id)}
          className="delete-btn flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ color: "#fca5a5", background: "#fef2f2" }}>
          <FaTrash size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────
function ConfirmModal({ cart, onConfirm, onCancel, submitting }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl modal-enter"
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "#d1d5db" }} />
        </div>

        <div className="px-6 py-4" style={{ background: "#2e7d32" }}>
          <h2 className="font-bold text-white text-base">ยืนยันการส่งคำขอเบิก</h2>
          <p className="text-xs text-white/70 mt-0.5">รวม {cart.length} รายการ</p>
        </div>

        <div className="px-6 pt-4">
          <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid #e8f5e9" }}>
            <div className="px-3 py-2" style={{ background: "#e8f5e9" }}>
              <p className="text-xs font-semibold" style={{ color: "#2e7d32" }}>รายการที่จะส่ง</p>
            </div>
            <div className="divide-y max-h-44 overflow-y-auto" style={{ borderColor: "#e8f5e9" }}>
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm" style={{ color: "#374151" }}>{item.name}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-5">
          <button onClick={onCancel} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold btn-outline disabled:opacity-50">
            ยกเลิก
          </button>
          <button onClick={onConfirm} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-green flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />กำลังส่ง...</>
              : <><FaCheckCircle size={13} />ยืนยันส่งคำขอ</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateCartQuantity, removeFromCart, submitRequest } = useCart();
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitRequest();
      setShowConfirm(false);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const totalItems = cart.reduce((a, i) => a + i.quantity, 0);

  return (
    <div className="cart-root min-h-screen" style={{ background: "#f5f7f5" }}>

      {/* TOPBAR */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom: "1px solid #e8f5e9", boxShadow: "0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/borrow-material")}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition btn-outline">
              <FaArrowLeft size={13} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#2e7d32" }}>
                <FaShoppingCart size={16} color="#fff" />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>ตะกร้าเบิกของ</h1>
                <p className="text-xs" style={{ color: "#9ca3af" }}>
                  {cart.length} รายการ · {totalItems} ชิ้นรวม
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={cart.length === 0}
            className="btn-green flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold">
            <FaCheckCircle size={13} />
            ส่งคำขอเบิก
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 py-6 max-w-3xl mx-auto">

        {error && (
          <div className="mb-4 rounded-xl p-4 text-sm flex items-center gap-2"
            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
            ⚠️ {error}
          </div>
        )}

        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "#e8f5e9" }}>
              <FaShoppingCart size={36} style={{ color: "#a5d6a7" }} />
            </div>
            <div className="text-center">
              <p className="font-bold text-base" style={{ color: "#1a1a1a" }}>ตะกร้าว่างเปล่า</p>
              <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>ยังไม่มีสินค้าในตะกร้า</p>
            </div>
            <button onClick={() => navigate("/borrow-material")}
              className="btn-green flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold">
              <FaBoxOpen size={14} /> ไปเลือกสินค้า
            </button>
          </div>
        )}

        {cart.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>รายการทั้งหมด</p>
              <span className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                {cart.length} รายการ
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={updateCartQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5"
              style={{ border: "1.5px solid #e8f5e9", boxShadow: "0 4px 20px rgba(46,125,50,.1)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>พร้อมส่งคำขอ</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>รวม {cart.length} รายการ · {totalItems} ชิ้น</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#e8f5e9" }}>
                  <FaCheckCircle size={18} style={{ color: "#2e7d32" }} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate("/borrow-material")}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold btn-outline">
                  ← เพิ่มสินค้า
                </button>
                <button onClick={() => setShowConfirm(true)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold btn-green flex items-center justify-center gap-2">
                  <FaCheckCircle size={13} /> ส่งคำขอเบิก
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          cart={cart}
          onConfirm={handleConfirm}
          onCancel={() => !submitting && setShowConfirm(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}