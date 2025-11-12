const config = require("config");
const jwt = require("jsonwebtoken");

/**
 * Middleware to validate JWT tokens from request body or query
 * Attaches decoded user data to req.user if valid
 */
const validator = async (req, res, next) => {
  const jwtKey = config.get("indexKey");
  const token = req?.body?.token || req?.query?.token;
  try {
    if (token) {
      // Verify and decode the JWT token
      const isValidToken = await jwt.verify(token, jwtKey);
      if (isValidToken) {
        req.user = isValidToken;
        next();
      } else {
        return res.status(401).send("Unauthorized");
      }
    } else {
      return res.status(401).send("Token Not Found");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};
module.exports = { validator };
