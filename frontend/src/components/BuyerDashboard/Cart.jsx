import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import "../../styles/Cart.css";

function Cart({ onNavigate }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState({ msg: "", show: false });

  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  /* ── Toast helper ── */
  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2600);
  }, []);

  /* ── Fetch cart ── */
  useEffect(() => {
    if (!email) return;
    setFetching(true);
    axios.get(`http://127.0.0.1:8000/api/cart/${email}/`)
      .then(res => { setItems(res.data); setFetching(false); })
      .catch(err => { console.log(err); setFetching(false); });
  }, [email]);

  /* ── Checkout ── */
  const handlePayment = async () => {
    if (!email) { showToast(`⚠️  ${t("cart_error_login")}`); return; }
    if (items.length === 0) { showToast(`🛒  ${t("cart_error_empty")}`); return; }

    // ── COD: go to address page first ──────────────────────────────────────
    if (paymentMethod === "COD") {
      navigate("/cart-checkout", {
        state: { items, paymentMethod: "COD" }
      });
      return;
    }

    // ── ONLINE: Stripe checkout ─────────────────────────────────────────────
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      const res = await axios.post("http://127.0.0.1:8000/api/create-checkout-session/", formData);
      if (!res.data.checkout_url) { showToast("❌  Stripe session creation failed."); return; }
      window.location.href = res.data.checkout_url;
    } catch (error) {
      console.log("Payment error:", error);
      showToast("❌  Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Update quantity ── */
  const updateQuantity = async (productId, action) => {
    try {
      await axios.post("http://127.0.0.1:8000/api/update-cart/", {
        email, product_id: productId, action,
      });
      setItems(prev =>
        prev
          .map(item =>
            item.id === productId
              ? { ...item, quantity: action === "increase" ? item.quantity + 1 : item.quantity - 1 }
              : item
          )
          .filter(item => item.quantity > 0)
      );
    } catch (err) { console.log(err); }
  };

  /* ── Remove item ── */
  const removeItem = async (productId) => {
    try {
      await axios.post("http://127.0.0.1:8000/api/remove-from-cart/", {
        email, product_id: productId,
      });
      setItems(prev => prev.filter(item => item.id !== productId));
      showToast(`🗑️  ${t("cart_removed_item")}`);
    } catch (err) { console.log(err); }
  };

  /* ── Totals ── */
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <>
      {/* ── Banner ── */}
      <div className="cart-banner">
        <div className="cart-banner-inner">
          <div>
            <div className="cart-banner-eyebrow">{t("cart_banner_eyebrow")}</div>
            <div className="cart-banner-title">
              {t("cart_banner_title")} <em>{t("cart_banner_title_em")}</em>
            </div>
          </div>
          <div className="cart-banner-count">
            {items.length} {items.length === 1 ? t("cart_item_singular") : t("cart_item_plural")}
          </div>
        </div>
      </div>

      <div className="cart-container">

        {/* ══ LEFT — ITEMS ══ */}
        <div className="cart-left">

          <div className="cart-title">
            {t("cart_items_title")}
            <div className="cart-title-bar" />
          </div>

          {/* Loading skeleton */}
          {fetching && (
            <div style={{ opacity: 0.5, fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", fontWeight: 300, color: "#3d2b1f", padding: "40px 0" }}>
              {t("cart_loading")}
            </div>
          )}

          {/* Empty state */}
          {!fetching && items.length === 0 && (
            <div className="cart-empty">
              <span className="cart-empty-icon">🛍️</span>
              <div className="cart-empty-title">{t("cart_empty_title")}</div>
              <p className="cart-empty-sub">{t("cart_empty_sub")}</p>
              <button
                className="cart-empty-btn"
                onClick={() => onNavigate && onNavigate("shop")}
              >
                {t("cart_continue_shopping")}
              </button>
            </div>
          )}

          {/* Cart items */}
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                className="cart-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="cart-image-wrap">
                  <img
                    src={`http://127.0.0.1:8000${item.image}`}
                    className="cart-image"
                    alt={item.name}
                    onError={e => { e.target.src = "https://via.placeholder.com/130x130?text=No+Image"; }}
                  />
                </div>

                <div className="cart-details">
                  {item.artisan && <div className="cart-artisan">{item.artisan}</div>}
                  <div className="cart-name">{item.name}</div>
                  <div className="cart-price">₹{item.price}</div>

                  <div className="quantity-controls">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, "decrease")}>−</button>
                    <span className="qty-val">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, "increase")}>+</button>
                  </div>

                  <button className="remove-btn" onClick={() => removeItem(item.id)}>{t("cart_remove")}</button>
                </div>

                <div className="cart-item-total">
                  <div className="cart-item-total-label">{t("cart_item_subtotal")}</div>
                  <div className="cart-item-total-val">₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ══ RIGHT — SUMMARY ══ */}
        <div className="cart-right">
          <div className="summary-box">

            <div className="summary-title">{t("cart_summary_title")}</div>

            <div className="summary-row">
              <span>{t("cart_summary_subtotal", { count: items.length })}</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>{t("cart_summary_gst")}</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>{t("cart_summary_delivery")}</span>
              <span style={{ color: "#4a7c59", fontWeight: 500 }}>{t("cart_summary_delivery_free")}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row summary-total">
              <span>{t("cart_summary_total")}</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            {/* Payment method */}
            <div className="payment-label">{t("cart_payment_method")}</div>
            <div className="payment-options">
              <button
                className={`payment-option ${paymentMethod === "COD" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("COD")}
              >
                <span className="payment-option-icon">🚚</span>
                {t("cart_payment_cod")}
              </button>
              <button
                className={`payment-option ${paymentMethod === "ONLINE" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("ONLINE")}
              >
                <span className="payment-option-icon">💳</span>
                {t("cart_payment_online")}
              </button>
            </div>

            <button
              className="pay-btn"
              onClick={handlePayment}
              disabled={loading || items.length === 0}
            >
              <span>
                {loading && <span className="btn-spinner" />}
                {loading
                  ? t("cart_processing")
                  : paymentMethod === "COD"
                    ? t("cart_enter_address")
                    : t("cart_pay_securely")}
              </span>
            </button>

            <div className="summary-trust">
              <div className="trust-row"><span className="trust-icon">🔒</span> {t("cart_trust_secure")}</div>
              <div className="trust-row"><span className="trust-icon">📦</span> {t("cart_trust_shipping")}</div>
              <div className="trust-row"><span className="trust-icon">↩️</span> {t("cart_trust_returns")}</div>
            </div>

          </div>
        </div>
      </div>

      <div className={`cart-toast ${toast.show ? "show" : ""}`}>{toast.msg}</div>
    </>
  );
}

export default Cart;