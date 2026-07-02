# Backend API

Express + SQLite backend for the movie microblogging platform.

## Setup

```bash
cd api
npm install
cp .env.example .env   # then edit .env and set a real JWT_SECRET
npm run dev             # or: npm start
```

The SQLite database file is created automatically at `api/db/app.db` the
first time the server starts (schema is applied from `db/schema.sql`).

## Auth

Send `Authorization: Bearer <token>` on protected routes. Tokens are issued
by register/login and expire after 1 hour.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register` | - | Create an account, returns a token |
| POST | `/api/users/login` | - | Log in, returns a token |
| GET | `/api/profile` | required | Get your own profile |
| GET | `/api/users/:id` | optional | Get a user's public profile |
| POST | `/api/users/:id/follow` | required | Follow a user |
| DELETE | `/api/users/:id/follow` | required | Unfollow a user |
| POST | `/api/posts` | required | Create a post/review, max 280 chars. Optional `movie_id` to attach it to a movie |
| GET | `/api/posts/feed` | required | Posts from users you follow |
| GET | `/api/posts/:id` | optional | Get a post with replies + counts |
| DELETE | `/api/posts/:id` | required (owner) | Delete your own post |
| POST | `/api/posts/:id/like` | required | Like a post |
| DELETE | `/api/posts/:id/like` | required | Unlike a post |
| POST | `/api/posts/:id/replies` | required | Reply to a post, max 280 chars |
| GET | `/api/movies` | - | List/search movies (`?search=`) |
| GET | `/api/movies/:id` | - | Movie page: details + reviews (posts) about it |
| GET | `/api/health` | - | Health check |

## Project layout

```
api/
├── server.js          # entry point: middleware + route wiring
├── db/
│   ├── database.js     # opens the SQLite connection, applies schema.sql
│   ├── schema.sql       # table definitions (User, Post, Follow, Like, Reply)
│   └── app.db            # generated at runtime, gitignored
├── middleware/
│   ├── auth.js          # JWT verification (authenticateToken, optionalAuth)
│   └── validate.js       # express-validator error handler
└── routes/
    ├── auth.js           # register, login
    ├── users.js          # profile, public profile, follow/unfollow
    ├── posts.js          # posts, feed, likes, replies
    └── movies.js         # mocked movie page
```

## Movies

The original project spec's data model (2.3) didn't define a `Movie` entity,
so a `movies` table was added (`movie_id`, `title`, `director`, `year`,
`description`, `poster_url`) and `posts` now has an optional `movie_id`
foreign key (`ON DELETE SET NULL`, so deleting a movie doesn't delete
people's posts). `db/schema.sql` seeds 5 sample movies on first run so
there's real data to browse immediately — edit or extend that seed block,
or insert rows directly, to add more.

## Notes / next steps

- Password hashing (bcrypt) and cascade deletes (SQLite `ON DELETE CASCADE`)
  are wired up per the project spec's requirements.
- Movie posters are currently just a `poster_url` text column with no
  upload handling — add file storage (e.g. multer + a static folder, or
  S3) if you want real image uploads.
