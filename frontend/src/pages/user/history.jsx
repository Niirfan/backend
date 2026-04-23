// pages/HistoryPage.jsx
import { useState } from "react";
import { FaHistory, FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import th from "date-fns/locale/th";
import { useCart } from "../../context/CartContext";

registerLocale("th", th);

// ── helpers ───────────────────────────────────────────────────────

const STATUS_STYLE = {
  completed: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-purple-100 text-purple-700 border-purple-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  approved: "bg-blue-100 text-blue-700 border-blue-200",
  processing: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const STATUS_LABEL = {
  pending: "รอดำเนินการ",
  approved: "อนุมัติแล้ว",
  processing: "กำลังดำเนินการ",
  rejected: "ไม่อนุมัติ",
  completed: "เบิกสำเร็จ",
};

const BRANCHES = [
  { id: "all", label: "รวมสาขา" },
  { id: "สำนักงานใหญ่", label: "สำนักงานใหญ่" },
  { id: "สาขาพัทลุง", label: "สาขาพัทลุง" },
  { id: "สาขารัตภูมิ", label: "สาขารัตภูมิ" },
  { id: "สาขาจะนะ", label: "สาขาจะนะ" },
  { id: "สาขาหาดใหญ่", label: "สาขาหาดใหญ่" },
];

// ── HistoryDetailModal ────────────────────────────────────────────

function HistoryDetailModal({ record, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-lg">{record.id}</h2>
            <p className="text-xs text-gray-500">{record.date}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[record.status]}`}>
            {STATUS_LABEL[record.status]}
          </span>
        </div>

        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500">ผู้ขอ:</span>
            <span className="font-medium">{record.requester}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">สาขา:</span>
            <span className="font-medium">{record.branch}</span>
          </div>
          {record.note && (
            <div className="flex justify-between">
              <span className="text-gray-500">หมายเหตุ:</span>
              <span className="font-medium text-right max-w-[60%]">{record.note}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500">รายการสินค้า</p>
          {record.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span className="font-semibold">{item.quantity} {item.unit}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full border rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────

export default function HistoryPage() {
  const { history } = useCart();

  const [startDate, setStartDate] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Filter
  const historyData = history.filter((item) => {
    const matchId = item.id.toLowerCase().includes(searchId.toLowerCase());
    const matchBranch = selectedBranch === "all" || item.branch === selectedBranch;
    const matchStatus = selectedStatus === "all" || item.status === selectedStatus;
    return matchId && matchBranch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-black text-white flex items-center justify-center">
              <FaHistory size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ประวัติการเบิก</h1>
              <p className="text-sm text-gray-500">
                ทั้งหมด {historyData.length} รายการ
              </p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="ค้นหารหัสคำขอ"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 border rounded-xl px-4 py-2 text-sm min-w-[140px]"
          />

          <div className="relative flex-1 min-w-[140px]">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              locale="th"
              dateFormat="dd/MM/yyyy"
              placeholderText="เลือกวันที่"
              className="w-full border rounded-xl px-4 py-2 text-sm"
            />
            <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 text-sm appearance-none"
            >
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 text-sm appearance-none"
            >
              <option value="all">รวมสถานะ</option>
              <option value="completed">เบิกสำเร็จ</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {historyData.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">📂</div>
              <p className="font-semibold text-gray-700">ยังไม่มีประวัติการเบิก</p>
              <p className="text-sm text-gray-400 mt-1">
                ประวัติจะปรากฏเมื่อคำขอถูกดำเนินการเสร็จสิ้นหรือถูกปฏิเสธ
              </p>
            </div>
          ) : (
            <table className="w-full text-center text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="py-4 px-4 font-semibold text-gray-600">รหัสคำขอ</th>
                  <th className="py-4 px-4 font-semibold text-gray-600">วันที่</th>
                  <th className="py-4 px-4 font-semibold text-gray-600">จำนวน</th>
                  <th className="py-4 px-4 font-semibold text-gray-600">สาขา</th>
                  <th className="py-4 px-4 font-semibold text-gray-600">ผู้ขอ</th>
                  <th className="py-4 px-4 font-semibold text-gray-600">สถานะ</th>
                  <th className="py-4 px-4 font-semibold text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-4 px-4 font-medium">{item.id}</td>
                    <td className="py-4 px-4 text-gray-600">{item.date}</td>
                    <td className="py-4 px-4">{item.items.length} รายการ</td>
                    <td className="py-4 px-4 text-gray-600">{item.branch}</td>
                    <td className="py-4 px-4 text-gray-600">{item.requester}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLE[item.status]}`}
                      >
                        {STATUS_LABEL[item.status]}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setSelectedRecord(item)}
                        className="text-blue-500 hover:underline text-sm font-medium"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Modal รายละเอียด */}
      {selectedRecord && (
        <HistoryDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
} 