// src/components/BuyerDashboard/ReviewForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Usage: <ReviewForm artisanId={artisan.id} artisanName={artisan.firstname} onSuccess={() => refetch()} />
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const BASE_URL = "http://127.0.0.1:8000";

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          style={{
            fontSize: 28,
            cursor: "pointer",
            color: star <= (hovered || value) ? "#f7c948" : "#e0d0c0",
            transition: "color 0.15s, transform 0.15s",
            transform: star <= (hovered || value) ? "scale(1.15)" : "scale(1)",
            display: "inline-block",
          }}
        >★</span>
      ))}
      {value > 0 && (
        <span style={{ fontSize: 13, color: "#9e8a78", alignSelf: "center", marginLeft: 4 }}>
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

function ReviewForm({ artisanId, artisanName, onSuccess }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const email = localStorage.getItem("email");

  const handleSubmit = async () => {
    if (!email) { setError("Please login to submit a review."); return; }
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!comment.trim()) { setError("Please write a comment."); return; }

    setSubmitting(true); setError("");
    try {
      await axios.post(`${BASE_URL}/api/submit-review/`, {
        buyer_email: email,
        artisan_id: artisanId,
        rating,
        comment: comment.trim(),
      });
      setDone(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit review.");
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div style={{
        background: "#f0faf5", border: "1px solid #b6ddb6", borderRadius: 14,
        padding: "20px 24px", textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 800, color: "#2c1a0e", marginBottom: 6 }}>
          {t("review_submitted")}
        </div>
        <p style={{ fontSize: 13, color: "#5c7a5a" }}>
          {t("review_pending")}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e8e0d5", borderRadius: 16,
      padding: "22px 24px", boxShadow: "0 2px 12px rgba(139,69,19,0.06)",
    }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 800, color: "#2c1a0e", marginBottom: 4 }}>
        {t("review_write")}
      </div>
      <p style={{ fontSize: 13, color: "#9e8a78", marginBottom: 14 }}>
        {t("review_share")} <strong>{artisanName}</strong>
      </p>

      {/* Star rating */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#9e8a78", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
        {t("review_rating")}
      </div>
      <StarPicker value={rating} onChange={setRating} />

      {/* Comment */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#9e8a78", textTransform: "uppercase", letterSpacing: "0.8px", margin: "14px 0 6px" }}>
        {t("review_comment")}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder={t("review_placeholder")}
        rows={4}
        style={{
          width: "100%", background: "#faf6f1", border: "1px solid #e8e0d5",
          borderRadius: 10, padding: "10px 14px", fontFamily: "'Nunito',sans-serif",
          fontSize: 14, color: "#2c1a0e", outline: "none", resize: "vertical",
          lineHeight: 1.6,
        }}
      />
      <div style={{ fontSize: 12, color: "#c4b5a5", marginTop: 4 }}>{comment.length}/500 characters</div>

      {/* Error */}
      {error && (
        <div style={{ background: "#fff0f0", border: "1px solid #ddb6b6", color: "#8B2020", borderRadius: 8, padding: "9px 14px", fontSize: 13, marginTop: 10 }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          marginTop: 16, background: "#8B4513", border: "none", color: "#fff8f0",
          padding: "11px 28px", borderRadius: 10, cursor: "pointer",
          fontFamily: "'Nunito',sans-serif", fontSize: 14, fontWeight: 800,
          opacity: submitting ? 0.7 : 1, width: "100%",
        }}
      >
        {submitting ? t("review_submitting") : t("review_submit")}
      </button>
      <p style={{ fontSize: 12, color: "#c4b5a5", textAlign: "center", marginTop: 8 }}>
        {t("review_admin")}
      </p>
    </div>
  );
}

export default ReviewForm;