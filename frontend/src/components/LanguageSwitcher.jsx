// src/components/LanguageSwitcher.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const cur = (i18n.language || "en").slice(0, 2);

  const langs = [
    { code: "en", label: "EN" },
    { code: "hi", label: "हि" },
    { code: "gu", label: "ગુ" },
  ];

  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("craftelligence_lang", lang);
  };

  return (
    <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 4px", border: "1px solid rgba(255,255,255,0.15)" }}>
      {langs.map(l => (
        <button key={l.code} onClick={() => changeLang(l.code)}
          style={{ background: cur === l.code ? "#f7c948" : "transparent", color: cur === l.code ? "#3c1a00" : "rgba(255,255,255,0.75)", border: "none", borderRadius: 14, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", minWidth: 30 }}>
          {l.label}
        </button>
      ))}
    </div>
  );
}