const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const db = require('../db/database');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Strict limiter for login/register: 10 attempts per 15 minutes per IP in production,
// more permissive in local development to avoid blocking normal testing.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_PRODUCTION ? 10 : 100,
    message: { error: "Too many attempts. Please try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- Register (POST /api/users/register) ---
router.post(
    '/register',
    authLimiter,
    [
        body('username')
            .trim()
            .notEmpty().withMessage("Username is required.")
            .isLength({ min: 3, max: 50 }).withMessage("Username must be 3-50 characters.")
            .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores.")
            .escape(),
        body('display_name')
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 100 }).withMessage("Display name too long.")
            .escape(),
        body('password')
            .notEmpty().withMessage("Password is required.")
            .isLength({ min: 8, max: 128 }).withMessage("Password must be 8-128 characters."),
    ],
    handleValidationErrors,
    async (req, res) => {
        const { username, password } = req.body;
        const display_name = req.body.display_name || username;

        const existing = db.prepare('SELECT user_id FROM users WHERE username = ?').get(username);
        if (existing) {
            return res.status(409).json({ error: "Username is already taken." });
        }

        try {
            const password_hash = await bcrypt.hash(password, 12);
            const result = db
                .prepare('INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)')
                .run(username, display_name, password_hash);

            const token = jwt.sign(
                { user_id: result.lastInsertRowid, username, role: 'user' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(201).json({
                message: "Registration successful",
                token,
                user: { user_id: result.lastInsertRowid, username, display_name }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Could not create account." });
        }
    }
);

// --- Login (POST /api/users/login) ---
router.post(
    '/login',
    authLimiter,
    [
        body('username')
            .trim()
            .notEmpty().withMessage("Username is required.")
            .isLength({ max: 50 }).withMessage("Username too long.")
            .escape(),
        body('password')
            .notEmpty().withMessage("Password is required.")
            .isLength({ min: 8, max: 128 }).withMessage("Password must be 8-128 characters."),
    ],
    handleValidationErrors,
    async (req, res) => {
        const { username, password } = req.body;

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) {
            // Same generic error whether the user exists or not, to avoid
            // leaking which usernames are registered.
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, role: 'user' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: { user_id: user.user_id, username: user.username, display_name: user.display_name }
        });
    }
);

module.exports = router;
