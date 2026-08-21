// Login + register pages. Depends on api.js + nav.js.

async function handleLoginSubmit(event) {
  event.preventDefault();
  showAlert("form-message", "");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const submitBtn = event.target.querySelector("button[type=submit]");

  submitBtn.disabled = true;
  try {
    const res = await apiFetch("/users/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    saveSession(res.token, res.data);
    window.location.href = "index.html";
  } catch (err) {
    showAlert("form-message", err.message);
    submitBtn.disabled = false;
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  showAlert("form-message", "");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    showAlert("form-message", "Passwords do not match.");
    return;
  }

  const submitBtn = event.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  try {
    await apiFetch("/users/register", {
      method: "POST",
      auth: false,
      body: { name, email, password },
    });
    window.location.href = "login.html?registered=1";
  } catch (err) {
    showAlert("form-message", err.message);
    submitBtn.disabled = false;
  }
}

function initLoginPage() {
  if (isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }
  if (getQueryParam("registered")) {
    showAlert("form-message", "Account created. Please log in.", "success");
  }
  if (getQueryParam("reset")) {
    showAlert("form-message", "Password reset. Please log in with your new password.", "success");
  }
  document.getElementById("login-form").addEventListener("submit", handleLoginSubmit);
}

function initRegisterPage() {
  if (isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }
  document.getElementById("register-form").addEventListener("submit", handleRegisterSubmit);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("login-form")) initLoginPage();
  if (document.getElementById("register-form")) initRegisterPage();
});
