const express = require('express');
const { body, param } = require('express-validator');

const db = require('../db/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

// Shared helper: attach like_count and reply_count to a post row.
// Ratings/likes are computed on demand rather than cached, per spec 2.4.
function withCounts(post) {
    const like_count = db
        .prepare('SELECT COUNT(*) AS c FROM likes WHERE post_id = ?')
        .get(post.post_id).c;
    const reply_count = db
        .prepare('SELECT COUNT(*) AS c FROM replies WHERE post_id = ?')
        .get(post.post_id).c;
    return { ...post, like_count, reply_count };
}

// --- Create a post/review (POST /api/posts) - protected ---
router.post(
    '/',
    authenticateToken,
    [
        body('content')
            .trim()
            .notEmpty().withMessage("Content is required.")
            .isLength({ max: 280 }).withMessage("Posts are limited to 280 characters.")
            .escape(),
        body('movie_id')
            .optional({ checkFalsy: true })
            .isInt().withMessage("movie_id must be an integer."),
    ],
    handleValidationErrors,
    (req, res) => {
        const movieId = req.body.movie_id ? Number(req.body.movie_id) : null;

        if (movieId) {
            const movie = db.prepare('SELECT movie_id FROM movies WHERE movie_id = ?').get(movieId);
            if (!movie) return res.status(404).json({ error: "Movie not found." });
        }

        const result = db
            .prepare('INSERT INTO posts (user_id, movie_id, content) VALUES (?, ?, ?)')
            .run(req.user.user_id, movieId, req.body.content);

        const post = db.prepare('SELECT * FROM posts WHERE post_id = ?').get(result.lastInsertRowid);
        res.status(201).json({ message: "Post created.", post: withCounts(post) });
    }
);

// --- Feed (GET /api/posts/feed) - protected ---
// Posts from users the caller follows, newest first, per spec 2.1
// "Social Graph and Dynamic Feed".
router.get('/feed', authenticateToken, (req, res) => {
    const posts = db
        .prepare(`
            SELECT p.*, u.username, u.display_name, m.title AS movie_title
            FROM posts p
            JOIN follows f ON f.following_id = p.user_id
            JOIN users u ON u.user_id = p.user_id
            LEFT JOIN movies m ON m.movie_id = p.movie_id
            WHERE f.follower_id = ?
            ORDER BY p.created_at DESC
            LIMIT 50
        `)
        .all(req.user.user_id);

    res.status(200).json({ posts: posts.map(withCounts) });
});

// --- Get a single post with its replies (GET /api/posts/:id) - public ---
router.get(
    '/:id',
    optionalAuth,
    [param('id').isInt().withMessage("Post id must be an integer.")],
    handleValidationErrors,
    (req, res) => {
        const postId = Number(req.params.id);
        const post = db
            .prepare(`
                SELECT p.*, u.username, u.display_name, m.title AS movie_title
                FROM posts p
                JOIN users u ON u.user_id = p.user_id
                LEFT JOIN movies m ON m.movie_id = p.movie_id
                WHERE p.post_id = ?
            `)
            .get(postId);

        if (!post) return res.status(404).json({ error: "Post not found." });

        const replies = db
            .prepare(`
                SELECT r.reply_id, r.content, r.created_at, u.username, u.display_name
                FROM replies r JOIN users u ON u.user_id = r.user_id
                WHERE r.post_id = ?
                ORDER BY r.created_at ASC
            `)
            .all(postId);

        let liked_by_me = false;
        if (req.user) {
            liked_by_me = !!db
                .prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?')
                .get(req.user.user_id, postId);
        }

        res.status(200).json({ post: { ...withCounts(post), liked_by_me, replies } });
    }
);

// --- Delete a post (DELETE /api/posts/:id) - protected, owner only ---
// Cascade deletion of likes/replies is handled by the FK constraints
// in schema.sql (ON DELETE CASCADE), per spec 2.1.
router.delete(
    '/:id',
    authenticateToken,
    [param('id').isInt().withMessage("Post id must be an integer.")],
    handleValidationErrors,
    (req, res) => {
        const postId = Number(req.params.id);
        const post = db.prepare('SELECT user_id FROM posts WHERE post_id = ?').get(postId);

        if (!post) return res.status(404).json({ error: "Post not found." });
        if (post.user_id !== req.user.user_id) {
            return res.status(403).json({ error: "You can only delete your own posts." });
        }

        db.prepare('DELETE FROM posts WHERE post_id = ?').run(postId);
        res.status(200).json({ message: "Post deleted." });
    }
);

// --- Like a post (POST /api/posts/:id/like) - protected ---
router.post(
    '/:id/like',
    authenticateToken,
    [param('id').isInt().withMessage("Post id must be an integer.")],
    handleValidationErrors,
    (req, res) => {
        const postId = Number(req.params.id);
        const post = db.prepare('SELECT post_id FROM posts WHERE post_id = ?').get(postId);
        if (!post) return res.status(404).json({ error: "Post not found." });

        try {
            db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)')
                .run(req.user.user_id, postId);
            res.status(201).json({ message: "Post liked." });
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                return res.status(409).json({ error: "Already liked this post." });
            }
            console.error(err);
            res.status(500).json({ error: "Could not like post." });
        }
    }
);

// --- Unlike a post (DELETE /api/posts/:id/like) - protected ---
router.delete(
    '/:id/like',
    authenticateToken,
    [param('id').isInt().withMessage("Post id must be an integer.")],
    handleValidationErrors,
    (req, res) => {
        const postId = Number(req.params.id);
        const result = db
            .prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?')
            .run(req.user.user_id, postId);

        if (result.changes === 0) {
            return res.status(404).json({ error: "You had not liked this post." });
        }
        res.status(200).json({ message: "Like removed." });
    }
);

// --- Reply to a post (POST /api/posts/:id/replies) - protected ---
router.post(
    '/:id/replies',
    authenticateToken,
    [
        param('id').isInt().withMessage("Post id must be an integer."),
        body('content')
            .trim()
            .notEmpty().withMessage("Content is required.")
            .isLength({ max: 280 }).withMessage("Replies are limited to 280 characters.")
            .escape(),
    ],
    handleValidationErrors,
    (req, res) => {
        const postId = Number(req.params.id);
        const post = db.prepare('SELECT post_id FROM posts WHERE post_id = ?').get(postId);
        if (!post) return res.status(404).json({ error: "Post not found." });

        const result = db
            .prepare('INSERT INTO replies (post_id, user_id, content) VALUES (?, ?, ?)')
            .run(postId, req.user.user_id, req.body.content);

        const reply = db.prepare('SELECT * FROM replies WHERE reply_id = ?').get(result.lastInsertRowid);
        res.status(201).json({ message: "Reply posted.", reply });
    }
);

module.exports = router;
