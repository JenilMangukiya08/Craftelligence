import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaUser } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import ContactUs from "./ContactUs";
import AboutUs from "./AboutUs";
import Home from "./Home";
import Shop from "./shop";
import Wishlist from "./Wishlist";
import Cart from "./Cart";
import AIRecommendation from "./AIRecommendation";
import LanguageSwitcher from "../LanguageSwitcher";

import "../../styles/BuyerDashboard.css";

function BuyerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("home");
  const [tabKey, setTabKey] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [shopCategory, setShopCategory] = useState("All");

  const searchRef = useRef(null);

  const NAV_LINKS = [
    { id: "home", label: t("nav_home") },
    { id: "shop", label: t("nav_shop") },
    { id: "ai", label: t("nav_ai") },
    { id: "about", label: t("nav_about") },
    { id: "contact", label: t("nav_contact") },
    { id: "wishlist", label: t("nav_wishlist") },
  ];

  // ── Navigation ─────────────────────────────
  const goToTab = (tab, options = {}) => {
    if (tab === "shop" && options.category) {
      setShopCategory(options.category);
    }
    if (tab === "shop" && options.search !== undefined) {
      setNavSearch(options.search);
    }
    setActiveTab(tab);
    setTabKey((k) => k + 1);
  };

  // ── Search ─────────────────────────────
  const handleNavSearch = (e) => {
    if (e.key === "Enter" && navSearch.trim()) {
      setShopCategory("All");
      goToTab("shop", { search: navSearch.trim() });
      setSearchOpen(false);
    }
  };

  const handleSearchIconClick = () => {
    if (searchOpen && navSearch.trim()) {
      setShopCategory("All");
      goToTab("shop", { search: navSearch.trim() });
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
    }
  };

  // ── Logout ─────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ── Close search when clicking outside ──
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Reset shop filters when leaving shop ──
  useEffect(() => {
    if (activeTab !== "shop") {
      setShopCategory("All");
      setNavSearch("");
    }
  }, [activeTab]);

  const needsPadding = activeTab !== "home";

  return (
    <div className="buyer-container">

      {/* ══ NAVBAR ══ */}
      <nav className="navbar">

        {/* Logo */}
        <div className="nav-left">
          <img
            src="/logo.png"
            alt="Craftelligence"
            className="logo"
            onClick={() => goToTab("home")}
          />
        </div>

        {/* Center Links */}
        <div className="nav-center">
          {NAV_LINKS.map((link) => (
            <span
              key={link.id}
              className={activeTab === link.id ? "nav-active" : ""}
              onClick={() => goToTab(link.id)}
            >
              {link.label}
            </span>
          ))}
        </div>

        {/* Right Icons */}
        <div className="nav-icons">

          <div className="nav-divider" />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LanguageSwitcher />
          </div>

          <div className="nav-divider" />

          {/* 🔍 Search */}
          <div
            ref={searchRef}
            className={`nav-search ${searchOpen ? "open" : ""}`}
            onClick={handleSearchIconClick}
          >
            <span className="nav-search-icon">
              <FaSearch />
            </span>
            <input
              className="nav-search-input"
              placeholder={t("nav_search")}
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              onKeyDown={handleNavSearch}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="nav-divider" />

          {/* 🛒 Cart */}
          <div className="nav-icon-btn" onClick={() => goToTab("Cart")} title={t("nav_cart")}>
            <FaShoppingCart className="icon" />
          </div>

          {/* 📦 Orders */}
          <div
            className="nav-icon-btn"
            onClick={() => navigate("/my-orders")}
            title={t("nav_myorders")}
          >
            <span style={{ fontSize: "1.1rem" }}>📦</span>
          </div>

          {/* 👤 Profile */}
          <div
            className="nav-icon-btn"
            onClick={() => navigate("/buyer-profile")}
            title={t("nav_profile")}
          >
            <FaUser className="icon" />
          </div>

          {/* ⏻ Logout */}
          <div
            className="nav-icon-btn"
            onClick={handleLogout}
            title="Logout"
            style={{ marginLeft: "4px" }}
          >
            <span style={{ fontSize: "1rem", color: "rgba(255,100,80,.65)" }}>
              ⏻
            </span>
          </div>

        </div>
      </nav>

      {/* ══ MAIN CONTENT ══ */}
      <div className="main-content">
        <div
          className={`tab-enter ${needsPadding ? "tab-padded" : ""}`}
          key={tabKey}
        >
          {activeTab === "home" && <Home onNavigate={goToTab} />}
          {activeTab === "shop" && (
            <Shop
              initialCategory={shopCategory}
              initialSearch={navSearch}
            />
          )}
          {activeTab === "ai" && <AIRecommendation />}
          {activeTab === "about" && <AboutUs />}
          {activeTab === "contact" && <ContactUs />}
          {activeTab === "wishlist" && <Wishlist />}
          {activeTab === "Cart" && <Cart />}
        </div>
      </div>
    </div>
  );
}

export default BuyerDashboard;