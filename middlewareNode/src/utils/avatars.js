/**
 * Avatar URL Helper
 *
 * Converts a stored avatarKey (S3 object key) into a presigned, time-limited
 * URL for display. Mirrors the presigned-URL pattern already used for meeting
 * recordings in routes/meetings.js. Presigning on read (rather than storing
 * a permanent URL) means the bucket/region can change without a data migration.
 */

const AWS = require("aws-sdk");
const config = require("config");

const AVATAR_BUCKET = "ystemandchess-user-avatars";
const AVATAR_URL_EXPIRY_SECONDS = 3600; // 1 hour

function getS3Client() {
  return new AWS.S3({
    apiVersion: "latest",
    region: "us-east-2",
    accessKeyId: config.get("awsAccessKey"),
    secretAccessKey: config.get("awsSecretKey"),
  });
}

/**
 * Returns a presigned S3 URL for the given avatarKey, or null if no
 * avatarKey is set (caller should fall back to a placeholder image).
 */
function getAvatarUrl(avatarKey) {
  if (!avatarKey) return null;
  const s3 = getS3Client();
  return s3.getSignedUrl("getObject", {
    Bucket: AVATAR_BUCKET,
    Key: avatarKey,
    Expires: AVATAR_URL_EXPIRY_SECONDS,
  });
}

module.exports = { getAvatarUrl, AVATAR_BUCKET, AVATAR_URL_EXPIRY_SECONDS };
