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
    reaction       TEXT CHECK (reaction IN ('upvote', 'downvote')),
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
INSERT INTO movies (title, director, year, description, poster_url)
SELECT * FROM (
    SELECT 'The Grand Budapest Hotel' AS title, 'Wes Anderson' AS director, 2014 AS year, 'A concierge and his protégé become embroiled in a theft and murder mystery at a famous European hotel.' AS description, 'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Grand_Budapest_Hotel.png' AS poster_url
    UNION ALL SELECT 'Parasite', 'Bong Joon-ho', 2019, 'A poor family schemes to become employed by a wealthy family, infiltrating their household.', 'https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png'
    UNION ALL SELECT 'Spirited Away', 'Hayao Miyazaki', 2001, 'A young girl wanders into a world of spirits and must find a way to save her parents and return home.', 'https://upload.wikimedia.org/wikipedia/en/d/db/Spirited_Away_Japanese_poster.png'
    UNION ALL SELECT 'Mad Max: Fury Road', 'George Miller', 2015, 'In a post-apocalyptic wasteland, Furiosa and Max team up to flee a tyrannical warlord.', 'https://upload.wikimedia.org/wikipedia/en/6/6e/Mad_Max_Fury_Road.jpg'
    UNION ALL SELECT 'Eternal Sunshine of the Spotless Mind', 'Michel Gondry', 2004, 'A couple undergoes a procedure to erase each other from their memories after a painful breakup.', 'https://upload.wikimedia.org/wikipedia/en/a/a4/Eternal_Sunshine_of_the_Spotless_Mind.png'
    UNION ALL SELECT 'Gladiator', 'Ridley Scott', 2000, 'A betrayed Roman general seeks revenge after being forced into slavery as a gladiator.', 'https://upload.wikimedia.org/wikipedia/en/f/fb/Gladiator_%282000_film_poster%29.png'
    UNION ALL SELECT 'The Lord of the Rings: The Fellowship of the Ring', 'Peter Jackson', 2001, 'A young hobbit begins a perilous journey to destroy a powerful ring before darkness consumes Middle-earth.', 'https://upload.wikimedia.org/wikipedia/en/f/fb/Lord_Rings_Fellowship_Ring.jpg'
    UNION ALL SELECT 'The Lord of the Rings: The Return of the King', 'Peter Jackson', 2003, 'The final battle for Middle-earth unfolds as Frodo and Sam approach Mount Doom.', 'https://upload.wikimedia.org/wikipedia/en/4/48/Lord_Rings_Return_King.jpg'
    UNION ALL SELECT 'The Dark Knight', 'Christopher Nolan', 2008, 'Batman faces the Joker, a criminal mastermind who pushes Gotham City into chaos.', 'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg'
    UNION ALL SELECT 'Inception', 'Christopher Nolan', 2010, 'A skilled thief enters dreams to steal secrets and attempts one last impossible act of planting an idea.', 'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg'
    UNION ALL SELECT 'The Social Network', 'David Fincher', 2010, 'The founding of Facebook sparks ambition, rivalry, and legal battles among its creators.', 'https://upload.wikimedia.org/wikipedia/en/8/8c/The_Social_Network_film_poster.png'
    UNION ALL SELECT 'Interstellar', 'Christopher Nolan', 2014, 'Explorers travel through a wormhole in search of a new home for humanity.', 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg'
    UNION ALL SELECT 'Whiplash', 'Damien Chazelle', 2014, 'An ambitious young drummer is pushed to his limits by a ruthless music instructor.', 'https://upload.wikimedia.org/wikipedia/en/0/01/Whiplash_poster.jpg'
    UNION ALL SELECT 'La La Land', 'Damien Chazelle', 2016, 'A jazz musician and an aspiring actor fall in love while chasing their dreams in Los Angeles.', 'https://upload.wikimedia.org/wikipedia/en/a/ab/La_La_Land_%28film%29.png'
    UNION ALL SELECT 'Get Out', 'Jordan Peele', 2017, 'A young man uncovers a disturbing secret while visiting his girlfriend''s family estate.', 'https://upload.wikimedia.org/wikipedia/en/a/a3/Get_Out_poster.png'
    UNION ALL SELECT 'Avengers: Endgame', 'Anthony Russo and Joe Russo', 2019, 'The Avengers assemble for a final attempt to reverse Thanos'' devastating snap.', 'https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg'
    UNION ALL SELECT 'Dune', 'Denis Villeneuve', 2021, 'A noble family becomes entangled in a war for control of the desert planet Arrakis.', 'https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_%282021_film%29.jpg'
    UNION ALL SELECT 'Everything Everywhere All at Once', 'Daniel Kwan and Daniel Scheinert', 2022, 'A laundromat owner is swept into a multiverse adventure that tests her family and identity.', 'https://upload.wikimedia.org/wikipedia/en/1/1e/Everything_Everywhere_All_at_Once.jpg'
    UNION ALL SELECT 'Oppenheimer', 'Christopher Nolan', 2023, 'Physicist J. Robert Oppenheimer leads the Manhattan Project and confronts the consequences of his work.', 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg'
    UNION ALL SELECT 'Dune: Part Two', 'Denis Villeneuve', 2024, 'Paul Atreides unites with the Fremen and seeks revenge while facing visions of a terrible future.', 'https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM movies);

-- Demo users and movie activity for profile discovery. Password is
-- "password123" for local demos; replace/remove this seed for production data.
INSERT INTO users (username, display_name, password_hash)
SELECT 'nolan_fan', 'Nolan Fan', '$2a$10$qnxPuMlq0teCxZYsnRzfPeZJxUA1NxYNrksMwi63IUIuFV2jl25Ma'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'nolan_fan');

INSERT INTO users (username, display_name, password_hash)
SELECT 'arthouse_ava', 'Arthouse Ava', '$2a$10$qnxPuMlq0teCxZYsnRzfPeZJxUA1NxYNrksMwi63IUIuFV2jl25Ma'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'arthouse_ava');

INSERT INTO users (username, display_name, password_hash)
SELECT 'sci_fi_sam', 'Sci-Fi Sam', '$2a$10$qnxPuMlq0teCxZYsnRzfPeZJxUA1NxYNrksMwi63IUIuFV2jl25Ma'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'sci_fi_sam');

INSERT INTO users (username, display_name, password_hash)
SELECT 'blockbuster_bea', 'Blockbuster Bea', '$2a$10$qnxPuMlq0teCxZYsnRzfPeZJxUA1NxYNrksMwi63IUIuFV2jl25Ma'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'blockbuster_bea');

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'A precise thriller with a villain performance that still feels electric.', 'upvote'
FROM users u, movies m
WHERE u.username = 'nolan_fan' AND m.title = 'The Dark Knight'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'The layered dream logic makes every rewatch feel like a puzzle box.', 'upvote'
FROM users u, movies m
WHERE u.username = 'nolan_fan' AND m.title = 'Inception'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'The final hour turns cosmic scale into something painfully human.', 'upvote'
FROM users u, movies m
WHERE u.username = 'nolan_fan' AND m.title = 'Interstellar'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'Class satire with surgical timing and a perfect tonal slide into horror.', 'upvote'
FROM users u, movies m
WHERE u.username = 'arthouse_ava' AND m.title = 'Parasite'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'Chaotic, tender, and somehow completely coherent by the end.', 'upvote'
FROM users u, movies m
WHERE u.username = 'arthouse_ava' AND m.title = 'Everything Everywhere All at Once'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'The memory-erasure premise lands because the relationship feels so specific.', 'upvote'
FROM users u, movies m
WHERE u.username = 'arthouse_ava' AND m.title = 'Eternal Sunshine of the Spotless Mind'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'Huge, strange, and patient in exactly the right ways.', 'upvote'
FROM users u, movies m
WHERE u.username = 'sci_fi_sam' AND m.title = 'Dune'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'Bigger and sharper than the first part, especially once the desert politics tighten.', 'upvote'
FROM users u, movies m
WHERE u.username = 'sci_fi_sam' AND m.title = 'Dune: Part Two'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'The spectacle works because the emotion is doing just as much heavy lifting.', 'upvote'
FROM users u, movies m
WHERE u.username = 'sci_fi_sam' AND m.title = 'Interstellar'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'A crowd-pleaser that actually earns the victory lap.', 'upvote'
FROM users u, movies m
WHERE u.username = 'blockbuster_bea' AND m.title = 'Avengers: Endgame'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'Pure momentum, clean action geography, and a world that feels scorched into place.', 'upvote'
FROM users u, movies m
WHERE u.username = 'blockbuster_bea' AND m.title = 'Mad Max: Fury Road'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);

INSERT INTO posts (user_id, movie_id, content, reaction)
SELECT u.user_id, m.movie_id, 'A grand finale that still gives the smallest emotional beats room to breathe.', 'upvote'
FROM users u, movies m
WHERE u.username = 'blockbuster_bea' AND m.title = 'The Lord of the Rings: The Return of the King'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE user_id = u.user_id AND movie_id = m.movie_id);
