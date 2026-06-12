import { useMemo, useState } from "react";

const CATEGORY_OPTIONS = [
  { value: "all", label: "ประเภททั้งหมด" },
  { value: "computer", label: "คอมพิวเตอร์" },
  { value: "furniture", label: "เฟอร์นิเจอร์" },
  { value: "electronics", label: "อุปกรณ์อิเล็กทรอนิกส์" },
];

const MOCK_SECTIONS = [
  {
    title: "คอมพิวเตอร์",
    items: [
      { id: 1, name: "เครื่องคอมพิวเตอร์ตั้งโต๊ะ", unit: "เครื่อง", stock: 15 },
      { id: 2, name: "โน้ตบุ๊ค", unit: "เครื่อง", stock: 8 },
      { id: 3, name: "เครื่องพิมพ์เลเซอร์", unit: "เครื่อง", stock: 5 },
    ],
  },
  {
    title: "เฟอร์นิเจอร์",
    items: [
      { id: 4, name: "โต๊ะทำงาน", unit: "ตัว", stock: 20 },
      { id: 5, name: "เก้าอี้สำนักงาน", unit: "ตัว", stock: 25 },
      { id: 6, name: "ตู้เอกสาร", unit: "ตู้", stock: 10 },
      { id: 7, name: "โต๊ะประชุม", unit: "ตัว", stock: 3 },
    ],
  },
  {
    title: "อุปกรณ์อิเล็กทรอนิกส์",
    items: [
      { id: 8, name: "โปรเจคเตอร์", unit: "เครื่อง", stock: 4 },
      { id: 9, name: "กล้องวงจรปิด", unit: "ตัว", stock: 12 },
      { id: 10, name: "เครื่องสแกนเนอร์", unit: "เครื่อง", stock: 6 },
    ],
  },
];

function EquipmentCard({ item }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="h-32 w-full rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <span className="text-4xl"></span>
      </div>

      <div className="mt-3">
        <p className="text-sm font-semibold text-gray-900">{item.name}</p>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>เหลืออีก {item.stock} {item.unit}</span>
          <button className="text-blue-600 hover:underline">ดูรายละเอียด</button>
        </div>

        <button className="mt-3 w-full rounded-xl bg-black py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
          ขอยืมครุภัณฑ์
        </button>
      </div>
    </div>
  );
}

export default function EquipmentPage() {
  const [category, setCategory] = useState("all");

  const sections = useMemo(() => {
    if (category === "all") return MOCK_SECTIONS;
    if (category === "computer") return MOCK_SECTIONS.filter((s) => s.title === "คอมพิวเตอร์");
    if (category === "furniture") return MOCK_SECTIONS.filter((s) => s.title === "เฟอร์นิเจอร์");
    if (category === "electronics") return MOCK_SECTIONS.filter((s) => s.title === "อุปกรณ์อิเล็กทรอนิกส์");
    return MOCK_SECTIONS;
  }, [category]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl rounded-2xl bg-white p-8 shadow-sm">
        
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center text-xl shadow-md">
            🖥️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ครุภัณฑ์</h1>
            <p className="text-sm text-gray-500 mt-1">เลือกประเภทและรายการครุภัณฑ์ที่ต้องการยืม</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-xl bg-blue-400 px-6 py-3 shadow-sm hover:bg-blue-500 transition-colors">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-sm font-semibold text-white outline-none cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-gray-900">
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-white">▾</span>
          </div>
        </div>

        <div className="mt-8 mb-6 border-t border-gray-100"></div>

        <div className="space-y-10">
          {sections.map((sec) => (
            <section key={sec.title}>
              <h2 className="mb-5 text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-blue-500"></span>
                {sec.title}
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sec.items.map((item) => (
                  <EquipmentCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}