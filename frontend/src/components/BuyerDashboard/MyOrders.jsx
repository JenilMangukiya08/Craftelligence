import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

const BASE_URL = "http://127.0.0.1:8000";

// ── get_orders returns:
// [{ id, total_amount, payment_status, payment_method, created_at,
//    items: [{ product_id, product_name, quantity, price, image }] }]

const STATUS_STYLE = {
  Pending: { bg: "#fff8e6", color: "#b07d00", border: "#f0d080", dot: "#f0b429" },
  Processing: { bg: "#e8f0ff", color: "#2563eb", border: "#b6c8f5", dot: "#3b82f6" },
  Shipped: { bg: "#e8f5e9", color: "#15803d", border: "#a8d5b0", dot: "#22c55e" },
  Delivered: { bg: "#f0fdf4", color: "#166534", border: "#86efac", dot: "#16a34a" },
  Cancelled: { bg: "#fff0f0", color: "#dc2626", border: "#fca5a5", dot: "#ef4444" },
  Paid: { bg: "#f0fdf4", color: "#166534", border: "#86efac", dot: "#16a34a" },
};

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const s = STATUS_STYLE[status] || STATUS_STYLE["Pending"];
  const displayStatus = t(`status_${status.toLowerCase()}`) || status;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {displayStatus}
    </span>
  );
};

const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function MyOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState(null); // expanded order id
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  const fetchOrders = useCallback(() => {
    if (!email) { navigate("/login"); return; }
    setLoading(true);
    axios.get(`${BASE_URL}/api/orders/${email}/`)
      .then(res => {
        setOrders(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
        setTimeout(() => setAnimate(true), 50);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [email, navigate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Filter by payment_status (matches your Order model field)
  const FILTERS = ["All", "Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled"];
  const filtered = filter === "All"
    ? orders
    : orders.filter(o => o.payment_status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.payment_status === "Pending").length,
    active: orders.filter(o => ["Processing", "Shipped"].includes(o.payment_status)).length,
    delivered: orders.filter(o => o.payment_status === "Delivered").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Nunito:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f5ede4;}
        .mo-root{min-height:100vh;background:#f5ede4;font-family:'Nunito',sans-serif;}

        .mo-topbar{background:#1e1008;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;}
        .mo-brand{font-family:'Playfair Display',serif;font-size:18px;font-weight:800;color:#f7c948;cursor:pointer;}
        .mo-brand span{color:#e8d5b0;}
        .mo-back{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#e8d5b0;padding:7px 16px;border-radius:8px;cursor:pointer;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;}
        .mo-back:hover{background:rgba(255,255,255,0.14);}

        .mo-hero{background:linear-gradient(135deg,#5c2a0e 0%,#8B4513 45%,#a0522d 100%);padding:40px 32px 72px;position:relative;overflow:hidden;text-align:center;}
        .mo-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.04);}
        .mo-hero-eyebrow{font-size:11px;font-weight:700;letter-spacing:2.5px;color:rgba(255,220,170,0.6);text-transform:uppercase;margin-bottom:12px;}
        .mo-hero-title{font-family:'Playfair Display',serif;font-size:32px;font-weight:800;color:#fff8f0;margin-bottom:4px;}
        .mo-hero-title em{color:#f7c948;font-style:italic;}
        .mo-hero-sub{font-size:14px;color:rgba(255,220,170,0.65);}

        .mo-stats{display:flex;gap:12px;max-width:700px;margin:-30px auto 0;padding:0 20px;position:relative;z-index:2;}
        .mo-stat{flex:1;background:#fff;border-radius:14px;padding:16px 14px;border:1px solid #e8e0d5;text-align:center;box-shadow:0 2px 12px rgba(139,69,19,0.09);}
        .mo-stat-val{font-family:'Playfair Display',serif;font-size:24px;font-weight:800;color:#2c1a0e;line-height:1;}
        .mo-stat-val.gold{color:#b07d00;} .mo-stat-val.blue{color:#2563eb;} .mo-stat-val.green{color:#166534;}
        .mo-stat-label{font-size:11px;color:#9e8a78;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;}

        .mo-content{max-width:700px;margin:24px auto 60px;padding:0 20px;}

        .mo-filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;background:#fff;padding:6px;border-radius:14px;border:1px solid #e8e0d5;box-shadow:0 1px 6px rgba(139,69,19,0.05);}
        .mo-filter-btn{padding:7px 14px;border-radius:10px;border:none;cursor:pointer;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;background:transparent;color:#9e8a78;transition:all 0.18s;display:flex;align-items:center;gap:5px;}
        .mo-filter-btn:hover{background:#faf0e4;color:#5c4033;}
        .mo-filter-btn.active{background:#1e1008;color:#f7c948;}
        .mo-filter-count{background:rgba(0,0,0,0.08);font-size:11px;font-weight:800;padding:1px 7px;border-radius:10px;}
        .mo-filter-btn.active .mo-filter-count{background:rgba(247,201,72,0.2);}

        .mo-card{background:#fff;border-radius:16px;border:1px solid #e8e0d5;box-shadow:0 2px 12px rgba(139,69,19,0.06);margin-bottom:16px;overflow:hidden;opacity:0;transform:translateY(20px);transition:opacity 0.4s ease,transform 0.4s ease;}
        .mo-card.visible{opacity:1;transform:translateY(0);}
        .mo-card:hover{box-shadow:0 4px 20px rgba(139,69,19,0.12);}

        .mo-card-header{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f5f0eb;background:#faf6f1;}
        .mo-order-id{font-family:'Playfair Display',serif;font-size:15px;font-weight:800;color:#2c1a0e;}
        .mo-order-meta{font-size:12px;color:#c4b5a5;margin-top:2px;display:flex;gap:10px;}

        /* Items list inside card */
        .mo-items-list{padding:0 20px;}
        .mo-item-row{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #f5f0eb;}
        .mo-item-row:last-child{border-bottom:none;}
        .mo-item-img{width:56px;height:56px;border-radius:10px;object-fit:cover;border:1px solid #e8e0d5;flex-shrink:0;background:#faf0e4;}
        .mo-item-info{flex:1;min-width:0;}
        .mo-item-name{font-weight:700;color:#2c1a0e;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .mo-item-qty{font-size:12px;color:#9e8a78;margin-top:3px;}
        .mo-item-price{font-family:'Playfair Display',serif;font-size:16px;font-weight:800;color:#8B4513;flex-shrink:0;}

        .mo-card-footer{padding:12px 20px;border-top:1px solid #f5f0eb;display:flex;align-items:center;justify-content:space-between;background:#fdfaf7;}
        .mo-total-label{font-size:12px;color:#9e8a78;font-weight:600;}
        .mo-total-val{font-family:'Playfair Display',serif;font-size:18px;font-weight:800;color:#8B4513;}
        .mo-expand-btn{background:none;border:1px solid #e8e0d5;color:#8B4513;padding:6px 14px;border-radius:8px;cursor:pointer;font-family:'Nunito',sans-serif;font-size:12px;font-weight:600;}
        .mo-expand-btn:hover{background:#faf0e4;}

        .mo-empty{text-align:center;padding:60px 20px;background:#fff;border-radius:16px;border:1px solid #e8e0d5;}
        .mo-empty-icon{font-size:48px;display:block;margin-bottom:16px;}
        .mo-empty-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:800;color:#2c1a0e;margin-bottom:8px;}
        .mo-empty-sub{font-size:14px;color:#9e8a78;margin-bottom:24px;}
        .mo-shop-btn{background:#8B4513;border:none;color:#fff8f0;padding:12px 28px;border-radius:12px;cursor:pointer;font-family:'Nunito',sans-serif;font-size:14px;font-weight:800;}

        .mo-skeleton{background:#fff;border-radius:16px;border:1px solid #e8e0d5;padding:20px;margin-bottom:14px;}
        .mo-sk{background:linear-gradient(90deg,#f5ede4 25%,#ede3d8 50%,#f5ede4 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;height:14px;margin-bottom:10px;}
        .mo-sk-w{width:60%;} .mo-sk-m{width:40%;} .mo-sk-s{width:25%;}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        @media(max-width:500px){
          .mo-stats{gap:8px;} .mo-stat{padding:12px 8px;} .mo-stat-val{font-size:20px;}
          .mo-item-row{flex-wrap:wrap;}
        }
      `}</style>

      <div className="mo-root">

        {/* Topbar */}
        <div className="mo-topbar">
          <div className="mo-brand" onClick={() => navigate("/buyer-dashboard")}>
            Craft<span>elligence</span>
          </div>
          <button className="mo-back" onClick={() => navigate("/buyer-dashboard")}>← {t("dashboard")}</button>
        </div>

        {/* Hero */}
        <div className="mo-hero">
          <div className="mo-hero-eyebrow">✦ {t("profile_badge")}</div>
          <div className="mo-hero-title">{t("my_orders_title")}</div>
          <div className="mo-hero-sub">{t("mo_track")}</div>
        </div>

        {/* Stats */}
        <div className="mo-stats">
          <div className="mo-stat"><div className="mo-stat-val">{stats.total}</div><div className="mo-stat-label">{t("mo_total")}</div></div>
          <div className="mo-stat"><div className="mo-stat-val gold">{stats.pending}</div><div className="mo-stat-label">{t("mo_pending")}</div></div>
          <div className="mo-stat"><div className="mo-stat-val blue">{stats.active}</div><div className="mo-stat-label">{t("mo_active")}</div></div>
          <div className="mo-stat"><div className="mo-stat-val green">{stats.delivered}</div><div className="mo-stat-label">{t("mo_delivered")}</div></div>
        </div>

        <div className="mo-content">

          {/* Filters */}
          <div className="mo-filters">
            {FILTERS.map(f => (
              <button key={f} className={`mo-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f}
                <span className="mo-filter-count">
                  {f === "All" ? orders.length : orders.filter(o => o.payment_status === f).length}
                </span>
              </button>
            ))}
          </div>

          {/* Skeletons */}
          {loading && [1, 2, 3].map(i => (
            <div key={i} className="mo-skeleton">
              <div className="mo-sk mo-sk-w" /><div className="mo-sk mo-sk-m" /><div className="mo-sk mo-sk-s" />
            </div>
          ))}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="mo-empty">
              <span className="mo-empty-icon">📭</span>
              <div className="mo-empty-title">{filter === "All" ? t("mo_no_orders") : `No ${filter} orders`}</div>
              <p className="mo-empty-sub">{filter === "All" ? "Once you place an order it will appear here." : "Try a different filter."}</p>
              {filter === "All" && <button className="mo-shop-btn" onClick={() => navigate("/buyer-dashboard")}>{t("mo_start_shop")}</button>}
            </div>
          )}

          {/* Order cards */}
          {/* Each order has: id, total_amount, payment_status, payment_method, created_at, items[] */}
          {!loading && filtered.map((order, i) => (
            <div
              key={order.id}
              className={`mo-card ${animate ? "visible" : ""}`}
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              {/* Header */}
              <div className="mo-card-header">
                <div>
                  <div className="mo-order-id">Order #{order.id}</div>
                  <div className="mo-order-meta">
                    <span>📅 {fmtDate(order.created_at)}</span>
                    <span>💳 {order.payment_method || "COD"}</span>
                    <span>🛍️ {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <StatusBadge status={order.payment_status || "Pending"} />
              </div>

              {/* Items — each item has: product_id, product_name, quantity, price, image */}
              <div className="mo-items-list">
                {(order.items || []).map((item, j) => (
                  <div key={j} className="mo-item-row">
                    <img
                      className="mo-item-img"
                      src={
                        item.image
                          ? item.image.startsWith("http") ? item.image : `${BASE_URL}${item.image}`
                          : "https://placehold.co/56x56?text=📦"
                      }
                      alt={item.product_name}
                      onError={e => { e.target.src = "https://placehold.co/56x56?text=📦"; }}
                    />
                    <div className="mo-item-info">
                      <div className="mo-item-name">{item.product_name || "—"}</div>
                      <div className="mo-item-qty">Qty: {item.quantity} × {fmt(item.price)}</div>
                    </div>
                    <div className="mo-item-price">{fmt(parseFloat(item.price) * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mo-card-footer">
                <div>
                  <div className="mo-total-label">{t("mo_total")}</div>
                  <div className="mo-total-val">{fmt(order.total_amount)}</div>
                </div>
                <button
                  className="mo-expand-btn"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  {expanded === order.id ? `▲ ${t("mo_less")}` : `▼ ${t("mo_details")}`}
                </button>
              </div>

              {/* Expanded: show order item statuses */}
              {expanded === order.id && (
                <div style={{ padding: "14px 20px", borderTop: "1px solid #f5f0eb", background: "#fdfaf7" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#9e8a78", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
                    {t("mo_item_status")}
                  </div>
                  {(order.items || []).map((item, j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: j < order.items.length - 1 ? "1px solid #f5f0eb" : "none" }}>
                      <span style={{ fontSize: 14, color: "#2c1a0e", fontWeight: 600 }}>{item.product_name}</span>
                      <StatusBadge status={item.status || order.payment_status || "Pending"} />
                    </div>
                  ))}
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#f5ede4", borderRadius: 10, fontSize: 13, color: "#9e8a78" }}>
                    📦 Payment: <strong style={{ color: "#2c1a0e" }}>{order.payment_method || "COD"}</strong>
                    &nbsp;·&nbsp;
                    Status: <strong style={{ color: "#2c1a0e" }}>{order.payment_status}</strong>
                  </div>
                </div>
              )}
            </div>
          ))}

        </div>
      </div>
    </>
  );
}

export default MyOrders;