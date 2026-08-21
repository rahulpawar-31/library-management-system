// Renders the shared navbar into <div id="nav"></div> on every page.
// Depends on api.js being loaded first (getUser/isLoggedIn/isAdmin/clearSession/escapeHtml).

function renderNavbar() {
  const container = document.getElementById("nav");
  if (!container) return;

  const user = getUser();
  const loggedIn = isLoggedIn();
  const admin = isAdmin();
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const linkClass = (page) => (currentPage === page ? "active" : "");

  const links = [
    `<a href="index.html" class="${linkClass("index.html")}">Books</a>`,
    `<a href="authors.html" class="${linkClass("authors.html")}">Authors</a>`,
  ];

  if (loggedIn) {
    links.push(`<a href="book-form.html" class="${linkClass("book-form.html")}">Add Book</a>`);
    if (admin) {
      links.push(`<a href="admin-users.html" class="${linkClass("admin-users.html")}">Manage Users</a>`);
    }
  }

  const sessionLinks = loggedIn
    ? `
      <span class="navbar-user">
        Hi, ${escapeHtml(user?.name || "there")}
        ${admin ? '<span class="badge badge-admin">admin</span>' : ""}
      </span>
      <a href="profile.html" class="${linkClass("profile.html")}">Profile</a>
      <button type="button" class="btn-link" id="logout-btn">Logout</button>
    `
    : `
      <a href="login.html" class="${linkClass("login.html")}">Login</a>
      <a href="register.html" class="${linkClass("register.html")}">Register</a>
    `;

  container.innerHTML = `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="index.html" class="navbar-brand">Library</a>
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
      window.location.href = "index.html";
    });
  }
}

// ---------- Page guards ----------
// Call at the top of a protected page's script.

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!isLoggedIn() || !isAdmin()) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", renderNavbar);
