const config = require("config");
const jwt = require("jsonwebtoken");

const validator = async (req, res, next) => {
  const jwtKey = config.get("indexKey");
  // support token in body, query, or Authorization header (Bearer)
  let token = req?.body?.token || req?.query?.token;
  if (!token && req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      token = parts[1];
    }
  }
  try {
    if (token) {
      const isValidToken = jwt.verify(token, jwtKey);
      if (isValidToken) {
        req.user = isValidToken;
        return next();
      }
      return res.status(401).send("Unauthorized");
    } else {
      return res.status(401).send("Token Not Found");
    }
  } catch (error) {
    console.error("JWT validation error");
    return res.status(401).send("Invalid or expired token");
  }
};
module.exports = { validator };
