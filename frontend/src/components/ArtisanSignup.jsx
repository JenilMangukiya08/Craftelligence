import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

function ArtisanSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    bio: "",
    GSTNumber: "",
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
      GSTNumber: formData.GSTNumber,
      bio: formData.bio,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/artisan-signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Signup failed");
        return;
      }

      alert("Registration successful! Please wait for admin verification.");
      navigate("/waiting-verification");

    } catch (error) {
      console.error("Signup error:", error);
      alert("Server error");
    }
  };

  return (
    <div className="auth-container">

      {/* ── Left Visual Panel ── */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-badges">
            <span className="auth-visual-badge">🏺 Create</span>
            <span className="auth-visual-badge">🌍 Reach</span>
            <span className="auth-visual-badge">💰 Earn</span>
          </div>
          <div>
            <div className="auth-visual-tagline">
              Share your <em>craft</em><br />with the<br />entire world.
            </div>
            <div className="auth-visual-sub">Create · Sell · Inspire</div>
            <div className="auth-visual-bar"></div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-form-panel">
        <div className="card">

          <div className="auth-brand">
            <div className="auth-brand-dot"></div>
            <span className="auth-brand-label">Artisan Registration</span>
          </div>

          <img src="/logo.png" alt="Craftelligence" className="logo-auth" />
          <h2>Open your <em>studio</em></h2>
          <p className="auth-subtitle">Start selling your craft today</p>
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
                placeholder="Studio / Home address"
                required
                onChange={handleChange}
              />
              <span className="input-icon">📍</span>
            </div>

            <div className="input-group">
              <textarea
                name="bio"
                placeholder="Tell us about your craft and story..."
                required
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <input
                name="GSTNumber"
                placeholder="GST Number"
                required
                onChange={handleChange}
              />
              <span className="input-icon">🧾</span>
            </div>

            <button type="submit" className="btn">
              <span>Create Artisan Account →</span>
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

export default ArtisanSignup;