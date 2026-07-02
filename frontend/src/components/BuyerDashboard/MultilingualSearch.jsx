import { useState, useCallback, useRef } from "react";

const LANG_LABELS = {
  en: "English",
  hi: "हिंदी",
  gu: "ગુજરાતી",
  ta: "தமிழ்",
  bn: "বাংলা",
  auto: "Auto-detect",
};

const EXAMPLE_QUERIES = [
  { text: "मिट्टी के बर्तन", lang: "hi", meaning: "Pottery" },
  { text: "હસ્તકળા ભરત", lang: "gu", meaning: "Embroidery" },
  { text: "மரப்பொம்மை", lang: "ta", meaning: "Wooden toys" },
  { text: "হাতে বোনা শাড়ি", lang: "bn", meaning: "Handwoven saree" },
];

export default function MultilingualSearch({ onResults, apiBase = "" }) {
  const [query, setQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState("auto");
  const [isSearching, setIsSearching] = useState(false);
  const [detectedLang, setDetectedLang] = useState(null);
  const [translatedQuery, setTranslatedQuery] = useState(null);
  const [error, setError] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef(null);

  const handleSearch = useCallback(
    async (searchQuery = query) => {
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      setError(null);
      setDetectedLang(null);
      setTranslatedQuery(null);

      try {
        const res = await fetch(`${apiBase}/api/nlp/search/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            query: searchQuery,
            lang: selectedLang,
          }),
        });

        if (!res.ok) throw new Error("Search failed. Please try again.");
        const data = await res.json();

        setDetectedLang(data.detected_lang);
        setTranslatedQuery(data.translated_query);
        if (onResults) onResults(data.products, data.translated_query);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSearching(false);
      }
    },
    [query, selectedLang, apiBase, onResults]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const useExample = (ex) => {
    setQuery(ex.text);
    setSelectedLang(ex.lang);
    setShowExamples(false);
    setTimeout(() => handleSearch(ex.text), 50);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>🔍</span>
        <div>
          <h2 style={styles.title}>Smart Search</h2>
          <p style={styles.subtitle}>
            Search in Hindi, Gujarati, Tamil, Bengali or English
          </p>
        </div>
      </div>

      {/* Language Selector */}
      <div style={styles.langRow}>
        {Object.entries(LANG_LABELS).map(([code, label]) => (
          <button
            key={code}
            onClick={() => setSelectedLang(code)}
            style={{
              ...styles.langBtn,
              ...(selectedLang === code ? styles.langBtnActive : {}),
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div style={styles.inputRow}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedLang === "hi"
              ? "यहाँ खोजें..."
              : selectedLang === "gu"
                ? "અહીં શોધો..."
                : selectedLang === "ta"
                  ? "இங்கே தேடுங்கள்..."
                  : selectedLang === "bn"
                    ? "এখানে অনুসন্ধান করুন..."
                    : "Search for crafts, artisans, products..."
          }
          style={styles.input}
        />
        <button
          onClick={() => handleSearch()}
          disabled={isSearching || !query.trim()}
          style={{
            ...styles.searchBtn,
            ...(isSearching || !query.trim() ? styles.searchBtnDisabled : {}),
          }}
        >
          {isSearching ? (
            <span style={styles.spinner}>⟳</span>
          ) : (
            "Search →"
          )}
        </button>
      </div>

      {/* Examples */}
      <div style={styles.examplesRow}>
        <button
          style={styles.exampleToggle}
          onClick={() => setShowExamples((v) => !v)}
        >
          {showExamples ? "Hide examples ▲" : "Try examples in Indian languages ▼"}
        </button>
      </div>

      {showExamples && (
        <div style={styles.examplesGrid}>
          {EXAMPLE_QUERIES.map((ex, i) => (
            <button key={i} onClick={() => useExample(ex)} style={styles.exampleChip}>
              <span style={styles.exampleNative}>{ex.text}</span>
              <span style={styles.exampleMeaning}>{ex.meaning}</span>
            </button>
          ))}
        </div>
      )}

      {/* Translation feedback */}
      {detectedLang && translatedQuery && detectedLang !== "en" && (
        <div style={styles.translationBadge}>
          <span style={styles.translationIcon}>🌐</span>
          <span>
            Detected{" "}
            <strong>{LANG_LABELS[detectedLang] || detectedLang}</strong> →
            searching for{" "}
            <strong style={styles.translatedText}>"{translatedQuery}"</strong>
          </span>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    background: "linear-gradient(135deg, #2a1a0e 0%, #1a0f07 100%)",
    border: "1px solid #8B5E3C",
    borderRadius: 16,
    padding: "28px 32px",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#f0e6d3",
    maxWidth: 760,
    width: "100%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  headerIcon: { fontSize: 32 },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "#D4A96A",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#a08060",
  },
  langRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  langBtn: {
    padding: "6px 14px",
    borderRadius: 20,
    border: "1px solid #5a3e28",
    background: "transparent",
    color: "#c9a87c",
    cursor: "pointer",
    fontSize: 13,
    transition: "all 0.15s",
  },
  langBtnActive: {
    background: "#8B5E3C",
    borderColor: "#D4A96A",
    color: "#fff",
    fontWeight: 600,
  },
  inputRow: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    padding: "12px 18px",
    borderRadius: 10,
    border: "1.5px solid #5a3e28",
    background: "rgba(255,255,255,0.05)",
    color: "#f0e6d3",
    fontSize: 16,
    outline: "none",
    fontFamily: "inherit",
  },
  searchBtn: {
    padding: "12px 24px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #C2853A, #8B5E3C)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  },
  searchBtnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  spinner: {
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
    fontSize: 18,
  },
  examplesRow: {
    marginBottom: 8,
  },
  exampleToggle: {
    background: "none",
    border: "none",
    color: "#C2853A",
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
    textDecoration: "underline",
  },
  examplesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 14,
  },
  exampleChip: {
    background: "rgba(139,94,60,0.2)",
    border: "1px solid #5a3e28",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    transition: "background 0.15s",
  },
  exampleNative: {
    fontSize: 15,
    color: "#f0e6d3",
    fontWeight: 500,
  },
  exampleMeaning: {
    fontSize: 11,
    color: "#a08060",
  },
  translationBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(212,169,106,0.12)",
    border: "1px solid #D4A96A44",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#c9a87c",
    marginTop: 10,
  },
  translationIcon: { fontSize: 16 },
  translatedText: { color: "#D4A96A" },
  error: {
    marginTop: 10,
    background: "rgba(200,60,60,0.15)",
    border: "1px solid rgba(200,60,60,0.3)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#f08080",
  },
};
