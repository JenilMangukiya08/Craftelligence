import React from "react";
import { useTranslation } from "react-i18next";

const CATEGORIES = [
  { icon: "🏺", name: "Pottery", tKey: "cat_pottery" },
  { icon: "🧵", name: "Weaving", tKey: "cat_weaving" },
  { icon: "🪵", name: "Woodcraft", tKey: "cat_woodcraft" },
  { icon: "🪡", name: "Embroidery", tKey: "cat_embroidery" },
  { icon: "🥁", name: "Metalwork", tKey: "cat_metalwork" },
  { icon: "🎨", name: "Paintings", tKey: "cat_paintings" },
];

const WHY = (t) => [
  {
    icon: "🤝",
    title: t("why1_title"),
    desc: t("why1_desc"),
  },
  {
    icon: "🌿",
    title: t("why2_title"),
    desc: t("why2_desc"),
  },
  {
    icon: "✈️",
    title: t("why3_title"),
    desc: t("why3_desc"),
  },
  {
    icon: "💛",
    title: t("why4_title"),
    desc: t("why4_desc"),
  },
];

function Home({ onNavigate }) {
  const { t } = useTranslation();

  return (
    <div>

      {/* ── HERO ── */}
      <section className="home-hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">
            {t("hero_eyebrow")}
          </div>

          <h1 className="hero-title">
            {t("hero_title_line1")}<br />
            {t("hero_title_line2")}<br />
            {t("hero_title_line3")}
          </h1>

          <p className="hero-body">
            {t("hero_body")}
          </p>

          <div className="hero-cta">
            <button
              className="cta-primary"
              onClick={() => onNavigate && onNavigate("shop")}
            >
              {t("hero_shop")}
            </button>

            <button
              className="cta-secondary"
              onClick={() => onNavigate && onNavigate("about")}
            >
              {t("hero_story")}
            </button>
          </div>
        </div>

        {/* Floating info card */}
        <div className="hero-float-card">
          <div className="float-card-label">
            {t("hero_artisan_label")}
          </div>
          <div className="float-card-value">
            {t("hero_count")}
          </div>
          <div className="float-card-sub">
            {t("hero_sub")}
          </div>
        </div>

        <div className="hero-scroll">
          <div className="hero-scroll-line" />
          {t("scroll_text")}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <div className="home-categories">
        <div className="sec-eyebrow" style={{ color: "rgba(240,204,130,.75)" }}>
          {t("browse_by")}
        </div>

        <div className="sec-title" style={{ color: "var(--cream)" }}>
          {t("find_category")}
        </div>

        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <div
              key={c.name}
              className="cat-pill"
              onClick={() =>
                onNavigate && onNavigate("shop", { category: c.name })
              }
              style={{ cursor: "pointer" }}
            >
              <span className="cat-icon">{c.icon}</span>
              <span className="cat-name">{t(c.tKey)}</span>
            </div>
          ))}
        </div>
      </div>

      <hr />

      {/* ── ARTISAN BANNER ── */}
      <div className="artisan-banner">
        <div className="artisan-banner-content">
          <div className="artisan-eyebrow">
            ✦ {t("artisan_eyebrow")}
          </div>

          <h2 className="artisan-title">
            {t("artisan_title")}
          </h2>

          <p className="artisan-body">
            {t("artisan_body")}
          </p>

          <button
            className="artisan-cta"
            onClick={() => onNavigate && onNavigate("about")}
          >
            {t("artisan_cta")}
          </button>
        </div>
      </div>

      {/* ── WHY CRAFTELLIGENCE ── */}
      <section className="home-section-sm home-section">
        <div className="sec-eyebrow">{t("why_us")}</div>

        <div className="sec-title">
          {t("why_promise")}
        </div>

        <div className="sec-bar" />

        <div className="why-grid">
          {WHY(t).map((w) => (
            <div key={w.title} className="why-card">
              <span className="why-icon">{w.icon}</span>
              <div className="why-title">{w.title}</div>
              <p className="why-desc">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <div className="newsletter">
        <div className="newsletter-left">
          <div className="newsletter-eyebrow">{t("newsletter_eyebrow")}</div>
          <div className="newsletter-title">
            {t("newsletter_title_line1")} <em>{t("newsletter_title_em")}</em><br />{t("newsletter_title_line2")}
          </div>
        </div>
      </div>




    </div>
  );
}

export default Home;