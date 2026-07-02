import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/AddProduct.css";

/* ✅ KEEP YOUR CATEGORY STRUCTURE */
const CATEGORIES = [
  { value: "", label: "Select a category", icon: "" },
  { value: "Pottery", icon: "🏺" },
  { value: "Weaving", icon: "🧵" },
  { value: "Woodcraft", icon: "🪵" },
  { value: "Embroidery", icon: "🪡" },
  { value: "Metalwork", icon: "🥁" },
  { value: "Paintings", icon: "🎨" },
  { value: "Other", icon: "✨" },
];

const AddProduct = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [certification, setCertification] = useState(null);
  const [certName, setCertName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });

  /* ✅ LOAD SAVED LANGUAGE (your key) */
  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang) i18n.changeLanguage(savedLang);
  }, []);

  /* ✅ LANGUAGE SWITCH */
  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const cur = (i18n.language || "en").slice(0, 2);

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2800);
  }, []);

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleCert = (e) => {
    const file = e.target.files[0];
    setCertification(file);
    setCertName(file ? file.name : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category) {
      showToast(t("select_category_warn") || "⚠️ Please select a category");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("email", localStorage.getItem("email"));
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("category", category);

    if (certification) formData.append("certification", certification);
    images.forEach((img) => formData.append("images", img));

    try {
      await axios.post("http://127.0.0.1:8000/api/add-product/", formData);

      showToast(t("add_success") || "✅ Product added successfully!");

      setName("");
      setDescription("");
      setPrice("");
      setCategory("");
      setImages([]);
      setPreviews([]);
      setCertification(null);
      setCertName("");

      setTimeout(() => navigate("/my-products"), 1800);
    } catch (error) {
      console.error(error.response?.data);
      showToast(t("add_error") || "❌ Error adding product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-product-container">

      {/* ✅ LANGUAGE SWITCH (same as dashboard) */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {["en", "hi", "gu"].map((code) => (
            <button
              key={code}
              onClick={() => changeLang(code)}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: cur === code ? "#8B4513" : "#fff",
                color: cur === code ? "#fff" : "#333",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <div className="ap-header">
        <div className="ap-eyebrow">✦ {t("artisan_studio") || "Artisan Studio"}</div>
        <h1 className="ap-title">
          {t("add_product_title") || "Add a new"} <em>{t("product") || "product"}</em>
        </h1>
        <div className="ap-divider" />
      </div>

      <form onSubmit={handleSubmit} className="add-product-card" encType="multipart/form-data">

        {/* Product Name */}
        <div className="ap-field">
          <label className="ap-label">{t("product_name_lbl") || "Product Name"}</label>
          <input
            type="text"
            placeholder={t("product_name_ph") || "e.g. Handmade Bowl"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Price */}
        <div className="ap-field">
          <label className="ap-label">{t("price_lbl") || "Price (₹)"}</label>
          <input
            type="number"
            placeholder={t("price_ph") || "e.g. 1200"}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="1"
          />
        </div>

        {/* Category */}
        <div className="ap-field ap-full">
          <label className="ap-label">{t("category_lbl") || "Category"}</label>

          <div className="ap-category-grid">
            {CATEGORIES.filter((c) => c.value).map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`ap-cat-btn ${category === cat.value ? "selected" : ""}`}
                onClick={() => setCategory(cat.value)}
              >
                <span className="ap-cat-icon">{cat.icon}</span>
                <span className="ap-cat-label">
                  {t(`cat_${cat.value.toLowerCase()}`) || cat.value}
                </span>
                {category === cat.value && <span className="ap-cat-check">✓</span>}
              </button>
            ))}
          </div>

          {category && (
            <div className="ap-selected-cat">
              {t("selected") || "Selected"}:{" "}
              <strong>
                {CATEGORIES.find((c) => c.value === category)?.icon}{" "}
                {t(`cat_${category.toLowerCase()}`) || category}
              </strong>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="ap-field ap-full">
          <label className="ap-label">{t("description_lbl") || "Description"}</label>
          <textarea
            placeholder={
              t("description_ph") ||
              "Describe your product — materials, size, story..."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Images */}
        <div className="ap-field ap-full">
          <label className="ap-label">{t("images_lbl") || "Product Images"}</label>

          <div className="ap-upload-zone">
            <input type="file" multiple accept="image/*" onChange={handleImages} required />
            <span className="ap-upload-icon">🖼️</span>

            <div className="ap-upload-text">
              {images.length > 0
                ? `${images.length} ${t("selected") || "selected"}`
                : t("images_hint") || "Click or drag images here"}
            </div>

            <div className="ap-upload-hint">
              {t("images_sub") || "JPG, PNG, WEBP · Max 5MB"}
            </div>
          </div>

          {previews.length > 0 && (
            <div className="ap-preview-row">
              {previews.map((url, i) => (
                <img key={i} src={url} alt={`preview-${i}`} className="ap-thumb" />
              ))}
            </div>
          )}
        </div>

        {/* Certification */}
        <div className="ap-field ap-full">
          <label className="ap-label">{t("cert_lbl") || "Certification (optional)"}</label>

          <div className="ap-upload-zone">
            <input type="file" accept=".pdf,image/*" onChange={handleCert} />
            <span className="ap-upload-icon">📄</span>
            <div className="ap-upload-text">
              {certName || t("cert_hint") || "Upload certification"}
            </div>
            <div className="ap-upload-hint">
              {t("cert_sub") || "PDF, JPG, PNG · Max 5MB"}
            </div>
          </div>

          {certName && <div className="ap-file-name">📎 {certName}</div>}
        </div>

        {/* Submit */}
        <div className="ap-full">
          <button type="submit" className="ap-submit-btn" disabled={submitting}>
            <div className="ap-submit-inner">
              {submitting && <span className="ap-spinner" />}
              {submitting
                ? t("submitting_text") || "Adding Product…"
                : t("add_product_btn") || "Add Product →"}
            </div>
          </button>
        </div>

      </form>

      <div className={`ap-toast ${toast.show ? "show" : ""}`}>{toast.msg}</div>
    </div>
  );
};

export default AddProduct;