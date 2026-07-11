const express = require('express');
const { param, query } = require('express-validator');

const db = require('../db/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

function buildProfilePayload(userId) {
    const user = db
        .prepare('SELECT user_id, username, display_name, created_at FROM users WHERE user_id = ?')
        .get(userId);

    if (!user) return null;

    const followers = db
        .prepare('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?')
        .get(userId).count;
    const following = db
        .prepare('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?')
        .get(userId).count;

    const posts = db
        .prepare(`
            SELECT p.post_id, p.movie_id, p.content, p.reaction, p.created_at, m.title AS movie_title, m.director, m.year
            FROM posts p
            LEFT JOIN movies m ON m.movie_id = p.movie_id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `)
        .all(userId);

    const liked_movies = posts
        .filter((post) => post.reaction === 'upvote' && post.movie_id)
        .map((post) => ({ movie_id: post.movie_id, title: post.movie_title, director: post.director, year: post.year }));

    const disliked_movies = posts
        .filter((post) => post.reaction === 'downvote' && post.movie_id)
        .map((post) => ({ movie_id: post.movie_id, title: post.movie_title, director: post.director, year: post.year }));

    const comments = posts
        .filter((post) => post.content && post.content.trim())
        .map((post) => ({
            post_id: post.post_id,
            movie_id: post.movie_id,
            movie_title: post.movie_title,
            content: post.content,
            reaction: post.reaction,
            created_at: post.created_at,
        }));

    return { user: { ...user, followers, following, liked_movies, disliked_movies, comments } };
}

function getUserHighlights(userId) {
    const liked_movies = db
        .prepare(`
            SELECT DISTINCT m.movie_id, m.title, m.director, m.year
            FROM posts p
            JOIN movies m ON m.movie_id = p.movie_id
            WHERE p.user_id = ? AND p.reaction = 'upvote'
            ORDER BY p.created_at DESC
            LIMIT 4
        `)
        .all(userId);

    const comments = db
        .prepare(`
            SELECT p.post_id, p.movie_id, p.content, p.reaction, p.created_at, m.title AS movie_title
            FROM posts p
            LEFT JOIN movies m ON m.movie_id = p.movie_id
            WHERE p.user_id = ? AND trim(p.content) != ''
            ORDER BY p.created_at DESC
            LIMIT 3
        `)
        .all(userId);

    return { liked_movies, comments };
}

function getInterestMovieIds(userId) {
    if (!userId) return [];

    return db
        .prepare(`
            SELECT DISTINCT movie_id
            FROM posts
            WHERE user_id = ? AND movie_id IS NOT NULL AND reaction = 'upvote'
        `)
        .all(userId)
        .map((row) => row.movie_id);
}

function getOwnProfile(req, res) {
    const payload = buildProfilePayload(req.user.user_id);
    if (!payload) return res.status(404).json({ error: "User not found." });

    res.status(200).json({
        message: "Profile loaded successfully",
        ...payload,
    });
}

router.get(
    '/',
    optionalAuth,
    [query('search').optional().trim().isLength({ max: 80 }).withMessage("Search is too long.")],
    handleValidationErrors,
    (req, res) => {
        const search = req.query.search || '';
        const currentUserId = req.user?.user_id || null;
        const currentInterestIds = getInterestMovieIds(currentUserId);

        const users = search
            ? db
                .prepare(`
                    SELECT u.user_id, u.username, u.display_name, u.created_at,
                        COUNT(DISTINCT f.follower_id) AS followers,
                        COUNT(DISTINCT p.post_id) AS comment_count
                    FROM users u
                    LEFT JOIN follows f ON f.following_id = u.user_id
                    LEFT JOIN posts p ON p.user_id = u.user_id
                    WHERE u.username LIKE ? OR u.display_name LIKE ?
                    GROUP BY u.user_id
                    ORDER BY comment_count DESC, followers DESC, u.username ASC
                    LIMIT 30
                `)
                .all(`%${search}%`, `%${search}%`)
            : db
                .prepare(`
                    SELECT u.user_id, u.username, u.display_name, u.created_at,
                        COUNT(DISTINCT f.follower_id) AS followers,
                        COUNT(DISTINCT p.post_id) AS comment_count
                    FROM users u
                    LEFT JOIN follows f ON f.following_id = u.user_id
                    LEFT JOIN posts p ON p.user_id = u.user_id
                    GROUP BY u.user_id
                    ORDER BY comment_count DESC, followers DESC, u.username ASC
                    LIMIT 30
                `)
                .all();

        const enrichedUsers = users
            .filter((user) => user.user_id !== currentUserId)
            .map((user) => {
                const { liked_movies, comments } = getUserHighlights(user.user_id);
                const likedIds = new Set(liked_movies.map((movie) => movie.movie_id));
                const shared_movie_count = currentInterestIds.filter((movieId) => likedIds.has(movieId)).length;
                const is_following = currentUserId
                    ? !!db
                        .prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?')
                        .get(currentUserId, user.user_id)
                    : false;

                return {
                    ...user,
                    liked_movies,
                    comments,
                    shared_movie_count,
                    is_following,
                };
            })
            .sort((a, b) => {
                if (b.shared_movie_count !== a.shared_movie_count) return b.shared_movie_count - a.shared_movie_count;
                if (Number(b.is_following) !== Number(a.is_following)) return Number(a.is_following) - Number(b.is_following);
                return b.comment_count - a.comment_count;
            });

        res.status(200).json({ users: enrichedUsers });
    }
);

router.get(
    '/:id',
    optionalAuth,
    [param('id').isInt().withMessage("User id must be an integer.")],
    handleValidationErrors,
    (req, res) => {
        const targetId = Number(req.params.id);
        const payload = buildProfilePayload(targetId);

        if (!payload) return res.status(404).json({ error: "User not found." });

        let is_following = false;
        if (req.user) {
            is_following = !!db
                .prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?')
                .get(req.user.user_id, targetId);
        }

        res.status(200).json({ ...payload, user: { ...payload.user, is_following } });
    }
);

router.post(
    '/:id/follow',
    authenticateToken,
    [param('id').isInt().withMessage("User id must be an integer.")],
    handleValidationErrors,
    (req, res) => {
        const targetId = Number(req.params.id);
        const followerId = req.user.user_id;

        if (targetId === followerId) {
            return res.status(400).json({ error: "You cannot follow yourself." });
        }

        const targetUser = db.prepare('SELECT user_id FROM users WHERE user_id = ?').get(targetId);
        if (!targetUser) return res.status(404).json({ error: "User not found." });

        try {
            db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)')
                .run(followerId, targetId);
            res.status(201).json({ message: "Followed successfully." });
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                return res.status(409).json({ error: "Already following this user." });
            }
            console.error(err);
            res.status(500).json({ error: "Could not follow user." });
        }
    }
);

router.delete(
    '/:id/follow',
    authenticateToken,
    [param('id').isInt().withMessage("User id must be an integer.")],
    handleValidationErrors,
    (req, res) => {
        const targetId = Number(req.params.id);
        const followerId = req.user.user_id;

        const result = db
            .prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?')
            .run(followerId, targetId);

        if (result.changes === 0) {
            return res.status(404).json({ error: "You are not following this user." });
        }
        res.status(200).json({ message: "Unfollowed successfully." });
    }
);

module.exports = { router, getOwnProfile };
