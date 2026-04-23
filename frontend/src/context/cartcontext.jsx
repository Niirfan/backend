// context/CartContext.jsx
// ================================================================
//  Global state สำหรับทั้งระบบ:
//  - cart         : สินค้าในตะกร้า
//  - requests     : รายการคำขอเบิกที่ส่งแล้ว
//  - history      : ประวัติการเบิกที่เสร็จสิ้น / ถูกปฏิเสธ
// ================================================================

import { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);           // items in cart
  const [requests, setRequests] = useState([]);   // submitted requests
  const [history, setHistory] = useState([]);     // completed / rejected

  // ── CART ──────────────────────────────────────────────────────

  /** เพิ่มสินค้าลงตะกร้า ถ้ามีอยู่แล้วให้เพิ่มจำนวน */
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

  /** อัปเดตจำนวนสินค้าในตะกร้า */
  const updateCartQuantity = useCallback((id, qty) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  }, []);

  /** ลบสินค้าออกจากตะกร้า */
  const removeFromCart = useCallback((id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  /** ล้างตะกร้าทั้งหมด */
  const clearCart = useCallback(() => setCart([]), []);

  // ── REQUESTS ──────────────────────────────────────────────────

  /**
   * ส่งคำขอเบิก
   * รับ meta: { requester, branch, note }
   * คืนค่า requestId ที่สร้างขึ้น
   */
  const submitRequest = useCallback(
    (meta = {}) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const id = `REQ-${Date.now()}`;

      const newRequest = {
        id,
        date: dateStr,
        requester: meta.requester ?? "ผู้ใช้",
        branch: meta.branch ?? "สำนักงานใหญ่",
        note: meta.note ?? "",
        status: "pending",
        items: cart.map((i) => ({ ...i })),
        itemsCount: cart.length,
      };

      setRequests((prev) => [newRequest, ...prev]);
      clearCart();
      return id;
    },
    [cart, clearCart]
  );

  /**
   * อัปเดตสถานะคำขอ
   * newStatus: "pending" | "approved" | "processing" | "completed" | "rejected"
   */
  const updateRequestStatus = useCallback((requestId, newStatus) => {
    setRequests((prev) => {
      const updated = prev.map((r) =>
        r.id === requestId ? { ...r, status: newStatus } : r
      );

      // ถ้า completed หรือ rejected → ย้ายไป history
      if (newStatus === "completed" || newStatus === "rejected") {
        const target = updated.find((r) => r.id === requestId);
        if (target) {
          setHistory((h) => [target, ...h]);
          return updated.filter((r) => r.id !== requestId);
        }
      }

      return updated;
    });
  }, []);

  // ── VALUE ─────────────────────────────────────────────────────

  return (
    <CartContext.Provider
      value={{
        // cart
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount: cart.length,

        // requests
        requests,
        submitRequest,
        updateRequestStatus,

        // history
        history,
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