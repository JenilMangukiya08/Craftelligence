import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

function BuyerSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      firstname: formData.firstname,
      lastname: formData.lastname,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      address: formData.address,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/buyer-signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // ── SUCCESS ──────────────────────────────────
      if (response.ok) {
        alert("Account created! Please sign in.");
        navigate("/login");                  // ← go to login, not dashboard

        // ── ERROR (duplicate email etc.) ─────────────
      } else {
        alert(data.error || "Signup failed. Please try again.");
      }

    } catch (error) {
      console.error("Error:", error);
      alert("Cannot connect to server.");
    }
  };

  return (
    <div className="auth-container">

      {/* ── Left Visual Panel ── */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-badges">
            <span className="auth-visual-badge">🛍️ Shop</span>
            <span className="auth-visual-badge">✨ Discover</span>
            <span className="auth-visual-badge">❤️ Collect</span>
          </div>
          <div>
            <div className="auth-visual-tagline">
              Find <em>unique</em><br />pieces made<br />with love.
            </div>
            <div className="auth-visual-sub">Authentic · Handcrafted · Yours</div>
            <div className="auth-visual-bar"></div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-form-panel">
        <div className="card">

          <div className="auth-brand">
            <div className="auth-brand-dot"></div>
            <span className="auth-brand-label">Buyer Registration</span>
          </div>

          <img src="/logo.png" alt="Craftelligence" className="logo-auth" />
          <h2>Create your <em>account</em></h2>
          <p className="auth-subtitle">Join thousands of craft lovers</p>
          <div className="auth-divider"></div>

          <form onSubmit={handleSubmit}>

            {/* Row: First + Last name */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div className="input-group" style={{ flex: 1 }}>
                <input
                  name="firstname"
                  placeholder="First name"
                  required
                  onChange={handleChange}
                />
                <span className="input-icon">👤</span>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <input
                  name="lastname"
                  placeholder="Last name"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-group">
              <input
                name="email"
                type="email"
                placeholder="Email address"
                required
                onChange={handleChange}
              />
              <span className="input-icon">✉</span>
            </div>

            <div className="input-group">
              <input
                name="password"
                type="password"
                placeholder="Create password"
                required
                onChange={handleChange}
              />
              <span className="input-icon">🔒</span>
            </div>

            <div className="input-group">
              <input
                name="phone"
                placeholder="Phone number"
                required
                onChange={handleChange}
              />
              <span className="input-icon">📱</span>
            </div>

            <div className="input-group">
              <input
                name="address"
                placeholder="Delivery address"
                required
                onChange={handleChange}
              />
              <span className="input-icon">📍</span>
            </div>

            <button type="submit" className="btn">
              <span>Create Buyer Account →</span>
            </button>

          </form>

          <div className="links">
            Already have an account?{" "}
            <span className="link-btn" onClick={() => navigate("/login")}>
              Sign In
            </span>
            {" "}·{" "}
            <span className="link-btn" onClick={() => navigate("/SelectRole")}>
              ← Back
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}

export default BuyerSignup;