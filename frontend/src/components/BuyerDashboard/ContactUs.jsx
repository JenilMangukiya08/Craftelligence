import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/ContactUs.css";

const CONTACT_DETAILS = [
  { icon: "📍", labelKey: "contact_label_address", value: "Ahmedabad, Gujarat, India", href: null },
  { icon: "📞", labelKey: "contact_label_phone", value: "+91 9664728920", href: "tel:+919664728920" },
  { icon: "✉️", labelKey: "contact_label_email", value: "jenilmangukiya009@gmail.com", href: "mailto:jenilmangukiya009@gmail.com" },
  { icon: "🕐", labelKey: "contact_label_hours", value: "Mon – Sat, 9 AM – 6 PM IST", href: null },
];

const SOCIALS = [
  { icon: "📘", label: "Facebook" },
  { icon: "📸", label: "Instagram" },
  { icon: "🐦", label: "Twitter" },
  { icon: "💼", label: "LinkedIn" },
];

function ContactUs() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const charLimit = 500;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "message" && value.length > charLimit) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch("http://localhost:8000/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Error sending message");
        return;
      }

      setSuccess(true);
      setFormData({ name: "", email: "", message: "" });

    } catch (error) {
      alert("Server error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-container">

      {/* ── Hero Banner ── */}
      <div className="contact-hero">
        <div className="contact-hero-inner">
          <div className="contact-hero-eyebrow">{t("contact_eyebrow")}</div>
          <div className="contact-hero-title">
            {t("contact_title_part1")} <em>{t("contact_title_em")}</em>
          </div>
        </div>
      </div>

      {/* ── Split Body ── */}
      <div className="contact-body">

        {/* ══ LEFT — INFO PANEL ══ */}
        <div className="contact-info-panel">
          <div className="contact-info-eyebrow">{t("contact_info_eyebrow")}</div>
          <h2 className="contact-info-title">
            {t("contact_info_title_part1")}<br /><em>{t("contact_info_title_em")}</em>
          </h2>
          <div className="contact-info-bar" />
          <p className="contact-info-sub">
            {t("contact_info_sub")}
          </p>

          {/* Contact detail cards */}
          <div className="contact-details">
            {CONTACT_DETAILS.map((d) => (
              <div key={d.labelKey} className="contact-detail-card">
                <div className="detail-icon-box">{d.icon}</div>
                <div className="detail-text">
                  <div className="detail-label">{t(d.labelKey)}</div>
                  <div className="detail-value">
                    {d.href
                      ? <a href={d.href}>{d.value}</a>
                      : d.value
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Social icons */}
          <div className="contact-social-label">{t("contact_social_label")}</div>
          <div className="contact-socials">
            {SOCIALS.map((s) => (
              <button key={s.label} className="social-btn" title={s.label}>
                {s.icon}
              </button>
            ))}
          </div>
        </div>

        {/* ══ RIGHT — FORM ══ */}
        <div className="contact-form-panel">
          <div className="contact-card">

            {success ? (

              /* Success state */
              <div className="contact-success">
                <span className="contact-success-icon">🎉</span>
                <div className="contact-success-title">
                  {t("contact_success_title")} <em>{t("contact_success_title_em")}</em>
                </div>
                <p className="contact-success-sub">
                  {t("contact_success_body")}
                </p>
                <button
                  className="contact-success-btn"
                  onClick={() => setSuccess(false)}
                >
                  {t("contact_success_button")}
                </button>
              </div>

            ) : (

              /* Form */
              <>
                <div className="contact-form-eyebrow">{t("contact_form_eyebrow")}</div>
                <h2>{t("contact_form_title_part1")} <em>{t("contact_form_title_em")}</em></h2>
                <p>{t("contact_form_sub")}</p>
                <div className="contact-form-divider" />

                <form onSubmit={handleSubmit}>

                  <div className="contact-input-group">
                    <label className="contact-input-label">{t("contact_form_label_name")}</label>
                    <input
                      type="text"
                      name="name"
                      placeholder={t("contact_form_placeholder_name")}
                      value={formData.name}
                      required
                      onChange={handleChange}
                    />
                  </div>

                  <div className="contact-input-group">
                    <label className="contact-input-label">{t("contact_form_label_email")}</label>
                    <input
                      type="email"
                      name="email"
                      placeholder={t("contact_form_placeholder_email")}
                      value={formData.email}
                      required
                      onChange={handleChange}
                    />
                  </div>

                  <div className="contact-input-group">
                    <label className="contact-input-label">{t("contact_form_label_message")}</label>
                    <textarea
                      name="message"
                      placeholder={t("contact_form_placeholder_message")}
                      value={formData.message}
                      required
                      onChange={handleChange}
                    />
                    <div className="contact-char-count">
                      {formData.message.length} / {charLimit}
                    </div>
                  </div>

                  <button type="submit" disabled={sending}>
                    <div className="btn-inner">
                      {sending && <span className="btn-spinner" />}
                      {sending ? t("contact_form_sending") : t("contact_form_submit")}
                    </div>
                  </button>

                </form>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default ContactUs;