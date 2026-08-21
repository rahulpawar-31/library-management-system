# Library Management System

![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-F7DF1E?logo=javascript&logoColor=black)
![No build step](https://img.shields.io/badge/Frontend%20build-none-lightgrey)

A book catalog with user accounts, built as a Node/Express/MongoDB REST API with a
plain HTML/CSS/JS frontend (no framework, no build step).

> **Scope note:** despite the name, this is a book/author *catalog* with user
> accounts — there's no borrowing/lending workflow (checkout, return, due dates).
> See [Known Limitations](#known-limitations).

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Overview](#api-overview)
- [Known Limitations](#known-limitations)
- [Test Accounts](#test-accounts)

## Features

- JWT-based auth: register, login, change password, forgot/reset password via
  emailed OTP
- Admin vs. regular user roles
- Book catalog: browse, search, view details, create/edit (with cover image
  upload), delete
- Author catalog: browse, search, view details (with their books), create/edit,
  delete
- Profile page (edit name, change password)
- Admin page: list users, deactivate a user

## Tech Stack

- **Backend:** Node.js, Express 5, MongoDB/Mongoose, JWT, bcrypt, Multer (file
  uploads), Nodemailer (OTP emails), Babel (for ESM `import`/`export` syntax)
- **Frontend:** Plain HTML, CSS, and JavaScript — no build tooling. Each page is
  a standalone `.html` file paired with its own `js/*.js` file, plus shared
  `js/api.js` (fetch wrapper + session helpers) and `js/nav.js` (navbar)

## Project Structure

```
.
├── index.js                 # Express app entry point
├── configs/                 # Nodemailer config
├── controllers/             # Route handlers (users, books, authors)
├── middleware/               # JWT auth, role guard, file upload
├── models/                   # Mongoose schemas
├── routers/                  # Express routers
├── cron/                     # Scheduled cleanup of soft-deleted users/books
├── uploads/                  # Uploaded book cover images (created locally, not committed)
└── frontend/
    ├── css/style.css         # Single shared stylesheet
    ├── js/                   # api.js, nav.js, + one file per page
    └── *.html                # One page per screen
```

## Getting Started

### Prerequisites

- Node.js
- A running MongoDB instance (local `mongod`, or a MongoDB Atlas URI)

### Backend Setup

```bash
npm install
```

Create a `.env` file in the repo root:

```env
PORT=8080
MONGO_URI=mongodb://127.0.0.1:27017/library-management-system
TOKEN_SECRET=some-long-random-string
SALT=10
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-char-gmail-app-password
```

`EMAIL_USER`/`EMAIL_PASS` are only needed for the forgot-password OTP email —
everything else works without them. `EMAIL_PASS` must be a
[Gmail App Password](https://support.google.com/mail/?p=BadCredentials), not
your normal account password.

```bash
npm run dev
```

The API runs at `http://localhost:8080`. Note: `uploads/` must exist for book
cover uploads to work — create it manually if it's missing (`mkdir uploads`),
since empty directories aren't tracked by git.

### Frontend Setup

The frontend is static files — serve `frontend/` with anything:

```bash
npx serve -l 5500 frontend
```

Then open `http://localhost:5500`. The frontend calls the API at
`http://localhost:8080` — that's hardcoded as `API_BASE_URL` in
`frontend/js/api.js`, so update it there if the backend runs elsewhere.

## API Overview

All routes are prefixed with `/api/v1`.

| Resource | Routes |
|---|---|
| Users | `POST /users/register`, `POST /users/login`, `PUT /users/change-password`, `POST /users/forgot-password`, `POST /users/verify-otp`, `POST /users/reset-password`, `GET /users` (admin), `GET/PUT /users/:id`, `DELETE /users/soft-delete/:id` (admin), `PUT /users/restore/:id` (admin) |
| Books | `GET /books`, `GET /books/:id`, `POST /books` (multipart, cover image required), `PUT /books/:id`, `DELETE /books/:id` |
| Authors | `GET /authors`, `GET /authors/:id` (includes their books), `POST /authors`, `PUT /authors/:id`, `DELETE /authors/:id` |

Two field-naming quirks worth knowing if you call the API directly: book
creation expects `authorId`, but book **editing** expects `author` (the
schema's actual field name) — the two routes don't agree.

## Known Limitations

- **No borrowing/lending workflow.** This is a catalog, not a full library
  system — no checkout, return, due dates, or fines.
- **No auth on book/author write routes.** Creating, editing, or deleting a
  book/author requires no login at the API level (the frontend hides those
  controls when logged out, but doesn't — and can't — enforce this).
- **Registration accepts a `role` field with no server-side restriction** —
  the API itself would let anyone self-assign `"admin"`. The frontend's
  register form doesn't expose this, but a direct API call still can.
- **`GET /users` only returns active users**, so there's no way to list or
  restore deactivated accounts from the UI (the restore endpoint exists but
  has nothing to point it at).
- **Book covers can't be changed on edit** — the update route has no upload
  middleware, only creation does.
- **No pagination** on books, authors, or users — fine at small scale, will
  need it as the catalog grows.
- **No automated tests**, frontend or backend.

## Test Accounts

None are seeded — register your own via `/register`. To test admin-only
features, register normally then either promote the account by editing its
`role` field directly in MongoDB, or register via a direct API call with
`role: "admin"` in the body (see the limitation above).
