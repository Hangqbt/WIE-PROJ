# CinePost — Movie Microblogging Platform

A microblogging platform for film enthusiasts. Write short reviews on movies, follow other users, and discover people who share your taste.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Password hashing | bcrypt |
| Frontend | React + Vite |

## Prerequisites

- Node.js v20 or later
- npm

## Running Locally

### 1. Clone the repository

```bash
git clone <repo-url>
cd WIE-PROJ-main_FINAL
```

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set a value for `JWT_SECRET` (any long random string). Then:

```bash
node server.js
```

The API runs at `http://localhost:3000`. The SQLite database is created automatically on first run from `db/schema.sql` and seeded with 20 movies and 4 demo accounts.

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Demo accounts

All demo accounts use the password `password123`.

| Username | Display name |
|---|---|
| nolan_fan | Nolan Fan |
| arthouse_ava | Arthouse Ava |
| sci_fi_sam | Sci-Fi Sam |
| blockbuster_bea | Blockbuster Bea |

## Project structure

```
/
├── backend/
│   ├── server.js           # Entry point: middleware + route wiring
│   ├── routes/             # auth, users, posts, movies
│   ├── middleware/         # JWT auth, input validation
│   ├── db/
│   │   ├── schema.sql      # Table definitions — recreate the DB from this
│   │   └── app.db          # Generated at runtime (gitignored)
│   ├── .env.example        # Environment variable template
│   └── README.md           # Full API documentation
├── frontend/
│   ├── src/
│   │   ├── components/     # Feed, Login, MovieCard, MovieDetail, MovieSearch, UserProfile, UserSearch
│   │   └── App.jsx         # Routing + top nav
│   └── README.md           # Frontend setup
└── design-document.md
```
