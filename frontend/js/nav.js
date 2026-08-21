// Renders the shared navbar into <div id="nav"></div> on every page.
// Depends on api.js being loaded first (getUser/isLoggedIn/isAdmin/clearSession/escapeHtml).

function renderNavbar() {
  const container = document.getElementById("nav");
  if (!container) return;

  const user = getUser();
  const loggedIn = isLoggedIn();
  const admin = isAdmin();
  // Normalize both "/login" and "/login.html" (nginx serves either) to the
  // same clean path so the active-link check matches regardless of which
  // form the user actually navigated with.
  const currentPage = window.location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  const linkClass = (page) => (currentPage === page ? "active" : "");

  const links = [
    `<a href="/" class="${linkClass("/")}">Books</a>`,
    `<a href="/authors" class="${linkClass("/authors")}">Authors</a>`,
  ];

  if (loggedIn) {
    links.push(`<a href="/book-form" class="${linkClass("/book-form")}">Add Book</a>`);
    if (admin) {
      links.push(`<a href="/admin-users" class="${linkClass("/admin-users")}">Manage Users</a>`);
    }
  }

  const sessionLinks = loggedIn
    ? `
      <span class="navbar-user">
        Hi, ${escapeHtml(user?.name || "there")}
        ${admin ? '<span class="badge badge-admin">admin</span>' : ""}
      </span>
      <a href="/profile" class="${linkClass("/profile")}">Profile</a>
      <button type="button" class="btn-link" id="logout-btn">Logout</button>
    `
    : `
      <a href="/login" class="${linkClass("/login")}">Login</a>
      <a href="/register" class="${linkClass("/register")}">Register</a>
    `;

  container.innerHTML = `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="/" class="navbar-brand">Library</a>
        <div class="navbar-links">
          ${links.join("")}
          ${sessionLinks}
        </div>
      </div>
    </nav>
  `;

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = "/";
    });
  }
}

// ---------- Page guards ----------
// Call at the top of a protected page's script.

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = "/login";
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!isLoggedIn() || !isAdmin()) {
    window.location.href = "/";
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", renderNavbar);
