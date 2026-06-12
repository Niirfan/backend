import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaPlus, FaChevronDown, FaTrash, FaEdit,
  FaImage, FaTimes, FaLink, FaUpload, FaBoxOpen, FaSearch
} from "react-icons/fa";
import { MdVisibilityOff } from "react-icons/md";
import Toast from "../../components/toast";
import api from "../../services/api";

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Global styles ──────────────────────────────────────────────────
if (!document.head.querySelector("#adminmat-v2")) {
  const s = document.createElement("style");
  s.id = "adminmat-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .adminmat-root * { font-family: 'Sarabun', sans-serif; }
    .mat-row { transition: background .15s; }
    .mat-row:hover { background: #f4faf4 !important; }
    .modal-enter { animation: menter .2s ease; }
    @keyframes menter { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }
    .search-focus:focus-within { border-color:#2e7d32 !important; box-shadow:0 0 0 3px rgba(46,125,50,.1); }
    .tab-active { background:#2e7d32; color:#fff; }
    .tab-inactive { background:#f3f4f6; color:#6b7280; }
    .tab-inactive:hover { background:#e8f5e9; color:#2e7d32; }
    .action-btn { transition: background .15s; border-radius: 10px; padding: 7px; }
  `;
  document.head.appendChild(s);
}

// ── SafeImage ──────────────────────────────────────────────────────
function SafeImage({ src, alt, className }) {
  const [objectUrl, setObjectUrl] = useState(null);
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    fetch(src, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then(r => r.blob()).then(blob => { if (!cancelled) setObjectUrl(URL.createObjectURL(blob)); }).catch(() => {});
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);
  if (!objectUrl) return null;
  return <img src={objectUrl} alt={alt} className={className} />;
}

// ── ImageModal ─────────────────────────────────────────────────────
function ImageModal({ material, onClose, onSaved, setToastMsg, setShowToast }) {
  const [tab, setTab] = useState("upload");
  const [urlInput, setUrlInput] = useState("");
  const [previewSrc, setPreviewSrc] = useState(
    material?.image ? `${BASE_URL}${material.image}?ngrok-skip-browser-warning=true` : ""
  );
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setPreviewSrc(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (tab === "upload" && file) {
        const form = new FormData();
        form.append("image", file);
        await api.patch(`/materials/${material.mat_id}/image`, form, { headers: { "Content-Type": "multipart/form-data" } });
      } else if (tab === "url" && urlInput.trim()) {
        await api.patch(`/materials/${material.mat_id}/image`, { image_url: urlInput.trim() });
      } else {
        setToastMsg("กรุณาเลือกไฟล์หรือใส่ URL"); setShowToast(true); return;
      }
      setToastMsg("บันทึกรูปภาพสำเร็จ"); setShowToast(true);
      onSaved(); onClose();
    } catch {
      setToastMsg("บันทึกรูปภาพไม่สำเร็จ"); setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl modal-enter" onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background:"#d1d5db" }}/></div>

        <div className="flex items-center justify-between px-5 py-4" style={{ background:"#2e7d32" }}>
          <div>
            <h2 className="font-bold text-white text-sm">จัดการรูปภาพ</h2>
            <p className="text-xs text-white/70 mt-0.5 truncate max-w-[200px]">{material.mat_name}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><FaTimes size={14}/></button>
        </div>

        <div className="px-5 py-5">
          <div className="w-full h-44 rounded-2xl flex items-center justify-center mb-5 overflow-hidden"
            style={{ border:"2px dashed #c8e6c9", background:"#f4faf4" }}>
            {previewSrc ? (
              <img src={previewSrc} alt="preview" className="h-full w-full object-contain"
                onError={() => setPreviewSrc("")}/>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FaImage size={28} style={{ color:"#a5d6a7" }}/>
                <span className="text-xs" style={{ color:"#9ca3af" }}>ยังไม่มีรูปภาพ</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-4 p-1 rounded-xl" style={{ background:"#f3f4f6" }}>
            <button onClick={() => setTab("upload")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${tab==="upload" ? "tab-active" : "tab-inactive"}`}>
              <FaUpload size={11}/> อัปโหลดไฟล์
            </button>
            <button onClick={() => setTab("url")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${tab==="url" ? "tab-active" : "tab-inactive"}`}>
              <FaLink size={11}/> ใส่ URL
            </button>
          </div>

          {tab === "upload" ? (
            <label className="flex flex-col items-center justify-center w-full h-20 rounded-xl cursor-pointer transition"
              style={{ border:"2px dashed #c8e6c9", background:"#f4faf4" }}
              onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
              onMouseLeave={e => e.currentTarget.style.background="#f4faf4"}>
              <FaUpload size={16} style={{ color:"#2e7d32", marginBottom:6 }}/>
              <span className="text-xs font-semibold" style={{ color:"#2e7d32" }}>
                {file ? file.name : "คลิกหรือลากไฟล์มาวาง"}
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange}/>
            </label>
          ) : (
            <div className="search-focus flex items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={{ border:"1.5px solid #e0e0e0", transition:"border-color .2s" }}>
              <FaLink size={12} style={{ color:"#a5d6a7" }}/>
              <input type="text" value={urlInput} onChange={e => { setUrlInput(e.target.value); setPreviewSrc(e.target.value); }}
                placeholder="https://example.com/image.jpg"
                className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                style={{ color:"#1a1a1a" }}/>
            </div>
          )}

          <div className="flex gap-2.5 mt-5">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}
              onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}>
              ยกเลิก
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background:"#2e7d32" }}
              onMouseEnter={e => { if(!saving) e.currentTarget.style.background="#388e3c"; }}
              onMouseLeave={e => e.currentTarget.style.background="#2e7d32"}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────
function StatusBadge({ m }) {
  if (!m.is_active) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background:"#fef2f2", color:"#dc2626" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background:"#dc2626" }}/> ไม่พร้อม
    </span>
  );
  if (m.balance_qty === 0) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background:"#fef3c7", color:"#d97706" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background:"#d97706" }}/> หมด
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background:"#e8f5e9", color:"#2e7d32" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background:"#2e7d32" }}/> พร้อม
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AdminMaterials() {
  const navigate = useNavigate();
  const [materialTypes, setMaterialTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("visible"); // "visible" | "hidden"
  const [loading, setLoading] = useState(true);
  const [imageModal, setImageModal] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => { loadMaterialTypes(); }, []);
  useEffect(() => { loadMaterials(); }, [selectedType, visibilityFilter]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      // เรียก endpoint ต่างกันตาม filter
      const endpoint = visibilityFilter === "hidden"
        ? "/materials/admin/hidden"
        : "/materials/admin";
        console.log("📦 fetching:", endpoint); // ← เพิ่ม
      const res = await api.get(endpoint);
      let data = res.data;
      if (selectedType) data = data.filter(m => String(m.mat_type_id) === String(selectedType));
      setMaterials(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadMaterialTypes = async () => {
    try { const res = await api.get("/material-type"); setMaterialTypes(res.data); }
    catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/materials/${id}`);
      await loadMaterials();
      setToastMsg("ลบรายการสำเร็จ"); setShowToast(true);
    } catch {
      setToastMsg("ลบรายการไม่สำเร็จ"); setShowToast(true);
    }
  };

  const filtered = materials.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.mat_name?.toLowerCase().includes(q) || m.mat_code?.toLowerCase().includes(q);
  });

  // StatusBadge ไม่ต้องแสดง "ซ่อนอยู่" แล้ว เพราะกรองแยกหน้าแล้ว

  return (
    <div className="adminmat-root min-h-screen" style={{ background:"#f5f7f5" }}>
      <Toast show={showToast} message={toastMsg} onClose={() => setShowToast(false)}/>
      {imageModal && (
        <ImageModal material={imageModal} onClose={() => setImageModal(null)}
          onSaved={loadMaterials} setToastMsg={setToastMsg} setShowToast={setShowToast}/>
      )}

      {/* ── TOPBAR ── */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
              <FaBoxOpen size={17} color="#fff"/>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color:"#1a1a1a" }}>รายการวัสดุสำนักงาน</h1>
              {!loading && <p className="text-xs" style={{ color:"#9ca3af" }}>ทั้งหมด {filtered.length} รายการ</p>}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="search-focus flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-white"
              style={{ border:"1.5px solid #e0e0e0", transition:"border-color .2s, box-shadow .2s", minWidth:200 }}>
              <FaSearch size={12} style={{ color:"#a5d6a7", flexShrink:0 }}/>
              <input type="text" placeholder="ค้นหาชื่อ, รหัสวัสดุ..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                style={{ color:"#1a1a1a" }}/>
              {search && <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><FaTimes size={10}/></button>}
            </div>

            {/* Type filter */}
            <div className="relative">
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                className="appearance-none rounded-xl px-4 py-2.5 pr-9 text-sm font-semibold outline-none cursor-pointer"
                style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>
                <option value="">ประเภททั้งหมด</option>
                {materialTypes.map(t => <option key={t.mat_type_id} value={t.mat_type_id}>{t.mat_type_name}</option>)}
              </select>
              <FaChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:"#2e7d32" }}/>
            </div>

            {/* ── กรองสถานะการแสดง ── */}
            <div className="relative">
              <select
                value={visibilityFilter}
                onChange={e => setVisibilityFilter(e.target.value)}
                className="appearance-none rounded-xl px-4 py-2.5 pr-9 text-sm font-semibold outline-none cursor-pointer"
                style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>
                <option value="visible">วัสดุที่ใช้งาน</option>
                <option value="hidden">วัสดุที่ซ่อน</option>
              </select>
              <FaChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:"#2e7d32" }}/>
            </div>

            {/* Add button */}
            <button onClick={() => navigate("/admin/material/add")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition"
              style={{ background:"#2e7d32" }}
              onMouseEnter={e => e.currentTarget.style.background="#388e3c"}
              onMouseLeave={e => e.currentTarget.style.background="#2e7d32"}>
              <FaPlus size={11}/> เพิ่มวัสดุ
            </button>
          </div>
        </div>
      </div>

      {/* ── แถบแจ้งโหมดดูวัสดุที่ซ่อน ── */}
      {visibilityFilter === "hidden" && (
        <div className="px-6 pt-4">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-orange-50 border border-orange-200">
            <MdVisibilityOff size={16} className="text-orange-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-orange-700">
              กำลังดูวัสดุที่ถูกซ่อน — วัสดุเหล่านี้จะไม่แสดงให้ผู้ใช้งานทั่วไปเห็น
            </p>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-6 py-5">
        {loading ? (
          <div className="flex flex-col items-center py-32 gap-4">
            <div className="w-12 h-12 border-4 rounded-full animate-spin"
              style={{ borderColor:"#c8e6c9", borderTopColor:"#2e7d32" }}/>
            <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลดข้อมูล...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-32 gap-4">
            <FaBoxOpen size={44} style={{ color:"#c8e6c9" }}/>
            <p className="font-semibold" style={{ color:"#374151" }}>ไม่พบข้อมูลวัสดุ</p>
            {search && <button onClick={() => setSearch("")} className="text-sm px-4 py-1.5 rounded-xl transition"
              style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>ล้างการค้นหา</button>}
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background:"#e8f5e9", borderBottom:"1.5px solid #c8e6c9" }}>
                    {[
                      { label:"รูป",          cls:"w-20 text-left" },
                      { label:"รหัสวัสดุ",    cls:"text-left" },
                      { label:"ชื่อวัสดุ",     cls:"text-left" },
                      { label:"ประเภท",        cls:"text-left" },
                      { label:"คงเหลือ",       cls:"text-center w-24" },
                      { label:"สถานะ",         cls:"text-center w-28" },
                      { label:"รายละเอียด",    cls:"text-center w-28" },
                      { label:"จัดการ",        cls:"text-center w-28" },
                    ].map(h => (
                      <th key={h.label} className={`py-3 px-4 text-xs font-bold ${h.cls}`}
                        style={{ color:"#2e7d32" }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.mat_id} className="mat-row border-t" style={{ borderColor:"#e8f5e9" }}>

                      {/* รูป */}
                      <td className="py-3 px-4">
                        <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                          style={{ background:"#e8f5e9", border:"1px solid #c8e6c9" }}>
                          {m.image
                            ? <SafeImage src={`${BASE_URL}${m.image}`} alt={m.mat_name} className="w-full h-full object-cover"/>
                            : <FaImage size={16} style={{ color:"#a5d6a7" }}/>
                          }
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"#f4f6f4", color:"#6b7280" }}>
                          {m.mat_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold" style={{ color:"#1a1a1a" }}>{m.mat_name}</td>
                      <td className="py-3 px-4" style={{ color:"#6b7280" }}>{m.mat_type}</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: m.balance_qty === 0 ? "#d97706" : "#1a1a1a" }}>
                        {m.balance_qty}
                      </td>
                      <td className="py-3 px-4 text-center"><StatusBadge m={m}/></td>

                      {/* รายละเอียด */}
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => navigate(`/admin/materials/${m.mat_id}?admin=true`)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          style={{ background:"#e8f5e9", color:"#2e7d32" }}
                          onMouseEnter={e => e.currentTarget.style.background="#c8e6c9"}
                          onMouseLeave={e => e.currentTarget.style.background="#e8f5e9"}>
                          ดูรายละเอียด
                        </button>
                      </td>

                      {/* จัดการ */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setImageModal(m)} title="จัดการรูปภาพ"
                            className="action-btn" style={{ color:"#0369a1" }}
                            onMouseEnter={e => e.currentTarget.style.background="#e0f2fe"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <FaImage size={14}/>
                          </button>
                          <button onClick={() => navigate(`/admin/material/edit/${m.mat_id}`)} title="แก้ไข"
                            className="action-btn" style={{ color:"#2e7d32" }}
                            onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <FaEdit size={14}/>
                          </button>
                          <button onClick={() => handleDelete(m.mat_id)} title="ลบ"
                            className="action-btn" style={{ color:"#dc2626" }}
                            onMouseEnter={e => e.currentTarget.style.background="#fef2f2"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <FaTrash size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}