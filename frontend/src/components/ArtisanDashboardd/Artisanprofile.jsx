import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

function ArtisanProfile() {
  const navigate         = useNavigate();
  const [artisan, setArtisan] = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  const email = localStorage.getItem("email") || "";

  const load = useCallback(async () => {
    if (!email) { navigate("/login"); return; }
    setLoading(true);
    try {
      const [artisanRes, productsRes, ordersRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/artisan-by-email/?email=${email}`),
        axios.get(`${BASE_URL}/api/products/?email=${email}`),
        axios.get(`${BASE_URL}/api/artisan-orders/?email=${email}`),
      ]);

      setArtisan(artisanRes.data);

      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const orders   = Array.isArray(ordersRes.data)   ? ordersRes.data   : [];

      const revenue   = orders
        .filter(o => o.status !== "Cancelled")
        .reduce((s, o) => s + parseFloat(o.total_price || 0), 0);

      // Category breakdown
      const catMap = {};
      products.forEach(p => {
        catMap[p.category || "Other"] = (catMap[p.category || "Other"] || 0) + 1;
      });

      setStats({
        totalProducts: products.length,
        totalOrders:   orders.length,
        totalRevenue:  revenue,
        delivered:     orders.filter(o => o.status === "Delivered").length,
        pending:       orders.filter(o => o.status === "Pending").length,
        shipped:       orders.filter(o => o.status === "Shipped").length,
        cancelled:     orders.filter(o => o.status === "Cancelled").length,
        categories:    catMap,
        recentProducts:products.slice(0, 3),
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    setTimeout(() => setAnimate(true), 60);
  }, [email, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const initials = artisan
    ? `${artisan.firstname?.[0] || ""}${artisan.lastname?.[0] || ""}`.toUpperCase()
    : "A";

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#f5ede4", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Playfair Display',serif", fontSize:18, color:"#9e8a78", fontStyle:"italic" }}>
        Loading your profile…
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Nunito:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f5ede4;}

        .ap-root{min-height:100vh;background:#f5ede4;font-family:'Nunito',sans-serif;}

        /* Topbar */
        .ap-topbar{background:#1e1008;padding:13px 28px;display:flex;align-items:center;justify-content:space-between;}
        .ap-brand{font-family:'Playfair Display',serif;font-size:18px;font-weight:800;color:#f7c948;cursor:pointer;}
        .ap-brand span{color:#e8d5b0;}
        .ap-back{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#e8d5b0;padding:7px 16px;border-radius:8px;cursor:pointer;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;}
        .ap-back:hover{background:rgba(255,255,255,0.14);}

        /* Hero */
        .ap-hero{background:linear-gradient(135deg,#5c2a0e 0%,#8B4513 45%,#a0522d 100%);padding:44px 32px 80px;position:relative;overflow:hidden;text-align:center;}
        .ap-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.04);}
        .ap-hero::after{content:'';position:absolute;bottom:-60px;left:40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.03);}
        .ap-avatar{width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#f7c948,#f48c00);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:30px;font-weight:800;color:#3c1a00;margin:0 auto 14px;box-shadow:0 8px 28px rgba(0,0,0,0.25);border:3px solid rgba(255,255,255,0.2);position:relative;z-index:1;}
        .ap-hero-name{font-family:'Playfair Display',serif;font-size:26px;font-weight:800;color:#fff8f0;margin-bottom:4px;position:relative;z-index:1;}
        .ap-hero-email{font-size:13px;color:rgba(255,220,170,0.65);position:relative;z-index:1;margin-bottom:10px;}
        .ap-hero-badges{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1;}
        .ap-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;}
        .ap-badge-gold{background:rgba(247,201,72,0.2);border:1px solid rgba(247,201,72,0.4);color:#f7c948;}
        .ap-badge-green{background:rgba(76,175,80,0.2);border:1px solid rgba(76,175,80,0.4);color:#81c784;}

        /* Content */
        .ap-content{max-width:720px;margin:-40px auto 60px;padding:0 20px;position:relative;z-index:2;}

        /* Cards */
        .ap-card{background:#fff;border-radius:18px;border:1px solid #e8e0d5;box-shadow:0 2px 16px rgba(139,69,19,0.07);margin-bottom:16px;overflow:hidden;opacity:0;transform:translateY(20px);transition:opacity 0.45s ease,transform 0.45s ease;}
        .ap-card.visible{opacity:1;transform:translateY(0);}
        .ap-card:nth-child(2){transition-delay:0.07s;}
        .ap-card:nth-child(3){transition-delay:0.14s;}
        .ap-card:nth-child(4){transition-delay:0.21s;}
        .ap-card:nth-child(5){transition-delay:0.28s;}

        .ap-card-header{padding:16px 22px;border-bottom:1px solid #f5f0eb;background:#faf6f1;display:flex;align-items:center;gap:10px;}
        .ap-card-icon{width:32px;height:32px;border-radius:9px;background:#faf0e6;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
        .ap-card-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:800;color:#2c1a0e;}

        /* Info rows */
        .ap-row{display:flex;align-items:flex-start;padding:13px 22px;border-bottom:1px solid #faf6f1;gap:14px;}
        .ap-row:last-child{border-bottom:none;}
        .ap-row-label{font-size:11px;font-weight:700;color:#c4b5a5;text-transform:uppercase;letter-spacing:0.8px;width:100px;flex-shrink:0;padding-top:2px;}
        .ap-row-val{font-size:14px;font-weight:600;color:#2c1a0e;flex:1;line-height:1.5;}

        /* Stats grid */
        .ap-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;padding:18px 22px;}
        .ap-stat{background:#faf6f1;border-radius:12px;padding:14px;text-align:center;border:1px solid #f0ebe4;}
        .ap-stat-val{font-family:'Playfair Display',serif;font-size:24px;font-weight:800;color:#2c1a0e;line-height:1;}
        .ap-stat-label{font-size:11px;color:#9e8a78;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;}

        /* Order bar */
        .ap-order-bar-wrap{padding:0 22px 18px;}
        .ap-order-bar{height:10px;border-radius:5px;overflow:hidden;display:flex;gap:2px;margin-bottom:8px;}
        .ap-order-bar-leg{display:flex;gap:14px;flex-wrap:wrap;}
        .ap-order-leg{font-size:12px;color:#9e8a78;display:flex;align-items:center;gap:4px;}
        .ap-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}

        /* Category chips */
        .ap-cats{display:flex;flex-wrap:wrap;gap:8px;padding:16px 22px;}
        .ap-cat{background:#faf0e6;border:1px solid #e8d5b0;color:#8B4513;padding:"5px 14px";border-radius:20px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;}

        /* Product row */
        .ap-prod-row{display:flex;align-items:center;gap:12px;padding:12px 22px;border-bottom:1px solid #f5f0eb;}
        .ap-prod-row:last-child{border-bottom:none;}
        .ap-prod-img{width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid #e8e0d5;flex-shrink:0;}
        .ap-prod-name{font-weight:700;color:#2c1a0e;font-size:14px;}
        .ap-prod-cat{font-size:12px;color:#9e8a78;margin-top:2px;}
        .ap-prod-price{font-family:'Playfair Display',serif;font-weight:800;color:#8B4513;font-size:15px;flex-shrink:0;}

        /* Actions */
        .ap-actions{display:flex;flex-direction:column;gap:10px;padding:18px 22px;}
        .ap-btn{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:11px;border:none;cursor:pointer;font-family:'Nunito',sans-serif;font-size:14px;font-weight:700;transition:all 0.18s;text-align:left;}
        .ap-btn:hover{transform:translateX(3px);}
        .ap-btn-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
        .ap-btn-arrow{margin-left:auto;color:rgba(0,0,0,0.2);}

        @media(max-width:480px){
          .ap-hero{padding:32px 16px 68px;}
          .ap-content{padding:0 12px 40px;}
          .ap-stats-grid{grid-template-columns:repeat(2,1fr);}
        }
      `}</style>

      <div className="ap-root">

        {/* Topbar */}
        <div className="ap-topbar">
          <div className="ap-brand" onClick={() => navigate("/artisan-dashboard")}>
            Craft<span>elligence</span>
          </div>
          <button className="ap-back" onClick={() => navigate("/artisan-dashboard")}>← Dashboard</button>
        </div>

        {/* Hero */}
        <div className="ap-hero">
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"2.5px", color:"rgba(255,220,170,0.5)", textTransform:"uppercase", marginBottom:14, position:"relative", zIndex:1 }}>
            ✦ Artisan Profile
          </div>
          <div className="ap-avatar">{initials}</div>
          <div className="ap-hero-name">{artisan?.firstname} {artisan?.lastname}</div>
          <div className="ap-hero-email">{artisan?.email}</div>
          <div className="ap-hero-badges">
            <span className="ap-badge ap-badge-gold">🏺 ARTISAN</span>
            {artisan?.is_verified && <span className="ap-badge ap-badge-green">✓ VERIFIED</span>}
          </div>
        </div>

        {/* Content */}
        <div className="ap-content">

          {/* Personal Info */}
          <div className={`ap-card ${animate?"visible":""}`}>
            <div className="ap-card-header">
              <div className="ap-card-icon">👤</div>
              <div className="ap-card-title">Personal Information</div>
            </div>
            <div className="ap-row">
              <div className="ap-row-label">Full Name</div>
              <div className="ap-row-val">{artisan?.firstname} {artisan?.lastname}</div>
            </div>
            <div className="ap-row">
              <div className="ap-row-label">Email</div>
              <div className="ap-row-val">{artisan?.email}</div>
            </div>
            <div className="ap-row">
              <div className="ap-row-label">Phone</div>
              <div className="ap-row-val">{artisan?.phone || "—"}</div>
            </div>
            <div className="ap-row">
              <div className="ap-row-label">GST Number</div>
              <div className="ap-row-val" style={{ fontFamily:"monospace", letterSpacing:"0.5px" }}>{artisan?.gst_number || "—"}</div>
            </div>
            <div className="ap-row">
              <div className="ap-row-label">Address</div>
              <div className="ap-row-val">{artisan?.address || "—"}</div>
            </div>
            {artisan?.bio && (
              <div className="ap-row">
                <div className="ap-row-label">Bio</div>
                <div className="ap-row-val" style={{ color:"#5c4033", lineHeight:1.6 }}>{artisan.bio}</div>
              </div>
            )}
          </div>

          {/* Studio Stats */}
          <div className={`ap-card ${animate?"visible":""}`}>
            <div className="ap-card-header">
              <div className="ap-card-icon">📊</div>
              <div className="ap-card-title">Studio Statistics</div>
            </div>
            <div className="ap-stats-grid">
              {[
                { icon:"🛍️", label:"Products",  val: stats?.totalProducts ?? 0 },
                { icon:"📦", label:"Orders",    val: stats?.totalOrders   ?? 0 },
                { icon:"💰", label:"Revenue",   val:`₹${(stats?.totalRevenue||0).toLocaleString("en-IN")}` },
                { icon:"✅", label:"Delivered", val: stats?.delivered     ?? 0 },
                { icon:"⏳", label:"Pending",   val: stats?.pending       ?? 0 },
                { icon:"🚚", label:"Shipped",   val: stats?.shipped       ?? 0 },
              ].map(s => (
                <div key={s.label} className="ap-stat">
                  <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                  <div className="ap-stat-val">{s.val}</div>
                  <div className="ap-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Order status bar */}
            {stats && stats.totalOrders > 0 && (
              <div className="ap-order-bar-wrap">
                <div className="ap-order-bar">
                  {[
                    { val:stats.delivered, color:"#4caf50" },
                    { val:stats.shipped,   color:"#2196f3" },
                    { val:stats.pending,   color:"#ff9800" },
                    { val:stats.cancelled, color:"#ef5350" },
                  ].map((seg, i) => seg.val > 0 && (
                    <div key={i} style={{ width:`${(seg.val/stats.totalOrders)*100}%`, background:seg.color, borderRadius:3, minWidth:2 }} />
                  ))}
                </div>
                <div className="ap-order-bar-leg">
                  {[
                    { label:`${stats.delivered} Delivered`, dot:"#4caf50" },
                    { label:`${stats.shipped} Shipped`,     dot:"#2196f3" },
                    { label:`${stats.pending} Pending`,     dot:"#ff9800" },
                    { label:`${stats.cancelled} Cancelled`, dot:"#ef5350" },
                  ].map(l => (
                    <span key={l.label} className="ap-order-leg">
                      <span className="ap-dot" style={{ background:l.dot }}/>
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Categories */}
          {stats && Object.keys(stats.categories).length > 0 && (
            <div className={`ap-card ${animate?"visible":""}`}>
              <div className="ap-card-header">
                <div className="ap-card-icon">🏷️</div>
                <div className="ap-card-title">Product Categories</div>
              </div>
              <div className="ap-cats">
                {Object.entries(stats.categories).map(([cat, count]) => (
                  <span key={cat} style={{ background:"#faf0e6", border:"1px solid #e8d5b0", color:"#8B4513", padding:"6px 14px", borderRadius:20, fontSize:13, fontWeight:600 }}>
                    {cat} <span style={{ background:"#8B4513", color:"#fff8f0", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:800, marginLeft:4 }}>{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Products */}
          {stats?.recentProducts?.length > 0 && (
            <div className={`ap-card ${animate?"visible":""}`}>
              <div className="ap-card-header">
                <div className="ap-card-icon">🛍️</div>
                <div className="ap-card-title">Recent Products</div>
              </div>
              {stats.recentProducts.map((p, i) => (
                <div key={p.id} className="ap-prod-row" style={{ borderBottom: i < stats.recentProducts.length-1 ? "1px solid #f5f0eb" : "none" }}>
                  <img
                    className="ap-prod-img"
                    src={p.images?.[0] ? (p.images[0].startsWith("http") ? p.images[0] : `${BASE_URL}${p.images[0]}`) : "https://placehold.co/44x44?text=🏺"}
                    alt={p.name}
                    onError={e => { e.target.src = "https://placehold.co/44x44?text=🏺"; }}
                  />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="ap-prod-name">{p.name}</div>
                    <div className="ap-prod-cat">{p.category || "Uncategorized"}</div>
                  </div>
                  <div className="ap-prod-price">₹{p.price}</div>
                </div>
              ))}
              <div style={{ padding:"12px 22px" }}>
                <button onClick={() => navigate("/my-products")} style={{ background:"none", border:"1px solid #e8e0d5", color:"#8B4513", borderRadius:9, padding:"9px 18px", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, width:"100%" }}>
                  View All Products →
                </button>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className={`ap-card ${animate?"visible":""}`}>
            <div className="ap-card-header">
              <div className="ap-card-icon">⚡</div>
              <div className="ap-card-title">Quick Actions</div>
            </div>
            <div className="ap-actions">
              {[
                { icon:"➕", label:"Add New Product",  bg:"#faf0e6", path:"/add-product"    },
                { icon:"🏺", label:"My Products",       bg:"#faf0e6", path:"/my-products"    },
                { icon:"📦", label:"View Orders",       bg:"#e8f0fe", path:"/artisan-orders" },
                { icon:"🏠", label:"Go to Dashboard",   bg:"#faf0e6", path:"/artisan-dashboard" },
              ].map(a => (
                <button key={a.label} className="ap-btn" style={{ background:a.bg, border:"1px solid #e8e0d5", color:"#2c1a0e" }} onClick={() => navigate(a.path)}>
                  <div className="ap-btn-icon" style={{ background:"rgba(139,69,19,0.08)" }}>{a.icon}</div>
                  {a.label}
                  <span className="ap-btn-arrow">→</span>
                </button>
              ))}
              <button className="ap-btn" style={{ background:"#fff5f5", border:"1px solid #f5c6c6", color:"#8B2020" }} onClick={handleLogout}>
                <div className="ap-btn-icon" style={{ background:"rgba(139,0,0,0.08)" }}>🚪</div>
                Logout
                <span className="ap-btn-arrow">→</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default ArtisanProfile;