import { useState } from "react";
import { FaFileAlt, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MOCK_REQUESTS } from "./mockreq";

const STATUS_COLORS = {
  pending: "bg-purple-100 text-purple-700 border-purple-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  processing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
};

const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  approved: "อนุมัติ",
  processing: "กำลังดำเนินการ",
  rejected: "ไม่อนุมัติ",
  completed: "สำเร็จ",
};

function RequestCard({ request }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500">เลขคำขอ</p>
          <p className="text-lg font-bold">{request.id}</p>
        </div>
        <span
          className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[request.status]}`}
        >
          {STATUS_LABELS[request.status]}
        </span>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">วันที่ขอ:</span>
          <span className="font-medium">{request.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">สาขา:</span>
          <span className="font-medium">{request.branch}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">ผู้ขอ:</span>
          <span className="font-medium">{request.requester}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">จำนวนรายการ:</span>
          <span className="font-medium">
            {request.items.length} รายการ
          </span>
        </div>
      </div>

      <button
        onClick={() => navigate(`/requests/${request.id}`)}
        className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 flex items-center justify-center gap-2"
      >
        <FaEye /> ดูรายละเอียด
      </button>
    </div>
  );
}

export default function RequestListPage() {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? MOCK_REQUESTS
      : MOCK_REQUESTS.filter((r) => r.status === filter);

  const filterOptions = [
    { label: "ทั้งหมด", value: "all" },
    { label: "รอดำเนินการ", value: "pending" },
    { label: "กำลังดำเนินการ", value: "processing" },
    { label: "สำเร็จ", value: "completed" },
    { label: "ไม่อนุมัติ", value: "rejected" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center">
            <FaFileAlt size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">รายการคำขอ</h1>
            <p className="text-sm text-gray-500">
              ทั้งหมด {MOCK_REQUESTS.length} รายการ
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold ${
                filter === opt.value
                  ? "bg-black text-white"
                  : "bg-white border hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      </div>
    </div>
  );
}