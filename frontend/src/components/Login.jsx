import React, { useState } from "react";
import "../styles/Auth.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Login failed");
        return;
      }

      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);

      if (data.role === "ARTISAN") navigate("/artisan-dashboard");
      else if (data.role === "BUYER") navigate("/buyer-dashboard");
      else alert("Invalid credentials");

    } catch (error) {
      console.error("Login error:", error);
      alert("Server error");
    }
  };

  return (
    <div className="auth-container">

      {/* ── Left Visual Panel ── */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-badges">
            <span className="auth-visual-badge">🏺 Pottery</span>
            <span className="auth-visual-badge">🧵 Weaving</span>
            <span className="auth-visual-badge">🪵 Woodcraft</span>
          </div>
          <div>
            <div className="auth-visual-tagline">
              Where <em>artisan</em><br />craft meets<br />the world.
            </div>
            <div className="auth-visual-sub">Handmade · Heritage · Heart</div>
            <div className="auth-visual-bar"></div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-form-panel">
        <div className="card">

          <div className="auth-brand">
            <div className="auth-brand-dot"></div>
            <span className="auth-brand-label">Craftelligence</span>
          </div>

          <img src="/logo.png" alt="Craftelligence" className="logo-auth" />
          <h2>Welcome <em>back</em></h2>
          <p className="auth-subtitle">Sign in to your account</p>
          <div className="auth-divider"></div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                name="email"
                type="email"
                placeholder="Email address"
                onChange={handleChange}
                required
              />
              <span className="input-icon">✉</span>
            </div>

            <div className="input-group">
              <input
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleChange}
                required
              />
              <span className="input-icon">🔒</span>
            </div>

            <button type="submit" className="btn">
              <span>Sign In →</span>
            </button>
          </form>

          <div className="links">
            Don't have an account?{" "}
            <span className="link-btn" onClick={() => navigate("/SelectRole")}>
              Sign Up
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Login;