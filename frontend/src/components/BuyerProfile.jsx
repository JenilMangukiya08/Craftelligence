import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function BuyerProfile() {
  const { t } = useTranslation();
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  useEffect(() => {
    if (!email) { navigate("/login"); return; }
    fetch(`http://127.0.0.1:8000/api/buyer-profile/${email}/`)
      .then(res => res.json())
      .then(data => {
        if (data.error) { alert("Buyer not found"); navigate("/login"); }
        else { setBuyer(data); setLoading(false); setTimeout(() => setAnimate(true), 50); }
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [email, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // Avatar initials
  const initials = buyer
    ? `${buyer.firstname?.[0] || ""}${buyer.lastname?.[0] || ""}`.toUpperCase()
    : "?";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Nunito:wght@400;500;600;700;800&display=swap');

        .bp-root {
          min-height: 100vh;
          background: #f5ede4;
          font-family: 'Nunito', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ── Top bar ── */
        .bp-topbar {
          background: #1e1008;
          padding: 14px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .bp-brand {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 800;
          color: #f7c948;
          cursor: pointer;
        }
        .bp-brand span { color: #e8d5b0; }
        .bp-back-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: #e8d5b0;
          padding: 7px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          font-size: 13px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .bp-back-btn:hover { background: rgba(255,255,255,0.14); }

        /* ── Hero banner ── */
        .bp-hero {
          background: linear-gradient(135deg, #5c2a0e 0%, #8B4513 45%, #a0522d 100%);
          padding: 48px 32px 80px;
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        .bp-hero::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }
        .bp-hero::after {
          content: '';
          position: absolute;
          bottom: -80px; left: 40px;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
        }
        .bp-hero-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2.5px;
          color: rgba(255,220,170,0.6);
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .bp-avatar {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f7c948, #f48c00);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 800;
          color: #3c1a00;
          margin: 0 auto 16px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.25);
          border: 3px solid rgba(255,255,255,0.2);
          position: relative;
          z-index: 1;
        }
        .bp-hero-name {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 800;
          color: #fff8f0;
          margin-bottom: 4px;
          position: relative;
          z-index: 1;
        }
        .bp-hero-email {
          font-size: 14px;
          color: rgba(255,220,170,0.7);
          position: relative;
          z-index: 1;
        }
        .bp-hero-badge {
          display: inline-block;
          background: rgba(247,201,72,0.2);
          border: 1px solid rgba(247,201,72,0.4);
          color: #f7c948;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 4px 14px;
          border-radius: 20px;
          margin-top: 12px;
          position: relative;
          z-index: 1;
        }

        /* ── Content ── */
        .bp-content {
          flex: 1;
          max-width: 640px;
          width: 100%;
          margin: -40px auto 0;
          padding: 0 20px 60px;
          position: relative;
          z-index: 2;
        }

        /* ── Card ── */
        .bp-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e8e0d5;
          box-shadow: 0 4px 24px rgba(139,69,19,0.10);
          overflow: hidden;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .bp-card.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .bp-card:nth-child(2) { transition-delay: 0.08s; }
        .bp-card:nth-child(3) { transition-delay: 0.16s; }

        .bp-card-header {
          padding: 18px 24px 14px;
          border-bottom: 1px solid #f5f0eb;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bp-card-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #faf0e6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .bp-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 800;
          color: #2c1a0e;
        }

        /* ── Info rows ── */
        .bp-info-row {
          display: flex;
          align-items: flex-start;
          padding: 14px 24px;
          border-bottom: 1px solid #faf6f1;
          gap: 16px;
        }
        .bp-info-row:last-child { border-bottom: none; }
        .bp-info-label {
          font-size: 11px;
          font-weight: 700;
          color: #c4b5a5;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          width: 90px;
          flex-shrink: 0;
          padding-top: 2px;
        }
        .bp-info-value {
          font-size: 15px;
          font-weight: 600;
          color: #2c1a0e;
          flex: 1;
          line-height: 1.5;
        }

        /* ── Action buttons ── */
        .bp-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px 24px;
        }
        .bp-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.18s;
          text-align: left;
        }
        .bp-btn-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .bp-btn-text { flex: 1; }
        .bp-btn-arrow { color: rgba(0,0,0,0.2); font-size: 16px; }

        .bp-btn-shop {
          background: #fdf8f3;
          color: #2c1a0e;
          border: 1px solid #e8e0d5;
        }
        .bp-btn-shop:hover { background: #faf0e4; border-color: #c4956a; transform: translateX(3px); }
        .bp-btn-shop .bp-btn-icon { background: #f5e6d3; }

        .bp-btn-orders {
          background: #fdf8f3;
          color: #2c1a0e;
          border: 1px solid #e8e0d5;
        }
        .bp-btn-orders:hover { background: #faf0e4; border-color: #c4956a; transform: translateX(3px); }
        .bp-btn-orders .bp-btn-icon { background: #e8f0fe; }

        .bp-btn-logout {
          background: #fff5f5;
          color: #8B2020;
          border: 1px solid #f5c6c6;
        }
        .bp-btn-logout:hover { background: #ffe8e8; transform: translateX(3px); }
        .bp-btn-logout .bp-btn-icon { background: #ffe0e0; }

        /* ── Loading ── */
        .bp-loading {
          min-height: 100vh;
          background: #f5ede4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #9e8a78;
          font-style: italic;
        }

        @media (max-width: 480px) {
          .bp-hero { padding: 36px 20px 70px; }
          .bp-content { padding: 0 12px 40px; }
          .bp-hero-name { font-size: 22px; }
        }
      `}</style>

      {loading ? (
        <div className="bp-loading">Loading your profile…</div>
      ) : (
        <div className="bp-root">

          {/* Topbar */}
          <div className="bp-topbar">
            <div className="bp-brand" onClick={() => navigate("/buyer-dashboard")}>
              Craft<span>elligence</span>
            </div>
            <button className="bp-back-btn" onClick={() => navigate("/buyer-dashboard")}>
              ← {t("dashboard")}
            </button>
          </div>

          {/* Hero */}
          <div className="bp-hero">
            <div className="bp-hero-eyebrow">✦ {t("profile_eyebrow")}</div>
            <div className="bp-avatar">{initials}</div>
            <div className="bp-hero-name">
              {buyer.firstname} {buyer.lastname}
            </div>
            <div className="bp-hero-email">{buyer.email}</div>
            <div className="bp-hero-badge">{t("profile_badge")}</div>
          </div>

          {/* Content */}
          <div className="bp-content">

            {/* Personal Info Card */}
            <div className={`bp-card ${animate ? "visible" : ""}`}>
              <div className="bp-card-header">
                <div className="bp-card-icon">👤</div>
                <div className="bp-card-title">{t("profile_personal_info")}</div>
              </div>
              <div className="bp-info-row">
                <div className="bp-info-label">{t("profile_full_name")}</div>
                <div className="bp-info-value">{buyer.firstname} {buyer.lastname}</div>
              </div>
              <div className="bp-info-row">
                <div className="bp-info-label">{t("profile_email_label")}</div>
                <div className="bp-info-value">{buyer.email}</div>
              </div>
              <div className="bp-info-row">
                <div className="bp-info-label">{t("profile_phone_label")}</div>
                <div className="bp-info-value">{buyer.phone || "—"}</div>
              </div>
            </div>

            {/* Address Card */}
            <div className={`bp-card ${animate ? "visible" : ""}`}>
              <div className="bp-card-header">
                <div className="bp-card-icon">📍</div>
                <div className="bp-card-title">{t("profile_address_title")}</div>
              </div>
              <div className="bp-info-row">
                <div className="bp-info-label">{t("profile_address_label")}</div>
                <div className="bp-info-value">{buyer.address || t("profile_no_address")}</div>
              </div>
            </div>

            {/* Actions Card */}
            <div className={`bp-card ${animate ? "visible" : ""}`}>
              <div className="bp-card-header">
                <div className="bp-card-icon">⚡</div>
                <div className="bp-card-title">{t("profile_quick_actions")}</div>
              </div>
              <div className="bp-actions">
                <button className="bp-btn bp-btn-shop" onClick={() => navigate("/buyer-dashboard")}>
                  <div className="bp-btn-icon">🛍️</div>
                  <div className="bp-btn-text">Continue Shopping</div>
                  <div className="bp-btn-arrow">→</div>
                </button>
                <button className="bp-btn bp-btn-orders" onClick={() => navigate("/my-orders")}>
                  <div className="bp-btn-icon">📦</div>
                  <div className="bp-btn-text">{t("profile_my_orders")}</div>
                  <div className="bp-btn-arrow">→</div>
                </button>
                <button className="bp-btn bp-btn-logout" onClick={handleLogout}>
                  <div className="bp-btn-icon">🚪</div>
                  <div className="bp-btn-text">{t("nav_logout")}</div>
                  <div className="bp-btn-arrow">→</div>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default BuyerProfile;