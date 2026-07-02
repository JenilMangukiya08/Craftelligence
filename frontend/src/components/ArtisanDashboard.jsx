import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import "../styles/Dashboard.css";

const BASE_URL = "http://127.0.0.1:8000";

const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", path: null },
  { icon: "➕", label: "Add Product", path: "/add-product" },
  { icon: "🏺", label: "My Products", path: "/my-products" },
  { icon: "📦", label: "Orders", path: "/artisan-orders" },
];

const STATUS_COLOR = {
  Pending: "#f0b429",
  Processing: "#3b82f6",
  Shipped: "#22c55e",
  Delivered: "#16a34a",
  Cancelled: "#ef4444",
};

/* ✅ IMPROVED LANGUAGE SWITCH (keeps your "lang") */
function LangBtn({ i18n }) {
  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang); // keep your key
  };

  const cur = (i18n.language || "en").slice(0, 2);

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {["en", "hi", "gu"].map((code) => (
        <button
          key={code}
          onClick={() => changeLang(code)}
          style={{
            padding: "5px 10px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: cur === code ? "#8B4513" : "#fff",
            color: cur === code ? "#fff" : "#333",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function ArtisanDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [active, setActive] = useState("Dashboard"); // ✅ keep your label system
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const email = localStorage.getItem("email") || "";
  const firstName = email.split("@")[0];

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* ✅ LOAD SAVED LANGUAGE */
  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang) i18n.changeLanguage(savedLang);
  }, []);

  /* ✅ FETCH DATA */
  useEffect(() => {
    if (!email) return;

    const load = async () => {
      setLoading(true);
      try {
        const [pRes, oRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/products/?email=${email}`),
          axios.get(`${BASE_URL}/api/artisan-orders/?email=${email}`),
        ]);

        const products = Array.isArray(pRes.data) ? pRes.data : [];
        const orders = Array.isArray(oRes.data) ? oRes.data : [];

        const revenue = orders
          .filter((o) => o.status !== "Cancelled")
          .reduce((s, o) => s + parseFloat(o.total_price || 0), 0);

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue: revenue,
          pending: orders.filter((o) => o.status === "Pending").length,
          delivered: orders.filter((o) => o.status === "Delivered").length,
          shipped: orders.filter((o) => o.status === "Shipped").length,
          recentOrders: orders.slice(0, 3),
        });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    load();
  }, [email]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const STAT_CARDS = !stats
    ? []
    : [
      {
        icon: "🏺",
        label: t("total_products"),
        value: stats.totalProducts,
        trend: t("listed_store"),
        accent: "#8B4513",
      },
      {
        icon: "📦",
        label: t("total_orders"),
        value: stats.totalOrders,
        trend: `${stats.pending} ${t("pending")}`,
        accent: "#a0522d",
      },
      {
        icon: "💰",
        label: t("total_revenue"),
        value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
        trend: `${stats.shipped} ${t("in_transit")}`,
        accent: "#6B4226",
      },
    ];

  const QUICK_ACTIONS = [
    { icon: "➕", title: t("add_product"), desc: t("add_product_desc"), path: "/add-product" },
    { icon: "🏺", title: t("my_products"), desc: t("my_products_desc"), path: "/my-products" },
    { icon: "📦", title: t("view_orders"), desc: t("view_orders_desc"), path: "/artisan-orders" },
  ];

  return (
    <div className="dashboard-container">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-text">Craft<em>elligence</em></div>
          <div className="sidebar-tagline">{t("artisan_studio")}</div>
        </div>

        <div className="sidebar-artisan">
          <div className="sidebar-avatar">🏺</div>
          <div>
            <div className="sidebar-artisan-name">{firstName}</div>
            <div className="sidebar-artisan-role">{t("verified_artisan")}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">{t("menu")}</div>

          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`sidebar-btn ${active === item.label ? "active" : ""}`}
              onClick={() => {
                setActive(item.label);
                if (item.path) navigate(item.path);
              }}
            >
              <span className="sidebar-btn-icon">{item.icon}</span>
              {t(item.label.toLowerCase().replace(" ", "_"))}
            </button>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          ⏻ {t("logout")}
        </button>
      </aside>

      {/* MAIN */}
      <main className="dashboard-main">

        {/* TOPBAR */}
        <div className="dashboard-topbar">
          <div className="topbar-title">
            {t("good_day")}, <em>{firstName}</em> 👋
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <LangBtn i18n={i18n} />
            <span className="topbar-date">{today}</span>
            <span className="topbar-badge">{t("artisan")}</span>
          </div>
        </div>

        <div className="dashboard-body">

          {/* WELCOME */}
          <div className="welcome-banner">
            <div className="welcome-eyebrow">✦ {t("studio_overview")}</div>
            <h1 className="welcome-title">
              {t("welcome_back")} <br />
              <em>{firstName}.</em>
            </h1>

            <p className="welcome-sub">{t("dashboard_subtext")}</p>

            <div className="welcome-actions">
              <button onClick={() => navigate("/add-product")} className="welcome-btn">
                + {t("add_new_product")}
              </button>
              <button onClick={() => navigate("/artisan-orders")} className="welcome-btn-outline">
                {t("view_orders")}
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="cards">
            {loading
              ? [1, 2, 3].map((i) => <div key={i} className="card-box" />)
              : STAT_CARDS.map((s) => (
                <div key={s.label} className="card-box" style={{ borderTop: `3px solid ${s.accent}` }}>
                  <span className="card-box-icon">{s.icon}</span>
                  <h3>{s.label}</h3>
                  <p style={{ fontSize: 30, fontWeight: 800 }}>{s.value}</p>
                  <div className="card-box-trend">{s.trend}</div>
                </div>
              ))}
          </div>

          {/* ✅ RECENT ORDERS (NEW FEATURE) */}
          {!loading && stats?.recentOrders?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3>{t("recent_orders")}</h3>
              {stats.recentOrders.map((o) => (
                <div key={o.id} style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                  <b>{o.product_name}</b> — ₹{o.total_price}
                  <span style={{ marginLeft: 10, color: STATUS_COLOR[o.status] }}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* QUICK ACTIONS */}
          <div className="quick-actions">
            {QUICK_ACTIONS.map((q) => (
              <div key={q.title} className="quick-action-card" onClick={() => navigate(q.path)}>
                <span>{q.icon}</span>
                <div>{q.title}</div>
                <div>{q.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}

export default ArtisanDashboard;