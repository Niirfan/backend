import { useState } from "react";
import { FaHistory, FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import th from "date-fns/locale/th";
import { MOCK_REQUESTS } from "./mockreq";  // ✅ ใช้ mock โดยตรง

registerLocale("th", th);

export default function HistoryPage() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("วัสดุ");
  const [startDate, setStartDate] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const requests = MOCK_REQUESTS || [];

  const BRANCHES = [
    { id: "all", label: "รวมสาขา" },
    { id: "สำนักงานใหญ่", label: "สำนักงานใหญ่" },
    { id: "สาขาพัทลุง", label: "สาขาพัทลุง" },
    { id: "สาขารัตภูมิ", label: "สาขารัตภูมิ" },
    { id: "สาขาจะนะ", label: "สาขาจะนะ" },
    { id: "สาขาหาดใหญ่", label: "สาขาหาดใหญ่" },
  ];

  // ✅ Filter ทำงานจริง
  const historyData = requests.filter((item) => {
    const matchId = item.id
      .toLowerCase()
      .includes(searchId.toLowerCase());

    const matchBranch =
      selectedBranch === "all" || item.branch === selectedBranch;

    const matchStatus =
      selectedStatus === "all" || item.status === selectedStatus;

    return matchId && matchBranch && matchStatus;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "approved":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "processing":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "รอดำเนินการ",
      approved: "อนุมัติแล้ว",
      processing: "กำลังดำเนินการ",
      rejected: "ไม่อนุมัติ",
      completed: "เบิกสำเร็จ",
    };
    return labels[status] || status;
  };

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
            className="flex-1 border rounded-xl px-4 py-2 text-sm"
          />

          <div className="relative flex-1">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              locale="th"
              dateFormat="dd/MM/yyyy"
              placeholderText="เลือกวันที่"
              className="w-full border rounded-xl px-4 py-2 text-sm"
            />
            <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative flex-1">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 text-sm"
            >
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative flex-1">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 text-sm"
            >
              <option value="all">รวมสถานะ</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="processing">กำลังดำเนินการ</option>
              <option value="completed">เบิกสำเร็จ</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-center">
            <thead className="border-b">
              <tr>
                <th className="py-4">รหัสคำขอ</th>
                <th>วันที่</th>
                <th>จำนวน</th>
                <th>สาขา</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {historyData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-gray-400">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                historyData.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">{item.id}</td>
                    <td>{item.date}</td>
                    <td>{item.itemsCount}</td>
                    <td>{item.branch}</td>
                    <td>
                      <span
                        className={`px-4 py-1 rounded-full text-xs font-bold border ${getStatusStyle(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/requests/${item.id}`)}
                        className="text-blue-500 hover:underline text-sm"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}