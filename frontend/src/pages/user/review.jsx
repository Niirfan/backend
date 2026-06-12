import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "../../context/CartContext"; 

function RequestItem({ item }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-24 w-24 flex-shrink-0 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-3xl">{item.image || "📦"}</span>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
        <p className="text-xs text-gray-500 mt-1">หน่วย: {item.unit}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900">{item.quantity}</p>
      </div>
    </div>
  );
}

export default function ReviewRequestPage() {
  const navigate = useNavigate();
  
  // ✅ แก้ไขจุดนี้: ดึง clearCart และ addRequest ออกมาใช้
  const { cartItems, clearCart, addRequest } = useCart(); 

  const handleCancel = () => {
    navigate('/cart'); 
  };

  const handleConfirm = () => {
    if (cartItems.length === 0) return; //

    // 1. สร้างก้อนข้อมูลคำขอใหม่
    const newRequestData = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      type: "เบิกพัสดุ",
      date: new Date().toLocaleDateString('th-TH'),
      itemsCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      branch: "สำนักงานใหญ่",
      approver: "-",
      requester: "อับดุล เอ้ย",
      status: "pending",
    };

    addRequest(newRequestData); 

    //  ล้างตะกร้าสินค้า
    clearCart(); 

    //  แสดง Alert แจ้งเตือน
    console.log("กำลังจะไปหน้า Request...");
    navigate('/requests'); 
  };

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm mb-6 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center shadow-md">
                <FaShoppingCart size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบคำขอ</h1>
                <p className="text-sm text-gray-500 mt-1">ตรวจสอบรายการก่อนยืนยันคำขอ</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm text-left">
          <h2 className="text-lg font-bold text-gray-900 mb-6">รายการคำขอเบิก</h2>
          <div className="flex justify-end mb-4 border-b border-gray-100 pb-2">
            <span className="text-sm font-semibold text-gray-700">จำนวน</span>
          </div>

          <div className="divide-y divide-gray-100">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <RequestItem key={item.id} item={item} />
              ))
            ) : (
              <div className="py-20 text-center">
                 <p className="text-gray-400">ไม่มีรายการในตะกร้า</p>
                 <button onClick={() => navigate('/material')} className="mt-4 text-sm text-blue-600 underline">ไปเลือกสินค้า</button>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">รวมจำนวนทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalQuantity} รายการ</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCancel} 
                  className="rounded-xl border-2 border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleConfirm} 
                  disabled={cartItems.length === 0}
                  className="rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  ยืนยันการเบิก
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}