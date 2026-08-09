/**
 * Avatar Ownership Guard
 *
 * Allows a user to modify their own avatar, or a parent to modify the avatar
 * of their own child. The target username comes from req.params.username when
 * present; otherwise the route is treated as a self-operation.
 */

const Users = require("../models/users");

const FORBIDDEN_MESSAGE = "Forbidden: cannot modify another user's avatar";

const requireAvatarOwnership = async (req, res, next) => {
  try {
    const targetUsername = req.params.username || req.user.username;

    if (targetUsername === req.user.username) {
      req.avatarTargetUsername = targetUsername;
      return next();
    }

    if (req.user.role !== "parent") {
      return res.status(403).json({ error: FORBIDDEN_MESSAGE });
    }

    const targetUser = await Users.findOne(
      { username: targetUsername },
      { parentUsername: 1, _id: 0 }
    );

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.parentUsername !== req.user.username) {
      return res.status(403).json({ error: FORBIDDEN_MESSAGE });
    }

    req.avatarTargetUsername = targetUsername;
    next();
  } catch (err) {
    console.error("requireAvatarOwnership:", err.message);
    res.status(500).json({ error: "Authorization error" });
  }
};

module.exports = requireAvatarOwnership;