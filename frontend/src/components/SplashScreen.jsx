import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/Splash.css";

/* SVG corner ornament — a simple L-bracket with a dot */
function CornerSVG() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 40 L4 4 L40 4"
        stroke="rgba(212,168,83,0.55)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="4" cy="4" r="2.5" fill="rgba(212,168,83,0.55)" />
      <circle cx="4" cy="40" r="1.5" fill="rgba(212,168,83,0.28)" />
      <circle cx="40" cy="4" r="1.5" fill="rgba(212,168,83,0.28)" />
    </svg>
  );
}

function SplashScreen() {
  const navigate   = useNavigate();
  const curtainRef = useRef(null);

  useEffect(() => {
    /* Lock scroll ONLY while splash is mounted — restored on unmount */
    document.body.style.overflow = "hidden";

    /* At t=5.4s drop the curtain, then navigate at t=6s */
    const curtainTimer = setTimeout(() => {
      curtainRef.current?.classList.add("drop");
    }, 5400);

    const navTimer = setTimeout(() => {
      navigate("/login");
    }, 6000);

    return () => {
      /* Restore scroll when component unmounts */
      document.body.style.overflow = "";
      clearTimeout(curtainTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <>
      <div className="splash-container">

        {/* ── Background layers ── */}
        <div className="splash-glow" />
        <div className="splash-lines" />
        <div className="splash-grain" />

        {/* ── Floating dust particles ── */}
        <div className="splash-particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>

        {/* ── Corner ornaments ── */}
        <div className="splash-corner splash-corner--tl"><CornerSVG /></div>
        <div className="splash-corner splash-corner--tr"><CornerSVG /></div>
        <div className="splash-corner splash-corner--bl"><CornerSVG /></div>
        <div className="splash-corner splash-corner--br"><CornerSVG /></div>

        {/* ── Horizontal rules ── */}
        <div className="splash-rule splash-rule--top" />
        <div className="splash-rule splash-rule--bottom" />

        {/* ── Centre content ── */}
        <div className="splash-center">

          <p className="splash-eyebrow">Est. 2025 · India's Craft Marketplace</p>

          {/* Logo with Framer Motion on top of CSS animation */}
          <motion.img
            src="/logo.png"
            alt="Craftelligence"
            className="logo"
            whileHover={{ scale: 1.04, filter: "brightness(1.15)" }}
            transition={{ type: "spring", stiffness: 300 }}
          />

          {/* Brand name — data-text mirrors content for shimmer pseudo-element */}
          <motion.h1
            className="brand-text"
            data-text="CRAFTELLIGENCE"
          >
            CRAFTELLIGENCE
          </motion.h1>

          <p className="splash-tagline">
            Where every craft tells a story.
          </p>

          {/* Decorative dots row */}
          <div className="splash-dots">
            <div className="dot" />
            <div className="dot-line" />
            <div className="dot dot--lg" />
            <div className="dot-line" />
            <div className="dot" />
          </div>

        </div>

        {/* ── Progress bar at the bottom ── */}
        <div className="splash-progress-wrap">
          <span className="splash-progress-label">Loading experience</span>
          <div className="splash-progress-track">
            <div className="splash-progress-fill" />
          </div>
        </div>

      </div>

      {/* ── Exit curtain (drops just before navigate) ── */}
      <div className="splash-curtain" ref={curtainRef} />
    </>
  );
}

export default SplashScreen;