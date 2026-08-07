/**
 * Require Auth Middleware
 *
 * Validates JWT and attaches req.user, without any role restriction.
 * Use on student-facing routes that need a logged-in user but are not
 * admin-only (contrast with adminGuard, which additionally requires role === 'admin').
 * Uses passport callback mode so we control the response instead of
 * passport's default 401 redirect.
 */

const passport = require("passport");

const requireAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return res.status(500).json({ error: "Authentication error" });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    req.user = user;
    next();
  })(req, res, next);
};

module.exports = requireAuth;
