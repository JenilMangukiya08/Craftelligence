import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

// We will reconstruct QUICK_ACTIONS inside the component using translations.

const BOT_AVATAR = "🤖";
const USER_AVATAR = "👤";

function Message({ msg }) {
  const isBot = msg.role === "assistant";
  return (
    <div
      style={{
        ...styles.msgRow,
        flexDirection: isBot ? "row" : "row-reverse",
      }}
    >
      <div style={styles.avatar}>{isBot ? BOT_AVATAR : USER_AVATAR}</div>
      <div
        style={{
          ...styles.bubble,
          ...(isBot ? styles.botBubble : styles.userBubble),
        }}
      >
        {msg.content}
        {msg.products && msg.products.length > 0 && (
          <div style={styles.productCards}>
            {msg.products.slice(0, 3).map((p) => (
              <div key={p.product_id} style={styles.productCard}>
                <div style={styles.productName}>{p.name}</div>
                <div style={styles.productMeta}>
                  {p.category} · ₹{p.price}
                </div>
                {p.artisan_name && (
                  <div style={styles.productArtisan}>by {p.artisan_name}</div>
                )}
              </div>
            ))}
          </div>
        )}
        {msg.artisan_details && msg.artisan_details.length > 0 && (
          <div style={styles.artisanCards}>
            {msg.artisan_details.map((artisan, idx) => (
              <div key={idx} style={styles.artisanCard}>
                <div style={styles.artisanName}>{artisan.name}</div>
                <div style={styles.artisanMeta}>{artisan.address}</div>
                <div style={styles.artisanEmail}>Email: {artisan.email}</div>
                {artisan.phone && <div style={styles.artisanPhone}>Phone: {artisan.phone}</div>}
              </div>
            ))}
          </div>
        )}
        <div style={styles.timestamp}>{msg.time}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ ...styles.msgRow, flexDirection: "row" }}>
      <div style={styles.avatar}>{BOT_AVATAR}</div>
      <div style={{ ...styles.bubble, ...styles.botBubble }}>
        <div style={styles.typingDots}>
          <span style={{ ...styles.dot, animationDelay: "0ms" }} />
          <span style={{ ...styles.dot, animationDelay: "160ms" }} />
          <span style={{ ...styles.dot, animationDelay: "320ms" }} />
        </div>
      </div>
    </div>
  );
}

// FIX 1: default apiBase points to Django dev server, not React's port
export default function CraftelligenceChatbot({ apiBase = "http://localhost:8000" }) {
  const { t } = useTranslation();
  const QUICK_ACTIONS = [
    { label: t("qa_1"), query: t("qa_1_q") },
    { label: t("qa_2"), query: t("qa_2_q") },
    { label: t("qa_3"), query: t("qa_3_q") },
    { label: t("qa_4"), query: t("qa_4_q") },
    { label: t("qa_5"), query: t("qa_5_q") },
    { label: t("qa_6"), query: t("qa_6_q") },
  ];

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: t("bot_welcome"),
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change or chat opens
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg = { role: "user", content: trimmed, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Send only role + content to the backend (no timestamps / products)
      const history = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${apiBase}/api/chatbot/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!res.ok) throw new Error("Bot unavailable");
      const data = await res.json();

      const botMsg = {
        role: "assistant",
        content: data.reply || "🤖 No response. Try again.",
        products: data.products || [],
        artisan_details: data.artisan_details || [],
        time: now(),
      };

      setMessages((prev) => [...prev, botMsg]);

      // FIX 2: increment unread only when the chat window is closed
      if (!isOpen) setUnread((n) => n + 1);

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          time: now(),
        },
      ]);

      // FIX 2: also count error replies as unread when window is closed
      if (!isOpen) setUnread((n) => n + 1);

    } finally {
      setIsTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button style={styles.fab} onClick={() => setIsOpen(true)}>
          <span style={styles.fabIcon}>💬</span>
          {unread > 0 && <span style={styles.badge}>{unread}</span>}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.chatHeader}>
            <div style={styles.headerLeft}>
              <div style={styles.botAvatarLarge}>🤖</div>
              <div>
                <div style={styles.botName}>{t("bot_name")}</div>
                <div style={styles.botStatus}>
                  <span style={styles.onlineDot} />
                  {t("bot_title")}
                </div>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Quick Actions */}
          <div style={styles.quickActions}>
            {QUICK_ACTIONS.map((a, i) => (
              <button
                key={i}
                style={styles.quickBtn}
                onClick={() => sendMessage(a.query)}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={styles.messagesArea}>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={styles.inputArea}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t("bot_ask")}
              style={styles.chatInput}
              rows={1}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              style={{
                ...styles.sendBtn,
                ...(!input.trim() || isTyping ? styles.sendBtnDisabled : {}),
              }}
            >
              ➤
            </button>
          </div>
          <div style={styles.poweredBy}>{t("bot_powered")}</div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(194,133,58,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(194,133,58,0); }
        }
      `}</style>
    </>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const styles = {
  fab: {
    position: "fixed",
    bottom: 28,
    right: 28,
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #C2853A, #8B5E3C)",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
    zIndex: 9999,
    animation: "pulse 2.5s infinite",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fabIcon: { fontSize: 26 },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    background: "#e53935",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: "50%",
    width: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chatWindow: {
    position: "fixed",
    bottom: 28,
    right: 28,
    width: 380,
    height: 580,
    borderRadius: 20,
    background: "linear-gradient(160deg, #1e1208 0%, #130c05 100%)",
    border: "1px solid #5a3e28",
    boxShadow: "0 16px 56px rgba(0,0,0,0.6)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animation: "slideUp 0.25s ease",
    fontFamily: "'Segoe UI', sans-serif",
  },
  chatHeader: {
    background: "linear-gradient(135deg, #2a1a0e, #3d2510)",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #5a3e28",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  botAvatarLarge: { fontSize: 28 },
  botName: {
    fontWeight: 700,
    fontSize: 15,
    color: "#D4A96A",
    letterSpacing: "-0.2px",
  },
  botStatus: {
    fontSize: 11,
    color: "#a08060",
    display: "flex",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#4caf50",
    display: "inline-block",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#a08060",
    cursor: "pointer",
    fontSize: 16,
    padding: 4,
  },
  quickActions: {
    display: "flex",
    gap: 6,
    padding: "10px 14px",
    overflowX: "auto",
    borderBottom: "1px solid #2e1e0e",
    scrollbarWidth: "none",
  },
  quickBtn: {
    flexShrink: 0,
    padding: "5px 11px",
    borderRadius: 14,
    border: "1px solid #5a3e28",
    background: "rgba(139,94,60,0.18)",
    color: "#c9a87c",
    fontSize: 11.5,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 0.15s",
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "14px 14px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    scrollbarWidth: "thin",
    scrollbarColor: "#3d2510 transparent",
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
  },
  avatar: {
    fontSize: 20,
    flexShrink: 0,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "78%",
    padding: "10px 14px",
    borderRadius: 14,
    fontSize: 13.5,
    lineHeight: 1.5,
    position: "relative",
  },
  botBubble: {
    background: "rgba(139,94,60,0.22)",
    border: "1px solid #5a3e2855",
    color: "#f0e6d3",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    background: "linear-gradient(135deg, #C2853A, #8B5E3C)",
    color: "#fff",
    borderBottomRightRadius: 4,
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.45,
    marginTop: 5,
    textAlign: "right",
  },
  productCards: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  productCard: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    padding: "7px 10px",
    border: "1px solid #5a3e2855",
  },
  productName: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "#D4A96A",
  },
  productMeta: {
    fontSize: 11,
    color: "#a08060",
    marginTop: 2,
  },
  productArtisan: {
    fontSize: 11,
    color: "#c9a87c",
    fontStyle: "italic",
    marginTop: 1,
  },
  artisanCards: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  artisanCard: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "10px 12px",
    border: "1px solid #5a3e2855",
  },
  artisanName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#F0D8A8",
  },
  artisanMeta: {
    fontSize: 11,
    color: "#d3b585",
    marginTop: 4,
  },
  artisanEmail: {
    fontSize: 11,
    color: "#f4e5c6",
    marginTop: 4,
  },
  artisanPhone: {
    fontSize: 11,
    color: "#e7d1a9",
    marginTop: 2,
  },
  typingDots: {
    display: "flex",
    gap: 4,
    padding: "2px 0",
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#C2853A",
    display: "inline-block",
    animation: "bounce 1.2s infinite ease-in-out",
  },
  inputArea: {
    display: "flex",
    gap: 8,
    padding: "10px 14px",
    borderTop: "1px solid #2e1e0e",
    alignItems: "flex-end",
  },
  chatInput: {
    flex: 1,
    padding: "9px 13px",
    borderRadius: 10,
    border: "1px solid #5a3e28",
    background: "rgba(255,255,255,0.05)",
    color: "#f0e6d3",
    fontSize: 13,
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
    maxHeight: 80,
    overflow: "auto",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #C2853A, #8B5E3C)",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  poweredBy: {
    textAlign: "center",
    fontSize: 10,
    color: "#5a3e28",
    padding: "4px 0 8px",
  },
};