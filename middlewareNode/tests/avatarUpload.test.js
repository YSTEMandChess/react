/**
 * Integration tests — POST /user/avatar/:username?
 *
 * Passport and Azure Blob Storage are mocked so no real JWT, DB, or blob
 * container is needed. Verifies: auth enforcement, file-type/size
 * validation, upload call, and that avatarKey is persisted against the
 * authenticated user or their own child only.
 */

// users.js calls passport.authenticate("jwt") once at require-time and wires
// the RETURNED middleware directly into each route — so the mock middleware
// must be the same function instance for the whole file; per-test auth state
// is controlled via this mutable box that the middleware reads on every
// request, not by reassigning passport.authenticate.mockImplementation
// after require (that would have no effect on already-bound routes).
let mockCurrentAuthUser = { username: "default-test-user", role: "student" };

jest.mock("passport", () => ({
  authenticate: jest.fn(() => (req, res, next) => {
    if (!mockCurrentAuthUser) return res.status(401).json({ error: "Unauthorized" });
    req.user = mockCurrentAuthUser;
    next();
  }),
}));
jest.mock("../src/models/users");
jest.mock("../src/utils/avatars");

const express = require("express");
const request = require("supertest");
const usersRoute = require("../src/routes/users");
const Users = require("../src/models/users");
const { getAvatarUrl, getBlobServiceClient } = require("../src/utils/avatars");

const app = express();
app.use(express.json());
app.use("/user", usersRoute);

afterEach(() => {
  jest.clearAllMocks();
  mockCurrentAuthUser = { username: "default-test-user", role: "student" };
});

describe("POST /user/avatar", () => {
  let mockUploadData;

  beforeEach(() => {
    mockUploadData = jest.fn().mockResolvedValue({});
    getBlobServiceClient.mockReturnValue({
      credential: {},
      client: {
        getContainerClient: jest.fn(() => ({
          getBlockBlobClient: jest.fn(() => ({ uploadData: mockUploadData })),
        })),
      },
    });
    Users.updateOne.mockResolvedValue({ modifiedCount: 1 });
    getAvatarUrl.mockImplementation((key) => (key ? `https://test.blob.core.windows.net/avatars/${key}` : null));
  });

  const setFindOneByUsername = (lookup) => {
    Users.findOne.mockImplementation(async (query) => {
      const username = query.username;
      return lookup[username] || null;
    });
  };

  test("401 — no authenticated user", async () => {
    mockCurrentAuthUser = null;

    const res = await request(app)
      .post("/user/avatar")
      .attach("avatar", Buffer.from("fake-image-bytes"), {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(401);
  });

  test("200 — uploads a valid PNG and persists avatarKey for the authenticated user", async () => {
    mockCurrentAuthUser = { username: "alice", role: "student" };
    setFindOneByUsername({
      alice: { username: "alice", avatarKey: null, parentUsername: "parent1" },
    });

    const res = await request(app)
      .post("/user/avatar")
      .attach("avatar", Buffer.from("fake-image-bytes"), {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("avatarKey");
    expect(res.body.avatarKey).toMatch(/^alice\//);
    expect(res.body.avatarUrl).toBe(`https://test.blob.core.windows.net/avatars/${res.body.avatarKey}`);
    expect(mockUploadData).toHaveBeenCalledTimes(1);
    expect(Users.updateOne).toHaveBeenCalledWith(
      { username: "alice" },
      { $set: { avatarKey: expect.stringMatching(/^alice\//) } }
    );
  });

  test("200 — parent can upload an avatar for their own child", async () => {
    mockCurrentAuthUser = { username: "parent1", role: "parent" };
    setFindOneByUsername({
      child1: { username: "child1", parentUsername: "parent1" },
    });

    const res = await request(app)
      .post("/user/avatar/child1")
      .attach("avatar", Buffer.from("fake-image-bytes"), {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(res.body.avatarKey).toMatch(/^child1\//);
    expect(Users.updateOne).toHaveBeenCalledWith(
      { username: "child1" },
      { $set: { avatarKey: expect.stringMatching(/^child1\//) } }
    );
  });

  test("403 — parent cannot upload an avatar for another parent's child", async () => {
    mockCurrentAuthUser = { username: "parent1", role: "parent" };
    setFindOneByUsername({
      child2: { username: "child2", parentUsername: "parent2" },
    });

    const res = await request(app)
      .post("/user/avatar/child2")
      .attach("avatar", Buffer.from("fake-image-bytes"), {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(403);
    expect(mockUploadData).not.toHaveBeenCalled();
  });

  test("403 — unrelated user cannot upload another user's avatar", async () => {
    mockCurrentAuthUser = { username: "eve", role: "student" };
    setFindOneByUsername({
      alice: { username: "alice", parentUsername: "parent1" },
    });

    const res = await request(app)
      .post("/user/avatar/alice")
      .attach("avatar", Buffer.from("fake-image-bytes"), {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(403);
    expect(mockUploadData).not.toHaveBeenCalled();
  });

  test("400 — rejects a disallowed file type", async () => {
    mockCurrentAuthUser = { username: "bob", role: "student" };
    setFindOneByUsername({
      bob: { username: "bob", parentUsername: "parent1" },
    });

    const res = await request(app)
      .post("/user/avatar")
      .attach("avatar", Buffer.from("not-an-image"), {
        filename: "malware.exe",
        contentType: "application/x-msdownload",
      });

    expect(res.status).toBe(400);
    expect(mockUploadData).not.toHaveBeenCalled();
  });

  test("400 — missing file", async () => {
    mockCurrentAuthUser = { username: "carol", role: "student" };
    setFindOneByUsername({
      carol: { username: "carol", parentUsername: "parent1" },
    });

    const res = await request(app).post("/user/avatar");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/avatar file is required/i);
  });

  test("400 — rejects a file over the size limit", async () => {
    mockCurrentAuthUser = { username: "dave", role: "student" };
    setFindOneByUsername({
      dave: { username: "dave", parentUsername: "parent1" },
    });

    const oversized = Buffer.alloc(6 * 1024 * 1024); // 6MB > 5MB limit
    const res = await request(app)
      .post("/user/avatar")
      .attach("avatar", oversized, {
        filename: "huge.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
  });

  test("upload always targets req.user.username, never a request body/param username", async () => {
    mockCurrentAuthUser = { username: "eve", role: "student" };
    setFindOneByUsername({
      eve: { username: "eve", parentUsername: "parent1" },
    });

    await request(app)
      .post("/user/avatar")
      .field("username", "someone-else") // attempted override, should be ignored
      .attach("avatar", Buffer.from("fake-image-bytes"), {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(Users.updateOne).toHaveBeenCalledWith(
      { username: "eve" },
      expect.anything()
    );
  });

  test("500 — returns server error when the blob upload fails", async () => {
    mockCurrentAuthUser = { username: "frank", role: "student" };
    setFindOneByUsername({
      frank: { username: "frank", parentUsername: "parent1" },
    });
    mockUploadData.mockRejectedValue(new Error("Azure Blob Storage unavailable"));

    const res = await request(app)
      .post("/user/avatar")
      .attach("avatar", Buffer.from("fake-image-bytes"), {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(500);
  });
});

describe("GET /user/avatar", () => {
  beforeEach(() => {
    getAvatarUrl.mockImplementation((key) => (key ? `https://test.blob.core.windows.net/avatars/${key}` : null));
    Users.findOne.mockImplementation(async (query) => {
      const username = query.username;
      if (username === "alice") return { avatarKey: "alice/photo123.png" };
      if (username === "bob") return { avatarKey: null };
      if (username === "carol") return { avatarKey: null };
      if (username === "dave") throw new Error("DB down");
      return null;
    });
  });

  test("401 — no authenticated user", async () => {
    mockCurrentAuthUser = null;
    const res = await request(app).get("/user/avatar");
    expect(res.status).toBe(401);
  });

  test("200 — returns a SAS URL when the user has an avatarKey", async () => {
    mockCurrentAuthUser = { username: "alice", role: "student" };
    Users.findOne.mockResolvedValue({ avatarKey: "alice/photo123.png" });

    const res = await request(app).get("/user/avatar");

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBe("https://test.blob.core.windows.net/avatars/alice/photo123.png");
    expect(Users.findOne).toHaveBeenCalledWith(
      { username: "alice" },
      expect.objectContaining({ avatarKey: 1 })
    );
  });

  test("200 — returns avatarUrl: null when no avatar has been uploaded", async () => {
    mockCurrentAuthUser = { username: "bob", role: "student" };
    Users.findOne.mockResolvedValue({ avatarKey: null });

    const res = await request(app).get("/user/avatar");

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBeNull();
  });

  test("always reads the authenticated user's own record, ignoring any other identifier", async () => {
    mockCurrentAuthUser = { username: "carol", role: "student" };
    Users.findOne.mockResolvedValue({ avatarKey: null });

    await request(app).get("/user/avatar");

    expect(Users.findOne).toHaveBeenCalledWith(
      { username: "carol" },
      expect.anything()
    );
  });

  test("500 — returns server error on DB failure", async () => {
    mockCurrentAuthUser = { username: "dave", role: "student" };
    Users.findOne.mockRejectedValue(new Error("DB down"));

    const res = await request(app).get("/user/avatar");

    expect(res.status).toBe(500);
  });
});
