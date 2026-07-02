// src/pages/buyer/CartOrderSuccess.jsx
// Success page after placing order from cart

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Ordersuccess.css";

const CartOrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items = [], address, totalPrice } = location.state || {};

  return (
    <div className="os-root">
      <div className="os-card">

        <div className="os-icon-wrap">
          <div className="os-icon">✓</div>
        </div>

        <div className="os-eyebrow">✦ Order Confirmed</div>
        <h1 className="os-title">Thank you!</h1>
        <p className="os-sub">
          Your {items.length} item{items.length > 1 ? "s have" : " has"} been ordered successfully.
          The artisans have been notified and will prepare your handcrafted items with love.
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
          <span>Total Paid</span>
          <span>₹{totalPrice}</span>
        </div>

        {/* Delivery address */}
        {address && (
          <div className="os-address-block">
            <div className="os-address-label">📍 Delivering to</div>
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
            Continue Shopping
          </button>
          <button className="os-btn-ghost" onClick={() => navigate("/cart")}>
            Back to Cart
          </button>
        </div>

      </div>
    </div>
  );
};

export default CartOrderSuccess;