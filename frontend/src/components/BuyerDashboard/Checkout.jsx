import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/Checkout.css";

const BASE_URL = "http://127.0.0.1:8000";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* Product + qty passed via navigate state from ProductDetails */
  const { product, qty } = location.state || {};

  const [step, setStep] = useState(1); // 1 = address, 2 = confirm
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

  if (!product) {
    return (
      <div className="co-error">
        <div className="co-error-icon">⚠️</div>
        <p>No product selected. Please go back and try again.</p>
        <button onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  const totalPrice = (parseFloat(product.price) * qty).toFixed(2);

  const showToast = (msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2800);
  };

  const handleChange = (e) => {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isAddressValid = () =>
    address.full_name.trim() &&
    address.phone.trim().length >= 10 &&
    address.pincode.trim().length === 6 &&
    address.address_line.trim() &&
    address.city.trim() &&
    address.state.trim();

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const payload = {
        buyer_email: localStorage.getItem("email"),
        product_id: product.id,
        quantity: qty,
        total_price: totalPrice,
        full_name: address.full_name,
        phone: address.phone,
        pincode: address.pincode,
        address_line: address.address_line,
        city: address.city,
        state: address.state,
        landmark: address.landmark,
      };
      await axios.post(`${BASE_URL}/api/place-order/`, payload);
      navigate("/order-success", { state: { product, qty, address, totalPrice } });
    } catch (err) {
      console.error(err.response?.data || err.message);
      showToast("❌  Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const productImage =
    product.images && product.images.length > 0
      ? `${BASE_URL}${product.images[0]}`
      : product.image
        ? `${BASE_URL}${product.image}`
        : "https://placehold.co/120x120?text=No+Image";

  return (
    <div className="co-root">

      {/* ── Header ── */}
      <div className="co-topbar">
        <button className="co-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="co-brand">✦ Craftelligence Checkout</div>
        <div />
      </div>

      {/* ── Step indicator ── */}
      <div className="co-steps">
        <div className={`co-step ${step >= 1 ? "active" : ""}`}>
          <div className="co-step-bubble">1</div>
          <span>Shipping</span>
        </div>
        <div className="co-step-line" />
        <div className={`co-step ${step >= 2 ? "active" : ""}`}>
          <div className="co-step-bubble">2</div>
          <span>Confirm</span>
        </div>
      </div>

      <div className="co-body">

        {/* ══ LEFT PANEL ══ */}
        <div className="co-left">

          {/* STEP 1 — Shipping Address */}
          {step === 1 && (
            <div className="co-card">
              <div className="co-card-eyebrow">Step 1 of 2</div>
              <h2 className="co-card-title">Shipping Address</h2>
              <div className="co-card-divider" />

              <div className="co-form">

                <div className="co-field-row">
                  <div className="co-field">
                    <label>Full Name *</label>
                    <input
                      name="full_name"
                      placeholder="As per ID"
                      value={address.full_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="co-field">
                    <label>Phone Number *</label>
                    <input
                      name="phone"
                      placeholder="10-digit mobile"
                      maxLength={10}
                      value={address.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="co-field co-full">
                  <label>Address Line *</label>
                  <input
                    name="address_line"
                    placeholder="House / Flat no., Street, Area"
                    value={address.address_line}
                    onChange={handleChange}
                  />
                </div>

                <div className="co-field">
                  <label>Landmark</label>
                  <input
                    name="landmark"
                    placeholder="Optional"
                    value={address.landmark}
                    onChange={handleChange}
                  />
                </div>

                <div className="co-field-row">
                  <div className="co-field">
                    <label>City *</label>
                    <input
                      name="city"
                      placeholder="City"
                      value={address.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="co-field">
                    <label>State *</label>
                    <input
                      name="state"
                      placeholder="State"
                      value={address.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="co-field co-field-sm">
                    <label>Pincode *</label>
                    <input
                      name="pincode"
                      placeholder="6 digits"
                      maxLength={6}
                      value={address.pincode}
                      onChange={handleChange}
                    />
                  </div>
                </div>

              </div>

              <button
                className="co-primary-btn"
                disabled={!isAddressValid()}
                onClick={() => setStep(2)}
              >
                Continue to Confirm →
              </button>
            </div>
          )}

          {/* STEP 2 — Confirm Order */}
          {step === 2 && (
            <div className="co-card">
              <div className="co-card-eyebrow">Step 2 of 2</div>
              <h2 className="co-card-title">Confirm Your Order</h2>
              <div className="co-card-divider" />

              {/* Address review */}
              <div className="co-review-block">
                <div className="co-review-label">
                  📍 Delivering to
                  <button className="co-edit-btn" onClick={() => setStep(1)}>Edit</button>
                </div>
                <div className="co-review-address">
                  <strong>{address.full_name}</strong> · {address.phone}<br />
                  {address.address_line}
                  {address.landmark && `, ${address.landmark}`}<br />
                  {address.city}, {address.state} — {address.pincode}
                </div>
              </div>

              {/* Payment note */}
              <div className="co-review-block">
                <div className="co-review-label">💳 Payment</div>
                <div className="co-pay-note">
                  <span className="co-pay-icon">🔒</span>
                  Cash on Delivery · Pay when your order arrives
                </div>
              </div>

              <button
                className="co-primary-btn co-place-btn"
                disabled={submitting}
                onClick={handlePlaceOrder}
              >
                {submitting
                  ? <><span className="co-spinner" /> Placing Order…</>
                  : "✦ Place Order"}
              </button>

              <p className="co-terms">
                By placing your order you agree to our Terms of Service and confirm
                that your shipping details are correct.
              </p>
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL — Order Summary ══ */}
        <div className="co-right">
          <div className="co-summary">
            <div className="co-summary-title">Order Summary</div>
            <div className="co-summary-divider" />

            <div className="co-summary-product">
              <img
                src={productImage}
                alt={product.name}
                className="co-summary-img"
                onError={(e) => { e.target.src = "https://placehold.co/120x120?text=No+Image"; }}
              />
              <div className="co-summary-info">
                <div className="co-summary-name">{product.name}</div>
                {product.artisan && (
                  <div className="co-summary-artisan">by {product.artisan}</div>
                )}
                {product.category && (
                  <div className="co-summary-cat">{product.category}</div>
                )}
                <div className="co-summary-qty">Qty: {qty}</div>
              </div>
            </div>

            <div className="co-summary-divider" />

            <div className="co-summary-row">
              <span>Price ({qty} item{qty > 1 ? "s" : ""})</span>
              <span>₹{totalPrice}</span>
            </div>
            <div className="co-summary-row">
              <span>Shipping</span>
              <span className="co-free">FREE</span>
            </div>
            <div className="co-summary-row">
              <span>Tax</span>
              <span>Included</span>
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

      {/* Toast */}
      <div className={`co-toast ${toast.show ? "show" : ""}`}>{toast.msg}</div>
    </div>
  );
};

export default Checkout;