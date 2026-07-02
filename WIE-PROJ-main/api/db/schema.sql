-- Schema for the movie microblogging platform
-- Matches the Data Model in the project spec (2.3):
-- User, Post, Follow, Like, Reply

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    user_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username       TEXT UNIQUE NOT NULL,
    display_name   TEXT,
    password_hash  TEXT NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movies (
    movie_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    title          TEXT NOT NULL,
    director       TEXT,
    year           INTEGER,
    description    TEXT,
    poster_url     TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
    post_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    movie_id       INTEGER,
    content        TEXT NOT NULL CHECK (length(content) <= 280),
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS follows (
    follower_id    INTEGER NOT NULL,
    following_id   INTEGER NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id)  REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CHECK (follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS likes (
    user_id        INTEGER NOT NULL,
    post_id        INTEGER NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS replies (
    reply_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id        INTEGER NOT NULL,
    user_id        INTEGER NOT NULL,
    content        TEXT NOT NULL CHECK (length(content) <= 280),
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_user       ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_movie       ON posts(movie_id);
CREATE INDEX IF NOT EXISTS idx_replies_post      ON replies(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_post        ON likes(post_id);

-- Seed a handful of movies so the app has real data to browse/review
-- right away. Safe to re-run: only inserts if the table is empty.
INSERT INTO movies (title, director, year, description)
SELECT * FROM (
    SELECT 'The Grand Budapest Hotel' AS title, 'Wes Anderson' AS director, 2014 AS year, 'A concierge and his protégé become embroiled in a theft and murder mystery at a famous European hotel.' AS description
    UNION ALL SELECT 'Parasite', 'Bong Joon-ho', 2019, 'A poor family schemes to become employed by a wealthy family, infiltrating their household.'
    UNION ALL SELECT 'Spirited Away', 'Hayao Miyazaki', 2001, 'A young girl wanders into a world of spirits and must find a way to save her parents and return home.'
    UNION ALL SELECT 'Mad Max: Fury Road', 'George Miller', 2015, 'In a post-apocalyptic wasteland, Furiosa and Max team up to flee a tyrannical warlord.'
    UNION ALL SELECT 'Eternal Sunshine of the Spotless Mind', 'Michel Gondry', 2004, 'A couple undergoes a procedure to erase each other from their memories after a painful breakup.'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM movies);
