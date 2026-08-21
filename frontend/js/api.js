// Shared across every page. Load this script before any other frontend/js/*.js file.

const API_ROOT = "http://localhost:8080";
const API_BASE_URL = `${API_ROOT}/api/v1`;

const TOKEN_KEY = "lms_token";
const USER_KEY = "lms_user";

/**
 * Calls the API and returns the parsed JSON body.
 * Throws an Error (with .status and .data) on any non-2xx response,
 * using the API's own `message` field when present.
 */
async function apiFetch(path, { method = "GET", body, isForm = false, auth = true } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (networkError) {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty/non-JSON body
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ---------- Session (token + logged-in user) ----------

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

function isAdmin() {
  const user = getUser();
  return !!user && user.role === "admin";
}

// ---------- Small page helpers ----------

function coverImageUrl(coverImagePath) {
  return `${API_ROOT}/${coverImagePath}`;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

// Renders (or clears, when message is falsy) an alert box into a container element.
function showAlert(containerId, message, type = "error") {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = message ? `<div class="alert alert-${type}">${escapeHtml(message)}</div>` : "";
}
