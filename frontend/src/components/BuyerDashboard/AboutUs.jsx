import React from "react";
import { useTranslation } from "react-i18next";
import "../../styles/AboutUs.css";

const VALUES = [
  { icon: "🤝", titleKey: "about_value1_title", descKey: "about_value1_desc" },
  { icon: "🌿", titleKey: "about_value2_title", descKey: "about_value2_desc" },
  { icon: "💛", titleKey: "about_value3_title", descKey: "about_value3_desc" },
  { icon: "🔒", titleKey: "about_value4_title", descKey: "about_value4_desc" },
];

function AboutUs({ onNavigate }) {
  const { t } = useTranslation();
  return (
    <div className="about-container">

      {/* ── HERO ── */}
      <div className="about-hero">
        <div className="about-hero-inner">
          <div className="about-hero-eyebrow">{t("about_eyebrow")}</div>
          <h1>
            {t("about_title_line1")} <em>{t("about_title_em")}</em><br />
            {t("about_title_line2")}
          </h1>
          <p className="about-hero-sub">
            {t("about_hero_sub")}
          </p>
        </div>

        {/* Floating stat cards */}
        <div className="about-hero-stats">
          <div className="about-stat-card">
            <div className="about-stat-num">2,400+</div>
            <div className="about-stat-label">{t("about_stat_artisans")}</div>
          </div>
          <div className="about-stat-card">
            <div className="about-stat-num">24</div>
            <div className="about-stat-label">{t("about_stat_states")}</div>
          </div>
          <div className="about-stat-card">
            <div className="about-stat-num">98%</div>
            <div className="about-stat-label">{t("about_stat_satisfaction")}</div>
          </div>
        </div>
      </div>

      {/* ── MISSION STRIP ── */}
      <div className="about-mission-strip">
        <div className="mission-left">
          <div className="sec-eyebrow">{t("about_section_mission")}</div>
          <h2>
            {t("about_bridge_line1")} <em>{t("about_bridge_em")}</em><br />{t("about_bridge_line2")}
          </h2>
          <div className="mission-bar" />
        </div>
        <div className="mission-right">
          <p>
            {t("about_mission_paragraph1")}
            <br /><br />
            {t("about_mission_paragraph2")}
          </p>
        </div>
      </div>

      {/* ── 3-COLUMN SECTIONS ── */}
      <div className="about-content">

        <div className="about-section">
          <span className="about-section-icon">🎯</span>
          <h2>{t("about_section1_title")}</h2>
          <p>{t("about_section1_body")}</p>
        </div>

        <div className="about-section">
          <span className="about-section-icon">🛠️</span>
          <h2>{t("about_section2_title")}</h2>
          <p>{t("about_section2_body")}</p>
        </div>

        <div className="about-section">
          <span className="about-section-icon">⭐</span>
          <h2>{t("about_section3_title")}</h2>
          <ul>
            {[
              t("about_list1"),
              t("about_list2"),
              t("about_list3"),
              t("about_list4"),
            ].map((item) => (
              <li key={item}>
                <span className="about-check">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* ── VALUES GRID ── */}
      <div className="about-values">
        {VALUES.map((v) => (
          <div key={v.titleKey} className="value-card">
            <span className="value-icon">{v.icon}</span>
            <div className="value-title">{t(v.titleKey)}</div>
            <p className="value-desc">{t(v.descKey)}</p>
          </div>
        ))}
      </div>

      {/* ── JOIN US CTA FOOTER ── */}
      <div className="about-footer">
        <div className="about-footer-left">
          <div className="about-footer-eyebrow">{t("about_footer_eyebrow")}</div>
          <h3>
            {t("about_footer_title_line1")} <em>{t("about_footer_title_em")}</em>
          </h3>
          <p>{t("about_footer_body")}</p>
        </div>


      </div>

    </div>
  );
}

export default AboutUs;