import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CartItem({ item, onQuantityChange, onRemove }) {
  const handleDecrease = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (item.quantity < item.maxStock) {
      onQuantityChange(item.id, item.quantity + 1);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const newQty = Math.min(Math.max(1, value), item.maxStock);
    onQuantityChange(item.id, newQty);
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <input type="checkbox" className="h-5 w-5 rounded border-gray-300" />

      <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {item.unit} · เหลือ {item.maxStock} {item.unit}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleDecrease}
          className="h-8 w-8 rounded-lg border hover:bg-gray-50"
        >
          −
        </button>
        <input
          type="number"
          value={item.quantity}
          onChange={handleInputChange}
          className="h-8 w-16 rounded-lg border text-center text-sm"
        />
        <button
          onClick={handleIncrease}
          className="h-8 w-8 rounded-lg border hover:bg-gray-50"
        >
          +
        </button>
      </div>

      <button
        onClick={() => onRemove(item.id)}
        className="text-red-500 hover:text-red-700"
      >
        ✕
      </button>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();

  // ---------------- MOCK DATA ----------------
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "กระดาษ A4",
      unit: "รีม",
      quantity: 2,
      maxStock: 20,
      image: "https://likeoffice.co.th/cdn/shop/products/300019_1_2048x2048.jpg?v=1664013386",
    },
    {
      id: 2,
      name: "ปากกา",
      unit: "ด้าม",
      quantity: 5,
      maxStock: 50,
      image: "https://www.ofm.co.th/blog/wp-content/uploads/2019/09/2.png",
    },
    {
      id: 3,
      name: "แฟ้มเอกสาร",
      unit: "แฟ้ม",
      quantity: 3,
      maxStock: 30,
      image: "https://ge.lnwfile.com/_/ge/_raw/y5/nx/ql.jpg",
    },
  ]);

  const updateQuantity = (id, qty) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center text-xl">
              🛒
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ตะกร้าเบิกของ
              </h1>
              <p className="text-sm text-gray-500">
                สินค้าในตะกร้า {cartItems.length} รายการ
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/cart/review")}
            disabled={cartItems.length === 0}
            className="rounded-xl bg-green-500 px-6 py-3 text-sm font-semibold text-white hover:bg-green-600 disabled:bg-gray-300"
          >
            ส่งคำขอเบิก
          </button>
        </div>

        <div className="space-y-3">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQuantityChange={updateQuantity}
                onRemove={removeFromCart}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-lg font-semibold">ตะกร้าว่างเปล่า</p>
              <p className="text-sm text-gray-500 mt-2">
                ยังไม่มีสินค้าในตะกร้า
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}