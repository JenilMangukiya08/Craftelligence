// src/pages/buyer/CartOrderSuccess.jsx
// Success page after placing order from cart

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/Ordersuccess.css";

const CartOrderSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { items = [], address, totalPrice } = location.state || {};

  return (
    <div className="os-root">
      <div className="os-card">

        <div className="os-icon-wrap">
          <div className="os-icon">✓</div>
        </div>

        <div className="os-eyebrow">✦ {t("order_success_eyebrow")}</div>
        <h1 className="os-title">{t("order_success_title")}</h1>
        <p className="os-sub">
          {t("order_success_body", { count: items.length })}
        </p>

        <div className="os-divider" />

        {/* Items list */}
        {items.map(item => (
          <div key={item.id} className="os-product-row">
            <strong>{item.name}</strong>
            <span>Qty: {item.quantity} · ₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 700, borderTop: "1px solid #e8e0d5", marginTop: 8 }}>
          <span>{t("order_success_total_paid")}</span>
          <span>₹{totalPrice}</span>
        </div>

        {/* Delivery address */}
        {address && (
          <div className="os-address-block">
            <div className="os-address-label">📍 {t("order_success_delivering_to")}</div>
            <div className="os-address-text">
              {address.full_name} · {address.phone}<br />
              {address.address_line}{address.landmark && `, ${address.landmark}`}<br />
              {address.city}, {address.state} — {address.pincode}
            </div>
          </div>
        )}

        <div className="os-divider" />

        <div className="os-actions">
          <button className="os-btn-primary" onClick={() => navigate("/buyer-dashboard")}>
            {t("order_success_continue_shopping")}
          </button>
          <button className="os-btn-ghost" onClick={() => navigate("/cart")}>
            {t("order_success_back_to_cart")}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CartOrderSuccess;