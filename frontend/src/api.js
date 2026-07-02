// src/api.js
const BASE = "http://127.0.0.1:8000/api/admin";

const adminEmail = () => localStorage.getItem("admin_email") || "";

const headers = (isJson = true) => ({
  ...(isJson ? { "Content-Type": "application/json" } : {}),
  "X-Admin-Email": adminEmail(),
});

const get   = (path)       => fetch(`${BASE}${path}`, { headers: headers(false) }).then(r => r.json());
const post  = (path, body) => fetch(`${BASE}${path}`, { method: "POST",   headers: headers(), body: JSON.stringify(body) }).then(r => r.json());
const patch = (path, body) => fetch(`${BASE}${path}`, { method: "PATCH",  headers: headers(), body: JSON.stringify(body) }).then(r => r.json());
const del   = (path)       => fetch(`${BASE}${path}`, { method: "DELETE", headers: headers(false) }).then(r => r.json());

// ── Auth ──────────────────────────────────────────────────────────────────────
export const adminLogin = (username, password) =>
  fetch(`${BASE}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).then(r => r.json());

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getStats = () => get("/stats/");

// ── Artisans ──────────────────────────────────────────────────────────────────
export const getArtisans    = ()   => get("/artisans/");
export const verifyArtisan  = (id) => patch(`/artisans/${id}/verify/`, {});
export const deleteArtisan  = (id) => del(`/artisans/${id}/delete/`);

// ── Buyers ────────────────────────────────────────────────────────────────────
export const getBuyers      = ()   => get("/buyers/");
export const deleteBuyer    = (id) => del(`/buyers/${id}/delete/`);

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts    = ()         => get("/products/");
export const updateProduct  = (id, data) => patch(`/products/${id}/update/`, data);
export const deleteProduct  = (id)       => del(`/products/${id}/delete/`);

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders      = ()         => get("/orders/");
export const updateOrder    = (id, data) => patch(`/orders/${id}/update/`, data);

// ── Order Items ───────────────────────────────────────────────────────────────
export const getOrderItems     = ()         => get("/order-items/");
export const updateOrderItem   = (id, data) => patch(`/order-items/${id}/update/`, data);

// ── Reviews (admin) ───────────────────────────────────────────────────────────
export const getAdminReviews   = ()   => get("/reviews/");
export const approveReview     = (id) => patch(`/reviews/${id}/approve/`, {});
export const rejectReview      = (id) => del(`/reviews/${id}/reject/`);

// ── Artisan Analytics ────────────────────────────────────────────────────────
export const getArtisanAnalytics = (category='', sort='orders') =>
  get(`/artisan-analytics/?category=${category}&sort=${sort}`);