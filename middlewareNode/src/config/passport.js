// Passport JWT authentication configuration
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const passport = require("passport");
const config = require("config");
const users = require("../models/users.js")

/**
 * Serializes user for session storage
 */
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

/**
 * Deserializes user from session
 */
passport.deserializeUser(function (id, done) {
  users.findById(id, function (err, user) {
    done(err, user);
  });
});

/**
 * Configure JWT strategy for authentication
 * Validates JWT tokens from Authorization header
 */
passport.use(
  new JwtStrategy(
    {
      secretOrKey: config.get("indexKey"),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    async (jwt_payload, done) => {
      try {
        // Find user by username from JWT payload
        const user = await users.findOne({ username: jwt_payload.username });
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);
