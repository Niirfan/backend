import React, { createContext, useContext, useState } from "react";

// สร้าง Context สำหรับเก็บข้อมูลตะกร้าและรายการคำขอ
const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  
  // ข้อมูลรายการคำขอ (ใส่ข้อมูลจำลองเริ่มต้นเพื่อให้เห็นภาพในหน้า History และ Request)
  const [requests, setRequests] = useState([
    {
      id: "REQ68001",
      date: "27/10/2567",
      itemsCount: 5,
      branch: "001 หาดใหญ่",
      status: "pending", // รอดำเนินการ
      items: []
    },
    {
      id: "REQ68002",
      date: "28/10/2567",
      itemsCount: 2,
      branch: "002 สงขลา",
      status: "completed", // สำเร็จ (จะโชว์ในหน้าประวัติด้วย)
      items: []
    }
  ]);

  // ฟังก์ชันเพิ่มสินค้าลงตะกร้า
  const addToCart = (item) => {
    setCartItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, i.maxStock || 99) } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // ฟังก์ชันลบสินค้าจากตะกร้า
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ฟังก์ชันอัปเดตจำนวนสินค้า
  const updateQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: parseInt(quantity) || 1 } : item))
    );
  };

  // ฟังก์ชันล้างตะกร้า
  const clearCart = () => setCartItems([]);

  // ฟังก์ชันเพิ่มรายการคำขอใหม่ (เรียกใช้ตอนกดยืนยันการเบิก)
  const addRequest = (newRequest) => {
    setRequests((prev) => [newRequest, ...prev]);
  };

  // ฟังก์ชันอัปเดตสถานะคำขอ (สำหรับ Admin หรือการทดสอบเปลี่ยนสถานะ)
  const updateRequestStatus = (requestId, newStatus) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    );
  };

  // รวม Value ทั้งหมดที่จะส่งไปให้หน้าอื่นๆ ใช้
  const contextValue = {
    cartItems,
    requests,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    addRequest,
    updateRequestStatus
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Hook สำหรับดึงข้อมูลไปใช้ในหน้าต่างๆ (เช่น หน้า History, Request, Cart)
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    // กรณีไม่ได้เรียกใช้ภายใต้ CartProvider ให้ส่งค่าว่างกลับไปเพื่อไม่ให้ App พัง
    return { 
      cartItems: [], 
      requests: [], 
      addToCart: () => {}, 
      removeFromCart: () => {}, 
      updateQuantity: () => {}, 
      clearCart: () => {}, 
      addRequest: () => {},
      updateRequestStatus: () => {}
    }; 
  }
  return context;
};