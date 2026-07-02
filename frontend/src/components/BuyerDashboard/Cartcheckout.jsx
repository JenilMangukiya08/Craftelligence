// src/pages/buyer/CartCheckout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Handles address collection + order placement for ALL cart items at once.
// Each cart item becomes a separate OrderItem with its own ShippingAddress.
// Reached from Cart.jsx via navigate("/cart-checkout", { state: { items } })
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "../../styles/Checkout.css"; // reuse same styles

const BASE_URL = "http://127.0.0.1:8000";

const CartCheckout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { items = [] } = location.state || {};

  const email = localStorage.getItem("email");

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });

  const [address, setAddress] = useState({
    full_name: "",
    phone: "",
    pincode: "",
    address_line: "",
    city: "",
    state: "",
    landmark: "",
  });

  // Redirect if no items
  if (!items || items.length === 0) {
    return (
      <div className="co-error">
        <div className="co-error-icon">⚠️</div>
        <p>{t("checkout_error_no_items")}</p>
        <button onClick={() => navigate("/cart")}>{t("checkout_back_to_cart")}</button>
      </div>
    );
  }

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const tax = subtotal * 0.18;
  const totalPrice = (subtotal + tax).toFixed(2);

  const showToast = (msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2800);
  };

  const handleChange = (e) =>
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const isAddressValid = () =>
    address.full_name.trim() &&
    address.phone.trim().length >= 10 &&
    address.pincode.trim().length === 6 &&
    address.address_line.trim() &&
    address.city.trim() &&
    address.state.trim();

  // Place one order per cart item (matches your existing place-order endpoint)
  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      // Place each cart item as a separate order
      const promises = items.map(item =>
        axios.post(`${BASE_URL}/api/place-order/`, {
          buyer_email: email,
          product_id: item.id,
          quantity: item.quantity,
          total_price: (item.price * item.quantity).toFixed(2),
          full_name: address.full_name,
          phone: address.phone,
          pincode: address.pincode,
          address_line: address.address_line,
          city: address.city,
          state: address.state,
          landmark: address.landmark,
        })
      );

      await Promise.all(promises);

      // Clear the cart after successful order
      await axios.post(`${BASE_URL}/api/clear-cart/`, { email }).catch(() => { });

      navigate("/cart-order-success", {
        state: { items, address, totalPrice }
      });

    } catch (err) {
      console.error(err.response?.data || err.message);
      showToast("❌  Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="co-root">

      {/* Header */}
      <div className="co-topbar">
        <button className="co-back-btn" onClick={() => navigate("/cart")}>{t("checkout_back_to_cart")}</button>
        <div className="co-brand">✦ {t("checkout_brand")}</div>
        <div />
      </div>

      {/* Step indicator */}
      <div className="co-steps">
        <div className={`co-step ${step >= 1 ? "active" : ""}`}>
          <div className="co-step-bubble">1</div>
          <span>{t("checkout_step_shipping")}</span>
        </div>
        <div className="co-step-line" />
        <div className={`co-step ${step >= 2 ? "active" : ""}`}>
          <div className="co-step-bubble">2</div>
          <span>{t("checkout_step_confirm")}</span>
        </div>
      </div>

      <div className="co-body">

        {/* ── LEFT PANEL ── */}
        <div className="co-left">

          {/* STEP 1 — Address */}
          {step === 1 && (
            <div className="co-card">
              <div className="co-card-eyebrow">{t("checkout_step_label", { step: 1, total: 2 })}</div>
              <h2 className="co-card-title">{t("checkout_shipping_title")}</h2>
              <div className="co-card-divider" />

              <div className="co-form">
                <div className="co-field-row">
                  <div className="co-field">
                    <label>{t("checkout_field_full_name")}</label>
                    <input name="full_name" placeholder={t("checkout_placeholder_full_name")} value={address.full_name} onChange={handleChange} />
                  </div>
                  <div className="co-field">
                    <label>{t("checkout_field_phone")}</label>
                    <input name="phone" placeholder={t("checkout_placeholder_phone")} maxLength={10} value={address.phone} onChange={handleChange} />
                  </div>
                </div>

                <div className="co-field co-full">
                  <label>{t("checkout_field_address_line")}</label>
                  <input name="address_line" placeholder={t("checkout_placeholder_address_line")} value={address.address_line} onChange={handleChange} />
                </div>

                <div className="co-field">
                  <label>{t("checkout_field_landmark")}</label>
                  <input name="landmark" placeholder={t("checkout_placeholder_landmark")} value={address.landmark} onChange={handleChange} />
                </div>

                <div className="co-field-row">
                  <div className="co-field">
                    <label>{t("checkout_field_city")}</label>
                    <input name="city" placeholder={t("checkout_placeholder_city")} value={address.city} onChange={handleChange} />
                  </div>
                  <div className="co-field">
                    <label>{t("checkout_field_state")}</label>
                    <input name="state" placeholder={t("checkout_placeholder_state")} value={address.state} onChange={handleChange} />
                  </div>
                  <div className="co-field co-field-sm">
                    <label>{t("checkout_field_pincode")}</label>
                    <input name="pincode" placeholder={t("checkout_placeholder_pincode")} maxLength={6} value={address.pincode} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <button className="co-primary-btn" disabled={!isAddressValid()} onClick={() => setStep(2)}>
                {t("checkout_continue_to_confirm")}
              </button>
            </div>
          )}

          {/* STEP 2 — Confirm */}
          {step === 2 && (
            <div className="co-card">
              <div className="co-card-eyebrow">{t("checkout_step_label", { step: 2, total: 2 })}</div>
              <h2 className="co-card-title">{t("checkout_confirm_title")}</h2>
              <div className="co-card-divider" />

              <div className="co-review-block">
                <div className="co-review-label">
                  {t("checkout_delivering_to")}
                  <button className="co-edit-btn" onClick={() => setStep(1)}>{t("checkout_edit")}</button>
                </div>
                <div className="co-review-address">
                  <strong>{address.full_name}</strong> · {address.phone}<br />
                  {address.address_line}{address.landmark && `, ${address.landmark}`}<br />
                  {address.city}, {address.state} — {address.pincode}
                </div>
              </div>

              <div className="co-review-block">
                <div className="co-review-label">{t("checkout_payment_label")}</div>
                <div className="co-pay-note">
                  <span className="co-pay-icon">🔒</span>
                  {t("checkout_payment_cod_note")}
                </div>
              </div>

              {/* Items list */}
              <div className="co-review-block">
                <div className="co-review-label">{t("checkout_items_label", { count: items.length })}</div>
                {items.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0ebe4", fontSize: 14 }}>
                    <span style={{ color: "#3d2b1f" }}>{item.name} × {item.quantity}</span>
                    <span style={{ color: "#8B4513", fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              <button
                className="co-primary-btn co-place-btn"
                disabled={submitting}
                onClick={handlePlaceOrder}
              >
                {submitting
                  ? <><span className="co-spinner" /> {t("checkout_placing_order")}</>
                  : `${t("checkout_place_order_prefix")} ₹${totalPrice}`}
              </button>

              <p className="co-terms">
                {t("checkout_terms")}
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — Summary ── */}
        <div className="co-right">
          <div className="co-summary">
            <div className="co-summary-title">Order Summary</div>
            <div className="co-summary-divider" />

            {items.map(item => (
              <div key={item.id} className="co-summary-product" style={{ marginBottom: 12 }}>
                <img
                  src={item.image ? `${BASE_URL}${item.image}` : "https://placehold.co/60x60?text=📦"}
                  alt={item.name}
                  className="co-summary-img"
                  onError={e => { e.target.src = "https://placehold.co/60x60?text=📦"; }}
                />
                <div className="co-summary-info">
                  <div className="co-summary-name">{item.name}</div>
                  {item.artisan && <div className="co-summary-artisan">by {item.artisan}</div>}
                  <div className="co-summary-qty">Qty: {item.quantity} · ₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
              </div>
            ))}

            <div className="co-summary-divider" />

            <div className="co-summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="co-summary-row">
              <span>GST (18%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="co-summary-row">
              <span>Shipping</span>
              <span className="co-free">FREE</span>
            </div>

            <div className="co-summary-divider" />

            <div className="co-summary-total">
              <span>Total</span>
              <span>₹{totalPrice}</span>
            </div>

            <div className="co-summary-badges">
              <div className="co-sbadge">🔒 Secure</div>
              <div className="co-sbadge">📦 Tracked</div>
              <div className="co-sbadge">↩️ Easy Returns</div>
            </div>
          </div>
        </div>

      </div>

      <div className={`co-toast ${toast.show ? "show" : ""}`}>{toast.msg}</div>
    </div>
  );
};

export default CartCheckout;