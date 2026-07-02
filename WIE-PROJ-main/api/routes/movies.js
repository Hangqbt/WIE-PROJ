const express = require('express');
const { param, query } = require('express-validator');

const db = require('../db/database');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

function withCounts(post) {
    const like_count = db
        .prepare('SELECT COUNT(*) AS c FROM likes WHERE post_id = ?')
        .get(post.post_id).c;
    const reply_count = db
        .prepare('SELECT COUNT(*) AS c FROM replies WHERE post_id = ?')
        .get(post.post_id).c;
    return { ...post, like_count, reply_count };
}

// --- List / search movies (GET /api/movies?search=...) - public ---
router.get(
    '/',
    [query('search').optional().trim().escape()],
    handleValidationErrors,
    (req, res) => {
        const search = req.query.search;
        const movies = search
            ? db.prepare('SELECT * FROM movies WHERE title LIKE ? ORDER BY title ASC LIMIT 50')
                  .all(`%${search}%`)
            : db.prepare('SELECT * FROM movies ORDER BY title ASC LIMIT 50').all();

        res.status(200).json({ movies });
    }
);

// --- Show Movie Page (GET /api/movies/:id) - public ---
// Includes the movie's average-of-recent reviews (posts) with like/reply counts.
router.get(
    '/:id',
    [param('id').isInt().withMessage("Movie id must be an integer.")],
    handleValidationErrors,
    (req, res) => {
        const movieId = Number(req.params.id);
        const movie = db.prepare('SELECT * FROM movies WHERE movie_id = ?').get(movieId);

        if (!movie) return res.status(404).json({ error: "Movie not found." });

        const reviews = db
            .prepare(`
                SELECT p.*, u.username, u.display_name
                FROM posts p JOIN users u ON u.user_id = p.user_id
                WHERE p.movie_id = ?
                ORDER BY p.created_at DESC
                LIMIT 50
            `)
            .all(movieId)
            .map(withCounts);

        res.status(200).json({ movie: { ...movie, reviews } });
    }
);

module.exports = router;
