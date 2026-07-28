/**
 * Unit tests for the getAvatarUrl helper.
 */

const mockGetSignedUrl = jest.fn();
jest.mock("aws-sdk", () => ({
  S3: jest.fn().mockImplementation(() => ({
    getSignedUrl: mockGetSignedUrl,
  })),
}));

const { getAvatarUrl } = require("../src/utils/avatars");

afterEach(() => jest.clearAllMocks());

describe("getAvatarUrl", () => {
  test("returns null when avatarKey is null", () => {
    expect(getAvatarUrl(null)).toBeNull();
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  test("returns null when avatarKey is undefined", () => {
    expect(getAvatarUrl(undefined)).toBeNull();
  });

  test("returns a presigned URL when avatarKey is set", () => {
    mockGetSignedUrl.mockReturnValue("https://s3.example.com/signed-url");
    const url = getAvatarUrl("alice/photo.png");
    expect(url).toBe("https://s3.example.com/signed-url");
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      "getObject",
      expect.objectContaining({ Key: "alice/photo.png" })
    );
  });
});
