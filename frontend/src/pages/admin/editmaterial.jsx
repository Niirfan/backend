import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaImage, FaArrowLeft, FaEdit, FaBoxOpen } from "react-icons/fa";
import { HiChevronDown } from "react-icons/hi";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Global styles ──────────────────────────────────────────────────
if (!document.head.querySelector("#editmat-v2")) {
  const s = document.createElement("style");
  s.id = "editmat-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .editmat-root * { font-family: 'Sarabun', sans-serif; }
    .field-input {
      width:100%; padding:10px 16px; border-radius:12px;
      background:#f9fafb; border:1.5px solid #e8f5e9;
      outline:none; font-size:14px; color:#1a1a1a;
      transition: border-color .18s, box-shadow .18s, background .18s;
    }
    .field-input:focus { background:#fff; border-color:#2e7d32; box-shadow:0 0 0 3px rgba(46,125,50,.1); }
    .field-label { display:block; font-size:13px; font-weight:700; color:#374151; margin-bottom:6px; }
    .field-section { background:#fff; border-radius:20px; padding:20px; border:1.5px solid #e8f5e9; box-shadow:0 2px 8px rgba(0,0,0,.04); }
    .section-title { font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#a5d6a7; margin-bottom:16px; }
    .stock-tab { transition:background .15s, color .15s; }
    .stock-tab.active { background:#2e7d32; color:#fff; }
    .stock-tab:not(.active) { background:#f3f4f6; color:#6b7280; }
    .stock-tab:not(.active):hover { background:#e8f5e9; color:#2e7d32; }
    .modal-enter { animation: menter .2s ease; }
    @keyframes menter { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:none} }
  `;
  document.head.appendChild(s);
}

export default function EditMaterial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
    mat_code:"", mat_name:"", mat_type_id:"",
    unit_pack:"", qty_per_pack:"", unit_sub:"",
    price_per_pack:"", min_qty:"",
    current_stock:0, adjust_qty:"", adjust_mode:"add",
  });

  useEffect(() => { loadMaterialTypes(); }, []);
  useEffect(() => { if (materialTypes.length > 0) fetchDetail(); }, [materialTypes]);

  const loadMaterialTypes = async () => {
    try { const res = await api.get("/material-type"); setMaterialTypes(res.data); }
    catch { console.error("โหลดประเภทวัสดุไม่สำเร็จ"); }
  };

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/materials/admin/${id}`);
      const d = res.data;
      setFormData({
        mat_code: d.mat_code??"", mat_name: d.mat_name??"",
        mat_type_id: String(d.mat_type_id??""),
        unit_pack: d.unit_pack??"", qty_per_pack: d.qty_per_pack?.toString()??"",
        unit_sub: d.unit_sub??"", price_per_pack: d.price_per_pack?.toString()??"",
        min_qty: d.min_qty?.toString()??"", current_stock: d.maxStock??0,
        adjust_qty:"", adjust_mode:"add",
      });
      setIsHidden(d.is_active === false);
      if (d.image) setPreviewSrc(`${BASE_URL}${d.image}?ngrok-skip-browser-warning=true`);
      setLoading(false);
    } catch { showError("โหลดข้อมูลไม่สำเร็จ"); navigate("/admin/materials"); }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f); setPreviewSrc(URL.createObjectURL(f));
  };

  const previewStock = () => {
    const adj = Number(formData.adjust_qty)||0;
    return formData.adjust_mode === "set" ? adj : formData.current_stock + adj;
  };

  const handleToggle = async () => {
    setShowConfirm(false);
    try {
      setTogglingVisibility(true);
      await api.patch(`/materials/${id}/visibility`, { is_hidden: !isHidden });
      setIsHidden(p => !p);
    } catch (err) { showError(err.response?.data?.detail || "เปลี่ยนสถานะไม่สำเร็จ"); }
    finally { setTogglingVisibility(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/materials/${id}`, {
        mat_code: formData.mat_code, mat_name: formData.mat_name,
        mat_type_id: Number(formData.mat_type_id), unit_pack: formData.unit_pack,
        qty_per_pack: Number(formData.qty_per_pack), unit_sub: formData.unit_sub,
        price_per_pack: Number(formData.price_per_pack), min_qty: Number(formData.min_qty)||0,
      });
      if (formData.adjust_qty !== "") {
        await api.patch(`/admin/stock/${id}/stock`, { quantity:Number(formData.adjust_qty), mode:formData.adjust_mode });
      }
      if (imageFile) {
        const form = new FormData(); form.append("image", imageFile);
        await api.patch(`/materials/${id}/image`, form, { headers:{"Content-Type":"multipart/form-data"} });
      }
      showSuccess("บันทึกการแก้ไขสำเร็จ");
      navigate("/admin/materials");
    } catch (err) { showError(err.response?.data?.detail || "แก้ไขไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="editmat-root min-h-screen flex items-center justify-center" style={{ background:"#f5f7f5" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor:"#c8e6c9", borderTopColor:"#2e7d32" }}/>
        <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  return (
    <div className="editmat-root min-h-screen" style={{ background:"#f5f7f5" }}>

      {/* ══ TOPBAR ═══════════════════════════════════════════════════ */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition"
              style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}
              onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}>
              <FaArrowLeft size={13}/>
            </button>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
              <FaEdit size={15} color="#fff"/>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color:"#1a1a1a" }}>แก้ไขวัสดุสำนักงาน</h1>
              <p className="text-xs" style={{ color:"#9ca3af" }}>แก้ไขข้อมูลและจำนวนสต็อก</p>
            </div>
          </div>

          {/* Visibility toggle */}
          <button type="button" onClick={() => setShowConfirm(true)} disabled={togglingVisibility}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-60"
            style={isHidden
              ? { border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }
              : { border:"1.5px solid #fde68a", color:"#d97706", background:"#fffbeb" }
            }>
            {isHidden ? <><MdVisibility size={16}/> แสดงวัสดุนี้</> : <><MdVisibilityOff size={16}/> ซ่อนวัสดุนี้</>}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6 max-w-4xl mx-auto space-y-4">

          {/* Hidden alert */}
          {isHidden && (
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
              style={{ background:"#fffbeb", border:"1.5px solid #fde68a" }}>
              <MdVisibilityOff size={18} style={{ color:"#d97706" }}/>
              <div>
                <p className="text-sm font-bold" style={{ color:"#d97706" }}>วัสดุนี้ถูกซ่อนอยู่</p>
                <p className="text-xs mt-0.5" style={{ color:"#92400e" }}>ผู้ใช้งานทั่วไปจะไม่เห็นวัสดุรายการนี้</p>
              </div>
            </div>
          )}

          {/* ── รูปภาพ ── */}
          <div className="field-section">
            <p className="section-title">รูปภาพวัสดุ</p>
            <div
              onClick={() => fileInputRef.current.click()}
              className="w-full h-48 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden transition"
              style={{ border:"2px dashed #c8e6c9", background:"#f4faf4" }}
              onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
              onMouseLeave={e => e.currentTarget.style.background="#f4faf4"}>
              {previewSrc ? (
                <img src={previewSrc} alt="preview" className="h-full w-full object-contain"/>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FaBoxOpen size={36} style={{ color:"#a5d6a7" }}/>
                  <p className="text-sm font-semibold" style={{ color:"#2e7d32" }}>คลิกเพื่อเปลี่ยนรูปภาพ</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={handleImageChange}/>
            {imageFile && <p className="text-xs mt-2 ml-1" style={{ color:"#9ca3af" }}>📎 {imageFile.name}</p>}
          </div>

          {/* ── ข้อมูลหลัก ── */}
          <div className="field-section">
            <p className="section-title">ข้อมูลหลัก</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="field-label">รหัสวัสดุ</label>
                <input type="text" name="mat_code" value={formData.mat_code}
                  onChange={handleChange} className="field-input"/>
              </div>
              <div>
                <label className="field-label">ประเภทวัสดุ</label>
                <div className="relative">
                  <select name="mat_type_id" value={formData.mat_type_id}
                    onChange={handleChange} required className="field-input appearance-none cursor-pointer">
                    <option value="" disabled hidden>เลือกประเภท</option>
                    {materialTypes.map(t => <option key={t.mat_type_id} value={t.mat_type_id}>{t.mat_type_name}</option>)}
                  </select>
                  <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color:"#2e7d32" }}/>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="field-label">ชื่อวัสดุ</label>
                <input type="text" name="mat_name" value={formData.mat_name}
                  onChange={handleChange} className="field-input"/>
              </div>
            </div>
          </div>

          {/* ── หน่วยและราคา ── */}
          <div className="field-section">
            <p className="section-title">หน่วยและราคา</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name:"unit_pack",      label:"หน่วย",          placeholder:"เช่น รีม, กล่อง", type:"text" },
                { name:"qty_per_pack",   label:"หน่วยละ",         placeholder:"เช่น 500",        type:"number" },
                { name:"unit_sub",       label:"หน่วยนับ",        placeholder:"เช่น แผ่น, ชิ้น", type:"text" },
                { name:"price_per_pack", label:"ราคาหน่วยละ (฿)", placeholder:"0.00",             type:"number" },
                { name:"min_qty",        label:"จำนวนขั้นต่ำ",   placeholder:"เช่น 50",          type:"number" },
              ].map(f => (
                <div key={f.name}>
                  <label className="field-label">{f.label}</label>
                  <input type={f.type} name={f.name} placeholder={f.placeholder}
                    value={formData[f.name]} onChange={handleChange} className="field-input"/>
                </div>
              ))}
            </div>
          </div>

          {/* ── จัดการสต็อก ── */}
          <div className="field-section">
            <p className="section-title">จัดการสต็อก</p>

            {/* Current */}
            <div className="flex items-center gap-4 p-4 rounded-xl mb-4"
              style={{ background:"#f4faf4", border:"1px solid #c8e6c9" }}>
              <div>
                <p className="text-xs" style={{ color:"#9ca3af" }}>สต็อกปัจจุบัน</p>
                <p className="text-3xl font-extrabold" style={{ color:"#2e7d32" }}>
                  {formData.current_stock}
                  <span className="text-sm font-semibold ml-1" style={{ color:"#9ca3af" }}>{formData.unit_sub}</span>
                </p>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2 p-1.5 rounded-xl mb-3" style={{ background:"#f3f4f6" }}>
              {[
                { value:"add", label:"เพิ่ม / ลด จำนวน" },
                { value:"set", label:"ตั้งค่าใหม่" },
              ].map(m => (
                <button key={m.value} type="button"
                  onClick={() => setFormData(p => ({ ...p, adjust_mode:m.value, adjust_qty:"" }))}
                  className={`stock-tab flex-1 py-2 rounded-lg text-xs font-semibold ${formData.adjust_mode===m.value ? "active" : ""}`}>
                  {m.label}
                </button>
              ))}
            </div>

            <input type="number" name="adjust_qty" value={formData.adjust_qty}
              onChange={handleChange}
              placeholder={formData.adjust_mode === "add"
                ? "กรอกจำนวนที่ต้องการเพิ่ม (ลบ = ลดสต็อก)"
                : "กรอกจำนวนสต็อกใหม่"}
              className="field-input"/>

            {/* Preview */}
            {formData.adjust_qty !== "" && (
              <div className="flex items-center gap-2 mt-3 px-4 py-3 rounded-xl"
                style={{ background: previewStock() < 0 ? "#fef2f2" : "#e8f5e9" }}>
                <span className="text-xs" style={{ color:"#6b7280" }}>จำนวนหลังปรับ →</span>
                <span className="text-xl font-extrabold"
                  style={{ color: previewStock() < 0 ? "#dc2626" : "#2e7d32" }}>
                  {previewStock()} {formData.unit_sub}
                </span>
                {previewStock() < 0 && <span className="text-xs" style={{ color:"#dc2626" }}>⚠️ ต่ำกว่าศูนย์</span>}
              </div>
            )}
          </div>

          {/* ── Buttons ── */}
          <div className="flex items-center gap-3 pt-2 pb-8">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background:"#2e7d32" }}
              onMouseEnter={e => { if(!saving) e.currentTarget.style.background="#388e3c"; }}
              onMouseLeave={e => e.currentTarget.style.background="#2e7d32"}>
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="px-8 py-3 rounded-xl text-sm font-semibold transition"
              style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}
              onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}>
              ย้อนกลับ
            </button>
          </div>
        </div>
      </form>

      {/* ══ CONFIRM MODAL ════════════════════════════════════════════ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden modal-enter"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 py-4"
              style={{ background: isHidden ? "#e8f5e9" : "#fffbeb", borderBottom:"1px solid #e5e7eb" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: isHidden ? "#c8e6c9" : "#fde68a" }}>
                  {isHidden
                    ? <MdVisibility size={20} style={{ color:"#2e7d32" }}/>
                    : <MdVisibilityOff size={20} style={{ color:"#d97706" }}/>
                  }
                </div>
                <h3 className="font-bold text-sm" style={{ color:"#1a1a1a" }}>
                  {isHidden ? "แสดงวัสดุนี้?" : "ซ่อนวัสดุนี้?"}
                </h3>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm mb-5" style={{ color:"#6b7280" }}>
                {isHidden
                  ? "วัสดุนี้จะกลับมาปรากฏให้ผู้ใช้งานเห็นและสามารถเบิกได้ตามปกติ"
                  : "วัสดุนี้จะไม่แสดงให้ผู้ใช้งานเห็น เหมาะสำหรับวัสดุที่หมดหรือมีรายการใหม่แทนแล้ว"
                }
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
                  style={{ border:"1.5px solid #e5e7eb", color:"#374151", background:"#fff" }}>
                  ยกเลิก
                </button>
                <button onClick={handleToggle} disabled={togglingVisibility}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                  style={{ background: isHidden ? "#2e7d32" : "#d97706" }}>
                  {togglingVisibility ? "กำลังดำเนินการ..." : isHidden ? "ยืนยัน แสดง" : "ยืนยัน ซ่อน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}