const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");
const verifyToken = require("../utils/verifyJWT");
const config = require("config");

dotenv.config();

// @route   GET /s3/getPresignedUrl
// @desc    Generates a pre-signed URL for a file in S3
// @access  Public with jwt Authentication
router.get("/getPresignedUrl", async (req, res) => {
  try {
    const { jwt, vid: filename } = req.query;

    if (!jwt || !filename) {
      return res.status(400).json("Missing JWT or filename in query");
    }

    const credentials = verifyToken(jwt);
    if (typeof credentials === "string" && credentials.startsWith("Error")) {
      return res.status(401).json(credentials);
    }

    const s3 = new AWS.S3({
      region: "us-east-2",
      credentials: {
        accessKeyId: config.get("awsAccessKey"),
        secretAccessKey: config.get("awsSecretKey"),
      },
    });

    const params = {
      Bucket: "ystemandchess-meeting-recordings",
      Key: filename,
      Expires: 60 * 20, // 20 minutes
    };

    const signedUrl = s3.getSignedUrl("getObject", params);

    return res.status(200).send(signedUrl);
  } catch (error) {
    console.error("Error generating presigned URL:", error.message);
    return res.status(500).json("Server error");
  }
});

module.exports = router;
