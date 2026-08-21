// Forgot-password page: request an OTP, then reset with that OTP + a new password.
// Skips the separate /users/verify-otp call on purpose — it clears the OTP server-side,
// which would make the following reset-password call reject that same OTP as invalid.
// Depends on api.js + nav.js.

async function handleRequestOtp(event) {
  event.preventDefault();
  showAlert("form-message", "");

  const email = document.getElementById("email").value.trim();
  const submitBtn = event.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  try {
    await apiFetch("/users/forgot-password", {
      method: "POST",
      auth: false,
      body: { email },
    });

    document.getElementById("reset-email").value = email;
    document.getElementById("sent-to").textContent = email;
    document.getElementById("request-otp-form").classList.add("hidden");
    document.getElementById("reset-password-form").classList.remove("hidden");
    showAlert("form-message", "A reset code has been sent to your email.", "success");
  } catch (err) {
    showAlert("form-message", err.message);
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleResetPassword(event) {
  event.preventDefault();
  showAlert("form-message", "");

  const email = document.getElementById("reset-email").value;
  const otp = document.getElementById("otp").value.trim();
  const newPassword = document.getElementById("new-password").value;
  const confirmNewPassword = document.getElementById("confirm-new-password").value;

  if (newPassword !== confirmNewPassword) {
    showAlert("form-message", "Passwords do not match.");
    return;
  }

  const submitBtn = event.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  try {
    await apiFetch("/users/reset-password", {
      method: "POST",
      auth: false,
      body: { email, otp, newPassword },
    });
    window.location.href = "login.html?reset=1";
  } catch (err) {
    showAlert("form-message", err.message);
    submitBtn.disabled = false;
  }
}

function backToRequestStep(event) {
  event.preventDefault();
  document.getElementById("reset-password-form").classList.add("hidden");
  document.getElementById("request-otp-form").classList.remove("hidden");
  showAlert("form-message", "");
}

function initForgotPasswordPage() {
  document.getElementById("request-otp-form").addEventListener("submit", handleRequestOtp);
  document.getElementById("reset-password-form").addEventListener("submit", handleResetPassword);
  document.getElementById("back-to-request").addEventListener("click", backToRequestStep);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("request-otp-form")) initForgotPasswordPage();
});
