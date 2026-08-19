/**
 * Integration tests — POST/GET /user/avatar, GET /user/avatar/child
 *
 * Passport, the Users model, and the avatar helpers (utils/avatars.js) are
 * mocked so no real JWT or DB is needed. Verifies: auth enforcement,
 * file-type/size validation, avatar bytes are saved via saveAvatar, and
 * that avatarKey is persisted against the authenticated user only (never a
 * caller-supplied username).
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
const { getAvatarUrl, saveAvatar } = require("../src/utils/avatars");

const app = express();
app.use(express.json());
app.use("/user", usersRoute);

afterEach(() => {
  jest.clearAllMocks();
  mockCurrentAuthUser = { username: "default-test-user", role: "student" };
});

describe("POST /user/avatar", () => {
  beforeEach(() => {
    saveAvatar.mockResolvedValue(undefined);
    Users.updateOne.mockResolvedValue({ modifiedCount: 1 });
    getAvatarUrl.mockImplementation((key) =>
      Promise.resolve(key ? `data:image/png;base64,fake-${key}` : null)
    );
  });

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

    const res = await request(app)
      .post("/user/avatar")
      .attach("avatar", Buffer.from("fake-image-bytes"), {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("avatarKey");
    expect(res.body.avatarKey).toMatch(/^alice\//);
    expect(res.body.avatarUrl).toBe(`data:image/png;base64,fake-${res.body.avatarKey}`);
    expect(saveAvatar).toHaveBeenCalledWith(
      expect.stringMatching(/^alice\//),
      expect.any(Buffer),
      "image/png"
    );
    expect(Users.updateOne).toHaveBeenCalledWith(
      { username: "alice" },
      { $set: { avatarKey: expect.stringMatching(/^alice\//) } }
    );
  });

  test("400 — rejects a disallowed file type", async () => {
    mockCurrentAuthUser = { username: "bob", role: "student" };

    const res = await request(app)
      .post("/user/avatar")
      .attach("avatar", Buffer.from("not-an-image"), {
        filename: "malware.exe",
        contentType: "application/x-msdownload",
      });

    expect(res.status).toBe(400);
    expect(saveAvatar).not.toHaveBeenCalled();
  });

  test("400 — missing file", async () => {
    mockCurrentAuthUser = { username: "carol", role: "student" };

    const res = await request(app).post("/user/avatar");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/avatar file is required/i);
  });

  test("400 — rejects a file over the size limit", async () => {
    mockCurrentAuthUser = { username: "dave", role: "student" };

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

  test("500 — returns server error when saving the avatar fails", async () => {
    mockCurrentAuthUser = { username: "frank", role: "student" };
    saveAvatar.mockRejectedValue(new Error("MongoDB unavailable"));

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
    getAvatarUrl.mockImplementation((key) =>
      Promise.resolve(key ? `data:image/png;base64,fake-${key}` : null)
    );
  });

  test("401 — no authenticated user", async () => {
    mockCurrentAuthUser = null;
    const res = await request(app).get("/user/avatar");
    expect(res.status).toBe(401);
  });

  test("200 — returns a data: URI when the user has an avatarKey", async () => {
    mockCurrentAuthUser = { username: "alice", role: "student" };
    Users.findOne.mockResolvedValue({ avatarKey: "alice/photo123.png" });

    const res = await request(app).get("/user/avatar");

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBe("data:image/png;base64,fake-alice/photo123.png");
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

describe("GET /user/avatar/child", () => {
  beforeEach(() => {
    getAvatarUrl.mockImplementation((key) =>
      Promise.resolve(key ? `data:image/png;base64,fake-${key}` : null)
    );
  });

  test("401 — no authenticated user", async () => {
    mockCurrentAuthUser = null;
    const res = await request(app).get("/user/avatar/child?childUsername=kiddo");
    expect(res.status).toBe(401);
  });

  test("403 — caller is not a parent account", async () => {
    mockCurrentAuthUser = { username: "alice", role: "student" };

    const res = await request(app).get("/user/avatar/child?childUsername=kiddo");

    expect(res.status).toBe(403);
    expect(Users.findOne).not.toHaveBeenCalled();
  });

  test("400 — missing childUsername", async () => {
    mockCurrentAuthUser = { username: "parentA", role: "parent" };

    const res = await request(app).get("/user/avatar/child");

    expect(res.status).toBe(400);
  });

  test("403 — childUsername exists but does not belong to this parent", async () => {
    mockCurrentAuthUser = { username: "parentA", role: "parent" };
    Users.findOne.mockResolvedValue(null); // no doc matches {parentUsername, username} together

    const res = await request(app).get("/user/avatar/child?childUsername=someoneElsesKid");

    expect(res.status).toBe(403);
    expect(Users.findOne).toHaveBeenCalledWith(
      { parentUsername: "parentA", username: "someoneElsesKid" },
      expect.objectContaining({ avatarKey: 1 })
    );
  });

  test("200 — returns the child's avatar data: URI for the child's own parent", async () => {
    mockCurrentAuthUser = { username: "parentA", role: "parent" };
    Users.findOne.mockResolvedValue({ avatarKey: "kiddo/photo.png" });

    const res = await request(app).get("/user/avatar/child?childUsername=kiddo");

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBe("data:image/png;base64,fake-kiddo/photo.png");
  });

  test("200 — returns avatarUrl: null when the child has no avatar uploaded", async () => {
    mockCurrentAuthUser = { username: "parentA", role: "parent" };
    Users.findOne.mockResolvedValue({ avatarKey: null });

    const res = await request(app).get("/user/avatar/child?childUsername=kiddo");

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBeNull();
  });

  test("500 — returns server error on DB failure", async () => {
    mockCurrentAuthUser = { username: "parentA", role: "parent" };
    Users.findOne.mockRejectedValue(new Error("DB down"));

    const res = await request(app).get("/user/avatar/child?childUsername=kiddo");

    expect(res.status).toBe(500);
  });
});
