// context/CartContext.jsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const CartContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    "ngrok-skip-browser-warning": "true",
  };
}

// ✅ cart key แยกตาม user — ป้องกัน cart ของ user นึงไปโผล่ในอีก user
function getCartKey() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return `cart_${user.emp_code}`; // ✅ unique ต่อคน
}

export const STATUS_LABELS = {
  PENDING: "รอดำเนินการ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่อนุมัติ",
};

export const STATUS_COLORS = {
  PENDING: "bg-purple-100 text-purple-700 border-purple-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

export function CartProvider({ children }) {
  // ✅ โหลด cart จาก key เฉพาะของ user นั้น
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(getCartKey());
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

  // ✅ บันทึก cart ลง key เฉพาะของ user นั้นทุกครั้งที่เปลี่ยน
  useEffect(() => {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
  }, [cart]);

  // ── ดึงข้อมูลใบเบิกทั้งหมดของ user จาก API ──────────────────
  const fetchMyRequests = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setLoadingReqs(true);
    try {
      const res = await fetch(`${API_BASE}/requests/mine`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();

      const dataArray = Array.isArray(data) ? data : data.items ?? data.requests ?? data.data ?? [];
const withDetails = await Promise.all(
  dataArray.map(async (r) => {
          try {
            const detailRes = await fetch(
              `${API_BASE}/requests/${r.mat_req_id}`,
              { headers: authHeaders() }
            );
            if (!detailRes.ok) return { ...r, details: [] };
            const detail = await detailRes.json();
            return { ...r, details: detail.items || [] };
          } catch {
            return { ...r, details: [] };
          }
        })
      );

      const pending = withDetails
        .filter((r) => r.req_status === "PENDING")
        .map(normalize);
      const finished = withDetails
        .filter((r) => ["APPROVED", "REJECTED"].includes(r.req_status))
        .map(normalize);

      setRequests(pending);
      setHistory(finished);
    } catch (err) {
      console.error("fetchMyRequests error:", err);
    } finally {
      setLoadingReqs(false);
    }
  }, []);

  function normalize(r) {
    return {
      mat_req_id: r.mat_req_id,
      mat_req_code: r.mat_req_code,
      req_status: r.req_status,
      req_date: r.req_date,
      user_id: r.user_id,
      id: r.mat_req_code,
      status: r.req_status?.toLowerCase(),
      date: r.req_date ? new Date(r.req_date).toLocaleDateString("th-TH") : "-",
      requester: r.full_name || r.user_id,
      items: (r.details || []).map((d) => ({
        ...d,
        name: d.mat_name || `วัสดุ #${d.mat_id}`,
        quantity: d.req_qty,
      })),
      itemsCount: r.details?.length || 0,
    };
  }

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  // ── CART ──────────────────────────────────────────────────────

  const addToCart = useCallback((material) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === material.mat_id);
      if (exists) {
        return prev.map((i) =>
          i.id === material.mat_id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.maxStock) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: material.mat_id,
          name: material.mat_name,
          unit: material.mat_unit ?? "ชิ้น",
          quantity: 1,
          maxStock: material.balance_qty,
          image: material.image,
        },
      ];
    });
  }, []);

  const updateCartQuantity = useCallback((id, qty) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ✅ clearCart ล้าง state → useEffect จะล้าง localStorage ให้อัตโนมัติ
  const clearCart = useCallback(() => setCart([]), []);

  // ── SUBMIT → POST /requests/ ──────────────────────────────────
  const submitRequest = useCallback(async () => {
    const payload = {
      items: cart.map((i) => ({
        mat_id: i.id,
        req_qty: i.quantity,
      })),
    };

    const res = await fetch(`${API_BASE}/requests/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "ส่งคำขอไม่สำเร็จ");
    }

    const created = await res.json();
    clearCart();
    await fetchMyRequests();
    return created.mat_req_code;
  }, [cart, clearCart, fetchMyRequests]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: cart.length,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        requests,
        history,
        loadingReqs,
        fetchMyRequests,
        submitRequest,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}