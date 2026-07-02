import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/Artisanorders.css";

const BASE_URL = "http://127.0.0.1:8000";

const STATUS_OPTIONS = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_COLORS = {
  Pending:    { bg: "#fff8e6", color: "#b07d00", dot: "#f0b429" },
  Processing: { bg: "#e8f0ff", color: "#2563eb", dot: "#3b82f6" },
  Shipped:    { bg: "#e8f5e9", color: "#15803d", dot: "#22c55e" },
  Delivered:  { bg: "#f0fdf4", color: "#166534", dot: "#16a34a" },
  Cancelled:  { bg: "#fff0f0", color: "#dc2626", dot: "#ef4444" },
};

function SkeletonRow() {
  return (
    <div className="ao-skeleton-row">
      <div className="ao-sk ao-sk-img" />
      <div className="ao-sk ao-sk-md" />
      <div className="ao-sk ao-sk-sm" />
      <div className="ao-sk ao-sk-md" />
      <div className="ao-sk ao-sk-sm" />
      <div className="ao-sk ao-sk-lg" />
    </div>
  );
}

const ArtisanOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const email = localStorage.getItem("email") || "";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState({ msg: "", show: false });
  const [expanded, setExpanded] = useState(null);

  /* ✅ Load saved language */
  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang) i18n.changeLanguage(savedLang);
  }, []);

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  }, []);

  const fetchOrders = useCallback(() => {
    if (!email) {
      setError(t("not_logged_orders") || "Not logged in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    axios
      .get(`${BASE_URL}/api/artisan-orders/`, { params: { email } })
      .then((res) => {
        setOrders(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err.response?.data || err.message);
        setError(t("load_orders_error") || "Failed to load orders.");
        setLoading(false);
      });
  }, [email, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, location.key]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${BASE_URL}/api/update-order-status/${orderId}/`, {
        status: newStatus,
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      showToast(t("order_updated") || `Order updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      showToast(t("update_failed") || "Update failed");
    }
  };

  /* FILTER */
  const filtered = orders.filter((o) => {
    const matchStatus = filter === "All" || o.status === filter;
    const matchSearch =
      o.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search);

    return matchStatus && matchSearch;
  });

  /* STATS */
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "Pending").length,
    shipped: orders.filter((o) => o.status === "Shipped").length,
    delivered: orders.filter((o) => o.status === "Delivered").length,
    revenue: orders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)
      .toFixed(2),
  };

  const resolveImage = (order) => {
    if (!order.product_image) return "https://placehold.co/56x56?text=📦";
    return order.product_image.startsWith("http")
      ? order.product_image
      : `${BASE_URL}${order.product_image}`;
  };

  /* NOT LOGGED */
  if (!email) {
    return (
      <div className="ao-root">
        <div className="ao-empty">
          <span className="ao-empty-icon">🔒</span>
          <p>{t("not_logged_orders") || "Please log in to view your orders."}</p>
          <button onClick={() => navigate("/login")}>
            {t("go_to_login") || "Go to Login →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ao-root">

      {/* HEADER */}
      <div className="ao-header">
        <div>
          <div className="ao-eyebrow">✦ {t("artisan_studio") || "Artisan Studio"}</div>
          <h1 className="ao-title">
            {t("my_orders") || "My"} <em>{t("orders") || "Orders"}</em>
          </h1>
          <div className="ao-divider" />
        </div>

        <button className="ao-dash-btn" onClick={() => navigate("/artisan-dashboard")}>
          ← {t("dashboard") || "Dashboard"}
        </button>
      </div>

      {/* STATS */}
      <div className="ao-stats">
        <div className="ao-stat">
          <div className="ao-stat-val">{stats.total}</div>
          <div className="ao-stat-label">{t("total_orders") || "Total Orders"}</div>
        </div>
        <div className="ao-stat">
          <div className="ao-stat-val ao-stat-gold">{stats.pending}</div>
          <div className="ao-stat-label">{t("pending") || "Pending"}</div>
        </div>
        <div className="ao-stat">
          <div className="ao-stat-val ao-stat-blue">{stats.shipped}</div>
          <div className="ao-stat-label">{t("shipped") || "Shipped"}</div>
        </div>
        <div className="ao-stat">
          <div className="ao-stat-val ao-stat-green">{stats.delivered}</div>
          <div className="ao-stat-label">{t("delivered") || "Delivered"}</div>
        </div>
        <div className="ao-stat">
          <div className="ao-stat-val">₹{stats.revenue}</div>
          <div className="ao-stat-label">{t("revenue") || "Revenue"}</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="ao-toolbar">
        <div className="ao-search-wrap">
          <span className="ao-search-icon">🔍</span>
          <input
            className="ao-search"
            placeholder={t("search_orders") || "Search by product, buyer or order ID…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ao-filters">
          {["All", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              className={`ao-filter-btn ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {t(s.toLowerCase()) || s}
              <span className="ao-filter-count">
                {s === "All"
                  ? orders.length
                  : orders.filter((o) => o.status === s).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="ao-error-banner">
          ⚠️ {error}
          <button onClick={fetchOrders}>Retry</button>
        </div>
      )}

      {/* TABLE */}
      <div className="ao-table-wrap">

        <div className="ao-table-head">
          <span>{t("product") || "Product"}</span>
          <span>{t("order_id") || "Order ID"}</span>
          <span>{t("buyer") || "Buyer"}</span>
          <span>{t("amount") || "Amount"}</span>
          <span>{t("date") || "Date"}</span>
          <span>{t("status") || "Status"}</span>
        </div>

        {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

        {!loading &&
          filtered.map((order) => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.Pending;
            const isExpanded = expanded === order.id;

            return (
              <div key={order.id} className="ao-row-wrap">
                <div className="ao-row">

                  <div className="ao-row-product">
                    <img src={resolveImage(order)} alt="" className="ao-row-img" />
                    <div>
                      <div className="ao-row-pname">{order.product_name}</div>
                      <div className="ao-row-qty">Qty: {order.quantity}</div>
                    </div>
                  </div>

                  <div className="ao-row-id">#{order.id}</div>

                  <div className="ao-row-buyer">
                    <div>{order.buyer_name || order.buyer_email}</div>
                    <button
                      className="ao-addr-toggle"
                      onClick={() => setExpanded(isExpanded ? null : order.id)}
                    >
                      {isExpanded ? "Hide address ▲" : "View address ▼"}
                    </button>
                  </div>

                  <div className="ao-row-amount">₹{order.total_price}</div>

                  <div className="ao-row-date">
                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </div>

                  <div className="ao-row-status">
                    <select
                      className="ao-status-select"
                      value={order.status}
                      style={{ background: sc.bg, color: sc.color }}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <div className={`ao-toast ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
};

export default ArtisanOrders;