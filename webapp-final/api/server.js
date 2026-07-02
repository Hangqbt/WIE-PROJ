require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken'); // 1. Import JWT
const rateLimit = require('express-rate-limit'); // 2. Import rate limiting middleware
const {body, param, validationResult} = require('express-validator'); // 3. Import express-validator
const bcrypt = require('bcryptjs'); // 4. Import bcrypt for password hashing

const app = express();

// Pull the variables from the process.env object
const PORT = process.env.PORT || 3000; // Fallback to 3000 if not in .env
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
    process.exit(1); // Kill the server if it's missing
}

// Middleware to force HTTPS
app.use((req, res, next) => {
    // Check if the connection is secure OR if a proxy forwarded it as secure
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        next(); // It's secure, continue to the next route
    } else {
        // Not secure, redirect to the HTTPS version of the exact same URL
        res.redirect(`https://${req.headers.host}${req.url}`);
    }
});

// --- Security & Middleware ---
app.use(helmet()); // Secures HTTP headers

app.use(cors({ 
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json()); // Allows API to read JSON data sent in requests

// --- Rate Limiting ---
 
// Strict limiter for login: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: "Too many login attempts. Please try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
});
 
app.use('/api/', apiLimiter);

// --- Validation Error Handler ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// --- Authentication Middleware (The Bouncer) ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Expected format: "Bearer <token_string>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Token is invalid or expired
            return res.status(403).json({ error: "Token is invalid or expired." });
        }
        // Token is good. Attach the decoded user data to the request.
        req.user = user; 
        next(); 
    });
};


// --- Mock API Routes ---

// 1. Show Profile (GET) - PROTECTED ROUTE
app.get('/api/profile', authenticateToken, (req, res) => {
    // Returning mock data until Person A and B finish their work
    res.status(200).json({
        message: "Profile loaded successfully",
        user: {
            username: req.user.username, // Pulled dynamically from the verified JWT!
            description: "I love horror games and vintage audio gear.",
            followers: 42
        }
    });
});

// 2. Login (POST)
app.post(
    '/api/users/login',
    loginLimiter,
    [
        body('username')
            .trim()
            .notEmpty().withMessage("Username is required.")
            .isLength({ max: 50 }).withMessage("Username too long.")
            .escape(),
        body('password')
            .notEmpty().withMessage("Password is required.")
            .isLength({ min: 8, max: 128 }).withMessage("Password must be 8–128 characters."),
    ],
    handleValidationErrors,
    async (req, res) => {
        const { username, password } = req.body;
 
        // --- Placeholder: swap this block out when a real DB is connected ---
        // Hash comparison example (bcrypt.compare returns true/false):
        //   const isMatch = await bcrypt.compare(password, userFromDB.passwordHash);
        //   if (!isMatch) return res.status(401).json({ error: "Invalid credentials." });
        // Password hashing on registration:
        //   const passwordHash = await bcrypt.hash(password, 12);
        // --------------------------------------------------------------------
 
        const token = jwt.sign(
            { username: username, role: "user" },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
 
        res.status(200).json({
            message: "Login successful",
            token: token
        });
    }
);

// 3. Show Movie Page (GET) - PUBLIC ROUTE
app.get('/api/movies/:id', (req, res) => {
    const movieId = req.params.id;
    
    res.status(200).json({
        id: movieId,
        title: "Mock Movie Title",
        director: "Mock Director",
        year: 2026,
        description: "This is a placeholder description."
    });
});

// 4. Like a Movie (POST) - PROTECTED ROUTE
app.post('/api/movies/:id/like', authenticateToken, (req, res) => {
    const movieId = req.params.id;
    const username = req.user.username; 

    res.status(200).json({
        message: `Movie ${movieId} liked successfully by ${username}`
    });
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is securely running on http://localhost:${PORT}`);
});