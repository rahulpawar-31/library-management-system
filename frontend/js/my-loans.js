// "My Loans" page: current user's borrow history. Depends on api.js + nav.js.

function loanStatusBadge(loan) {
  if (loan.returnedAt) {
    return `<span class="badge badge-returned">Returned</span>`;
  }
  const overdue = new Date(loan.dueDate) < new Date();
  return overdue
    ? `<span class="badge badge-overdue">Overdue</span>`
    : `<span class="badge badge-active">Active</span>`;
}

async function loadMyLoans() {
  const container = document.getElementById("loans-table-container");
  try {
    const res = await apiFetch("/loans/my");
    renderMyLoansTable(res.data || []);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function renderMyLoansTable(loans) {
  const container = document.getElementById("loans-table-container");

  if (!loans.length) {
    container.innerHTML = `<div class="empty-state">You haven't borrowed any books yet.</div>`;
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Book</th>
          <th>Borrowed On</th>
          <th>Due Date</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${loans
          .map(
            (loan) => `
          <tr>
            <td><a href="/book?id=${loan.book?._id}">${escapeHtml(loan.book?.title || "Unknown book")}</a></td>
            <td>${new Date(loan.borrowedAt).toLocaleDateString()}</td>
            <td>${new Date(loan.dueDate).toLocaleDateString()}</td>
            <td>${loanStatusBadge(loan)}</td>
            <td>
              ${
                loan.returnedAt
                  ? ""
                  : `<button type="button" class="btn btn-sm" data-loan-id="${loan._id}">Return</button>`
              }
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  container.querySelectorAll("button[data-loan-id]").forEach((btn) => {
    btn.addEventListener("click", () => handleReturnLoan(btn.dataset.loanId));
  });
}

async function handleReturnLoan(id) {
  if (!confirm("Mark this book as returned?")) return;

  try {
    await apiFetch(`/loans/return/${id}`, { method: "PUT" });
    loadMyLoans();
  } catch (err) {
    alert(err.message);
  }
}

function initMyLoansPage() {
  if (!requireLogin()) return;
  loadMyLoans();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("loans-table-container")) initMyLoansPage();
});
