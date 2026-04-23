// pages/BorrowMaterialPage.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import Toast from "../../components/toast";

// ── MOCK DATA (แทนที่ด้วย API call จริงได้เลย) ──────────────────
const mockMaterials = [
  {
    mat_id: 1,
    mat_code: "MAT001",
    mat_name: "กระดาษ A4",
    mat_unit: "รีม",
    mat_type: "เครื่องเขียน",
    balance_qty: 120,
    image: "https://likeoffice.co.th/cdn/shop/products/300019_1_2048x2048.jpg?v=1664013386",
  },
  {
    mat_id: 2,
    mat_code: "MAT002",
    mat_name: "ปากกา",
    mat_unit: "ด้าม",
    mat_type: "เครื่องเขียน",
    balance_qty: 90,
    image: "https://www.ofm.co.th/blog/wp-content/uploads/2019/09/2.png",
  },
  {
    mat_id: 3,
    mat_code: "MAT003",
    mat_name: "แฟ้มเอกสาร",
    mat_unit: "แฟ้ม",
    mat_type: "สำนักงาน",
    balance_qty: 60,
    image: "https://ge.lnwfile.com/_/ge/_raw/y5/nx/ql.jpg",
  },
  {
    mat_id: 4,
    mat_code: "MAT004",
    mat_name: "หมึกพิมพ์",
    mat_unit: "ตลับ",
    mat_type: "คอมพิวเตอร์",
    balance_qty: 25,
    image: "https://v3i.rweb-images.com/www.itinkonline.com/images/editor/%e0%b8%99%e0%b9%89%e0%b8%b3%e0%b8%ab%e0%b8%a1%e0%b8%b6%e0%b8%81DTG1.jpg",
  },
  {
    mat_id: 5,
    mat_code: "MAT005",
    mat_name: "เมาส์",
    mat_unit: "ตัว",
    mat_type: "คอมพิวเตอร์",
    balance_qty: 15,
    image: "https://www.425degree.com/media/amasty/webp/catalog/product/cache/16f787c0803d70727d149195af4aa9dd/p/u/purchase-gallery-650wl-top_png.webp__1850x800_q100_crop-scale_optimize_subsampling-2_png.webp",
  },
];

// ── SUB-COMPONENTS ───────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold">{value || "-"}</span>
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────

export default function BorrowMaterialPage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();

  const [materials] = useState(mockMaterials);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // จัดกลุ่มตามประเภท
  const sections = useMemo(() => {
    const grouped = {};
    materials.forEach((m) => {
      if (!grouped[m.mat_type]) grouped[m.mat_type] = [];
      grouped[m.mat_type].push(m);
    });
    return Object.keys(grouped).map((k) => ({ title: k, items: grouped[k] }));
  }, [materials]);

  const handleAddToCart = (item) => {
    addToCart(item);
    setToastMsg(`เพิ่ม "${item.mat_name}" ลงตะกร้าแล้ว`);
    setShowToast(true);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">เบิกพัสดุ</h1>

        {/* ปุ่มไปตะกร้า */}
        <button
          onClick={() => navigate("/cart")}
          className="relative flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
        >
          🛒 ตะกร้า
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* สินค้าแบ่งตามประเภท */}
      {sections.map((sec) => (
        <div key={sec.title} className="mb-8">
          <h2 className="font-bold text-lg mb-3">{sec.title}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sec.items.map((item) => (
              <div
                key={item.mat_id}
                className="border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="h-32 bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.mat_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <p className="mt-3 font-semibold">{item.mat_name}</p>
                <p className="text-xs text-gray-500">
                  เหลือ {item.balance_qty} {item.mat_unit}
                </p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="flex-1 border border-gray-300 rounded-xl py-2 text-sm hover:bg-gray-100"
                  >
                    ดูรายละเอียด
                  </button>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="flex-1 bg-black text-white rounded-xl py-2 text-sm hover:bg-gray-800"
                  >
                    เพิ่ม
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal รายละเอียด */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white p-6 rounded-2xl w-80 relative shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setSelectedItem(null)}
            >
              <FaTimes />
            </button>

            <h2 className="font-bold mb-4">รายละเอียดวัสดุ</h2>

            <img
              src={selectedItem.image}
              alt={selectedItem.mat_name}
              className="w-full h-40 object-cover rounded-xl mb-4"
            />

            <InfoRow label="รหัส" value={selectedItem.mat_code} />
            <InfoRow label="ชื่อ" value={selectedItem.mat_name} />
            <InfoRow label="หน่วย" value={selectedItem.mat_unit} />
            <InfoRow label="ประเภท" value={selectedItem.mat_type} />
            <InfoRow label="คงเหลือ" value={`${selectedItem.balance_qty} ${selectedItem.mat_unit}`} />

            <button
              onClick={() => {
                handleAddToCart(selectedItem);
                setSelectedItem(null);
              }}
              className="mt-4 w-full bg-black text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-800"
            >
              เพิ่มลงตะกร้า
            </button>
          </div>
        </div>
      )}

      <Toast
        show={showToast}
        message={toastMsg}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}