import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaBoxOpen, FaTag, FaRuler, FaLayerGroup, FaMoneyBillWave, FaWarehouse } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../services/api";

const BASE_URL = import.meta.env.VITE_API_URL;

if (!document.head.querySelector("#matdetail-v2")) {
  const s = document.createElement("style");
  s.id = "matdetail-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .matdetail-root * { font-family: 'Sarabun', sans-serif; }
    .info-card { transition: box-shadow .2s; }
    .info-card:hover { box-shadow: 0 6px 20px rgba(46,125,50,.12) !important; }
  `;
  document.head.appendChild(s);
}

function SafeImage({ src, alt, className }) {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    let blobUrl = null;

    fetch(src, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then(res => res.blob())
      .then(blob => {
        if (!cancelled) {
          blobUrl = URL.createObjectURL(blob);
          setObjectUrl(blobUrl);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (!objectUrl) return null;
  return <img src={objectUrl} alt={alt} className={className} />;
}

function InfoCard({ icon, label, value, accent }) {
  return (
    <div className="info-card bg-white rounded-2xl p-5 flex items-center gap-4"
      style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: accent || "#e8f5e9" }}>
        <span style={{ color:"#2e7d32" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color:"#a5d6a7" }}>{label}</p>
        <p className="font-bold text-base leading-snug truncate" style={{ color:"#1a1a1a" }}>{value || "–"}</p>
      </div>
    </div>
  );
}

export default function MaterialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get("admin") === "true";
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState(null);

  useEffect(() => {
    setLoading(true);
    setMaterial(null);
    const endpoint = isAdmin ? `/materials/admin/${id}` : `/materials/${id}`;
    api.get(endpoint)
      .then(res => setMaterial(res.data))
      .catch(err => { console.error(err); setMaterial(null); })
      .finally(() => setLoading(false));
  }, [id, isAdmin]);

  if (loading) return (
    <div className="matdetail-root min-h-screen flex items-center justify-center" style={{ background:"#f5f7f5" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor:"#c8e6c9", borderTopColor:"#2e7d32" }}/>
        <p className="text-sm" style={{ color:"#6b7280" }}>กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  if (!material) return (
    <div className="matdetail-root min-h-screen flex flex-col items-center justify-center gap-4" style={{ background:"#f5f7f5" }}>
      <FaBoxOpen size={48} style={{ color:"#c8e6c9" }}/>
      <p className="font-bold" style={{ color:"#374151" }}>ไม่พบข้อมูลพัสดุ</p>
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background:"#2e7d32" }}>
        <FaArrowLeft size={12}/> ย้อนกลับ
      </button>
    </div>
  );

  const inStock = material.balance_qty > 0;
  const imageSrc = material.image ? `${BASE_URL}${material.image}` : null;

  return (
    <div className="matdetail-root min-h-screen" style={{ background:"#f5f7f5" }}>

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
            <FaBoxOpen size={16} color="#fff"/>
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color:"#1a1a1a" }}>รายละเอียดวัสดุสำนักงาน</h1>
            <p className="text-xs" style={{ color:"#9ca3af" }}>{material.mat_code}</p>
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════ */}
      <div className="px-6 py-6 max-w-4xl mx-auto space-y-5">

        {/* ── Hero card ── */}
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ background:"#2e7d32", height:5 }}/>

          <div className="p-6 flex items-center gap-6 flex-wrap">

            <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background:"#e8f5e9", border:"1.5px solid #c8e6c9" }}>
              {imageSrc ? (
                <SafeImage src={imageSrc} alt={material.mat_name} className="w-full h-full object-cover"/>
              ) : (
                <FaBoxOpen size={40} style={{ color:"#a5d6a7" }}/>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background:"#e8f5e9", color:"#2e7d32" }}>
                  {material.mat_type_name || material.mat_type || "–"}
                </span>
                {/* แสดง badge ซ่อนอยู่ถ้า is_active เป็น false */}
                {!material.is_active ? (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background:"#fff7ed", color:"#ea580c" }}>
                    ซ่อนอยู่
                  </span>
                ) : inStock ? (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background:"#e8f5e9", color:"#2e7d32" }}>
                    มีสินค้า
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background:"#fef2f2", color:"#dc2626" }}>
                    หมดสต็อก
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold leading-tight mb-1" style={{ color:"#1a1a1a" }}>
                {material.mat_name}
              </h2>
              <p className="text-sm" style={{ color:"#9ca3af" }}>{material.mat_code}</p>
            </div>

            <div className="flex-shrink-0 text-center px-6 py-4 rounded-2xl"
              style={{ background: inStock ? "#e8f5e9" : "#fef2f2", border:`1.5px solid ${inStock ? "#c8e6c9" : "#fecaca"}` }}>
              <p className="text-4xl font-extrabold" style={{ color: inStock ? "#2e7d32" : "#dc2626" }}>
                {material.balance_qty}
              </p>
              <p className="text-xs font-semibold mt-1" style={{ color: inStock ? "#2e7d32" : "#dc2626" }}>
                คงเหลือ ({material.unit_sub || "ชิ้น"})
              </p>
            </div>
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard icon={<FaTag size={15}/>}           label="รหัสวัสดุ"   value={material.mat_code}/>
          <InfoCard icon={<FaLayerGroup size={15}/>}    label="ประเภทวัสดุ" value={material.mat_type_name || material.mat_type}/>
          <InfoCard icon={<FaRuler size={15}/>}         label="หน่วย"       value={material.unit_pack}/>
          <InfoCard icon={<FaRuler size={15}/>}         label="หน่วยละ"     value={`${material.qty_per_pack} ${material.unit_sub || ""}`}/>
          <InfoCard icon={<FaWarehouse size={15}/>}     label="หน่วยนับ"    value={material.unit_sub}/>
          <InfoCard
            icon={<FaMoneyBillWave size={15}/>}
            label="ราคาหน่วยละ"
            value={`${Number(material.price_per_pack || 0).toLocaleString("th-TH")} บาท`}
            accent="#fef3c7"
          />
        </div>

        {/* ── Back button ── */}
        <div className="flex justify-center pb-8">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition"
            style={{ background:"#2e7d32" }}
            onMouseEnter={e => e.currentTarget.style.background="#388e3c"}
            onMouseLeave={e => e.currentTarget.style.background="#2e7d32"}>
            <FaArrowLeft size={12}/> กลับหน้าหลัก
          </button>
        </div>
      </div>
    </div>
  );
}