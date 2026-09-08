/**
 * Admin Guard Middleware
 *
 * Validates JWT and enforces role === 'admin' on protected routes.
 * Returns 401 for missing/invalid tokens and 403 for non-admin roles.
 * Uses passport callback mode so we control the response instead of
 * passport's default 401 redirect.
 */

const passport = require("passport");

const adminGuard = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err)   return res.status(500).json({ error: "Authentication error" });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.role !== "admin")
      return res.status(403).json({ error: "Forbidden: admin access required" });

    req.user = user;
    next();
  })(req, res, next);
};

module.exports = adminGuard;
