# Backend API

Express + SQLite backend for the CinePost movie microblogging platform.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # set a real JWT_SECRET
node server.js
```

The SQLite database is created automatically at `db/app.db` on first run. The schema is applied from `db/schema.sql` and seeded with 20 movies and 4 demo accounts (password: `password123`).

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `JWT_SECRET` | Secret used to sign JWT tokens | none — must be set |
| `ALLOWED_ORIGIN` | Frontend origin allowed by CORS | `http://localhost:5173` |

## Authentication

Send `Authorization: Bearer <token>` on protected routes. Tokens are issued on register/login and expire after 1 hour.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register` | — | Create an account, returns a token |
| POST | `/api/users/login` | — | Log in, returns a token |
| GET | `/api/users` | optional | List users; `?search=` filters by username or display name |
| GET | `/api/users/:id` | optional | Get a user's public profile |
| POST | `/api/users/:id/follow` | required | Follow a user |
| DELETE | `/api/users/:id/follow` | required | Unfollow a user |
| GET | `/api/profile` | required | Get your own profile |
| POST | `/api/posts` | required | Create a post/review (max 280 chars). Optional `movie_id` and `reaction` (upvote/downvote) |
| GET | `/api/posts/feed` | required | Reverse-chronological feed of posts from users you follow |
| GET | `/api/posts/:id` | optional | Get a post with replies and like/reply counts |
| PUT | `/api/posts/:id` | required (owner) | Edit your own post |
| DELETE | `/api/posts/:id` | required (owner) | Delete your own post |
| POST | `/api/posts/:id/like` | required | Like a post |
| DELETE | `/api/posts/:id/like` | required | Unlike a post |
| POST | `/api/posts/:id/replies` | required | Reply to a post (max 280 chars) |
| GET | `/api/movies` | — | List all movies; `?search=` filters by title |
| GET | `/api/movies/:id` | — | Movie detail page with all reviews (posts) |
| GET | `/api/health` | — | Health check |

## Project layout

```
backend/
├── server.js           # Entry point: security middleware + route wiring
├── db/
│   ├── schema.sql      # Table definitions (users, movies, posts, follows, likes, replies)
│   ├── database.js     # Opens SQLite connection, applies schema
│   └── app.db          # Generated at runtime (gitignored)
├── middleware/
│   ├── auth.js         # authenticateToken + optionalAuth middleware
│   └── validate.js     # express-validator error handler
└── routes/
    ├── auth.js         # POST /register, POST /login
    ├── users.js        # Profile, user search, follow/unfollow
    ├── posts.js        # Posts, feed, likes, replies
    └── movies.js       # Movie listing and detail
```
