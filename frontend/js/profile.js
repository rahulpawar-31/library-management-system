// Profile page: view/edit own name, change password. Depends on api.js + nav.js.
// Note: the update-user route strips email/password/role out of the request
// body server-side, so only `name` is actually editable through it.

async function loadProfile() {
  const user = getUser();
  try {
    const freshUser = await apiFetch(`/users/${user._id}`);
    document.getElementById("name").value = freshUser.name || "";
    document.getElementById("email").value = freshUser.email || "";
    document.getElementById("role-badge").textContent = freshUser.role;
  } catch (err) {
    showAlert("profile-message", err.message);
  }
}

async function handleProfileSubmit(event) {
  event.preventDefault();
  showAlert("profile-message", "");

  const user = getUser();
  const name = document.getElementById("name").value.trim();
  const submitBtn = event.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  try {
    const updated = await apiFetch(`/users/${user._id}`, {
      method: "PUT",
      body: { name },
    });
    saveSession(getToken(), updated);
    renderNavbar();
    showAlert("profile-message", "Profile updated.", "success");
  } catch (err) {
    showAlert("profile-message", err.message);
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleChangePasswordSubmit(event) {
  event.preventDefault();
  showAlert("password-message", "");

  const oldPassword = document.getElementById("old-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmNewPassword = document.getElementById("confirm-new-password").value;
  const submitBtn = event.target.querySelector("button[type=submit]");

  if (newPassword !== confirmNewPassword) {
    showAlert("password-message", "New passwords do not match.");
    return;
  }

  submitBtn.disabled = true;
  try {
    await apiFetch("/users/change-password", {
      method: "PUT",
      body: { oldPassword, newPassword },
    });
    showAlert("password-message", "Password changed successfully.", "success");
    event.target.reset();
  } catch (err) {
    showAlert("password-message", err.message);
  } finally {
    submitBtn.disabled = false;
  }
}

function initProfilePage() {
  if (!requireLogin()) return;
  loadProfile();
  document.getElementById("profile-form").addEventListener("submit", handleProfileSubmit);
  document.getElementById("change-password-form").addEventListener("submit", handleChangePasswordSubmit);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("profile-form")) initProfilePage();
});
