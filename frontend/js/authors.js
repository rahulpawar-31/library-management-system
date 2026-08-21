// Authors list, detail, and create/edit pages. Depends on api.js + nav.js.

let allAuthors = [];

async function loadAuthors() {
  const grid = document.getElementById("authors-grid");
  try {
    const res = await apiFetch("/authors", { auth: false });
    allAuthors = res.data || [];
    renderAuthors(allAuthors);
  } catch (err) {
    grid.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function renderAuthors(authors) {
  const grid = document.getElementById("authors-grid");

  if (!authors.length) {
    grid.innerHTML = `<div class="empty-state">No authors found.</div>`;
    return;
  }

  grid.innerHTML = authors
    .map((author) => {
      const bio = author.bio || "";
      const excerpt = bio.length > 120 ? `${bio.slice(0, 120)}…` : bio;
      return `
        <a class="card card-link" href="/author?id=${author._id}">
          <h3>${escapeHtml(author.name)}</h3>
          <p>${escapeHtml(excerpt)}</p>
        </a>
      `;
    })
    .join("");
}

function handleAuthorSearch(event) {
  const term = event.target.value.trim().toLowerCase();

  if (!term) {
    renderAuthors(allAuthors);
    return;
  }

  const filtered = allAuthors.filter(
    (author) =>
      author.name.toLowerCase().includes(term) || (author.bio || "").toLowerCase().includes(term)
  );
  renderAuthors(filtered);
}

function initAuthorsListPage() {
  loadAuthors();
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.addEventListener("input", handleAuthorSearch);
}

// ---------- Author detail page (author.html) ----------

function formatDate(dateStr) {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString();
}

async function loadAuthorDetail() {
  const container = document.getElementById("author-detail");
  const id = getQueryParam("id");

  if (!id) {
    container.innerHTML = `<div class="alert alert-error">No author specified.</div>`;
    return;
  }

  try {
    const res = await apiFetch(`/authors/${id}`, { auth: false });
    renderAuthorDetail(res.data.author, res.data.books);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function renderAuthorDetail(author, books) {
  const container = document.getElementById("author-detail");

  const actions = isLoggedIn()
    ? `
      <div class="detail-actions">
        <a class="btn btn-secondary" href="/author-form?id=${author._id}">Edit</a>
        <button type="button" class="btn btn-danger" id="delete-author-btn">Delete</button>
      </div>
    `
    : "";

  const booksHtml = books.length
    ? `<div class="grid">${books
        .map(
          (book) => `
        <a class="book-card" href="/book?id=${book._id}">
          <img class="book-cover" src="${coverImageUrl(book.coverImage)}" alt="${escapeHtml(book.title)} cover" />
          <div class="book-card-body">
            <div class="book-card-title">${escapeHtml(book.title)}</div>
          </div>
        </a>
      `
        )
        .join("")}</div>`
    : `<div class="empty-state">No books by this author yet.</div>`;

  container.innerHTML = `
    <div class="page-header">
      <h1>${escapeHtml(author.name)}</h1>
    </div>
    <div class="detail-meta">Born ${formatDate(author.birthDate)}</div>
    <p>${escapeHtml(author.bio || "No bio available.")}</p>
    ${actions}
    <div class="page-header section-header">
      <h2>Books</h2>
    </div>
    ${booksHtml}
  `;

  const deleteBtn = document.getElementById("delete-author-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => handleDeleteAuthor(author._id));
  }
}

async function handleDeleteAuthor(id) {
  if (!confirm("Delete this author? This cannot be undone.")) return;

  try {
    await apiFetch(`/authors/${id}`, { method: "DELETE" });
    window.location.href = "/authors";
  } catch (err) {
    alert(err.message);
  }
}

function initAuthorDetailPage() {
  loadAuthorDetail();
}

// ---------- Author create/edit page (author-form.html) ----------

let editingAuthorId = null;

async function initAuthorFormPage() {
  if (!requireLogin()) return;

  editingAuthorId = getQueryParam("id");
  const isEdit = !!editingAuthorId;

  document.getElementById("form-title").textContent = isEdit ? "Edit Author" : "Add Author";
  document.getElementById("submit-btn").textContent = isEdit ? "Save Changes" : "Add Author";

  if (isEdit) {
    try {
      const res = await apiFetch(`/authors/${editingAuthorId}`, { auth: false });
      const author = res.data.author;
      document.getElementById("name").value = author.name || "";
      document.getElementById("bio").value = author.bio || "";
      if (author.birthDate) {
        document.getElementById("birth-date").value = author.birthDate.slice(0, 10);
      }
    } catch (err) {
      showAlert("form-message", err.message);
    }
  }

  document.getElementById("author-form").addEventListener("submit", handleAuthorFormSubmit);
}

async function handleAuthorFormSubmit(event) {
  event.preventDefault();
  showAlert("form-message", "");

  const name = document.getElementById("name").value.trim();
  const bio = document.getElementById("bio").value.trim();
  const birthDate = document.getElementById("birth-date").value;
  const submitBtn = document.getElementById("submit-btn");

  submitBtn.disabled = true;
  try {
    if (editingAuthorId) {
      await apiFetch(`/authors/${editingAuthorId}`, {
        method: "PUT",
        body: { name, bio, birthDate },
      });
      window.location.href = `/author?id=${editingAuthorId}`;
    } else {
      const res = await apiFetch("/authors", {
        method: "POST",
        body: { name, bio, birthDate },
      });
      window.location.href = `/author?id=${res.data._id}`;
    }
  } catch (err) {
    showAlert("form-message", err.message);
    submitBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("authors-grid")) initAuthorsListPage();
  if (document.getElementById("author-detail")) initAuthorDetailPage();
  if (document.getElementById("author-form")) initAuthorFormPage();
});
