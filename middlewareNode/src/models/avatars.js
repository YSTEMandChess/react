/**
 * Avatars Schema
 *
 * Stores profile avatar image bytes directly in MongoDB (replaces the
 * former Azure Blob Storage backend — see Task 12, "revert avatar storage
 * to MongoDB").
 *
 * Kept as its own collection, separate from the `users` document, on
 * purpose: routes/leaderboard.js projects avatarKey for up to
 * MAX_UNFILTERED_CANDIDATES (500) users per request to build the
 * leaderboard page. If image bytes lived inline on the user document,
 * that projection would have to explicitly exclude them (easy to forget)
 * or risk pulling megabytes of image data per candidate. Keeping avatars
 * in their own collection, looked up only for the one avatar actually
 * being displayed, means the existing `avatarKey: 1` projection pattern
 * stays cheap and correct without special-casing.
 *
 * avatarKey is still the identifier stored on the user document
 * (users.avatarKey) — same shape as before, just resolved against this
 * collection instead of a blob container.
 */

const mongoose = require("mongoose");

const AvatarsSchema = new mongoose.Schema(
  {
    // Matches users.avatarKey exactly — `${username}/${uuid}.${ext}`,
    // same key format the Azure blob name used, so no user-document
    // migration is needed.
    avatarKey: { type: String, required: true, unique: true, index: true },

    // Raw image bytes. Capped by MAX_AVATAR_BYTES (5MB) at upload time in
    // routes/users.js — comfortably under MongoDB's 16MB document limit,
    // so no GridFS is needed here.
    data: { type: Buffer, required: true },

    // Needed to rebuild the data: URI and to set the right Content-Type
    // if this is ever served via a binary route instead.
    contentType: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Avatars", AvatarsSchema);
