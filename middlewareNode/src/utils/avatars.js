/**
 * Avatar URL Helper
 *
 * Converts a stored avatarKey (Azure blob name) into a SAS, time-limited
 * URL for display. Mirrors the SAS-URL pattern already used for meeting
 * recordings in routes/meetings.js. Generating the URL on read (rather than
 * storing a permanent one) means the storage account/container can change
 * without a data migration.
 */

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require("@azure/storage-blob");
const config = require("config");

// Dedicated container for avatars — separate from meeting recordings, since
// avatars are user-facing profile images, not private session recordings.
const AVATAR_CONTAINER = "avatars";
const AVATAR_URL_EXPIRY_SECONDS = 3600; // 1 hour

function getBlobServiceClient() {
  const account = config.get("azureStorageAccount");
  const accountKey = config.get("azureStorageKey");
  const credential = new StorageSharedKeyCredential(account, accountKey);
  return {
    credential,
    client: new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential),
  };
}

/**
 * Returns a SAS URL for the given avatarKey, or null if no avatarKey is
 * set (caller should fall back to a placeholder image).
 */
function getAvatarUrl(avatarKey) {
  if (!avatarKey) return null;
  const { client, credential } = getBlobServiceClient();
  const blobClient = client.getContainerClient(AVATAR_CONTAINER).getBlobClient(avatarKey);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: AVATAR_CONTAINER,
      blobName: avatarKey,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn: new Date(Date.now() + AVATAR_URL_EXPIRY_SECONDS * 1000),
    },
    credential
  ).toString();

  return `${blobClient.url}?${sas}`;
}

module.exports = { getAvatarUrl, getBlobServiceClient, AVATAR_CONTAINER, AVATAR_URL_EXPIRY_SECONDS };
