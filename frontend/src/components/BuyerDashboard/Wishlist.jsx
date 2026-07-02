import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/Wishlist.css";

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton-line sk-short" />
        <div className="skeleton-line sk-med" />
        <div className="skeleton-line sk-full" />
        <div className="skeleton-line sk-short" />
      </div>
    </div>
  );
}

function Wishlist({ onNavigate }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [toast, setToast] = useState({ msg: "", show: false });

  const email = localStorage.getItem("email");

  /* ── Toast helper ── */
  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  }, []);

  /* ── Fetch wishlist ── */
  useEffect(() => {
    if (!email) {
      setError(t("wishlist_error_login"));
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get(`http://127.0.0.1:8000/api/wishlist/${email}/`)
      .then((res) => { setItems(res.data); setLoading(false); })
      .catch((err) => {
        console.error("Fetch wishlist error:", err.response?.data);
        setError(t("wishlist_error_load"));
        setLoading(false);
      });
  }, [email, t]);

  /* ── Remove from wishlist ── */
  const removeFromWishlist = async (e, productId) => {
    e.stopPropagation();
    if (!email) return;

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/remove-from-wishlist/",
        { email, product_id: productId },
        { headers: { "Content-Type": "application/json" } }
      );
      setItems((prev) => prev.filter((item) => item.id !== productId));
      showToast(t("wishlist_removed"));
    } catch (err) {
      console.error("Remove error:", err.response?.data);
      showToast(t("wishlist_remove_fail"));
    }
  };

  /* ── Add to cart from wishlist ── */
  const addToCart = async (e, productId) => {
    e.stopPropagation();
    if (!email) return;

    const formData = new FormData();
    formData.append("email", email);
    formData.append("product_id", productId);

    try {
      await axios.post("http://127.0.0.1:8000/api/add-to-cart/", formData);
      showToast(t("wishlist_added_to_bag"));
    } catch (err) {
      console.error(err);
      showToast(t("wishlist_add_bag_fail"));
    }
  };

  /* ── Sort pipeline ── */
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "price-asc") return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === "price-desc") return parseFloat(b.price) - parseFloat(a.price);
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    return 0;
  });

  /* ── Error state ── */
  if (error) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-error">
          <div className="wishlist-error-card">
            <span className="wishlist-error-icon">⚠️</span>
            <div className="wishlist-error-title">{t("wishlist_error_title")}</div>
            <p className="wishlist-error-sub">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">

      {/* ── Hero Banner ── */}
      <div className="wishlist-hero">
        <div className="wishlist-hero-inner">
          <div className="wishlist-hero-left">
            <div className="wishlist-hero-eyebrow">{t("wishlist_eyebrow")}</div>
            <div className="wishlist-hero-title">
              {t("wishlist_title")}
            </div>
          </div>
          <div className="wishlist-hero-count">
            {t("wishlist_saved_items", { count: items.length })}
          </div>
        </div>
      </div>

      {/* ── Sticky Toolbar ── */}
      <div className="wishlist-toolbar">
        <div className="wishlist-toolbar-left">
          <strong>{sortedItems.length}</strong> {t("wishlist_saved_label")}
        </div>
        <div className="wishlist-toolbar-right">
          <select
            className="wishlist-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">{t("wishlist_sort_default")}</option>
            <option value="price-asc">{t("wishlist_sort_price_low")}</option>
            <option value="price-desc">{t("wishlist_sort_price_high")}</option>
            <option value="name-asc">{t("wishlist_sort_name")}</option>
          </select>

          {items.length > 0 && (
            <button
              className="wishlist-clear-btn"
              onClick={() => {
                if (window.confirm(t("wishlist_clear_all_confirm"))) {
                  items.forEach(item =>
                    removeFromWishlist({ stopPropagation: () => { } }, item.id)
                  );
                }
              }}
            >
              {t("wishlist_clear_all")}
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="wishlist-body">
        <div className="wishlist-container">

          {/* Skeleton loading */}
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}

          {/* Empty state */}
          {!loading && sortedItems.length === 0 && (
            <div className="wishlist-empty">
              <span className="wishlist-empty-icon">🤍</span>
              <div className="wishlist-empty-title">
                {t("wishlist_empty_title")}
              </div>
              <p className="wishlist-empty-sub">
                {t("wishlist_empty_body")}
              </p>
              <button
                className="wishlist-empty-btn"
                onClick={() => onNavigate ? onNavigate("shop") : navigate(-1)}
              >
                {t("wishlist_empty_cta")}
              </button>
            </div>
          )}

          {/* Wishlist cards */}
          <AnimatePresence>
            {!loading && sortedItems.map((item, index) => (
              <motion.div
                key={item.id}
                className="wishlist-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => navigate(`/product/${item.id}`)}
              >
                {/* Image */}
                <div className="wishlist-image-wrap">
                  <img
                    src={
                      item.image
                        ? `http://127.0.0.1:8000${item.image}`
                        : "https://via.placeholder.com/300x260?text=No+Image"
                    }
                    alt={item.name}
                    className="wishlist-image"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x260?text=No+Image";
                    }}
                  />
                </div>

                {/* Heart remove button */}
                <motion.div
                  className="heart-icon"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.75 }}
                  onClick={(e) => removeFromWishlist(e, item.id)}
                  title={t("wishlist_remove_tooltip")}
                >
                  ❤️
                </motion.div>

                {/* Info */}
                <div className="wishlist-info">
                  {item.artisan && (
                    <div className="wishlist-artisan">{item.artisan}</div>
                  )}
                  <div className="wishlist-name">{item.name}</div>
                  <div className="wishlist-footer">
                    <span className="wishlist-price">₹{item.price}</span>
                    <button
                      className="wishlist-cart-btn"
                      onClick={(e) => addToCart(e, item.id)}
                    >
                      <span>{t("wishlist_add_to_bag")}</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>

        </div>
      </div>

      {/* ── Toast ── */}
      <div className={`wishlist-toast ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>

    </div>
  );
}

export default Wishlist;