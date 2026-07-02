// src/components/BuyerDashboard/ReviewSection.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Usage: <ReviewSection artisanId={123} artisanName="Mihir Patel" />
// Drop this into your artisan profile page or product details page.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import ReviewForm from "./Reviewform";

const BASE_URL = "http://127.0.0.1:8000";

function Stars({ rating, size = 16 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= rating ? "#f7c948" : "#e0d0c0" }}>★</span>
      ))}
    </span>
  );
}

function ReviewSection({ artisanId, artisanName }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const isLoggedBuyer = localStorage.getItem("role") === "BUYER";

  const fetchReviews = useCallback(() => {
    if (!artisanId) return;
    setLoading(true);
    axios.get(`${BASE_URL}/api/reviews/${artisanId}/`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [artisanId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const reviews = data?.reviews || [];
  const avg = data?.average_rating || 0;
  const total = data?.total_reviews || 0;

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: "#2c1a0e" }}>
            {t("reviews", "Reviews")}
          </div>
          {total > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Stars rating={Math.round(avg)} size={18} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#2c1a0e" }}>{avg}</span>
              <span style={{ fontSize: 13, color: "#9e8a78" }}>({total} {t("reviews", "reviews")})</span>
            </div>
          )}
        </div>
        {isLoggedBuyer && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: "#8B4513", border: "none", color: "#fff8f0",
              padding: "10px 20px", borderRadius: 10, cursor: "pointer",
              fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800,
            }}
          >
            ✍️ {t("review_write")}
          </button>
        )}
      </div>

      {/* Rating bar summary */}
      {total > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e8e0d5", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 40, fontWeight: 800, color: "#2c1a0e", lineHeight: 1 }}>{avg}</div>
            <Stars rating={Math.round(avg)} size={16} />
            <div style={{ fontSize: 12, color: "#9e8a78", marginTop: 4 }}>{total} reviews</div>
          </div>
          <div style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#9e8a78", width: 10 }}>{star}</span>
                  <span style={{ fontSize: 12, color: "#f7c948" }}>★</span>
                  <div style={{ flex: 1, background: "#f5ede4", borderRadius: 4, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, background: "#f7c948", height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "#c4b5a5", width: 16 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <div style={{ marginBottom: 20 }}>
          <ReviewForm
            artisanId={artisanId}
            artisanName={artisanName}
            onSuccess={() => { fetchReviews(); setShowForm(false); }}
          />
          <button
            onClick={() => setShowForm(false)}
            style={{ background: "none", border: "none", color: "#9e8a78", cursor: "pointer", fontSize: 13, marginTop: 8, fontFamily: "'Nunito',sans-serif" }}
          >
            {t("checkout_edit") === "Edit" ? "Cancel" : "રદ કરો"}
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#c4b5a5", fontSize: 14 }}>{t("cart_loading")}</div>
      )}

      {!loading && reviews.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "#fff", border: "1px solid #e8e0d5", borderRadius: 14 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color: "#2c1a0e", marginBottom: 6 }}>{t("review_no")}</div>
          <p style={{ fontSize: 13, color: "#9e8a78" }}>{t("review_be_first")}</p>
        </div>
      )}

      {!loading && reviews.map((r, i) => (
        <div key={r.id}
          style={{
            background: "#fff", border: "1px solid #e8e0d5", borderRadius: 14,
            padding: "18px 20px", marginBottom: 12,
            boxShadow: "0 1px 6px rgba(139,69,19,0.05)",
            opacity: 0, animation: `fadeUp 0.4s ease ${i * 0.08}s forwards`,
          }}
        >
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg,#8B4513,#f7c948)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, color: "#3c1a00", flexShrink: 0,
              }}>
                {r.buyer_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#2c1a0e", fontSize: 14 }}>{r.buyer_name}</div>
                <div style={{ fontSize: 11, color: "#c4b5a5" }}>
                  {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            </div>
            <Stars rating={r.rating} size={15} />
          </div>
          <p style={{ fontSize: 14, color: "#5c4033", lineHeight: 1.6, margin: 0 }}>{r.comment}</p>
        </div>
      ))}
    </div>
  );
}

export default ReviewSection;