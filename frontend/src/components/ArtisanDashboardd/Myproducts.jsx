import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/Myproducts.css";

const BASE_URL = "http://127.0.0.1:8000";

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="mp-skeleton">
      <div className="sk-img" />
      <div className="sk-body">
        <div className="sk-line sk-s" />
        <div className="sk-line sk-m" />
        <div className="sk-line sk-f" />
        <div className="sk-line sk-s" />
      </div>
    </div>
  );
}

function MyProducts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ msg: "", show: false });

  const email = localStorage.getItem("email") || "";

  /* ── Toast helper ── */
  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  }, []);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(() => {
    if (!email) {
      setError(t("login_required") || "Not logged in — please sign in first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    axios
      .get(`${BASE_URL}/api/products/`, { params: { email } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];

        const mine = data.filter(
          (p) =>
            p.artisan_email === email ||
            p.artisan === email
        );

        setProducts(mine);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(t("fetch_products_error") || "Failed to load products. Please try again.");
        setLoading(false);
      });
  }, [email, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, location.key]);

  /* ── Delete product ── */
  const deleteProduct = async (productId) => {
    if (!window.confirm(t("remove_confirm") || "Remove this product from your store?")) return;

    try {
      await axios.delete(`${BASE_URL}/api/delete-product/${productId}/`, {
        data: { email },
      });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast(t("product_removed") || "🗑️ Product removed");
    } catch (err) {
      console.error(err);
      showToast(t("delete_error") || "❌ Could not delete product");
    }
  };

  /* ── Image resolver ── */
  const resolveImage = (product) => {
    const raw =
      (product.images && product.images.length > 0 && product.images[0]) ||
      product.image ||
      null;

    if (!raw) return "https://placehold.co/300x220?text=No+Image";
    if (raw.startsWith("http")) return raw;
    return `${BASE_URL}${raw}`;
  };

  /* ── Filter ── */
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Language switcher ── */
  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("craftelligence_lang", lang);
  };
  const cur = (i18n.language || "en").slice(0, 2);

  /* ── Not logged in ── */
  if (!email) {
    return (
      <div className="my-products-container">
        <div className="mp-empty">
          <span className="mp-empty-icon">🔒</span>
          <div className="mp-empty-title">
            {t("not_logged_in") || "Please log in"}
          </div>
          <p className="mp-empty-sub">
            {t("login_required") || "You need to be signed in to view your products."}
          </p>
          <button className="mp-empty-btn" onClick={() => navigate("/login")}>
            {t("go_login") || "Go to Login →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-products-container">

      {/* ── Toolbar ── */}
      <div className="mp-toolbar">
        <div className="mp-header">
          <div className="mp-eyebrow">✦ {t("artisan_studio") || "Artisan Studio"}</div>
          <h1 className="mp-title">
            {t("my_products_title") || <>My <em>Products</em></>}
          </h1>
          <div className="mp-divider" />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          
          {/* Language Switcher */}
          <div style={{
            display: "flex",
            gap: 2,
            background: "rgba(0,0,0,0.06)",
            borderRadius: 20,
            padding: "3px 4px"
          }}>
            {[["en", "EN"], ["hi", "हि"], ["gu", "ગુ"]].map(([code, label]) => (
              <button
                key={code}
                onClick={() => changeLang(code)}
                style={{
                  background: cur === code ? "#8B4513" : "transparent",
                  color: cur === code ? "#fff" : "#5c4033",
                  border: "none",
                  borderRadius: 14,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button className="mp-add-btn" onClick={() => navigate("/add-product")}>
            <span>{t("add_new_btn") || "➕ Add New Product"}</span>
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="mp-search-row">
        <div className="mp-search-wrap">
          <span className="mp-search-icon">🔍</span>
          <input
            type="text"
            className="mp-search"
            placeholder={t("search_products") || "Search your products..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="mp-count">
          <strong>{filtered.length}</strong>{" "}
          {filtered.length !== 1
            ? (t("product_plural") || "products")
            : (t("product_singular") || "product")}
        </span>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mp-error-banner">
          ⚠️ {error}
          <button onClick={fetchProducts} style={{ marginLeft: "12px" }}>
            {t("retry") || "Retry"}
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="mp-grid-wrap">
        <div className="mp-grid">

          {loading &&
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

          {!loading && !error && filtered.length === 0 && (
            <div className="mp-empty">
              <span className="mp-empty-icon">🏺</span>
              <div className="mp-empty-title">
                {search
                  ? <>No results for <em>"{search}"</em></>
                  : (t("no_products_yet") || <>No products <em>yet</em></>)}
              </div>
              <p className="mp-empty-sub">
                {search
                  ? (t("try_different") || "Try a different search term.")
                  : (t("start_listing") || "Start listing your handcrafted creations today.")}
              </p>
              {!search && (
                <button className="mp-empty-btn" onClick={() => navigate("/add-product")}>
                  {t("add_first") || "Add First Product →"}
                </button>
              )}
            </div>
          )}

          {!loading &&
            filtered.map((product) => (
              <div key={product.id} className="mp-card">

                <div className="mp-card-img-wrap">
                  <img
                    src={resolveImage(product)}
                    alt={product.name}
                    className="mp-card-img"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/300x220?text=No+Image";
                    }}
                  />
                  {product.category && (
                    <span className="mp-status-badge active">
                      {t(`cat_${product.category.toLowerCase()}`) || product.category}
                    </span>
                  )}
                </div>

                <div className="mp-card-info">
                  <div className="mp-card-name">{product.name}</div>

                  {product.description && (
                    <div className="mp-card-desc">{product.description}</div>
                  )}

                  <div className="mp-card-footer">
                    <span className="mp-card-price">₹{product.price}</span>

                    <div className="mp-card-actions">
                      <button
                        className="mp-action-btn"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        👁️
                      </button>

                      <button
                        className="mp-action-btn delete"
                        onClick={() => deleteProduct(product.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
        </div>
      </div>

      {/* Toast */}
      <div className={`mp-toast ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>

    </div>
  );
}

export default MyProducts;