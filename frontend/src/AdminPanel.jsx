// src/AdminPanel.jsx
// Connected to your Django backend via api.js
// Uses your exact model fields: artisan.firstname, artisan.lastname, artisan.email, etc.

import { useState, useEffect, useCallback } from "react";
import {
  adminLogin,
  getStats,
  getArtisans,   deleteArtisan,  verifyArtisan,
  getBuyers,     deleteBuyer,
  getProducts,   updateProduct,  deleteProduct,
  getOrders,     updateOrder,
  getOrderItems, updateOrderItem,
  getAdminReviews, approveReview, rejectReview,
  getArtisanAnalytics,
} from "./api";

// ── Tiny helpers ───────────────────────────────────────────────────────────
const fmt  = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }); }
  catch { return d; }
};

const STATUS_C = {
  Delivered:  { bg:"#f0faf0", color:"#2d7a3a", border:"#b6ddb6" },
  Shipped:    { bg:"#f0f4ff", color:"#3a55a0", border:"#b6c4ee" },
  Processing: { bg:"#fffbf0", color:"#8B6914", border:"#ddd0a0" },
  Pending:    { bg:"#fff8f0", color:"#8B4513", border:"#e8c9a0" },
  Cancelled:  { bg:"#fff0f0", color:"#8B2020", border:"#ddb6b6" },
};
const Badge = ({ v }) => {
  const s = STATUS_C[v] || { bg:"#f5f5f0", color:"#666", border:"#ddd" };
  return <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`, padding:"3px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>{v||"—"}</span>;
};
const Bool = ({ v }) => (
  <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:24, height:24, borderRadius:"50%", background:v?"#f0faf0":"#fff0f0", color:v?"#2d7a3a":"#8B2020", border:v?"1px solid #b6ddb6":"1px solid #ddb6b6", fontSize:13, fontWeight:900 }}>
    {v ? "✓" : "✗"}
  </span>
);

// ── Shared style tokens ────────────────────────────────────────────────────
const INP = { background:"#faf6f1", border:"1px solid #e8e0d5", borderRadius:10, padding:"10px 14px", fontFamily:"'Nunito',sans-serif", fontSize:14, color:"#2c1a0e", outline:"none", width:"100%" };
const TH  = { padding:"11px 16px", textAlign:"left", fontSize:11, color:"#9e8a78", fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase" };
const TD  = { padding:"13px 16px", fontSize:14 };

// ── Login ──────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ username:"", password:"" });
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.username || !form.password) { setErr("Fill in both fields."); return; }
    setBusy(true); setErr("");
    try {
      const res = await adminLogin(form.username, form.password);
      if (res.email) {
        localStorage.setItem("admin_email",    res.email);
        localStorage.setItem("admin_username", res.username);
        onLogin(res.username);
      } else {
        setErr(res.error || "Invalid credentials.");
      }
    } catch {
      setErr("Cannot reach Django. Make sure it's running on :8000");
    }
    setBusy(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f5ede4", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"48px 40px", width:380, boxShadow:"0 8px 40px rgba(139,69,19,0.13)", border:"1px solid #e8e0d5" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:38, marginBottom:10 }}>🛕</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800, color:"#2c1a0e" }}>
            Craft<span style={{ color:"#8B4513" }}>elligence</span>
          </div>
          <div style={{ fontSize:13, color:"#9e8a78", marginTop:3 }}>Admin Panel · Staff login only</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <input placeholder="Username (Django staff user)" value={form.username}
            onChange={e=>setForm({...form,username:e.target.value})}
            onKeyDown={e=>e.key==="Enter"&&submit()} style={INP} />
          <input type="password" placeholder="Password" value={form.password}
            onChange={e=>setForm({...form,password:e.target.value})}
            onKeyDown={e=>e.key==="Enter"&&submit()} style={INP} />
          {err && <div style={{ background:"#fff0f0", border:"1px solid #ddb6b6", color:"#8B2020", borderRadius:8, padding:"9px 14px", fontSize:13 }}>{err}</div>}
          <button onClick={submit} disabled={busy}
            style={{ background:"#8B4513", border:"none", color:"#fff8f0", borderRadius:10, padding:"13px", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"inherit", marginTop:4, opacity:busy?0.7:1 }}>
            {busy ? "Logging in…" : "Login →"}
          </button>
        </div>
        <div style={{ marginTop:20, fontSize:12, color:"#c4b5a5", textAlign:"center" }}>
          Must be a Django <code style={{ background:"#faf0e6",color:"#8B4513",padding:"1px 6px",borderRadius:4 }}>is_staff=True</code> user
        </div>
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, accent="#8B4513" }) => (
  <div style={{ background:"#fff", borderRadius:16, padding:"22px 20px", border:"1px solid #e8e0d5", borderTop:`3px solid ${accent}`, flex:1, minWidth:0, boxShadow:"0 1px 8px rgba(139,69,19,0.05)" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
      <span style={{ fontSize:11, fontWeight:700, color:"#9e8a78", letterSpacing:"1px", textTransform:"uppercase" }}>{label}</span>
      <span style={{ fontSize:22 }}>{icon}</span>
    </div>
    <div style={{ fontSize:28, fontWeight:800, color:"#2c1a0e", fontFamily:"'Playfair Display',serif", letterSpacing:"-0.5px" }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:"#9e8a78", marginTop:3 }}>{sub}</div>}
  </div>
);

// ── Edit Modal ─────────────────────────────────────────────────────────────
function EditModal({ title, fields, data, onSave, onClose }) {
  const [form, setForm] = useState({ ...data });
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(44,26,14,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:18, padding:"32px 28px", width:440, boxShadow:"0 16px 60px rgba(139,69,19,0.2)", maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:800, color:"#2c1a0e" }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#9e8a78" }}>✕</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {fields.map(f => (
            <div key={f.key}>
              <div style={{ fontSize:11, fontWeight:700, color:"#9e8a78", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:5 }}>{f.label}</div>
              {f.type==="select"
                ? <select value={form[f.key]||""} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={INP}>
                    {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                : <input value={form[f.key]||""} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={INP} />}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, marginTop:24, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"#faf6f1", border:"1px solid #ddd3c8", color:"#5c4033", borderRadius:9, padding:"10px 20px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Cancel</button>
          <button onClick={()=>onSave(form)} style={{ background:"#8B4513", border:"none", color:"#fff8f0", borderRadius:9, padding:"10px 24px", cursor:"pointer", fontFamily:"inherit", fontWeight:800 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ msg }) => msg
  ? <div style={{ position:"fixed", bottom:24, right:24, background:"#2c1a0e", color:"#f7c948", borderRadius:12, padding:"12px 22px", fontSize:14, fontWeight:700, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,0.25)" }}>✓ {msg}</div>
  : null;

// ── Data Table ─────────────────────────────────────────────────────────────
function Table({ cols, rows, loading, onEdit, onDelete, extraAction }) {
  const [q, setQ]   = useState("");
  const [sel, setSel] = useState([]);

  const filtered = rows.filter(r => cols.some(c => String(r[c.key]??"").toLowerCase().includes(q.toLowerCase())));
  const allSel   = filtered.length > 0 && sel.length === filtered.length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ color:"#9e8a78", fontSize:13, fontWeight:600 }}>{filtered.length} records</span>
        <div style={{ flex:1 }}/>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#c4b5a5", fontSize:13 }}>🔍</span>
          <input placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}
            style={{ background:"#fff", border:"1px solid #e8e0d5", borderRadius:9, padding:"8px 14px 8px 32px", fontFamily:"'Nunito',sans-serif", fontSize:13, color:"#2c1a0e", outline:"none", width:220 }} />
        </div>
      </div>
      <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", border:"1px solid #e8e0d5", boxShadow:"0 2px 12px rgba(139,69,19,0.06)" }}>
        {loading
          ? <div style={{ padding:"56px 0", textAlign:"center", color:"#c4b5a5" }}><div style={{ fontSize:28, marginBottom:8 }}>⏳</div>Loading from Django…</div>
          : <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#faf6f1", borderBottom:"2px solid #e8e0d5" }}>
                  <th style={TH}><input type="checkbox" checked={allSel} onChange={()=>setSel(allSel?[]:filtered.map(r=>r.id))} /></th>
                  {cols.map(c=><th key={c.key} style={TH}>{c.label}</th>)}
                  {(onEdit||onDelete||extraAction) && <th style={{...TH,textAlign:"right"}}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 && <tr><td colSpan={cols.length+2} style={{padding:"48px 0",textAlign:"center",color:"#c4b5a5"}}>No records found.</td></tr>}
                {filtered.map((row,i)=>(
                  <tr key={row.id??i} style={{ borderBottom:"1px solid #f5f0eb" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#fdf8f3"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{...TD,width:40}}><input type="checkbox" checked={sel.includes(row.id)} onChange={()=>setSel(s=>s.includes(row.id)?s.filter(x=>x!==row.id):[...s,row.id])} /></td>
                    {cols.map(c=>(
                      <td key={c.key} style={TD}>
                        {c.type==="bool"  ? <Bool v={row[c.key]} /> :
                         c.type==="badge" ? <Badge v={row[c.key]} /> :
                         c.type==="money" ? <span style={{color:"#8B4513",fontWeight:700}}>{fmt(row[c.key])}</span> :
                         c.type==="date"  ? <span style={{color:"#9e8a78",fontSize:13}}>{fmtDate(row[c.key])}</span> :
                         c.type==="img"   ? (row[c.key] ? <img src={row[c.key].startsWith("http") ? row[c.key] : `http://127.0.0.1:8000${row[c.key]}`} alt="" style={{width:40,height:40,borderRadius:8,objectFit:"cover",border:"1px solid #e8e0d5"}} /> : <span style={{color:"#c4b5a5",fontSize:12}}>No image</span>) :
                         c.type==="link"  ? <span style={{color:"#7C3A10",fontWeight:700,cursor:"pointer"}}>{row[c.key]??"-"}</span> :
                         <span style={{color:"#5c4033"}}>{row[c.key]??"-"}</span>}
                      </td>
                    ))}
                    {(onEdit||onDelete||extraAction) && (
                      <td style={{...TD,textAlign:"right"}}>
                        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                          {extraAction && extraAction(row)}
                          {onEdit   && <button onClick={()=>onEdit(row)}   style={{background:"#faf6f1",border:"1px solid #ddd3c8",color:"#8B4513",borderRadius:8,padding:"5px 14px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>Edit</button>}
                          {onDelete && <button onClick={()=>onDelete(row.id)} style={{background:"#fff0f0",border:"1px solid #ddb6b6",color:"#8B2020",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>✖</button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}

// ── Sidebar nav item ───────────────────────────────────────────────────────
function SideItem({ icon, label, active, onClick, danger }) {
  return (
    <div style={{padding:"2px 10px"}}>
      <div onClick={onClick} style={{
        display:"flex", alignItems:"center", gap:9, padding:"9px 11px", borderRadius:9, cursor:"pointer",
        background: active?"rgba(247,201,72,0.15)":"transparent",
        borderLeft: active?"3px solid #f7c948":"3px solid transparent",
        color: danger?"rgba(239,154,154,0.65)": active?"#f7c948":"rgba(232,213,176,0.55)",
        fontWeight: active?700:500, fontSize:14, transition:"color 0.15s",
      }}
        onMouseEnter={e=>{ if(!active) e.currentTarget.style.color=danger?"#ef9a9a":"rgba(232,213,176,0.9)"; }}
        onMouseLeave={e=>{ if(!active) e.currentTarget.style.color=danger?"rgba(239,154,154,0.65)":"rgba(232,213,176,0.55)"; }}
      >
        <span style={{fontSize:15}}>{icon}</span> {label}
      </div>
    </div>
  );
}

// ── NAV structure ──────────────────────────────────────────────────────────
const NAV = [
  { section:"ACCOUNTS", items:[
    { key:"artisans",   label:"Artisans",    icon:"🧑‍🎨" },
    { key:"buyers",     label:"Buyers",      icon:"🛒"  },
  ]},
  { section:"PRODUCTS", items:[
    { key:"products",   label:"Products",    icon:"🛍️" },
  ]},
  { section:"ORDERS", items:[
    { key:"orders",     label:"Orders",      icon:"📦"  },
    { key:"orderitems", label:"Order Items", icon:"📋"  },
  ]},
  { section:"REVIEWS", items:[
    { key:"reviews", label:"Reviews", icon:"⭐" },
  ]},
  { section:"ANALYTICS", items:[
    { key:"analytics", label:"Artisan Analytics", icon:"📊" },
  ]},
];

// ── Root ───────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [authed,   setAuthed]   = useState(!!localStorage.getItem("admin_email"));
  const [uname,    setUname]    = useState(localStorage.getItem("admin_username")||"Admin");
  const [page,     setPage]     = useState("dashboard");
  const [toast,    setToast]    = useState("");
  const [modal,    setModal]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  // Data state — exact field names from your models
  const [stats,      setStats]      = useState({});
  const [artisans,   setArtisans]   = useState([]);
  const [buyers,     setBuyers]     = useState([]);
  const [products,   setProducts]   = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [reviews,    setReviews]    = useState([]);
  const [analytics,  setAnalytics]  = useState(null);
  const [anaFilter,  setAnaFilter]  = useState({ category:"", sort:"orders" });

  const toast$ = (m) => { setToast(m); setTimeout(()=>setToast(""),3000); };

  // Ensure response is always an array (guards against {error:...} responses)
  const safe = (data) => Array.isArray(data) ? data : [];

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      if (p==="dashboard") {
        const [s, ar, bu, pr, or_] = await Promise.all([
          getStats(), getArtisans(), getBuyers(), getProducts(), getOrders()
        ]);
        setStats(Array.isArray(s) ? {} : (s.error ? {} : s));
        setArtisans(safe(ar));
        setBuyers(safe(bu));
        setProducts(safe(pr));
        setOrders(safe(or_));
      } else if (p==="artisans")   { setArtisans(safe(await getArtisans())); }
      else if (p==="buyers")       { setBuyers(safe(await getBuyers())); }
      else if (p==="products")     { setProducts(safe(await getProducts())); }
      else if (p==="orders")       { setOrders(safe(await getOrders())); }
      else if (p==="orderitems")   { setOrderItems(safe(await getOrderItems())); }
      else if (p==="reviews")      { setReviews(safe(await getAdminReviews())); }
      else if (p==="analytics")    { const r = await getArtisanAnalytics(); setAnalytics(r); }
    } catch (e) {
      toast$("⚠️ Could not load data — is Django running on :8000?");
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) load(page); }, [authed, page, load]);

  const logout = () => {
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_username");
    setAuthed(false);
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const onDelArtisan = async (id) => {
    if (!window.confirm("Delete this artisan? This will also delete their products.")) return;
    const r = await deleteArtisan(id);
    if (r.error) { toast$("Error: "+r.error); return; }
    setArtisans(a=>a.filter(x=>x.id!==id)); toast$("Artisan deleted");
  };
  const onDelBuyer = async (id) => {
    if (!window.confirm("Delete this buyer account?")) return;
    const r = await deleteBuyer(id);
    if (r.error) { toast$("Error: "+r.error); return; }
    setBuyers(b=>b.filter(x=>x.id!==id)); toast$("Buyer deleted");
  };
  const onDelProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    const r = await deleteProduct(id);
    if (r.error) { toast$("Error: "+r.error); return; }
    setProducts(p=>p.filter(x=>x.id!==id)); toast$("Product deleted");
  };

  // ── Edit modals ──────────────────────────────────────────────────────────
  const openEditProduct = (row) => setModal({
    title: `Edit: ${row.name}`,
    fields:[
      { key:"name",     label:"Product Name", type:"text" },
      { key:"price",    label:"Price (₹)",    type:"text" },
      { key:"category", label:"Category",     type:"select", opts:["Pottery","Weaving","Woodcraft","Embroidery","Metalwork","Paintings","Other"] },
    ],
    data: row,
    onSave: async (form) => {
      const r = await updateProduct(row.id, { name:form.name, price:form.price, category:form.category });
      if (r.error) { toast$("Error: "+r.error); return; }
      setProducts(prev=>prev.map(p=>p.id===row.id?{...p,...form}:p));
      setModal(null); toast$("Product updated ✓");
    },
  });

  const openEditOrder = (row) => setModal({
    title: `Order #${row.id} — ${row.buyer_email}`,
    fields:[
      { key:"payment_status", label:"Payment Status", type:"select", opts:["Pending","Processing","Shipped","Delivered","Cancelled"] },
      { key:"payment_method", label:"Payment Method", type:"text" },
    ],
    data: row,
    onSave: async (form) => {
      const r = await updateOrder(row.id, { payment_status:form.payment_status, payment_method:form.payment_method });
      if (r.error) { toast$("Error: "+r.error); return; }
      setOrders(prev=>prev.map(o=>o.id===row.id?{...o,...form}:o));
      setModal(null); toast$("Order updated ✓");
    },
  });

  const openEditOrderItem = (row) => setModal({
    title: `Item #${row.id}: ${row.product_name}`,
    fields:[
      { key:"status", label:"Delivery Status", type:"select", opts:["Pending","Processing","Shipped","Delivered","Cancelled"] },
    ],
    data: row,
    onSave: async (form) => {
      const r = await updateOrderItem(row.id, { status:form.status });
      if (r.error) { toast$("Error: "+r.error); return; }
      setOrderItems(prev=>prev.map(i=>i.id===row.id?{...i,status:form.status}:i));
      setModal(null); toast$("Status updated ✓");
    },
  });

  const today = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const allItems   = NAV.flatMap(g=>g.items);
  const curItem    = allItems.find(i=>i.key===page);
  const curGroup   = NAV.find(g=>g.items.find(i=>i.key===page));

  if (!authed) return <LoginScreen onLogin={(u)=>{ setUname(u); setAuthed(true); }} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=Nunito:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f5ede4;}
        input[type=checkbox]{accent-color:#8B4513;width:14px;height:14px;cursor:pointer;}
        select,input{outline:none;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#f5ede4;}
        ::-webkit-scrollbar-thumb{background:#ddd3c8;border-radius:4px;}
        button:hover{opacity:0.88;}
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:"#f5ede4", fontFamily:"'Nunito',sans-serif" }}>

        {/* ── Sidebar ── */}
        <div style={{ width:210, background:"#1e1008", display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh" }}>
          <div style={{ padding:"22px 18px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:800, color:"#f7c948", cursor:"pointer" }} onClick={()=>setPage("dashboard")}>
              Craft<span style={{color:"#e8d5b0"}}>elligence</span>
            </div>
            <div style={{ fontSize:9, color:"rgba(255,220,170,0.3)", letterSpacing:"2px", textTransform:"uppercase", marginTop:2 }}>ADMIN STUDIO</div>
          </div>
          <div style={{ padding:"12px 16px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#8B4513,#f7c948)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>👤</div>
            <div>
              <div style={{ fontSize:12, color:"#e8d5b0", fontWeight:700 }}>{uname}</div>
              <div style={{ fontSize:9, color:"rgba(255,220,170,0.35)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Super Admin</div>
            </div>
          </div>
          <nav style={{ flex:1, overflowY:"auto", padding:"10px 0" }}>
            <SideItem icon="🏠" label="Dashboard" active={page==="dashboard"} onClick={()=>setPage("dashboard")} />
            {NAV.map(group=>(
              <div key={group.section}>
                <div style={{ padding:"10px 18px 4px", fontSize:9, fontWeight:800, color:"rgba(255,220,170,0.2)", letterSpacing:"1.5px", textTransform:"uppercase" }}>{group.section}</div>
                {group.items.map(item=>(
                  <SideItem key={item.key} icon={item.icon} label={item.label} active={page===item.key} onClick={()=>setPage(item.key)} />
                ))}
              </div>
            ))}
          </nav>
          <div style={{ padding:"10px 10px 16px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
            <SideItem icon="↻" label="Refresh" active={false} onClick={()=>load(page)} />
            <SideItem icon="🚪" label="Logout"  active={false} onClick={logout} danger />
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Topbar */}
          <div style={{ background:"#faf6f1", borderBottom:"1px solid #e8e0d5", padding:"12px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ fontSize:14, color:"#5c4033" }}>Good day, <span style={{ color:"#8B4513", fontWeight:700 }}>{uname}</span> 👋</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:12, color:"#9e8a78" }}>{today}</span>
              <span style={{ background:"#f7c948", color:"#3c1a00", fontSize:10, fontWeight:800, padding:"4px 12px", borderRadius:20, letterSpacing:"1px" }}>ADMIN</span>
            </div>
          </div>

          {/* Content area */}
          <div style={{ flex:1, overflowY:"auto", padding:"26px 30px" }}>

            {/* Breadcrumb */}
            {page!=="dashboard" && (
              <div style={{ fontSize:13, color:"#c4b5a5", marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:"#8B4513", cursor:"pointer", fontWeight:700 }} onClick={()=>setPage("dashboard")}>Dashboard</span>
                <span>›</span><span>{curGroup?.section}</span>
                <span>›</span><span style={{ color:"#5c4033", fontWeight:600 }}>{curItem?.label}</span>
              </div>
            )}
            {page!=="dashboard" && (
              <div style={{ marginBottom:22 }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:800, color:"#2c1a0e" }}>
                  {curItem?.icon} {curItem?.label}
                </h1>
                <p style={{ color:"#9e8a78", fontSize:13, marginTop:3 }}>
                  Live data from your Django database · {loading?"Loading…":"Up to date"}
                </p>
              </div>
            )}

            {/* ── DASHBOARD ─────────────────────────────────── */}
            {page==="dashboard" && (
              <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                {/* Hero */}
                <div style={{ background:"linear-gradient(135deg,#5c2a0e,#8B4513,#a0522d)", borderRadius:20, padding:"38px 44px", position:"relative", overflow:"hidden", boxShadow:"0 4px 24px rgba(139,69,19,0.22)" }}>
                  <div style={{ position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,0.04)" }}/>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:"2px", color:"rgba(255,220,170,0.55)", textTransform:"uppercase", marginBottom:12 }}>✦ SITE OVERVIEW</div>
                  <div style={{ fontSize:34, fontWeight:800, color:"#fff8f0", fontFamily:"'Playfair Display',serif" }}>Welcome back,</div>
                  <div style={{ fontSize:34, fontWeight:800, color:"#f7c948", fontFamily:"'Playfair Display',serif", fontStyle:"italic", marginBottom:14 }}>{uname}.</div>
                  <div style={{ fontSize:14, color:"rgba(255,220,170,0.75)", maxWidth:400, lineHeight:1.6, marginBottom:24 }}>
                    Your marketplace is live. Manage artisans, track orders, grow the platform.
                  </div>
                  <div style={{ display:"flex", gap:12 }}>
                    <button onClick={()=>setPage("products")} style={{ background:"#f7c948", border:"none", color:"#3c1a00", padding:"11px 22px", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>+ PRODUCTS</button>
                    <button onClick={()=>setPage("orders")}   style={{ background:"transparent", border:"2px solid rgba(255,220,170,0.4)", color:"#fff8f0", padding:"11px 22px", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>VIEW ORDERS</button>
                  </div>
                </div>

                {/* Stats — from your Django admin_stats view */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14 }}>
                  <StatCard icon="🧑‍🎨" label="Artisans"      value={stats.total_artisans  ?? artisans.length}  sub="Registered" accent="#8B4513" />
                  <StatCard icon="🛒"   label="Buyers"        value={stats.total_buyers    ?? buyers.length}    sub="Registered" accent="#a0522d" />
                  <StatCard icon="🛍️"  label="Products"      value={stats.total_products  ?? products.length}  sub="Listed"     accent="#7C5C3A" />
                  <StatCard icon="📦"   label="Orders"        value={stats.total_orders    ?? orders.length}    sub="All time"   accent="#6B4226" />
                  <StatCard icon="💰"   label="Revenue"       value={fmt(stats.total_revenue)} sub="All orders" accent="#f7c948" />
                  <StatCard icon="⏳"   label="Pending"       value={stats.pending_orders  ?? 0}                sub="Awaiting"   accent="#c4956a" />
                </div>

                {/* Quick actions */}
                <div>
                  <div style={{ fontSize:10, fontWeight:800, color:"#9e8a78", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:12 }}>QUICK ACTIONS</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
                    {NAV.flatMap(g=>g.items).map(q=>(
                      <div key={q.key} onClick={()=>setPage(q.key)}
                        style={{ background:"#fff", borderRadius:14, padding:"20px 18px", border:"1px solid #e8e0d5", cursor:"pointer", transition:"all 0.18s" }}
                        onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 20px rgba(139,69,19,0.12)";e.currentTarget.style.transform="translateY(-2px)";}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}>
                        <div style={{ fontSize:24, marginBottom:8 }}>{q.icon}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#2c1a0e", fontFamily:"'Playfair Display',serif" }}>{q.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent orders preview */}
                <div>
                  <div style={{ fontSize:10, fontWeight:800, color:"#9e8a78", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:12 }}>RECENT ORDERS</div>
                  <Table loading={loading} rows={orders.slice(0,5)} onEdit={openEditOrder}
                    cols={[
                      { key:"id",             label:"Order #"                },
                      { key:"buyer_email",    label:"Buyer Email"            },
                      { key:"buyer_name",     label:"Name"                   },
                      { key:"total_amount",   label:"Total",    type:"money" },
                      { key:"payment_status", label:"Payment",  type:"badge" },
                      { key:"created_at",     label:"Date",     type:"date"  },
                    ]} />
                </div>
              </div>
            )}

            {/* ── ARTISANS ─────────────────────── */}
            {/* Fields: id, firstname, lastname, email, gst_number, is_verified, created_at */}
            {page==="artisans" && (
              <Table loading={loading} rows={artisans} onDelete={onDelArtisan}
                extraAction={(row) => !row.is_verified ? (
                  <button
                    onClick={async () => {
                      if (!window.confirm("Verify " + row.firstname + " " + row.lastname + "? A confirmation email will be sent.")) return;
                      const r = await verifyArtisan(row.id);
                      if (r.error) { toast$("Error: "+r.error); return; }
                      setArtisans(prev => prev.map(a => a.id===row.id ? {...a, verified:true, is_verified:true} : a));
                      toast$(row.firstname + " verified ✓");
                    }}
                    style={{ background:"#f0faf0", border:"1px solid #b6ddb6", color:"#2d7a3a", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" }}>
                    ✓ Verify
                  </button>
                ) : null}
                cols={[
                  { key:"firstname",   label:"First Name",  type:"link" },
                  { key:"lastname",    label:"Last Name"               },
                  { key:"email",       label:"Email"                   },
                  { key:"phone",       label:"Phone"                   },
                  { key:"gst_number",  label:"GST Number"              },
                  { key:"is_verified", label:"Verified",    type:"bool" },
                ]} />
            )}

            {/* ── BUYERS ───────────────────────── */}
            {/* Fields: id, username, first_name, last_name, email, is_active, date_joined */}
            {page==="buyers" && (
              <Table loading={loading} rows={buyers} onDelete={onDelBuyer}
                cols={[
                  { key:"firstname",   label:"First Name",  type:"link" },
                  { key:"lastname",    label:"Last Name"               },
                  { key:"email",       label:"Email"                   },
                  { key:"phone",       label:"Phone"                   },
                  { key:"address",     label:"Address"                 },
                ]} />
            )}

            {/* ── PRODUCTS ─────────────────────── */}
            {/* Fields: id, name, artisan_name, artisan_email, price, category, image, created_at */}
            {page==="products" && (
              <Table loading={loading} rows={products} onDelete={onDelProduct} onEdit={openEditProduct}
                cols={[
                  { key:"image",        label:"",           type:"img"   },
                  { key:"name",         label:"Product",    type:"link"  },
                  { key:"artisan_name", label:"Artisan"                  },
                  { key:"category",     label:"Category"                 },
                  { key:"price",        label:"Price",      type:"money" },
                  { key:"created_at",   label:"Added",      type:"date"  },
                ]} />
            )}

            {/* ── ORDERS ───────────────────────── */}
            {/* Fields: id, buyer_email, buyer_name, total_amount, payment_status, payment_method, created_at, item_count */}
            {page==="orders" && (
              <Table loading={loading} rows={orders} onEdit={openEditOrder}
                cols={[
                  { key:"id",             label:"Order #"                },
                  { key:"buyer_email",    label:"Buyer Email"            },
                  { key:"buyer_name",     label:"Name"                   },
                  { key:"total_amount",   label:"Total",    type:"money" },
                  { key:"payment_status", label:"Payment",  type:"badge" },
                  { key:"payment_method", label:"Method"                 },
                  { key:"item_count",     label:"Items"                  },
                  { key:"created_at",     label:"Date",     type:"date"  },
                ]} />
            )}

            {/* ── ORDER ITEMS ──────────────────── */}
            {/* Fields: id, order_id, product_name, artisan_name, buyer_email, quantity, price, total, status, city, state */}
            {page==="orderitems" && (
              <Table loading={loading} rows={orderItems} onEdit={openEditOrderItem}
                cols={[
                  { key:"id",               label:"#"                          },
                  { key:"order_id",         label:"Order"                      },
                  { key:"product_name",     label:"Product",     type:"link"   },
                  { key:"artisan_name",     label:"Artisan"                    },
                  { key:"buyer_email",      label:"Buyer"                      },
                  { key:"quantity",         label:"Qty"                        },
                  { key:"total",            label:"Total",       type:"money"  },
                  { key:"status",           label:"Status",      type:"badge"  },
                  { key:"city",             label:"City"                       },
                  { key:"created_at",       label:"Date",        type:"date"   },
                ]} />
            )}

            {/* ── REVIEWS ──────────────────────── */}
            {page==="reviews" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {/* Pending count banner */}
                {reviews.filter(r=>!r.approved).length > 0 && (
                  <div style={{ background:"#fffbf0", border:"1px solid #f0d080", borderRadius:12, padding:"12px 18px", display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18 }}>⏳</span>
                    <span style={{ fontWeight:700, color:"#b07d00" }}>
                      {reviews.filter(r=>!r.approved).length} review{reviews.filter(r=>!r.approved).length!==1?"s":""} pending approval
                    </span>
                  </div>
                )}

                {loading && <div style={{ textAlign:"center", padding:"40px 0", color:"#c4b5a5" }}>Loading reviews…</div>}
                {!loading && reviews.length===0 && (
                  <div style={{ textAlign:"center", padding:"48px 0", background:"#fff", borderRadius:14, border:"1px solid #e8e0d5", color:"#c4b5a5" }}>No reviews yet.</div>
                )}

                {!loading && reviews.map(r => (
                  <div key={r.id} style={{
                    background:"#fff", borderRadius:14, border:`1px solid ${r.approved ? "#e8e0d5" : "#f0d080"}`,
                    padding:"18px 20px", boxShadow:"0 1px 8px rgba(139,69,19,0.05)",
                    borderLeft: r.approved ? "4px solid #b6ddb6" : "4px solid #f7c948",
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
                      <div>
                        <div style={{ fontWeight:800, color:"#2c1a0e", fontSize:15 }}>{r.buyer_name}</div>
                        <div style={{ fontSize:12, color:"#9e8a78" }}>{r.buyer_email}</div>
                        <div style={{ fontSize:12, color:"#9e8a78", marginTop:2 }}>
                          For artisan: <strong style={{ color:"#8B4513" }}>{r.artisan_name}</strong>
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:14 }}>
                          {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}
                        </span>
                        {r.approved
                          ? <span style={{ background:"#f0faf5", color:"#2d7a3a", border:"1px solid #b6ddb6", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700 }}>✓ Approved</span>
                          : <span style={{ background:"#fffbf0", color:"#b07d00", border:"1px solid #f0d080", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700 }}>⏳ Pending</span>
                        }
                      </div>
                    </div>

                    <p style={{ fontSize:14, color:"#5c4033", lineHeight:1.6, margin:"12px 0 14px" }}>"{r.comment}"</p>

                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                      {!r.approved && (
                        <button
                          onClick={async () => {
                            const res = await approveReview(r.id);
                            if (res.error) { toast$("Error: "+res.error); return; }
                            setReviews(prev => prev.map(x => x.id===r.id ? {...x, approved:true} : x));
                            toast$("Review approved ✓");
                          }}
                          style={{ background:"#f0faf5", border:"1px solid #b6ddb6", color:"#2d7a3a", borderRadius:8, padding:"7px 18px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}
                        >
                          ✓ Approve
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!window.confirm("Delete this review permanently?")) return;
                          const res = await rejectReview(r.id);
                          if (res.error) { toast$("Error: "+res.error); return; }
                          setReviews(prev => prev.filter(x => x.id!==r.id));
                          toast$("Review deleted");
                        }}
                        style={{ background:"#fff0f0", border:"1px solid #ddb6b6", color:"#8B2020", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}
                      >
                        ✖ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ARTISAN ANALYTICS ────────────── */}
            {page==="analytics" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

                {/* Filters */}
                <div style={{ background:"#fff", borderRadius:14, padding:"18px 20px", border:"1px solid #e8e0d5", display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#2c1a0e" }}>Filter by:</div>

                  {/* Category */}
                  <select
                    value={anaFilter.category}
                    onChange={async e => {
                      const cat = e.target.value;
                      setAnaFilter(f => ({...f, category:cat}));
                      const r = await getArtisanAnalytics(cat, anaFilter.sort);
                      setAnalytics(r);
                    }}
                    style={{ background:"#faf6f1", border:"1px solid #e8e0d5", borderRadius:8, padding:"8px 14px", fontFamily:"inherit", fontSize:13, color:"#2c1a0e", outline:"none", cursor:"pointer" }}
                  >
                    <option value="">All Categories</option>
                    {["Pottery","Weaving","Woodcraft","Embroidery","Metalwork","Paintings","Other"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {/* Sort */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {[
                      { key:"orders",   label:"Most Orders"   },
                      { key:"revenue",  label:"Most Revenue"  },
                      { key:"products", label:"Most Products" },
                      { key:"rating",   label:"Best Rating"   },
                      { key:"reviews",  label:"Most Reviews"  },
                    ].map(s => (
                      <button key={s.key}
                        onClick={async () => {
                          setAnaFilter(f => ({...f, sort:s.key}));
                          const r = await getArtisanAnalytics(anaFilter.category, s.key);
                          setAnalytics(r);
                        }}
                        style={{
                          background: anaFilter.sort===s.key ? "#1e1008" : "#faf6f1",
                          color: anaFilter.sort===s.key ? "#f7c948" : "#9e8a78",
                          border: "1px solid #e8e0d5", borderRadius:8,
                          padding:"7px 14px", cursor:"pointer",
                          fontFamily:"inherit", fontSize:12, fontWeight:700,
                        }}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>

                {/* Loading */}
                {loading && <div style={{ textAlign:"center", padding:"48px 0", color:"#c4b5a5" }}>Loading analytics…</div>}

                {/* Leaderboard cards */}
                {!loading && analytics && (analytics.artisans||[]).map((a, i) => {
                  const medal = i===0 ? "🥇" : i===1 ? "🥈" : i===2 ? "🥉" : `#${a.rank}`;
                  const isTop = i < 3;
                  return (
                    <div key={a.id} style={{
                      background:"#fff", borderRadius:16, border:"1px solid #e8e0d5",
                      padding:"20px 22px", boxShadow:"0 2px 12px rgba(139,69,19,0.06)",
                      borderLeft: isTop ? `4px solid ${i===0?"#f7c948":i===1?"#c0c0c0":"#cd7f32"}` : "4px solid transparent",
                    }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>

                        {/* Rank + name */}
                        <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:200 }}>
                          <div style={{ fontSize: isTop ? 28 : 18, fontWeight:800, color: i===0?"#b07d00":i===1?"#7a7a7a":i===2?"#8B4513":"#c4b5a5", minWidth:40, textAlign:"center" }}>
                            {medal}
                          </div>
                          <div>
                            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:800, color:"#2c1a0e" }}>
                              {a.firstname} {a.lastname}
                            </div>
                            <div style={{ fontSize:12, color:"#9e8a78" }}>{a.email}</div>
                            <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
                              {a.is_verified && <span style={{ background:"#f0faf5", color:"#2d7a3a", border:"1px solid #b6ddb6", padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700 }}>✓ Verified</span>}
                              {(a.categories||[]).map(cat => (
                                <span key={cat} style={{ background:"#faf0e6", color:"#8B4513", border:"1px solid #e8d5b0", padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600 }}>{cat}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))", gap:12, flex:2 }}>
                          {[
                            { label:"Orders",   value:a.total_orders,              icon:"📦", highlight: anaFilter.sort==="orders"   },
                            { label:"Revenue",  value:`₹${a.total_revenue.toLocaleString("en-IN")}`, icon:"💰", highlight: anaFilter.sort==="revenue"  },
                            { label:"Products", value:a.product_count,             icon:"🛍️", highlight: anaFilter.sort==="products" },
                            { label:"Rating",   value:a.avg_rating > 0 ? `${a.avg_rating}★` : "—", icon:"⭐", highlight: anaFilter.sort==="rating"   },
                            { label:"Reviews",  value:a.review_count,              icon:"💬", highlight: anaFilter.sort==="reviews"  },
                            { label:"Delivered",value:a.delivered,                 icon:"✅", highlight: false },
                          ].map(stat => (
                            <div key={stat.label} style={{
                              background: stat.highlight ? "#fdf8f0" : "#faf6f1",
                              borderRadius:10, padding:"10px 12px", textAlign:"center",
                              border: stat.highlight ? "1px solid #f7c948" : "1px solid #f0ebe4",
                            }}>
                              <div style={{ fontSize:16, marginBottom:2 }}>{stat.icon}</div>
                              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:800, color: stat.highlight ? "#8B4513" : "#2c1a0e" }}>{stat.value}</div>
                              <div style={{ fontSize:10, color:"#9e8a78", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Order status mini bar */}
                        {a.total_orders > 0 && (
                          <div style={{ width:"100%", marginTop:8 }}>
                            <div style={{ fontSize:11, color:"#9e8a78", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:6 }}>Order Status Breakdown</div>
                            <div style={{ display:"flex", height:8, borderRadius:4, overflow:"hidden", gap:1 }}>
                              {[
                                { val:a.delivered,   color:"#4caf50" },
                                { val:a.shipped,     color:"#2196f3" },
                                { val:a.pending,     color:"#ff9800" },
                                { val:a.cancelled,   color:"#ef5350" },
                              ].map((seg, si) => (
                                seg.val > 0 && (
                                  <div key={si} style={{
                                    width:`${(seg.val/a.total_orders)*100}%`,
                                    background:seg.color, borderRadius:2,
                                    minWidth:2,
                                  }} title={`${seg.val}`} />
                                )
                              ))}
                            </div>
                            <div style={{ display:"flex", gap:12, marginTop:6, fontSize:11, color:"#9e8a78" }}>
                              <span>🟢 {a.delivered} delivered</span>
                              <span>🔵 {a.shipped} shipped</span>
                              <span>🟡 {a.pending} pending</span>
                              <span>🔴 {a.cancelled} cancelled</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!loading && analytics && (analytics.artisans||[]).length===0 && (
                  <div style={{ textAlign:"center", padding:"48px 0", background:"#fff", borderRadius:14, border:"1px solid #e8e0d5", color:"#c4b5a5" }}>
                    No artisans found for this category.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {modal && <EditModal {...modal} onClose={()=>setModal(null)} />}
      <Toast msg={toast} />
    </>
  );
}