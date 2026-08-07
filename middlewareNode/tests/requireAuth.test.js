/**
 * Unit tests for requireAuth middleware.
 * Passport is mocked so no real JWT or DB connection is needed.
 */

jest.mock("passport", () => ({
  authenticate: jest.fn(),
}));

const passport    = require("passport");
const requireAuth = require("../src/middleware/requireAuth");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe("requireAuth middleware", () => {
  afterEach(() => jest.clearAllMocks());

  test("calls next() when JWT is valid, regardless of role", () => {
    const studentUser = { username: "sarita", role: "student" };
    passport.authenticate.mockImplementation((_, __, cb) => () => cb(null, studentUser));

    const req  = {};
    const res  = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBe(studentUser);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("calls next() for admin role too (no role restriction)", () => {
    const adminUser = { username: "karthik", role: "admin" };
    passport.authenticate.mockImplementation((_, __, cb) => () => cb(null, adminUser));

    const req  = {};
    const res  = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBe(adminUser);
  });

  test("returns 401 when JWT is missing or invalid (no user)", () => {
    passport.authenticate.mockImplementation((_, __, cb) => () => cb(null, false));

    const req  = {};
    const res  = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("returns 500 when passport itself throws an error", () => {
    passport.authenticate.mockImplementation((_, __, cb) => () => cb(new Error("JWT lib failure"), false));

    const req  = {};
    const res  = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication error" });
  });
});
