require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!JWT_SECRET) {
    if (IS_PRODUCTION) {
        console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
        process.exit(1);
    }

    process.env.JWT_SECRET = 'development-only-jwt-secret-change-me';
    console.warn("JWT_SECRET is not set. Using a development-only fallback; create api/.env for real use.");
}

// Initialize the database connection / schema before anything else.
require('./db/database');

// --- Force HTTPS in production only ---
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
            next();
        } else {
            res.redirect(`https://${req.headers.host}${req.url}`);
        }
    });
}

// --- Security & Core Middleware ---
app.use(helmet());
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// --- General API Rate Limiter: 100 requests / 15 min / IP ---
// (routes/auth.js applies its own stricter limiter on top of this)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_PRODUCTION ? 100 : 500,
    message: { error: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// --- Routes ---
const { authenticateToken } = require('./middleware/auth');
const { router: usersRouter, getOwnProfile } = require('./routes/users');

app.use('/api/users', require('./routes/auth'));  // /api/users/register, /api/users/login
app.use('/api/users', usersRouter);               // /api/users/:id, /api/users/:id/follow
app.get('/api/profile', authenticateToken, getOwnProfile); // GET /api/profile (own profile)
app.use('/api/posts', require('./routes/posts'));
app.use('/api/movies', require('./routes/movies'));

// --- Health check ---
app.get('/api/health', (req, res) => res.status(200).json({ status: "ok" }));

// --- 404 fallback ---
app.use((req, res) => res.status(404).json({ error: "Route not found." }));

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is securely running on http://localhost:${PORT}`);
});
