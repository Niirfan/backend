// pages/CartPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";

// ── CartItem ─────────────────────────────────────────────────────

function CartItem({ item, onQuantityChange, onRemove }) {
  const handleDecrease = () => {
    if (item.quantity > 1) onQuantityChange(item.id, item.quantity - 1);
  };

  const handleIncrease = () => {
    if (item.quantity < item.maxStock) onQuantityChange(item.id, item.quantity + 1);
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const newQty = Math.min(Math.max(1, value), item.maxStock);
    onQuantityChange(item.id, newQty);
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {item.unit} · เหลือ {item.maxStock} {item.unit}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleDecrease}
          disabled={item.quantity <= 1}
          className="h-8 w-8 rounded-lg border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>
        <input
          type="number"
          value={item.quantity}
          onChange={handleInputChange}
          min={1}
          max={item.maxStock}
          className="h-8 w-16 rounded-lg border text-center text-sm"
        />
        <button
          onClick={handleIncrease}
          disabled={item.quantity >= item.maxStock}
          className="h-8 w-8 rounded-lg border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      <button
        onClick={() => onRemove(item.id)}
        className="text-red-400 hover:text-red-600 flex-shrink-0 ml-2"
        title="ลบออกจากตะกร้า"
      >
        ✕
      </button>
    </div>
  );
}

// ── ConfirmModal ─────────────────────────────────────────────────

function ConfirmModal({ cart, onConfirm, onCancel }) {
  const [requester, setRequester] = useState("");
  const [branch, setBranch] = useState("สำนักงานใหญ่");
  const [note, setNote] = useState("");

  const branches = [
    "สำนักงานใหญ่",
    "สาขาพัทลุง",
    "สาขารัตภูมิ",
    "สาขาจะนะ",
    "สาขาหาดใหญ่",
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-1">ยืนยันการส่งคำขอเบิก</h2>
        <p className="text-sm text-gray-500 mb-4">
          รายการสินค้า {cart.length} รายการ
        </p>

        {/* สรุปสินค้า */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1 max-h-40 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.name}</span>
              <span className="font-semibold">
                {item.quantity} {item.unit}
              </span>
            </div>
          ))}
        </div>

        {/* ข้อมูลผู้ขอ */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              ชื่อผู้ขอเบิก
            </label>
            <input
              type="text"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              placeholder="กรอกชื่อ"
              className="w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              สาขา
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm"
            >
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              หมายเหตุ (ถ้ามี)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="กรอกหมายเหตุ..."
              className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onConfirm({ requester: requester || "ไม่ระบุ", branch, note })}
            className="flex-1 bg-green-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-600"
          >
            ยืนยันส่งคำขอ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateCartQuantity, removeFromCart, submitRequest } = useCart();

  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmSubmit = (meta) => {
    submitRequest(meta); // บันทึกเข้า context และเคลียร์ตะกร้า
    setShowConfirm(false);
    navigate("/requests"); // ไปหน้ารายการคำขอ
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center text-xl">
              🛒
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ตะกร้าเบิกของ</h1>
              <p className="text-sm text-gray-500">
                สินค้าในตะกร้า {cart.length} รายการ
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/borrow-material")}
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
            >
              ← เพิ่มสินค้า
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={cart.length === 0}
              className="rounded-xl bg-green-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ส่งคำขอเบิก
            </button>
          </div>
        </div>

        {/* รายการ */}
        <div className="space-y-3">
          {cart.length > 0 ? (
            cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQuantityChange={updateCartQuantity}
                onRemove={removeFromCart}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-lg font-semibold text-gray-800">ตะกร้าว่างเปล่า</p>
              <p className="text-sm text-gray-500 mt-2">ยังไม่มีสินค้าในตะกร้า</p>
              <button
                onClick={() => navigate("/borrow-material")}
                className="mt-4 bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800"
              >
                ไปเลือกสินค้า
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Modal ยืนยัน */}
      {showConfirm && (
        <ConfirmModal
          cart={cart}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}