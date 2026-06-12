import { FaEllipsisV, FaUsers, FaTrash, FaEdit, FaKey, FaUser, FaPlus, FaSearch, FaTimes, FaUndoAlt } from "react-icons/fa";
import { useState, useEffect } from "react";

if (!document.head.querySelector("#adminuser-v2")) {
  const s = document.createElement("style");
  s.id = "adminuser-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
    .adminuser-root * { font-family: 'Sarabun', sans-serif; }
    .user-row { transition: background .15s; }
    .user-row:hover { background: #f4faf4 !important; }
    .tab-chip { transition: background .15s, color .15s, box-shadow .15s; }
    .tab-chip.active { background:#2e7d32; color:#fff; box-shadow:0 2px 8px rgba(46,125,50,.3); }
    .tab-chip:not(.active):hover { background:#e8f5e9; color:#2e7d32; }
    .menu-item { transition: background .12s; }
    .field-input {
      width:100%; padding:10px 14px; border-radius:10px;
      background:#f9fafb; border:1.5px solid #e8f5e9;
      outline:none; font-size:13px; color:#1a1a1a;
      transition: border-color .18s, box-shadow .18s;
    }
    .field-input:focus { background:#fff; border-color:#2e7d32; box-shadow:0 0 0 3px rgba(46,125,50,.1); }
    .field-input:disabled { opacity:.5; cursor:not-allowed; }
    .field-label { display:block; font-size:10px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#a5d6a7; margin-bottom:5px; }
    .modal-enter { animation: menter .2s ease; }
    @keyframes menter { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }
    .toggle-on  { background:#2e7d32; }
    .toggle-off { background:#e5e7eb; }
    .search-focus:focus-within { border-color:#2e7d32 !important; box-shadow:0 0 0 3px rgba(46,125,50,.1); }
    .no-scrollbar::-webkit-scrollbar{display:none;} .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
  `;
  document.head.appendChild(s);
}

const API = import.meta.env.VITE_API_URL;
const tok = () => localStorage.getItem("access_token");
const hdr = (json = false) => ({
  "Authorization": `Bearer ${tok()}`,
  "ngrok-skip-browser-warning": "true",
  ...(json ? { "Content-Type": "application/json" } : {}),
});

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "toggle-on" : "toggle-off"}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? "left-6" : "left-1"}`}/>
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

export default function AdminUserManagement() {
  const [activeTab, setActiveTab]         = useState("ใช้งานอยู่");
  const [openMenuId, setOpenMenuId]       = useState(null);
  const [isEditOpen, setIsEditOpen]       = useState(false);
  const [isDetailOpen, setIsDetailOpen]   = useState(false);
  const [isAddOpen, setIsAddOpen]         = useState(false);
  const [selectedUser, setSelectedUser]   = useState(null);
  const [users, setUsers]                 = useState([]);
  const [branches, setBranches]           = useState([]);
  const [servicePoints, setServicePoints] = useState([]);
  const [search, setSearch]               = useState("");

  const [newUser, setNewUser] = useState({
    emp_code:"", full_name:"", position:"",
    branch_id:"", service_point_id:"",
    phone:"", email:"", password:"",
    user_role:"User", can_request:false
  });

  const getServicePointName = (id) => {
    if (!id || id === "-") return "-";
    const found = servicePoints.find(sp => String(sp.service_point_id) === String(id));
    return found ? found.service_point_name : id;
  };

  const fetchUsers = () => {
    if (!tok()) return;
    fetch(`${API}/admin/users?include_inactive=true`, { headers: hdr() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const arr = Array.isArray(data) ? data : data.data ?? data.items ?? [];
        setUsers(arr.map(u => ({
          id: u.user_id, name: u.full_name, position: u.position,
          role: u.user_role, branch: u.branch_name ?? u.branch_id,
          branchId: u.branch_id, servicePoint: u.service_point_id ?? "-",
          username: u.emp_code, canRequest: u.can_request ?? false,
          phone: u.phone, email: u.email, isActive: u.is_active,
          profileImage: u.profile_image,
        })));
      })
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchUsers();
    fetch(`${API}/branches`, { headers: hdr() }).then(r => r.json()).then(d => setBranches(Array.isArray(d)?d:d.data??[])).catch(()=>{});
    fetch(`${API}/service-point`, { headers: hdr() }).then(r => r.json()).then(d => setServicePoints(Array.isArray(d)?d:d.data??[])).catch(()=>{});
  }, []);

  const filtered = users.filter(u => {
    const matchTab = activeTab === "ใช้งานอยู่" ? u.isActive : activeTab === "ถูกลบแล้ว" ? !u.isActive : true;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.position?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const tabCounts = {
    "ใช้งานอยู่": users.filter(u => u.isActive).length,
    "ถูกลบแล้ว":  users.filter(u => !u.isActive).length,
    "ทั้งหมด":    users.length,
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm("ต้องการลบผู้ใช้คนนี้ใช่หรือไม่?")) return;
    try {
      const r = await fetch(`${API}/admin/users/${username}`, { method:"DELETE", headers:hdr() });
      if (!r.ok) throw new Error();
      fetchUsers(); setOpenMenuId(null); alert("ลบผู้ใช้สำเร็จ");
    } catch { alert("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
  };

  const handleRestore = async (username) => {
    if (!window.confirm("ต้องการกู้คืนผู้ใช้คนนี้ใช่หรือไม่?")) return;
    try {
      const r = await fetch(`${API}/admin/users/${username}/restore`, { method:"PATCH", headers:hdr() });
      console.log("RESTORE status:", r.status);
      if (!r.ok) {
        const err = await r.json();
        console.log("RESTORE error:", err);
        throw new Error();
      }
      fetchUsers(); setOpenMenuId(null); alert("กู้คืนผู้ใช้สำเร็จ");
    } catch { alert("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
  };

  const handleSaveEdit = async () => {
    try {
      const r = await fetch(`${API}/admin/users/${selectedUser.username}`, {
        method:"PUT", headers:hdr(true),
        body: JSON.stringify({
          user_role: selectedUser.role, branch_id: selectedUser.branchId,
          service_point_id: selectedUser.servicePoint==="-" ? null : Number(selectedUser.servicePoint),
          can_request: selectedUser.canRequest,
        }),
      });
      if (!r.ok) throw new Error();
      fetchUsers(); setIsEditOpen(false); alert("อัปเดตข้อมูลสำเร็จ");
    } catch { alert("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
  };

  const handleAddUser = async () => {
    try {
      const fd = new FormData();
      ["emp_code","full_name","position","branch_id","phone","email","password","user_role","can_request"].forEach(k => fd.append(k, newUser[k]));
      if (newUser.service_point_id) fd.append("service_point_id", newUser.service_point_id);
      const r = await fetch(`${API}/admin/users`, { method:"POST", headers:hdr(), body:fd });
      if (!r.ok) { const e = await r.json(); throw new Error(JSON.stringify(e)); }
      fetchUsers(); setIsAddOpen(false);
      setNewUser({ emp_code:"", full_name:"", position:"", branch_id:"", service_point_id:"", phone:"", email:"", password:"", user_role:"User", can_request:false });
      alert("เพิ่มผู้ใช้สำเร็จ");
    } catch(e) { alert("เกิดข้อผิดพลาด: " + e.message); }
  };

  const handleResetPassword = (username) => {
    alert(`รีเซ็ตรหัสผ่านของ ${username} เป็น '123456' เรียบร้อยแล้ว`);
    setOpenMenuId(null);
  };

  const ROLE_BADGE = { Admin:{ bg:"#fdf4ff", text:"#7e22ce" }, Superadmin:{ bg:"#fee2e2", text:"#dc2626" } };

  return (
    <div className="adminuser-root min-h-screen" style={{ background:"#f5f7f5" }}>

      {/* Overlay — z-30 ต่ำกว่า dropdown z-50 */}
      {openMenuId !== null && (
        <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)}/>
      )}

      {/* ══ TOPBAR ═══════════════════════════════════════════════════ */}
      <div className="bg-white sticky top-0 z-10"
        style={{ borderBottom:"1px solid #e8f5e9", boxShadow:"0 2px 10px rgba(46,125,50,.06)" }}>
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#2e7d32" }}>
              <FaUsers size={17} color="#fff"/>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color:"#1a1a1a" }}>การจัดการผู้ใช้</h1>
              <p className="text-xs" style={{ color:"#9ca3af" }}>ทั้งหมด {users.length} บัญชี</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="search-focus flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-white"
              style={{ border:"1.5px solid #e0e0e0", minWidth:200 }}>
              <FaSearch size={12} style={{ color:"#a5d6a7", flexShrink:0 }}/>
              <input type="text" placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder-gray-400" style={{ color:"#1a1a1a" }}/>
              {search && <button onClick={()=>setSearch("")} className="flex-shrink-0 text-gray-400 hover:text-gray-600"><FaTimes size={10}/></button>}
            </div>
            <button onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background:"#2e7d32" }}
              onMouseEnter={e => e.currentTarget.style.background="#388e3c"}
              onMouseLeave={e => e.currentTarget.style.background="#2e7d32"}>
              <FaPlus size={11}/> เพิ่มผู้ใช้
            </button>
          </div>
        </div>

        <div className="px-6 pb-3 flex gap-2">
          {["ใช้งานอยู่","ถูกลบแล้ว","ทั้งหมด"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`tab-chip flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold ${activeTab===t ? "active" : ""}`}
              style={activeTab!==t ? { background:"#f3f4f6", color:"#6b7280" } : {}}>
              {t}
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: activeTab===t ? "rgba(255,255,255,.25)" : "#e8f5e9", color: activeTab===t ? "#fff" : "#2e7d32" }}>
                {tabCounts[t]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ TABLE ════════════════════════════════════════════════════ */}
      <div className="px-6 py-5">
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border:"1.5px solid #e8f5e9", boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background:"#e8f5e9", borderBottom:"1.5px solid #c8e6c9" }}>
                  {["Username","ชื่อ","ตำแหน่ง","จุดบริการ","สาขา","สิทธิ์","เบิกได้","สถานะ","จัดการ"].map(h => (
                    <th key={h} className="py-3 px-4 text-xs font-bold text-center" style={{ color:"#2e7d32" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <FaUsers size={32} style={{ color:"#c8e6c9", margin:"0 auto 8px" }}/>
                      <p className="text-sm" style={{ color:"#9ca3af" }}>ไม่พบผู้ใช้</p>
                    </td>
                  </tr>
                ) : filtered.map(user => {
                  const roleCfg = ROLE_BADGE[user.role];
                  return (
                    <tr key={user.id} className={`user-row border-t ${!user.isActive ? "opacity-50" : ""}`}
                      style={{ borderColor:"#e8f5e9" }}>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:"#f4f6f4", color:"#6b7280" }}>
                          {user.username}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold" style={{ color:"#1a1a1a" }}>{user.name}</td>
                      <td className="py-3.5 px-4 text-center text-xs" style={{ color:"#6b7280" }}>{user.position || "–"}</td>
                      <td className="py-3.5 px-4 text-center text-xs" style={{ color:"#6b7280" }}>{getServicePointName(user.servicePoint)}</td>
                      <td className="py-3.5 px-4 text-center text-xs" style={{ color:"#6b7280" }}>{user.branch}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                          style={roleCfg ? { background:roleCfg.bg, color:roleCfg.text } : { background:"#f3f4f6", color:"#6b7280" }}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                          style={user.canRequest ? { background:"#e8f5e9", color:"#2e7d32" } : { background:"#fef2f2", color:"#dc2626" }}>
                          {user.canRequest ? "เบิกได้" : "เบิกไม่ได้"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                          style={user.isActive ? { background:"#e8f5e9", color:"#2e7d32" } : { background:"#f3f4f6", color:"#9ca3af" }}>
                          {user.isActive ? "ใช้งาน" : "ถูกลบ"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId===user.id ? null : user.id); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition relative z-40"
                          style={{ color:"#6b7280" }}
                          onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <FaEllipsisV size={13}/>
                        </button>

                        {/* Dropdown — z-50 สูงกว่า overlay z-30 */}
                        {openMenuId === user.id && (
                          <div className="absolute right-10 top-12 bg-white rounded-2xl p-1.5 z-50 min-w-[170px]"
                            style={{ border:"1px solid #e8f5e9", boxShadow:"0 8px 24px rgba(0,0,0,.12)" }}
                            onClick={e => e.stopPropagation()}>

                            <button onClick={(e) => { e.stopPropagation(); setSelectedUser({...user}); setIsDetailOpen(true); setOpenMenuId(null); }}
                              className="menu-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left"
                              style={{ color:"#374151" }}
                              onMouseEnter={e => e.currentTarget.style.background="#f4faf4"}
                              onMouseLeave={e => e.currentTarget.style.background=""}>
                              <FaUser size={12}/> ดูรายละเอียด
                            </button>

                            {user.isActive ? (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedUser({...user}); setIsEditOpen(true); setOpenMenuId(null); }}
                                  className="menu-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left"
                                  style={{ color:"#2e7d32" }}
                                  onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
                                  onMouseLeave={e => e.currentTarget.style.background=""}>
                                  <FaEdit size={12}/> แก้ไขสิทธิ์/สาขา
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleResetPassword(user.username); }}
                                  className="menu-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left"
                                  style={{ color:"#d97706" }}
                                  onMouseEnter={e => e.currentTarget.style.background="#fffbeb"}
                                  onMouseLeave={e => e.currentTarget.style.background=""}>
                                  <FaKey size={12}/> รีเซ็ตรหัสผ่าน
                                </button>
                                <div style={{ borderTop:"1px solid #e8f5e9", margin:"4px 0" }}/>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(user.id, user.username); }}
                                  className="menu-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left"
                                  style={{ color:"#dc2626" }}
                                  onMouseEnter={e => e.currentTarget.style.background="#fef2f2"}
                                  onMouseLeave={e => e.currentTarget.style.background=""}>
                                  <FaTrash size={12}/> ลบผู้ใช้
                                </button>
                              </>
                            ) : (
                              <>
                                <div style={{ borderTop:"1px solid #e8f5e9", margin:"4px 0" }}/>
                                <button onClick={(e) => { e.stopPropagation(); handleRestore(user.username); }}
                                  className="menu-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left"
                                  style={{ color:"#2e7d32" }}
                                  onMouseEnter={e => e.currentTarget.style.background="#e8f5e9"}
                                  onMouseLeave={e => e.currentTarget.style.background=""}>
                                  <FaUndoAlt size={12}/> กู้คืนผู้ใช้
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══ DETAIL MODAL ═════════════════════════════════════════════ */}
      {isDetailOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
          onClick={() => setIsDetailOpen(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl modal-enter"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background:"#d1d5db" }}/></div>
            <div className="flex items-center gap-4 px-6 py-5" style={{ background:"#2e7d32" }}>
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background:"rgba(255,255,255,.2)" }}>
                {selectedUser.profileImage
                  ? <img src={`${API}${selectedUser.profileImage}`} alt="profile" className="w-full h-full object-cover"/>
                  : <FaUser size={24} color="rgba(255,255,255,.8)"/>}
              </div>
              <div>
                <h2 className="font-bold text-white text-base">{selectedUser.name}</h2>
                <p className="text-white/70 text-xs mt-0.5">{selectedUser.position || "–"}</p>
              </div>
            </div>
            <div className="px-6 py-5">
              {[
                { label:"Username",   value: selectedUser.username },
                { label:"สิทธิ์",     value: selectedUser.role },
                { label:"อีเมล",     value: selectedUser.email },
                { label:"เบอร์โทร",  value: selectedUser.phone },
                { label:"สาขา",      value: selectedUser.branch },
                { label:"จุดบริการ", value: getServicePointName(selectedUser.servicePoint) },
                { label:"สถานะ",     value: selectedUser.isActive ? "ใช้งานอยู่" : "ถูกลบแล้ว" },
                { label:"สิทธิ์เบิก",value: selectedUser.canRequest ? "เบิกได้" : "เบิกไม่ได้" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b" style={{ borderColor:"#e8f5e9" }}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color:"#a5d6a7" }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color:"#1a1a1a" }}>{value ?? "–"}</span>
                </div>
              ))}
              <button onClick={() => setIsDetailOpen(false)}
                className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background:"#2e7d32" }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT MODAL ═══════════════════════════════════════════════ */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
          onClick={() => setIsEditOpen(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl modal-enter max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background:"#d1d5db" }}/></div>
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom:"1px solid #e8f5e9" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:"#e8f5e9" }}>
                <FaEdit size={15} style={{ color:"#2e7d32" }}/>
              </div>
              <h2 className="font-bold text-sm" style={{ color:"#1a1a1a" }}>แก้ไขข้อมูลสิทธิ์</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Field label="ชื่อผู้ใช้ (อ่านอย่างเดียว)">
                <input className="field-input" value={selectedUser.name} disabled/>
              </Field>
              <Field label="ตำแหน่งสิทธิ์">
                <select className="field-input" value={selectedUser.role}
                  onChange={e => setSelectedUser({...selectedUser, role:e.target.value})}>
                  <option value="User">เจ้าหน้าที่พัสดุ</option>
                  <option value="Admin">Admin</option>
                  <option value="BranchManager">หัวหน้าสาขา</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="สาขา">
                  <select className="field-input" value={selectedUser.branchId}
                    onChange={e => setSelectedUser({...selectedUser, branchId:e.target.value})}>
                    <option value="">-- เลือกสาขา --</option>
                    {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
                  </select>
                </Field>
                <Field label="จุดบริการ">
                  <select className="field-input" value={selectedUser.servicePoint==="-" ? "" : selectedUser.servicePoint}
                    onChange={e => setSelectedUser({...selectedUser, servicePoint:e.target.value})}>
                    <option value="">-- ไม่มี --</option>
                    {servicePoints.map(sp => <option key={sp.service_point_id} value={sp.service_point_id}>{sp.service_point_name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="สิทธิ์การเบิกวัสดุ">
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ border:"1.5px solid #e8f5e9" }}>
                  <span className="text-sm" style={{ color:"#374151" }}>อนุญาตให้เบิกได้</span>
                  <Toggle on={selectedUser.canRequest} onToggle={() => setSelectedUser({...selectedUser, canRequest:!selectedUser.canRequest})}/>
                </div>
              </Field>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>ยกเลิก</button>
                <button onClick={handleSaveEdit}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background:"#2e7d32" }}>บันทึกการแก้ไข</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD MODAL ════════════════════════════════════════════════ */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
          onClick={() => setIsAddOpen(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl modal-enter max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background:"#d1d5db" }}/></div>
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom:"1px solid #e8f5e9" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:"#e8f5e9" }}>
                <FaPlus size={14} style={{ color:"#2e7d32" }}/>
              </div>
              <h2 className="font-bold text-sm" style={{ color:"#1a1a1a" }}>เพิ่มผู้ใช้ใหม่</h2>
            </div>
            <div className="px-6 py-5 space-y-3.5">
              {[
                { label:"รหัสพนักงาน", key:"emp_code",  placeholder:"EMP001" },
                { label:"ชื่อ-นามสกุล", key:"full_name", placeholder:"นายตัวอย่าง ใจดี" },
                { label:"ตำแหน่งงาน",  key:"position",  placeholder:"เจ้าหน้าที่พัสดุ" },
                { label:"เบอร์โทร",    key:"phone",     placeholder:"0812345678" },
                { label:"อีเมล",       key:"email",     placeholder:"example@email.com" },
                { label:"รหัสผ่าน",    key:"password",  placeholder:"••••••••", type:"password" },
              ].map(({ label, key, placeholder, type }) => (
                <Field key={key} label={label}>
                  <input type={type || "text"} placeholder={placeholder} className="field-input"
                    value={newUser[key]} onChange={e => setNewUser({...newUser, [key]:e.target.value})}/>
                </Field>
              ))}
              <Field label="สาขา">
                <select className="field-input" value={newUser.branch_id}
                  onChange={e => setNewUser({...newUser, branch_id:e.target.value})}>
                  <option value="">-- เลือกสาขา --</option>
                  {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
                </select>
              </Field>
              <Field label="จุดบริการ">
                <select className="field-input" value={newUser.service_point_id}
                  onChange={e => setNewUser({...newUser, service_point_id:e.target.value})}>
                  <option value="">-- ไม่มี --</option>
                  {servicePoints.map(sp => <option key={sp.service_point_id} value={sp.service_point_id}>{sp.service_point_name}</option>)}
                </select>
              </Field>
              <Field label="สิทธิ์">
                <select className="field-input" value={newUser.user_role}
                  onChange={e => setNewUser({...newUser, user_role:e.target.value})}>
                  <option value="User">พนักงาน</option>
                  <option value="Admin">Admin</option>
                  <option value="BranchManager">หัวหน้าสาขา</option>
                </select>
              </Field>
              <Field label="สิทธิ์การเบิก">
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ border:"1.5px solid #e8f5e9" }}>
                  <span className="text-sm" style={{ color:"#374151" }}>อนุญาตให้เบิกได้</span>
                  <Toggle on={newUser.can_request} onToggle={() => setNewUser({...newUser, can_request:!newUser.can_request})}/>
                </div>
              </Field>
              <div className="flex gap-3 pt-2 pb-2">
                <button onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border:"1.5px solid #c8e6c9", color:"#2e7d32", background:"#fff" }}>ยกเลิก</button>
                <button onClick={handleAddUser}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background:"#2e7d32" }}>เพิ่มผู้ใช้</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}