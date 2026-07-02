import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import "../../styles/ProductDetails.css";
import ReviewSection from "./Reviewsection";   // ← ADD THIS

const ProductDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/product/${id}/`)
      .then(res => setProduct(res.data))
      .catch(err => console.error(err));
  }, [id]);

  const showToast = (msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  };

  const addToCart = async () => {
    const formData = new FormData();
    formData.append("email", localStorage.getItem("email"));
    formData.append("product_id", id);
    try {
      await axios.post("http://127.0.0.1:8000/api/add-to-cart/", formData);
      showToast("🛒  Added to Bag");
    } catch (err) {
      console.error(err);
      showToast("❌  Could not add to Bag");
    }
  };

  const addToWishlist = async () => {
    const formData = new FormData();
    formData.append("email", localStorage.getItem("email"));
    formData.append("product_id", id);
    try {
      await axios.post("http://127.0.0.1:8000/api/add-to-wishlist/", formData);
      setWished(true);
      showToast("❤️  Saved to Wishlist");
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuyNow = () => {
    navigate("/checkout", { state: { product, qty } });
  };

  if (!product) return <div className="loading">Loading</div>;

  const images = product.images && product.images.length > 0
    ? product.images.map(img => `http://127.0.0.1:8000${img}`)
    : product.image
      ? [`http://127.0.0.1:8000${product.image}`]
      : ["https://via.placeholder.com/600x600?text=No+Image"];

  // artisan_id comes from product.artisan_id OR we fetch it from artisan_email
  // Your product API returns artisan_email — we use that to match artisan
  // The ReviewSection needs artisan_id — we store it from product response
  const artisanId = product.artisan_id || null;

  return (
    <>
      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
        <span onClick={() => navigate("/buyer-dashboard")}>{t("nav_home")}</span>
        <span className="pd-breadcrumb-sep">›</span>
        <span onClick={() => navigate(-1)}>{t("nav_shop")}</span>
        <span className="pd-breadcrumb-sep">›</span>
        <span className="pd-breadcrumb-current">{product.name}</span>
      </div>

      <div className="product-detail-container">

        {/* ══ LEFT — IMAGE GALLERY ══ */}
        <div className="product-left">
          <div className="pd-main-image-wrap">
            <img src={images[activeImg]} alt={product.name} />
            <div className="pd-zoom-hint">Hover to zoom</div>
          </div>

          {images.length > 1 && (
            <div className="pd-thumbnails">
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`pd-thumb ${activeImg === i ? "active" : ""}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={img} alt={`view ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ MIDDLE — PRODUCT INFO ══ */}
        <div className="product-middle">

          <div className="pd-artisan-tag">
            <div className="pd-artisan-dot" />
            {t("verified")}
          </div>

          <h1>{product.name}</h1>

          {product.artisan && (
            <p className="artisan">By {product.artisan}</p>
          )}

          <div className="pd-rating">
            <span className="pd-stars">★★★★★</span>
            <span className="pd-rating-count">(128 reviews)</span>
          </div>

          <div className="pd-divider" />

          <h2 className="price">₹{product.price}</h2>
          <div className="pd-price-label">{t("inclusive")}</div>

          <div className="pd-desc-label">{t("about_piece")}</div>
          <p className="description">
            {product.description || "A beautifully handcrafted piece made with love and tradition."}
          </p>

          <div className="pd-badges">
            <div className="pd-badge"><span className="pd-badge-icon">🤝</span>{t("why1_title")}</div>
            <div className="pd-badge"><span className="pd-badge-icon">🌿</span>{t("why2_title")}</div>
            <div className="pd-badge"><span className="pd-badge-icon">✈️</span>{t("why3_title")}</div>
            <div className="pd-badge"><span className="pd-badge-icon">↩️</span>15-Day Returns</div>
          </div>

          {product.artisan && (
            <div className="pd-artisan-strip">
              <div className="pd-artisan-avatar">🏺</div>
              <div className="pd-artisan-info">
                <div className="pd-artisan-name">{product.artisan}</div>
                <div className="pd-artisan-meta">{t("verified")}</div>
              </div>
            </div>
          )}

        </div>

        {/* ══ RIGHT — BUY BOX ══ */}
        <div className="product-right">
          <div className="buy-box">

            <h2>₹{product.price}</h2>
            <div className="buy-box-price-sub">{t("per_piece")}</div>

            <div className="buy-box-stock">
              <span className="buy-box-stock-dot" />
              {t("in_stock")}
            </div>

            <div className="buy-box-divider" />

            <div className="buy-box-qty">
              <span className="buy-box-qty-label">{t("qty_label").replace(':', '')}</span>
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
              </div>
            </div>

            <button className="add-cart" onClick={addToCart}>
              <span>🛒 &nbsp;{t("add_to_bag")}</span>
            </button>

            <button className="buy-now" onClick={handleBuyNow}>
              {t("buy_now")}
            </button>

            <div className="buy-box-wish" onClick={addToWishlist}>
              {wished ? "❤️" : "🤍"}&nbsp; {wished ? t("saved_wishlist") : t("add_wishlist")}
            </div>

            <div className="buy-box-trust">
              <div className="trust-row">
                <span className="trust-icon">🔒</span>
                Secure payment · UPI, Cards, NetBanking
              </div>
              <div className="trust-row">
                <span className="trust-icon">📦</span>
                Packed with care · ships in 2–4 days
              </div>
              <div className="trust-row">
                <span className="trust-icon">↩️</span>
                Easy 15-day returns
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════
          REVIEWS SECTION — shows below the product details
          Buyer can write a review here, artisan's reviews shown
      ══════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: "1100px",
        margin: "48px auto 60px",
        padding: "0 24px",
      }}>
        <div style={{
          borderTop: "1px solid #e8e0d5",
          paddingTop: "40px",
        }}>
          {artisanId ? (
            <ReviewSection
              artisanId={artisanId}
              artisanName={product.artisan || "this artisan"}
            />
          ) : (
            /* Fallback: fetch artisan by email to get their ID */
            <ReviewSectionByEmail
              artisanEmail={product.artisan_email}
              artisanName={product.artisan}
            />
          )}
        </div>
      </div>

      {/* Toast */}
      <div
        className={`shop-toast ${toast.show ? "show" : ""}`}
        style={{
          position: "fixed", bottom: "32px", left: "50%",
          transform: toast.show
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(80px)",
          zIndex: 9999,
          background: "#1a110a", color: "#fdf6ec",
          padding: "14px 28px", borderRadius: "40px",
          fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem",
          border: "1px solid rgba(212,168,83,.2)",
          boxShadow: "0 8px 32px rgba(26,17,10,.3)",
          whiteSpace: "nowrap", opacity: toast.show ? 1 : 0,
          transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s",
          pointerEvents: "none",
        }}
      >
        {toast.msg}
      </div>
    </>
  );
};


// ── Fallback component: fetches artisan by email to get ID ────────────────────
// Your product API returns artisan_email but not artisan_id.
// This component resolves the artisan ID from email first.
function ReviewSectionByEmail({ artisanEmail, artisanName }) {
  const [artisanId, setArtisanId] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!artisanEmail) return;
    // Fetch artisan list and find by email
    axios.get(`http://127.0.0.1:8000/api/products/?email=${artisanEmail}`)
      .then(() => {
        // We use a dedicated endpoint — fetch all artisans and match
        axios.get(`http://127.0.0.1:8000/api/artisan-by-email/?email=${artisanEmail}`)
          .then(res => setArtisanId(res.data.id))
          .catch(() => setError(true));
      })
      .catch(() => setError(true));
  }, [artisanEmail]);

  if (error || !artisanEmail) return null;
  if (!artisanId) return (
    <div style={{ textAlign: "center", color: "#c4b5a5", padding: "20px 0", fontSize: 14 }}>
      Loading reviews…
    </div>
  );

  return <ReviewSection artisanId={artisanId} artisanName={artisanName} />;
}


export default ProductDetail;