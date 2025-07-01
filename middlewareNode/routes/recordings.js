const express = require("express");
const router = express.Router();
const axios = require("axios");
const config = require("config");

// Load env/config values
const appID = config.get("appID");
const auth = config.get("auth"); // Agora Basic Auth header
const channelName = config.get("channel");
const uid = config.get("uid");
const queryURL = `https://api.agora.io/v1/apps/${appID}/cloud_recording/`;

// AWS Info (used in request body)
const awsAccessKey = config.get("awsAccessKey");
const awsSecretKey = config.get("awsSecretKey");
const bucketName = "ystemandchess-meeting-recordings";
const region = 1;
const vendor = 1;

// Acquire Resource ID
async function acquireRecording() {
  const response = await axios.post(
    `${queryURL}acquire`,
    {
      cname: channelName,
      uid: uid,
      clientRequest: { resourceExpiredHour: 24 },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
    }
  );

  return response.data.resourceId;
}

// Start Recording
async function startRecording(resourceId) {
  const startURL = `${queryURL}resourceid/${resourceId}/mode/mix/start`;

  const startBody = {
    uid,
    cname: channelName,
    clientRequest: {
      storageConfig: {
        vendor,
        region,
        bucket: bucketName,
        accessKey: awsAccessKey,
        secretKey: awsSecretKey,
      },
      recordingConfig: {
        maxIdleTime: 30,
        audioProfile: 0,
        channelType: 0,
        transcodingConfig: {
          width: 1280,
          height: 720,
          fps: 15,
          bitrate: 600,
          mixedVideoLayout: 3,
          backgroundColor: "#000000",
          layoutConfig: [
            {
              x_axis: 0,
              y_axis: 0,
              width: 0.5,
              height: 1,
              alpha: 1,
              render_mode: 1,
            },
            {
              x_axis: 0.5,
              y_axis: 0,
              width: 0.5,
              height: 1,
              alpha: 1,
              render_mode: 1,
            },
          ],
        },
      },
    },
  };

  const response = await axios.post(startURL, startBody, {
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
  });

  return {
    sid: response.data.sid,
    resourceId: resourceId,
  };
}

// Stop Recording
async function stopRecording(resourceId, sid) {
  const stopURL = `${queryURL}resourceid/${resourceId}/sid/${sid}/mode/mix/stop`;

  const stopBody = {
    uid,
    cname: channelName,
    clientRequest: {},
  };

  const response = await axios.post(stopURL, stopBody, {
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
  });

  return response.data;
}

// @route   POST /recordings/start
// @desc    Starts Agora recording and stores in S3
// @access  Public (auth should be added in production)
router.post("/start", async (req, res) => {
  try {
    const resourceId = await acquireRecording();
    const result = await startRecording(resourceId);
    res.status(200).json({
      message: "Recording started",
      sid: result.sid,
      resourceId: result.resourceId,
    });
  } catch (error) {
    console.error(
      "Start Recording Error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to start recording" });
  }
});

// @route   POST /recordings/stop
// @desc    Stops Agora recording session
// @access  Public (auth should be added in production)
router.post("/stop", async (req, res) => {
  const { resourceId, sid } = req.body;

  if (!resourceId || !sid) {
    return res.status(400).json({ error: "Missing resourceId or sid" });
  }

  try {
    const result = await stopRecording(resourceId, sid);
    res.status(200).json({
      message: "Recording stopped",
      fileList: result.serverResponse?.fileList || [],
    });
  } catch (error) {
    console.error(
      "Stop Recording Error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to stop recording" });
  }
});

module.exports = router;
