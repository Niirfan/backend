import { useState, useEffect, useRef } from "react";
import { FaImage, FaPlus, FaArrowLeft, FaBoxOpen } from "react-icons/fa";
import { HiChevronDown } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

// ── Global styles ──────────────────────────────────────────────────
if (!document.head.querySelector("#addmat-v2")) {
  const s = document.createElement("style");
  s.id = "addmat-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .addmat-root * { font-family: 'Sarabun', sans-serif; }
    .field-input {
      width:100%; padding:10px 16px; border-radius:12px;
      background:#f9fafb; border:1.5px solid #e8f5e9;
      outline:none; font-size:14px; color:#1a1a1a;
      transition: border-color .18s, box-shadow .18s, background .18s;
    }
    .field-input:focus {
      background:#fff; border-color:#2e7d32;
      box-shadow:0 0 0 3px rgba(46,125,50,.1);
    }
    .field-input::placeholder { color:#c8e6c9; }
    .field-label { display:block; font-size:13px; font-weight:700; color:#374151; margin-bottom:6px; }
    .field-section { background:#fff; border-radius:20px; padding:20px; border:1.5px solid #e8f5e9; box-shadow:0 2px 8px rgba(0,0,0,.04); }
    .section-title { font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#a5d6a7; margin-bottom:16px; }
  `;
  document.head.appendChild(s);
}

export default function AddMaterial() {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const fileInputRef = useRef();
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [savingType, setSavingType] = useState(false);

  const [formData, setFormData] = useState({
    mat_code:"", mat_name:"", mat_type_id:"",
    unit_pack:"", qty_per_pack:"", unit_sub:"",
    price_per_pack:"", stock_qty:"", min_qty:""
  });

  useEffect(() => { loadMaterialTypes(); }, []);

  const loadMaterialTypes = async () => {
    try { const res = await api.get("/material-type"); setMaterialTypes(res.data); }
    catch { showError("โหลดประเภทวัสดุไม่สำเร็จ"); }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f); setPreviewSrc(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mat_code || !formData.mat_name || !formData.mat_type_id) {
      showWarning("กรุณากรอกข้อมูลให้ครบ"); return;
    }
    try {
      setLoading(true);
      const form = new FormData();
      Object.entries({
        mat_code: formData.mat_code.trim(), mat_name: formData.mat_name.trim(),
        mat_type_id: Number(formData.mat_type_id), unit_pack: formData.unit_pack.trim(),
        qty_per_pack: Number(formData.qty_per_pack)||0, unit_sub: formData.unit_sub.trim(),
        price_per_pack: Number(formData.price_per_pack)||0,
        stock_qty: Number(formData.stock_qty)||0, min_qty: Number(formData.min_qty)||0,
      }).forEach(([k,v]) => form.append(k, v));
      if (imageFile) form.append("image", imageFile);
      await api.post("/materials/", form, { headers:{"Content-Type":"multipart/form-data"} });
      showSuccess("เพิ่มวัสดุสำเร็จ");
      navigate("/admin/materials", { replace:true });
    } catch (err) {
      showError(err.response?.data?.detail || "เพิ่มข้อมูลไม่สำเร็จ");
    } finally { setLoading(false); }
  };
  
  const handleAddType = async () => {
  if (!newTypeName.trim()) { showWarning("กรุณากรอกชื่อประเภท"); return; }
  try {
    setSavingType(true);
    const res = await api.post("/material-type", { mat_type_name: newTypeName.trim() });
    await loadMaterialTypes(); // โหลด dropdown ใหม่
    setFormData(p => ({ ...p, mat_type_id: String(res.data.mat_type_id) })); // เลือกประเภทใหม่อัตโนมัติ
    setNewTypeName("");
    setShowNewType(false);
  } catch (err) {
    showError(err.response?.data?.detail || "เพิ่มประเภทไม่สำเร็จ");
  } finally {
    setSavingType(false);
  }
};

  return (
    <div className="addmat-root min-h-screen" style={{ background:"#f5f7f5" }}>

      {/* ══ TOPBAR ═══════════════════════════════════════════════════ */}
      <div className="bg-white sticky top-0 z-20"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition"
            style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}
            onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
            onMouseLeave={e => e.currentTarget.style.background="#fff"}>
            <FaArrowLeft size={13}/>
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
            <FaPlus size={15} color="#fff"/>
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color:"#1a1a1a" }}>เพิ่มรายการวัสดุ</h1>
            <p className="text-xs" style={{ color:"#9ca3af" }}>กรอกข้อมูลวัสดุสำนักงานใหม่</p>
          </div>
        </div>
      </div>

      {/* ══ FORM ═════════════════════════════════════════════════════ */}
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6 max-w-4xl mx-auto space-y-4">

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
                  <p className="text-sm font-semibold" style={{ color:"#2e7d32" }}>คลิกเพื่อเลือกรูปภาพ</p>
                  <p className="text-xs" style={{ color:"#9ca3af" }}>รองรับ JPG, PNG, WEBP</p>
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
                <label className="field-label">รหัสวัสดุ <span style={{ color:"#dc2626" }}>*</span></label>
                <input type="text" name="mat_code" placeholder="เช่น MAT-001"
                  value={formData.mat_code} onChange={handleChange} className="field-input" required/>
              </div>
              <div>
  <label className="field-label">ประเภทวัสดุ <span style={{ color:"#dc2626" }}>*</span></label>

  {!showNewType ? (
    <>
      <div className="relative">
        <select name="mat_type_id" value={formData.mat_type_id}
          onChange={handleChange} required
          className="field-input appearance-none cursor-pointer">
          <option value="" disabled hidden>เลือกประเภท</option>
          {materialTypes.map(t => (
            <option key={t.mat_type_id} value={t.mat_type_id}>{t.mat_type_name}</option>
          ))}
        </select>
        <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          size={18} style={{ color:"#2e7d32" }}/>
      </div>

      {/* ปุ่มเพิ่มประเภทใหม่ */}
      <button type="button" onClick={() => setShowNewType(true)}
        className="mt-2 flex items-center gap-1.5 text-xs font-semibold transition"
        style={{ color:"#2e7d32" }}
        onMouseEnter={e => e.currentTarget.style.opacity="0.7"}
        onMouseLeave={e => e.currentTarget.style.opacity="1"}>
        <FaPlus size={9}/> เพิ่มประเภทใหม่
      </button>
    </>
  ) : (
    <div className="rounded-xl p-3 space-y-2" style={{ background:"#f4faf4", border:"1.5px solid #c8e6c9" }}>
      <p className="text-xs font-bold" style={{ color:"#2e7d32" }}>ชื่อประเภทใหม่</p>
      <input
        type="text"
        value={newTypeName}
        onChange={e => setNewTypeName(e.target.value)}
        placeholder="เช่น อุปกรณ์ไฟฟ้า"
        className="field-input"
        autoFocus
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddType(); } }}
      />
      <div className="flex gap-2">
        <button type="button" onClick={handleAddType} disabled={savingType}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-50"
          style={{ background:"#2e7d32" }}
          onMouseEnter={e => { if(!savingType) e.currentTarget.style.background="#388e3c"; }}
          onMouseLeave={e => e.currentTarget.style.background="#2e7d32"}>
          {savingType ? "กำลังบันทึก..." : "✓ บันทึกประเภท"}
        </button>
        <button type="button" onClick={() => { setShowNewType(false); setNewTypeName(""); }}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition"
          style={{ border:"1.5px solid #c8e6c9", color:"#6b7280", background:"#fff" }}
          onMouseEnter={e => e.currentTarget.style.background="#f3f4f6"}
          onMouseLeave={e => e.currentTarget.style.background="#fff"}>
          ยกเลิก
        </button>
      </div>
    </div>
  )}
</div>
              <div className="md:col-span-2">
                <label className="field-label">ชื่อวัสดุ <span style={{ color:"#dc2626" }}>*</span></label>
                <input type="text" name="mat_name" placeholder="กรอกชื่อวัสดุ"
                  value={formData.mat_name} onChange={handleChange} className="field-input" required/>
              </div>
            </div>
          </div>

          {/* ── หน่วยและราคา ── */}
          <div className="field-section">
            <p className="section-title">หน่วยและราคา</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="field-label">หน่วย</label>
                <input type="text" name="unit_pack" placeholder="เช่น รีม, กล่อง"
                  value={formData.unit_pack} onChange={handleChange} className="field-input"/>
              </div>
              <div>
                <label className="field-label">หน่วยละ (จำนวน)</label>
                <input type="number" name="qty_per_pack" placeholder="เช่น 500"
                  value={formData.qty_per_pack} onChange={handleChange} className="field-input"/>
              </div>
              <div>
                <label className="field-label">หน่วยนับ</label>
                <input type="text" name="unit_sub" placeholder="เช่น แผ่น, ชิ้น"
                  value={formData.unit_sub} onChange={handleChange} className="field-input"/>
              </div>
              <div>
                <label className="field-label">ราคาหน่วยละ (บาท)</label>
                <input type="number" name="price_per_pack" placeholder="0.00"
                  value={formData.price_per_pack} onChange={handleChange} className="field-input"/>
              </div>
              <div>
                <label className="field-label">จำนวนนำเข้าเริ่มต้น</label>
                <input type="number" name="stock_qty" placeholder="0"
                  value={formData.stock_qty} onChange={handleChange} className="field-input"/>
              </div>
              <div>
                <label className="field-label">จำนวนขั้นต่ำ (แจ้งเตือน)</label>
                <input type="number" name="min_qty" placeholder="เช่น 50"
                  value={formData.min_qty} onChange={handleChange} className="field-input"/>
              </div>
            </div>
          </div>

          {/* ── Buttons ── */}
          <div className="flex items-center gap-3 pt-2 pb-8">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background:"#2e7d32" }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.background="#388e3c"; }}
              onMouseLeave={e => e.currentTarget.style.background="#2e7d32"}>
              <FaPlus size={12}/>
              {loading ? "กำลังบันทึก..." : "บันทึกวัสดุ"}
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
    </div>
  );
}