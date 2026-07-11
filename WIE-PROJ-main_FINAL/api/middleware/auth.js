const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// The Bouncer: verifies the "Authorization: Bearer <token>" header
// and attaches the decoded payload to req.user for downstream routes.
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token is invalid or expired." });
        }
        req.user = user; // { user_id, username, role, iat, exp }
        next();
    });
}

// Optional auth: if a valid token is present, attach req.user; otherwise
// continue as a guest. Useful for routes that behave differently for
// logged-in users vs. the "isolated, read-only" guest experience
// described in the spec (2.1 State and Authentication Mapping).
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        req.user = err ? null : user;
        next();
    });
}

module.exports = { authenticateToken, optionalAuth };
