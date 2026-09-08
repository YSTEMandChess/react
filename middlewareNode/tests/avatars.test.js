/**
 * Unit tests for the getAvatarUrl helper (Azure Blob Storage).
 */

const mockGetBlobClient = jest.fn();
const mockGetContainerClient = jest.fn(() => ({ getBlobClient: mockGetBlobClient }));
const mockGenerateSAS = jest.fn();

jest.mock("config", () => ({
  get: jest.fn((key) => {
    const values = {
      azureStorageAccount: "teststorageaccount",
      azureStorageKey: "dGVzdGtleQ==", // base64 "testkey"
    };
    return values[key];
  }),
}));

jest.mock("@azure/storage-blob", () => ({
  BlobServiceClient: jest.fn().mockImplementation(() => ({
    getContainerClient: mockGetContainerClient,
  })),
  StorageSharedKeyCredential: jest.fn().mockImplementation(() => ({})),
  generateBlobSASQueryParameters: (...args) => mockGenerateSAS(...args),
  BlobSASPermissions: { parse: jest.fn((p) => p) },
}));

const { getAvatarUrl } = require("../src/utils/avatars");

afterEach(() => jest.clearAllMocks());

describe("getAvatarUrl", () => {
  test("returns null when avatarKey is null", () => {
    expect(getAvatarUrl(null)).toBeNull();
    expect(mockGetContainerClient).not.toHaveBeenCalled();
  });

  test("returns null when avatarKey is undefined", () => {
    expect(getAvatarUrl(undefined)).toBeNull();
  });

  test("returns a SAS URL when avatarKey is set", () => {
    mockGetBlobClient.mockReturnValue({ url: "https://teststorageaccount.blob.core.windows.net/avatars/alice/photo.png" });
    mockGenerateSAS.mockReturnValue({ toString: () => "sv=2021&se=...&sig=abc" });

    const url = getAvatarUrl("alice/photo.png");

    expect(url).toBe(
      "https://teststorageaccount.blob.core.windows.net/avatars/alice/photo.png?sv=2021&se=...&sig=abc"
    );
    expect(mockGetContainerClient).toHaveBeenCalledWith("avatars");
    expect(mockGetBlobClient).toHaveBeenCalledWith("alice/photo.png");
    expect(mockGenerateSAS).toHaveBeenCalledWith(
      expect.objectContaining({
        containerName: "avatars",
        blobName: "alice/photo.png",
      }),
      expect.anything()
    );
  });
});
