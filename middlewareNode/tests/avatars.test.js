/**
 * Unit tests for the avatar helpers (utils/avatars.js) — MongoDB-backed
 * storage (see models/avatars.js), replacing the former Azure Blob Storage
 * backend as part of Task 12.
 */

const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockUpdateOne = jest.fn();

jest.mock("../src/models/avatars", () => ({
  findOne: (...args) => mockFindOne(...args),
  find: (...args) => mockFind(...args),
  updateOne: (...args) => mockUpdateOne(...args),
}));

const { getAvatarUrl, getAvatarUrls, saveAvatar } = require("../src/utils/avatars");

afterEach(() => jest.clearAllMocks());

describe("getAvatarUrl", () => {
  test("returns null when avatarKey is null", async () => {
    expect(await getAvatarUrl(null)).toBeNull();
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  test("returns null when avatarKey is undefined", async () => {
    expect(await getAvatarUrl(undefined)).toBeNull();
  });

  test("returns null when no matching avatar document exists", async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getAvatarUrl("alice/photo.png")).toBeNull();
    expect(mockFindOne).toHaveBeenCalledWith(
      { avatarKey: "alice/photo.png" },
      expect.objectContaining({ data: 1, contentType: 1 })
    );
  });

  test("returns a data: URI built from the stored bytes and contentType", async () => {
    mockFindOne.mockResolvedValue({
      data: Buffer.from("fake-image-bytes"),
      contentType: "image/png",
    });

    const url = await getAvatarUrl("alice/photo.png");

    const expectedBase64 = Buffer.from("fake-image-bytes").toString("base64");
    expect(url).toBe(`data:image/png;base64,${expectedBase64}`);
  });
});

describe("getAvatarUrls", () => {
  test("returns an empty map for an empty input list", async () => {
    const result = await getAvatarUrls([]);
    expect(result.size).toBe(0);
    expect(mockFind).not.toHaveBeenCalled();
  });

  test("maps a key with no matching upload to null, ignoring falsy keys entirely", async () => {
    mockFind.mockResolvedValue([]);
    const result = await getAvatarUrls([null, undefined, "", "nobody/photo.png"]);

    expect(result.has(null)).toBe(false);
    expect(result.get("nobody/photo.png")).toBeNull();
  });

  test("batches one query for all requested keys and maps results back by avatarKey", async () => {
    mockFind.mockResolvedValue([
      { avatarKey: "alice/a.png", data: Buffer.from("a"), contentType: "image/png" },
      { avatarKey: "bob/b.png", data: Buffer.from("b"), contentType: "image/jpeg" },
    ]);

    const result = await getAvatarUrls(["alice/a.png", "bob/b.png", "carol/none.png"]);

    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenCalledWith(
      { avatarKey: { $in: ["alice/a.png", "bob/b.png", "carol/none.png"] } },
      expect.objectContaining({ avatarKey: 1, data: 1, contentType: 1 })
    );
    expect(result.get("alice/a.png")).toBe(`data:image/png;base64,${Buffer.from("a").toString("base64")}`);
    expect(result.get("bob/b.png")).toBe(`data:image/jpeg;base64,${Buffer.from("b").toString("base64")}`);
    // Requested but never uploaded — present with null, not absent.
    expect(result.has("carol/none.png")).toBe(true);
    expect(result.get("carol/none.png")).toBeNull();
  });

  test("de-duplicates repeated keys into a single query", async () => {
    mockFind.mockResolvedValue([
      { avatarKey: "alice/a.png", data: Buffer.from("a"), contentType: "image/png" },
    ]);

    await getAvatarUrls(["alice/a.png", "alice/a.png"]);

    expect(mockFind).toHaveBeenCalledWith(
      { avatarKey: { $in: ["alice/a.png"] } },
      expect.anything()
    );
  });
});

describe("saveAvatar", () => {
  test("upserts the avatar document by avatarKey", async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    const bytes = Buffer.from("fake-image-bytes");

    await saveAvatar("alice/photo.png", bytes, "image/png");

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { avatarKey: "alice/photo.png" },
      { $set: { avatarKey: "alice/photo.png", data: bytes, contentType: "image/png" } },
      { upsert: true }
    );
  });
});
