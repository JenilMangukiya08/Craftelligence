import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/Shop.css";

const CATEGORIES = ["All", "Pottery", "Weaving", "Woodcraft", "Embroidery", "Metalwork", "Paintings", "Other"];

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img" />
      <div className="skeleton-info">
        <div className="skeleton-line skeleton-line-short" />
        <div className="skeleton-line skeleton-line-med" />
        <div className="skeleton-line skeleton-line-full" />
        <div className="skeleton-line skeleton-line-short" />
      </div>
    </div>
  );
}

function Shop({ initialCategory = "All", initialSearch = "" }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("grid");
  const [toast, setToast] = useState({ msg: "", show: false });
  const [wishlisted, setWishlisted] = useState({});

  useEffect(() => {
    setActiveFilter(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://127.0.0.1:8000/api/product-list/")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  }, []);

  const addToWishlist = async (e, productId) => {
    e.stopPropagation();
    const formData = new FormData();
    formData.append("email", localStorage.getItem("email"));
    formData.append("product_id", productId);

    try {
      await axios.post("http://127.0.0.1:8000/api/add-to-wishlist/", formData);
      setWishlisted((prev) => ({ ...prev, [productId]: true }));
      showToast("❤️  " + t("saved_wishlist"));
    } catch {
      showToast("❌  Could not add to Wishlist");
    }
  };

  const addToCart = async (e, productId) => {
    e.stopPropagation();
    const formData = new FormData();
    formData.append("email", localStorage.getItem("email"));
    formData.append("product_id", productId);

    try {
      await axios.post("http://127.0.0.1:8000/api/add-to-cart/", formData);
      showToast("🛒  " + t("add_to_bag"));
    } catch {
      showToast("❌  Could not add to Bag");
    }
  };

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.artisan || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeFilter === "All" ||
        (p.category || "").toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === "price-desc") return parseFloat(b.price) - parseFloat(a.price);
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      return 0;
    });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] =
      cat === "All"
        ? products.length
        : products.filter((p) => (p.category || "").toLowerCase() === cat.toLowerCase()).length;
    return acc;
  }, {});

  return (
    <div className="shop-container">

      {/* HERO */}
      <div className="shop-hero">
        <div className="shop-hero-inner">
          <div className="shop-hero-eyebrow">✦ {t("hero_eyebrow")}</div>

          <h1 className="shop-hero-title">
            {activeFilter !== "All" ? (
              <>
                {t(activeFilter === "All" ? "cat_all" : "cat_" + activeFilter.toLowerCase())} <em>{t("collection")}</em>
              </>
            ) : (
              t("shop_title")
            )}
          </h1>

          {searchQuery && (
            <div style={{ color: "rgba(255,220,170,0.75)", fontSize: 14, marginTop: 8 }}>
              {t("no_results")} "<strong>{searchQuery}</strong>"
            </div>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="shop-toolbar">
        <div className="shop-search-wrap">
          <span className="shop-search-icon">🔍</span>

          <input
            type="text"
            className="shop-search"
            placeholder={t("shop_search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery && (
            <span
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#c4b5a5",
                fontSize: 16,
              }}
            >
              ✕
            </span>
          )}
        </div>

        <div className="shop-toolbar-right">
          <span className="shop-count">
            <strong>{filteredProducts.length}</strong> {t("shop_products")}
          </span>

          <select
            className="shop-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">{t("shop_sort")}</option>
            <option value="price-asc">{t("sort_low")}</option>
            <option value="price-desc">{t("sort_high")}</option>
            <option value="name-asc">{t("sort_az")}</option>
          </select>

          <div className="shop-view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="shop-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${activeFilter === cat ? "active" : ""}`}
            onClick={() => setActiveFilter(cat)}
          >
            {t(cat === "All" ? "cat_all" : "cat_" + cat.toLowerCase())}

            {categoryCounts[cat] > 0 && (
              <span
                className={`filter-chip-count ${activeFilter === cat ? "active" : ""
                  }`}
              >
                {categoryCounts[cat]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* PRODUCTS */}
      <div className="shop-body">
        <div className={`product-grid ${viewMode === "list" ? "list-view" : ""}`}>

          {loading &&
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

          {!loading &&
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="product-image-wrapper">
                  <img
                    src={
                      product.images?.length > 0
                        ? `http://127.0.0.1:8000${product.images[0]}`
                        : product.image
                          ? `http://127.0.0.1:8000${product.image}`
                          : "https://via.placeholder.com/400x300?text=No+Image"
                    }
                    alt={product.name}
                    className="product-image"
                  />
                  {product.category && (
                    <span className="product-tag">{t(product.category === "All" ? "cat_all" : "cat_" + product.category.toLowerCase(), product.category)}</span>
                  )}
                </div>

                <div
                  className={`shop-heart ${wishlisted[product.id] ? "wishlisted" : ""
                    }`}
                  onClick={(e) => addToWishlist(e, product.id)}
                >
                  {wishlisted[product.id] ? "❤️" : "🤍"}
                </div>

                <div className="product-info">
                  {product.artisan && (
                    <div className="product-artisan-tag">{product.artisan}</div>
                  )}

                  <div className="product-name">{product.name}</div>

                  <div className="product-footer">
                    <span className="product-price">₹{product.price}</span>

                    <button
                      className="add-cart-btn"
                      onClick={(e) => addToCart(e, product.id)}
                    >
                      <span>{t("add_to_bag")}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {!loading && filteredProducts.length === 0 && (
            <div className="shop-empty">
              <span className="shop-empty-icon">🔍</span>

              <div className="shop-empty-title">
                {t("no_results")} "<em>{searchQuery || t(activeFilter === "All" ? "cat_all" : "cat_" + activeFilter.toLowerCase())}</em>"
              </div>

              <div className="shop-empty-sub">
                {activeFilter !== "All"
                  ? t("no_category_products", { category: activeFilter })
                  : t("try_search")}
              </div>

              <button
                onClick={() => {
                  setActiveFilter("All");
                  setSearchQuery("");
                }}
              >
                {t("show_all")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TOAST */}
      <div className={`shop-toast ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
}

export default Shop;