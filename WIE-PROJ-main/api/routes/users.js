const express = require('express');
const { param } = require('express-validator');

const db = require('../db/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

// --- Show Profile (GET /api/profile) - own profile, protected ---
// Exported separately so server.js can mount it at the exact top-level
// path /api/profile (matching the original mock route), while the rest
// of this router lives under /api/users.
function getOwnProfile(req, res) {
    const user = db
        .prepare('SELECT user_id, username, display_name, created_at FROM users WHERE user_id = ?')
        .get(req.user.user_id);

    if (!user) return res.status(404).json({ error: "User not found." });

    const followers = db
        .prepare('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?')
        .get(user.user_id).count;
    const following = db
        .prepare('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?')
        .get(user.user_id).count;

    res.status(200).json({
        message: "Profile loaded successfully",
        user: { ...user, followers, following }
    });
}

// --- Show any user's public profile (GET /api/users/:id) ---
// Guests get a read-only view (per spec 2.1: "unauthenticated guests
// interact through an isolated, read-only profile"). Logged-in users
// additionally see whether they already follow this person.
router.get(
    '/:id',
    optionalAuth,
    [param('id').isInt().withMessage("User id must be an integer.")],
    handleValidationErrors,
    (req, res) => {
        const targetId = Number(req.params.id);
        const user = db
            .prepare('SELECT user_id, username, display_name, created_at FROM users WHERE user_id = ?')
            .get(targetId);

        if (!user) return res.status(404).json({ error: "User not found." });

        const followers = db
            .prepare('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?')
            .get(targetId).count;
        const following = db
            .prepare('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?')
            .get(targetId).count;

        let is_following = false;
        if (req.user) {
            is_following = !!db
                .prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?')
                .get(req.user.user_id, targetId);
        }

        res.status(200).json({ user: { ...user, followers, following, is_following } });
    }
);

// --- Follow (POST /api/users/:id/follow) - protected ---
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

// --- Unfollow (DELETE /api/users/:id/follow) - protected ---
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
