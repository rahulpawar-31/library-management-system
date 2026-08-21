// Book catalog list page (index.html). Detail and create/edit page logic
// is added to this same file in later steps. Depends on api.js + nav.js.

let allBooks = [];

async function loadBooks() {
  const grid = document.getElementById("books-grid");
  try {
    const res = await apiFetch("/books", { auth: false });
    allBooks = res.data || [];
    renderBooks(allBooks);
  } catch (err) {
    grid.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function renderBooks(books) {
  const grid = document.getElementById("books-grid");

  if (!books.length) {
    grid.innerHTML = `<div class="empty-state">No books found.</div>`;
    return;
  }

  grid.innerHTML = books
    .map(
      (book) => `
    <a class="book-card" href="/book?id=${book._id}">
      <img class="book-cover" src="${coverImageUrl(book.coverImage)}" alt="${escapeHtml(book.title)} cover" />
      <div class="book-card-body">
        <div class="book-card-title">${escapeHtml(book.title)}</div>
        <div class="book-card-author">${escapeHtml(book.author?.name || "Unknown author")}</div>
      </div>
    </a>
  `
    )
    .join("");
}

function handleBookSearch(event) {
  const term = event.target.value.trim().toLowerCase();

  if (!term) {
    renderBooks(allBooks);
    return;
  }

  const filtered = allBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(term) ||
      (book.author?.name || "").toLowerCase().includes(term)
  );
  renderBooks(filtered);
}

function initBooksListPage() {
  loadBooks();
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.addEventListener("input", handleBookSearch);
}

// ---------- Book detail page (book.html) ----------

async function loadBookDetail() {
  const container = document.getElementById("book-detail");
  const id = getQueryParam("id");

  if (!id) {
    container.innerHTML = `<div class="alert alert-error">No book specified.</div>`;
    return;
  }

  try {
    const book = await apiFetch(`/books/${id}`, { auth: false });
    renderBookDetail(book);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function renderBookDetail(book) {
  const container = document.getElementById("book-detail");
  const author = book.author || {};

  const authorLink = author._id
    ? `<a href="/author?id=${author._id}">${escapeHtml(author.name || "Unknown author")}</a>`
    : escapeHtml(author.name || "Unknown author");

  const actions = isLoggedIn()
    ? `
      <div class="detail-actions">
        <a class="btn btn-secondary" href="/book-form?id=${book._id}">Edit</a>
        <button type="button" class="btn btn-danger" id="delete-book-btn">Delete</button>
      </div>
    `
    : "";

  container.innerHTML = `
    <div class="detail-layout">
      <img class="detail-cover" src="${coverImageUrl(book.coverImage)}" alt="${escapeHtml(book.title)} cover" />
      <div class="detail-info">
        <h1>${escapeHtml(book.title)}</h1>
        <div class="detail-meta">
          by ${authorLink}${book.publishedYear ? ` · Published ${escapeHtml(String(book.publishedYear))}` : ""}
        </div>
        <p>${escapeHtml(book.description || "No description available.")}</p>
        ${actions}
      </div>
    </div>
  `;

  const deleteBtn = document.getElementById("delete-book-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => handleDeleteBook(book._id));
  }
}

async function handleDeleteBook(id) {
  if (!confirm("Delete this book? This cannot be undone.")) return;

  try {
    await apiFetch(`/books/${id}`, { method: "DELETE" });
    window.location.href = "/";
  } catch (err) {
    alert(err.message);
  }
}

function initBookDetailPage() {
  loadBookDetail();
}

// ---------- Book create/edit page (book-form.html) ----------

let editingBookId = null;

async function loadAuthorsIntoSelect(selectedAuthorId) {
  const select = document.getElementById("author-select");
  try {
    const res = await apiFetch("/authors", { auth: false });
    const authors = res.data || [];

    if (!authors.length) {
      select.innerHTML = `<option value="">No authors yet — add one first</option>`;
      return;
    }

    select.innerHTML = authors
      .map(
        (a) =>
          `<option value="${a._id}" ${a._id === selectedAuthorId ? "selected" : ""}>${escapeHtml(a.name)}</option>`
      )
      .join("");
  } catch (err) {
    select.innerHTML = `<option value="">Failed to load authors</option>`;
  }
}

async function initBookFormPage() {
  if (!requireLogin()) return;

  editingBookId = getQueryParam("id");
  const isEdit = !!editingBookId;

  document.getElementById("form-title").textContent = isEdit ? "Edit Book" : "Add Book";
  document.getElementById("submit-btn").textContent = isEdit ? "Save Changes" : "Add Book";

  const coverInput = document.getElementById("cover-image");
  if (isEdit) {
    // The backend's update route has no upload middleware, so the cover
    // image can only be set at creation time — not changed on edit.
    coverInput.removeAttribute("required");
    document.getElementById("cover-field").classList.add("hidden");
  }

  await loadAuthorsIntoSelect(null);

  if (isEdit) {
    try {
      const book = await apiFetch(`/books/${editingBookId}`, { auth: false });
      document.getElementById("title").value = book.title || "";
      document.getElementById("published-year").value = book.publishedYear || "";
      document.getElementById("description").value = book.description || "";
      document.getElementById("author-select").value = book.author?._id || "";
    } catch (err) {
      showAlert("form-message", err.message);
    }
  }

  document.getElementById("book-form").addEventListener("submit", handleBookFormSubmit);
}

async function handleBookFormSubmit(event) {
  event.preventDefault();
  showAlert("form-message", "");

  const title = document.getElementById("title").value.trim();
  const authorId = document.getElementById("author-select").value;
  const publishedYear = document.getElementById("published-year").value;
  const description = document.getElementById("description").value.trim();
  const submitBtn = document.getElementById("submit-btn");

  if (!authorId) {
    showAlert("form-message", "Please select an author.");
    return;
  }

  submitBtn.disabled = true;

  try {
    if (editingBookId) {
      // The update route reads the schema's own field name (`author`), not `authorId`.
      await apiFetch(`/books/${editingBookId}`, {
        method: "PUT",
        body: {
          title,
          author: authorId,
          publishedYear: publishedYear ? Number(publishedYear) : undefined,
          description,
        },
      });
      window.location.href = `/book?id=${editingBookId}`;
    } else {
      const coverFile = document.getElementById("cover-image").files[0];
      const formData = new FormData();
      formData.append("title", title);
      formData.append("authorId", authorId);
      if (publishedYear) formData.append("publishedYear", publishedYear);
      if (description) formData.append("description", description);
      formData.append("coverImage", coverFile);

      const res = await apiFetch("/books", { method: "POST", isForm: true, body: formData });
      window.location.href = `/book?id=${res.data._id}`;
    }
  } catch (err) {
    showAlert("form-message", err.message);
    submitBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("books-grid")) {
    initBooksListPage();
  }
  if (document.getElementById("book-detail")) {
    initBookDetailPage();
  }
  if (document.getElementById("book-form")) {
    initBookFormPage();
  }
});
