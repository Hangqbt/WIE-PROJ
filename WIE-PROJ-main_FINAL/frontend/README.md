# Frontend

React + Vite frontend for the CinePost movie microblogging platform.

## Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. The backend must be running at `http://localhost:3000` first.

## Pages

| Route | Component | Description |
|---|---|---|
| `/` | MovieSearch | Browse and search all movies |
| `/movie/:id` | MovieDetail | Movie detail page with reviews |
| `/users` | UserSearch | Discover and search users |
| `/users/:id` | UserProfile | Public user profile with posts and stats |
| `/login` | Login | Register or log in |

## Components

| Component | Responsibility |
|---|---|
| `App.jsx` + `TopNav` | Routing, auth state, navigation bar |
| `Login` | Registration and login forms |
| `MovieSearch` | Movie listing with search input |
| `MovieCard` | Single movie summary card |
| `MovieDetail` | Full movie page with reviews, like/reply counts |
| `UserSearch` | User discovery with shared-taste ranking |
| `UserProfile` | User profile: posts, follower/following counts, follow button |
| `Feed` | Reverse-chronological feed for logged-in users |

## Auth state

On login or register, the JWT token and user object are saved to `localStorage`. Auth state is restored on page refresh. Logging out clears both values.
