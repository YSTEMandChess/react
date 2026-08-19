/**
 * Avatar URL Helper
 *
 * Converts a stored avatarKey into a displayable `data:` URI, resolving the
 * actual image bytes from the Avatars collection (see models/avatars.js).
 *
 * Previously this signed a time-limited Azure Blob SAS URL; that required no
 * DB round trip. Storing avatars in MongoDB instead (Task 12) means every
 * resolution is now a real query, so batch via getAvatarUrls wherever more
 * than one avatar is needed in the same request — e.g. leaderboard.js
 * resolves avatars only for the page actually being returned, not every
 * scored candidate, using the batched form below.
 *
 * data: URI (not a dedicated binary-serving route) so every existing
 * frontend consumer — a plain `<img src={avatarUrl}>` — keeps working with
 * no changes: the JSON contract (`avatarUrl: string | null`) is unchanged.
 */

const Avatars = require("../models/avatars");

/**
 * Returns a data: URI for the given avatarKey, or null if no avatarKey is
 * set or no matching avatar document exists (caller falls back to a
 * placeholder image either way).
 */
async function getAvatarUrl(avatarKey) {
  if (!avatarKey) return null;
  const doc = await Avatars.findOne({ avatarKey }, { data: 1, contentType: 1, _id: 0 });
  if (!doc) return null;
  return `data:${doc.contentType};base64,${doc.data.toString("base64")}`;
}

/**
 * Batched form of getAvatarUrl — one query for every key needed, rather than
 * one round trip per user. Every requested avatarKey is present in the
 * result; keys with no upload (or no matching document) map to null.
 *
 * @param {(string|null|undefined)[]} avatarKeys
 * @returns {Promise<Map<string, string|null>>} keyed by avatarKey
 */
async function getAvatarUrls(avatarKeys) {
  const keys = [...new Set(avatarKeys.filter(Boolean))];
  const urls = new Map(avatarKeys.filter(Boolean).map((k) => [k, null]));
  if (keys.length === 0) return urls;

  const docs = await Avatars.find(
    { avatarKey: { $in: keys } },
    { avatarKey: 1, data: 1, contentType: 1, _id: 0 }
  );
  for (const doc of docs) {
    urls.set(doc.avatarKey, `data:${doc.contentType};base64,${doc.data.toString("base64")}`);
  }
  return urls;
}

/**
 * Stores (or replaces) the image bytes for an avatarKey.
 * Upsert so re-uploading under the same key (not expected today — POST
 * /user/avatar always mints a fresh key — but kept safe) overwrites rather
 * than erroring on the unique index.
 */
async function saveAvatar(avatarKey, data, contentType) {
  await Avatars.updateOne(
    { avatarKey },
    { $set: { avatarKey, data, contentType } },
    { upsert: true }
  );
}

module.exports = { getAvatarUrl, getAvatarUrls, saveAvatar };
