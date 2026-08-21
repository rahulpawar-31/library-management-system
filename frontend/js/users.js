// Admin-only user management page. Depends on api.js + nav.js.
// Note: GET /users only ever returns active (isDeleted: false) users — the API
// has no way to list deactivated users, so there's no "restore" UI here; a
// deactivated user can currently only be restored via a direct API call.

async function loadUsers() {
  const container = document.getElementById("users-table-container");
  try {
    const users = await apiFetch("/users");
    renderUsersTable(users);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function renderUsersTable(users) {
  const container = document.getElementById("users-table-container");

  if (!users.length) {
    container.innerHTML = `<div class="empty-state">No active users found.</div>`;
    return;
  }

  const currentUser = getUser();

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Joined</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            (u) => `
          <tr>
            <td>${escapeHtml(u.name)}</td>
            <td>${escapeHtml(u.email)}</td>
            <td><span class="badge ${u.role === "admin" ? "badge-admin" : ""}">${escapeHtml(u.role)}</span></td>
            <td>${new Date(u.createdAt).toLocaleDateString()}</td>
            <td>
              ${
                u._id === currentUser?._id
                  ? `<span class="hint">You</span>`
                  : `<button type="button" class="btn btn-danger btn-sm" data-user-id="${u._id}">Deactivate</button>`
              }
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  container.querySelectorAll("button[data-user-id]").forEach((btn) => {
    btn.addEventListener("click", () => handleDeactivateUser(btn.dataset.userId));
  });
}

async function handleDeactivateUser(id) {
  if (!confirm("Deactivate this user? They will no longer be able to log in.")) return;

  try {
    await apiFetch(`/users/soft-delete/${id}`, { method: "DELETE" });
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}

function initAdminUsersPage() {
  if (!requireAdmin()) return;
  loadUsers();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("users-table-container")) initAdminUsersPage();
});
