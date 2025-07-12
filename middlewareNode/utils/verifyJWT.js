const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (token) => {
  if (!token) return "Error: 406. Please Provide a JSON Web Token.";

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    return "Error: 405. This key has been tampered with or is out of date.";
  }
};
