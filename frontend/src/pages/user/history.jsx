import { useState, useEffect } from "react";
import {
  FaHistory,
  FaCalendarAlt,
  FaSearch,
  FaTimes,
  FaBoxOpen,
  FaCheckCircle,
  FaBan,
  FaChevronRight,
} from "react-icons/fa";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import th from "date-fns/locale/th";
import api from "../../services/api";

registerLocale("th", th);

if (!document.head.querySelector("#history-v2")) {
  const s = document.createElement("style");
  s.id = "history-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .history-root * { font-family: 'Sarabun', sans-serif; }
    .filter-chip { transition: background .15s, color .15s, box-shadow .15s; }
    .filter-chip.active-issued { background:#0369a1; color:#fff; box-shadow:0 2px 8px rgba(3,105,161,.3); }
    .filter-chip.active-rejected { background:#dc2626; color:#fff; box-shadow:0 2px 8px rgba(220,38,38,.3); }
    .filter-chip.active-all { background:#2e7d32; color:#fff; box-shadow:0 2px 8px rgba(46,125,50,.3); }
    .filter-chip:not([class*="active"]):hover { background:#e8f5e9; color:#2e7d32; }
    .search-focus:focus-within { border-color:#2e7d32 !important; box-shadow:0 0 0 3px rgba(46,125,50,.1); }
    .modal-enter { animation: menter .2s ease; }
    @keyframes menter { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
    .no-scrollbar::-webkit-scrollbar { display:none; }
    .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
  `;
  document.head.appendChild(s);
}

const STATUS = {
  ISSUED: {
    bg: "#e0f2fe",
    text: "#0369a1",
    border: "#bae6fd",
    label: "เบิกจ่ายแล้ว",
    icon: <FaCheckCircle size={10} />,
    bar: "#0369a1",
  },
  REJECTED: {
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    label: "ไม่อนุมัติ",
    icon: <FaBan size={10} />,
    bar: "#dc2626",
  },
};

const getResponseList = (res) => {
  const payload = res?.data;

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload)) return payload;

  return [];
};

const getTotalPages = (res) => {
  const payload = res?.data;

  return Number(
    payload?.total_pages ??
      payload?.data?.total_pages ??
      payload?.pagination?.total_pages ??
      payload?.meta?.total_pages ??
      1
  );
};

function HistoryDetailModal({ record, onClose }) {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchItems = async () => {
      setLoadingItems(true);

      try {
        const res = await api.get(`/requests/${record.mat_req_id}`);
        const detailItems = getResponseList(res);

        if (active) {
          setItems(detailItems);
        }
      } catch (error) {
        console.error("fetch request detail error:", error);

        if (active) {
          setItems([]);
        }
      } finally {
        if (active) {
          setLoadingItems(false);
        }
      }
    };

    if (record?.mat_req_id) {
      fetchItems();
    }

    return () => {
      active = false;
    };
  }, [record?.mat_req_id]);

  const st = STATUS[record.req_status] || {
    bg: "#f3f4f6",
    text: "#6b7280",
    border: "#e5e7eb",
    label: record.req_status || "-",
    bar: "#9ca3af",
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#d1d5db" }} />
        </div>

        <div className="flex-shrink-0" style={{ background: "#2e7d32", padding: "18px 24px" }}>
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-base text-white truncate">
                {record.mat_req_code || "-"}
              </h2>
              <p className="text-xs text-white/70 mt-0.5">
                {record.req_date
                  ? new Date(record.req_date).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </p>
            </div>

            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0"
              style={{ background: st.bg, color: st.text, borderColor: st.border }}
            >
              {st.icon} {st.label}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div
            className="flex items-center gap-3 p-3 rounded-xl mb-4"
            style={{ background: "#f4f6f4" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#e8f5e9" }}
            >
              <span style={{ color: "#2e7d32", fontSize: 14 }}>ผู้</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                ผู้ขอ
              </p>
              <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                {record.full_name || "-"}
              </p>
            </div>
          </div>

          {record.admin_note && (
            <div
              className="flex items-start gap-2.5 mb-4 p-3 rounded-xl"
              style={{ background: "#fdf4ff", border: "1.5px solid #e9d5ff" }}
            >
              <span className="text-base flex-shrink-0">หมายเหตุ</span>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "#7e22ce" }}>
                  หมายเหตุจากผู้ดูแล
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#6b21a8", whiteSpace: "pre-wrap" }}
                >
                  {record.admin_note}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid #e8f5e9" }}>
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: "#e8f5e9" }}
            >
              <p className="text-xs font-bold" style={{ color: "#2e7d32" }}>
                รายการวัสดุ
              </p>
              {!loadingItems && items.length > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#fff", color: "#2e7d32" }}
                >
                  {items.length} รายการ
                </span>
              )}
            </div>

            {loadingItems ? (
              <div className="flex items-center gap-2.5 px-4 py-5" style={{ color: "#9ca3af" }}>
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                  style={{ borderColor: "#c8e6c9", borderTopColor: "#2e7d32" }}
                />
                <span className="text-sm">กำลังโหลด...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <FaBoxOpen size={24} style={{ color: "#c8e6c9" }} />
                <p className="text-sm" style={{ color: "#9ca3af" }}>
                  ไม่มีรายการ
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#e8f5e9" }}>
                {items.map((item, i) => (
                  <div key={item.detail_id || i} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>
                        {item.mat_name || "-"}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-bold ml-3 flex-shrink-0"
                      style={{ background: "#e8f5e9", color: "#2e7d32" }}
                    >
                      {item.approve_qty > 0 ? item.approve_qty : item.req_qty}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: "1px solid #e8f5e9" }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition"
            style={{ border: "1.5px solid #c8e6c9", color: "#2e7d32", background: "#fff" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f5e9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ item, onSelect }) {
  const st = STATUS[item.req_status] || {
    bg: "#f3f4f6",
    text: "#6b7280",
    border: "#e5e7eb",
    label: item.req_status || "-",
    bar: "#9ca3af",
  };

  const dateStr = item.req_date
    ? new Date(item.req_date).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  const timeStr = item.req_date
    ? new Date(item.req_date).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  return (
    <div
      onClick={() => onSelect(item)}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer"
      style={{ border: "1.5px solid #e8f5e9", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}
    >
      <div className="h-1 w-full" style={{ background: st.bar }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: st.bg }}
            >
              <FaHistory size={14} style={{ color: st.text }} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: "#1a1a1a" }}>
                {item.mat_req_code || "-"}
              </p>
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                {item.full_name || "-"}
              </p>
            </div>
          </div>

          <span
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0"
            style={{ background: st.bg, color: st.text, borderColor: st.border }}
          >
            {st.icon} {st.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl p-2.5" style={{ background: "#f9fafb" }}>
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              วันที่
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "#374151" }}>
              {dateStr}
            </p>
          </div>

          <div className="rounded-xl p-2.5" style={{ background: "#f9fafb" }}>
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              เวลา / จำนวน
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "#374151" }}>
              {timeStr} · {item.items_count ?? "-"} รายการ
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 text-xs font-semibold" style={{ color: "#2e7d32" }}>
          ดูรายละเอียด <FaChevronRight size={10} />
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async (pageNum = 1, reset = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const [issuedRes, rejectedRes] = await Promise.all([
        api.get("/requests/mine", {
          params: { page: pageNum, limit: 20, status: "ISSUED" },
        }),
        api.get("/requests/mine", {
          params: { page: pageNum, limit: 20, status: "REJECTED" },
        }),
      ]);

      const issuedData = getResponseList(issuedRes);
      const rejectedData = getResponseList(rejectedRes);

      const combined = [...issuedData, ...rejectedData].sort(
        (a, b) => new Date(b.req_date) - new Date(a.req_date)
      );

      setHistory((prev) => (reset ? combined : [...prev, ...combined]));

      const issuedTotalPages = getTotalPages(issuedRes);
      const rejectedTotalPages = getTotalPages(rejectedRes);

      setHasMore(pageNum < issuedTotalPages || pageNum < rejectedTotalPages);
    } catch (error) {
      console.error("fetchHistory error:", error);

      if (reset) {
        setHistory([]);
      }

      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchHistory(1, true);
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchHistory(next, false);
  };

  const historyData = history.filter((item) => {
    const matReqCode = String(item?.mat_req_code ?? "").toLowerCase();
    const searchText = searchId.toLowerCase();

    const matchId = matReqCode.includes(searchText);
    const matchStatus = selectedStatus === "all" || item?.req_status === selectedStatus;
    const matchDate =
      !startDate ||
      new Date(item?.req_date).toDateString() === new Date(startDate).toDateString();

    return matchId && matchStatus && matchDate;
  });

  const counts = { all: history.length, ISSUED: 0, REJECTED: 0 };

  history.forEach((r) => {
    if (counts[r.req_status] !== undefined) {
      counts[r.req_status] += 1;
    }
  });

  const chips = [
    { label: "ทั้งหมด", value: "all", activeClass: "active-all" },
    { label: "เบิกจ่ายแล้ว", value: "ISSUED", activeClass: "active-issued" },
    { label: "ไม่อนุมัติ", value: "REJECTED", activeClass: "active-rejected" },
  ];

  const hasFilters = searchId || startDate || selectedStatus !== "all";

  return (
    <div className="history-root min-h-screen" style={{ background: "#f5f7f5" }}>
      <div
        className="bg-white sticky top-0 z-20"
        style={{ borderBottom: "1px solid #e8f5e9", boxShadow: "0 2px 10px rgba(46,125,50,.06)" }}
      >
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#2e7d32" }}
            >
              <FaHistory size={17} color="#fff" />
            </div>

            <div>
              <h1 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>
                ประวัติการเบิก
              </h1>
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                พบ {historyData.length} รายการ
              </p>
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={() => {
                setSearchId("");
                setStartDate(null);
                setSelectedStatus("all");
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition"
              style={{ border: "1.5px solid #fecaca", color: "#dc2626", background: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              <FaTimes size={10} /> ล้างตัวกรอง
            </button>
          )}
        </div>

        <div className="px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {chips.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedStatus(c.value)}
              className={`filter-chip flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                selectedStatus === c.value ? c.activeClass : ""
              }`}
              style={selectedStatus !== c.value ? { background: "#f3f4f6", color: "#6b7280" } : {}}
            >
              {c.label}
              <span
                className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: selectedStatus === c.value ? "rgba(255,255,255,.25)" : "#e8f5e9",
                  color: selectedStatus === c.value ? "#fff" : "#2e7d32",
                }}
              >
                {counts[c.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pt-5">
        <div
          className="bg-white rounded-2xl p-3 flex flex-wrap gap-2.5"
          style={{ border: "1.5px solid #e8f5e9", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}
        >
          <div
            className="search-focus flex items-center gap-2 flex-1 min-w-[180px] rounded-xl px-3.5 py-2.5"
            style={{ border: "1.5px solid #e0e0e0", transition: "border-color .2s, box-shadow .2s" }}
          >
            <FaSearch size={12} style={{ color: "#a5d6a7", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="ค้นหารหัสคำขอ..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
              style={{ color: "#1a1a1a" }}
            />
            {searchId && (
              <button onClick={() => setSearchId("")} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                <FaTimes size={10} />
              </button>
            )}
          </div>

          <div className="relative min-w-[160px]" style={{ flex: "0 0 auto" }}>
            <div
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={{ border: "1.5px solid #e0e0e0", background: "#fff" }}
            >
              <FaCalendarAlt size={12} style={{ color: "#a5d6a7", flexShrink: 0 }} />
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                locale="th"
                dateFormat="dd/MM/yyyy"
                placeholderText="เลือกวันที่"
                className="bg-transparent outline-none text-sm placeholder-gray-400 w-full"
              />
              {startDate && (
                <button onClick={() => setStartDate(null)} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                  <FaTimes size={10} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        {loading && (
          <div className="flex flex-col items-center py-32 gap-4">
            <div
              className="w-12 h-12 rounded-full border-4 animate-spin"
              style={{ borderColor: "#c8e6c9", borderTopColor: "#2e7d32" }}
            />
            <p className="text-sm" style={{ color: "#6b7280" }}>
              กำลังโหลด...
            </p>
          </div>
        )}

        {!loading && historyData.length === 0 && (
          <div className="flex flex-col items-center py-32 gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "#e8f5e9" }}
            >
              <FaHistory size={32} style={{ color: "#a5d6a7" }} />
            </div>

            <div className="text-center">
              <p className="font-bold" style={{ color: "#374151" }}>
                ยังไม่มีประวัติการเบิก
              </p>
              <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
                {hasFilters
                  ? "ไม่พบรายการที่ตรงกับตัวกรอง"
                  : "ประวัติจะปรากฏเมื่อคำขอเสร็จสิ้น"}
              </p>
            </div>

            {hasFilters && (
              <button
                onClick={() => {
                  setSearchId("");
                  setStartDate(null);
                  setSelectedStatus("all");
                }}
                className="text-sm font-semibold px-4 py-2 rounded-xl transition"
                style={{ border: "1.5px solid #c8e6c9", color: "#2e7d32", background: "#fff" }}
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        )}

        {!loading && historyData.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyData.map((item, index) => (
                <HistoryCard
                  key={item.mat_req_id || `${item.mat_req_code}-${index}`}
                  item={item}
                  onSelect={setSelectedRecord}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition"
                  style={{ border: "1.5px solid #c8e6c9", color: "#2e7d32", background: "#fff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f5e9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  {loadingMore ? (
                    <>
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: "#c8e6c9", borderTopColor: "#2e7d32" }}
                      />
                      กำลังโหลด...
                    </>
                  ) : (
                    "โหลดเพิ่มเติม"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedRecord && (
        <HistoryDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}