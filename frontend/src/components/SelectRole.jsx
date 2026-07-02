import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

function SelectRole() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">

      {/* ── Left Visual Panel ── */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          
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
          <h2>Join <em>Craftelligence</em></h2>
          <p className="auth-subtitle">Choose how you'd like to continue</p>
          <div className="auth-divider"></div>

          <button
            className="role-card"
            onClick={() => navigate("/buyer-signup")}
          >
            <div className="role-card-icon">🛍️</div>
            <div className="role-card-text">
              <span className="role-card-title">Continue as Buyer</span>
              <span className="role-card-desc">Discover handcrafted treasures</span>
            </div>
            <span className="role-card-arrow">→</span>
          </button>

          <button
            className="role-card"
            onClick={() => navigate("/artisan-signup")}
          >
            <div className="role-card-icon">🏺</div>
            <div className="role-card-text">
              <span className="role-card-title">Continue as Artisan</span>
              <span className="role-card-desc">Sell your craft to the world</span>
            </div>
            <span className="role-card-arrow">→</span>
          </button>

          <div className="links">
            Already have an account?{" "}
            <span className="link-btn" onClick={() => navigate("/login")}>
              Login
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}

export default SelectRole;