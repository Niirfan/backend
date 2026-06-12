import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaChartBar,
  FaChevronDown,
  FaDownload,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;

const THAI_MONTHS = [
  "",
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

if (!document.head.querySelector("#monthly-detail-v1")) {
  const s = document.createElement("style");
  s.id = "monthly-detail-v1";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .md-root * { font-family: 'Sarabun', sans-serif; }
    .req-row { transition: background .15s; }
    .req-row:hover { background: #f4faf4 !important; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .search-focus:focus-within {
      border-color: #2e7d32 !important;
      box-shadow: 0 0 0 3px rgba(46, 125, 50, .1);
    }
  `;
  document.head.appendChild(s);
}

function getFilenameFromResponse(res, fallback) {
  const disposition = res.headers.get("content-disposition") || "";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const plainMatch = disposition.match(/filename="?([^"]+)"?/i);
  const filename = utf8Match?.[1] || plainMatch?.[1];

  return filename ? decodeURIComponent(filename) : fallback;
}

export default function MonthlyDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  const branch = searchParams.get("branch") || "";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      "ngrok-skip-browser-warning": "true",
    }),
    [],
  );

  const buildParams = (extra = {}) => {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
      ...extra,
    });

    if (branch) params.set("branch_id", branch);
    return params;
  };

  useEffect(() => {
    if (!year || !month) return;

    setLoading(true);
    fetch(`${API_URL}/admin/report/monthly-detail?${buildParams()}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Fetch monthly detail failed");
        return res.json();
      })
      .then((result) => setData(result))
      .catch((err) => {
        console.error(err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [year, month, branch, headers]);

  const downloadList = async () => {
    if (!year || !month || downloading) return;

    setDownloading(true);

    try {
      const params = buildParams({ format: "pdf" });
      const res = await fetch(`${API_URL}/admin/report/monthly-detail/export?${params}`, {
        headers,
      });

      if (!res.ok) throw new Error("Export monthly detail failed");

      const blob = await res.blob();
      const fallback = `monthly_detail_${year}_${String(month).padStart(2, "0")}.pdf`;
      const filename = getFilenameFromResponse(res, fallback);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถดาวน์โหลดรายการได้");
    } finally {
      setDownloading(false);
    }
  };

  const filtered = (data?.requests || []).filter((req) => {
    const q = search.trim().toLowerCase();

    return (
      !q ||
      req.full_name?.toLowerCase().includes(q) ||
      req.emp_code?.toLowerCase().includes(q) ||
      req.mat_req_code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="md-root min-h-screen" style={{ background: "#f5f7f5" }}>
      <div
        className="bg-white sticky top-0 z-20"
        style={{
          borderBottom: "1px solid #e8f5e9",
          boxShadow: "0 2px 10px rgba(46,125,50,.06)",
        }}
      >
        <div className="px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition"
            style={{
              border: "1.5px solid #c8e6c9",
              color: "#2e7d32",
              background: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e8f5e9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
          >
            <FaArrowLeft size={13} />
          </button>

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#2e7d32" }}
          >
            <FaChartBar size={16} color="#fff" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>
              รายละเอียดการเบิกวัสดุ - {THAI_MONTHS[month]} {year}
            </h1>

            {!loading && data && (
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                ทั้งหมด {data.total} รายการ
              </p>
            )}
          </div>

          <button
            onClick={downloadList}
            disabled={loading || downloading || !data}
            className="h-9 px-3 rounded-xl flex items-center gap-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: "1.5px solid #2e7d32",
              color: "#fff",
              background: "#2e7d32",
            }}
          >
            {downloading ? (
              <span
                className="w-3.5 h-3.5 border-2 rounded-full spin"
                style={{
                  borderColor: "rgba(255,255,255,.45)",
                  borderTopColor: "#fff",
                }}
              />
            ) : (
              <FaDownload size={12} />
            )}

            <span>{downloading ? "กำลังดาวน์โหลด" : "ดาวน์โหลด PDF"}</span>
          </button>
        </div>
      </div>

      <div className="px-6 py-5 max-w-4xl mx-auto">
        <div
          className="search-focus flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-white mb-4 max-w-sm"
          style={{ border: "1.5px solid #e0e0e0" }}
        >
          <FaSearch size={12} style={{ color: "#a5d6a7", flexShrink: 0 }} />

          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัสพนักงาน, เลขที่ใบเบิก..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
            style={{ color: "#1a1a1a" }}
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <FaTimes size={10} />
            </button>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center py-32 gap-4">
            <div
              className="w-12 h-12 border-4 rounded-full spin"
              style={{
                borderColor: "#c8e6c9",
                borderTopColor: "#2e7d32",
              }}
            />

            <p className="text-sm" style={{ color: "#6b7280" }}>
              กำลังโหลดข้อมูล...
            </p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-32 gap-3">
            <p className="font-semibold" style={{ color: "#374151" }}>
              ไม่มีข้อมูลการเบิก
            </p>
          </div>
        )}

        {!loading &&
          filtered.map((req) => (
            <div
              key={req.mat_req_id}
              className="bg-white rounded-2xl overflow-hidden mb-3"
              style={{
                border: "1.5px solid #e8f5e9",
                boxShadow: "0 2px 8px rgba(0,0,0,.04)",
              }}
            >
              <button
                onClick={() =>
                  setExpandedId(expandedId === req.mat_req_id ? null : req.mat_req_id)
                }
                className="w-full flex items-center justify-between px-5 py-4 text-left transition req-row"
                style={{ background: "#fff" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                    style={{ background: "#2e7d32" }}
                  >
                    {req.full_name?.charAt(0) || "?"}
                  </div>

                  <div>
                    <p className="font-bold text-sm" style={{ color: "#1a1a1a" }}>
                      {req.full_name}
                    </p>

                    <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                      {req.emp_code}
                      {req.branch_id ? ` · สาขา ${req.branch_id}` : ""}
                      {" · "}
                      {req.mat_req_code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {new Date(req.req_date).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>

                    <p className="text-xs font-semibold mt-0.5" style={{ color: "#2e7d32" }}>
                      {req.items.length} รายการ
                    </p>
                  </div>

                  <FaChevronDown
                    size={12}
                    style={{
                      color: "#9ca3af",
                      transform:
                        expandedId === req.mat_req_id ? "rotate(180deg)" : "none",
                      transition: "transform .2s",
                    }}
                  />
                </div>
              </button>

              {expandedId === req.mat_req_id && (
                <div
                  className="border-t px-5 pb-4 pt-3"
                  style={{ background: "#f9fafb", borderColor: "#e8f5e9" }}
                >
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e8f5e9" }}>
                        {["ชื่อวัสดุ", "รหัส", "จำนวนขอ", "จำนวนอนุมัติ", "หน่วย"].map(
                          (header, i) => (
                            <th
                              key={header}
                              className={`py-2 font-bold ${
                                i === 0 ? "text-left" : "text-center"
                              }`}
                              style={{ color: "#2e7d32" }}
                            >
                              {header}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {req.items.map((item, i) => (
                        <tr
                          key={`${item.mat_code}-${i}`}
                          className="border-t"
                          style={{ borderColor: "#f0f0f0" }}
                        >
                          <td className="py-2.5 font-medium" style={{ color: "#374151" }}>
                            {item.mat_name}
                          </td>

                          <td className="py-2.5 text-center">
                            <span
                              className="px-1.5 py-0.5 rounded text-xs"
                              style={{ background: "#f3f4f6", color: "#6b7280" }}
                            >
                              {item.mat_code}
                            </span>
                          </td>

                          <td className="py-2.5 text-center" style={{ color: "#6b7280" }}>
                            {item.req_qty}
                          </td>

                          <td
                            className="py-2.5 text-center font-bold"
                            style={{ color: "#2e7d32" }}
                          >
                            {item.approve_qty > 0 ? item.approve_qty : "-"}
                          </td>

                          <td className="py-2.5 text-center" style={{ color: "#9ca3af" }}>
                            {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}