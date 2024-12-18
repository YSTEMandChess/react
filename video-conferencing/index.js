console.log("Script started");
var options = {
  appid: '0f03b7d5ff73444ba3331fc7297881b6', // set your actual Agora App ID here
  channel: 'ystem-chess',
  uid: 12345,
  otherid: 54321,
  token: null, // or set token if you're using one
};
console.log("options set");

AgoraRTC.enableLogUpload();
console.log("Agora started");

var client;
var localTracks = {
  videoTrack: null,
  audioTrack: null,
};
var currentMic = null;
var currentCam = null;
var mics = [];
var cams = [];
var remoteUsers = {};



var curVideoProfile;

AgoraRTC.onAutoplayFailed = () => {
  alert("click to start autoplay!");
};

AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
  // When plugging in a device, switch to a device that is newly plugged in.
  if (changedDevice.state === "ACTIVE") {
    localTracks.audioTrack.setDevice(changedDevice.device.deviceId);
    // Switch to an existing device when the current device is unplugged.
  } else if (changedDevice.device.label === localTracks.audioTrack.getTrackLabel()) {
    const oldMicrophones = await AgoraRTC.getMicrophones();
    oldMicrophones[0] && localTracks.audioTrack.setDevice(oldMicrophones[0].deviceId);
  }
};

AgoraRTC.onCameraChanged = async (changedDevice) => {
  // When plugging in a device, switch to a device that is newly plugged in.
  if (changedDevice.state === "ACTIVE") {
    localTracks.videoTrack.setDevice(changedDevice.device.deviceId);
    // Switch to an existing device when the current device is unplugged.
  } else if (changedDevice.device.label === localTracks.videoTrack.getTrackLabel()) {
    const oldCameras = await AgoraRTC.getCameras();
    oldCameras[0] && localTracks.videoTrack.setDevice(oldCameras[0].deviceId);
  }
};

$("#step-join").attr("disabled", true);
$("#step-publish").attr("disabled", true);
$("#step-subscribe").attr("disabled", true);
$("#step-leave").attr("disabled", true);
$("#remote-uid-select").val("");

$(".mic-list").change(function (e) {
  switchMicrophone(this.value);
});

$(".cam-list").change(function (e) {
  switchCamera(this.value);
});

function create(e) {
  createClient();
  //addSuccessIcon("#step-create");
  message.success("Create client success!");
  //$("#step-create").attr("disabled", true);
  //$("#step-join").attr("disabled", false);
};

async function join(e) {
  try {
    options.channel = $("#channel").val();
    options.uid = Number($("#uid").val());
    const token = $("#token").val();
    if (token) {
      options.token = token;
    } else {
      options.token = await agoraGetAppData(options);
    }
    await join();
    setOptionsToLocal(options);
    addSuccessIcon("#step-join");
    message.success("Join channel success!");
    //$("#step-join").attr("disabled", true);
    //$("#step-publish").attr("disabled", false);
    //$("#step-subscribe").attr("disabled", false);
    //$("#step-leave").attr("disabled", false);
    //$("#mirror-check").attr("disabled", false);
  } catch (error) {
    if (error.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
      return message.error("Token parameter error,please check your token.");
    }
    message.error(error.message);
    console.error(error);
  }
};

async function publish(e) {
  await createTrackAndPublish();
  message.success("Create tracks and publish success!");
  initDevices();
  //$("#step-publish").attr("disabled", true);
  //$("#mirror-check").attr("disabled", true);
  // agora content inspect start
  agoraContentInspect(localTracks.videoTrack);
  // agora content inspect end ;
};


async function leave(e) {
  await leave();
  message.success("Leave channel success!");
  removeAllIcons();
  $("#local-player-name").text("");
  $("#join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  $("#step-leave").attr("disabled", true);
  $("#step-join").attr("disabled", true);
  $("#step-publish").attr("disabled", true);
  $("#step-subscribe").attr("disabled", true);
  $("#mirror-check").attr("disabled", true);
  $("#step-create").attr("disabled", false);
  $("#remote-playerlist").html("");
  $("#remote-uid-select option:not([disabled])").remove();
  $("#remote-uid-select").val("");
};

function createClient() {
  // create Agora client
  client = AgoraRTC.createClient({
    
    mode: "rtc",
    codec: "vp8",
  });
}

async function createTrackAndPublish() {
  // create local audio and video tracks
  const tracks = await Promise.all([
    AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: "music_standard",
    }),
    AgoraRTC.createCameraVideoTrack(),
  ]);
  localTracks.audioTrack = tracks[0];
  localTracks.videoTrack = tracks[1];
  // play local video track
  localTracks.videoTrack.play("local-player", {
    mirror: $("#mirror-check").prop("checked"),
  });
  $("#local-player-name").text(`uid: ${options.uid}`);
  // publish local tracks to channel
  await client.publish(Object.values(localTracks));
}

/*
 * Join a channel, then create local video and audio tracks and publish them to the channel.
 */
async function join() {
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);
  client.on("user-left", handleUserLeft);

  // start Proxy if needed
  const mode = Number(options.proxyMode);
  if (mode != 0 && !isNaN(mode)) {
    client.startProxyServer(mode);
  }

  options.uid = await client.join(
    options.appid,
    options.channel,
    options.token || null,
    options.uid || null,
  );
}

/*
 * Stop all local and remote tracks then leave the channel.
 */
async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }
  // Remove remote users and player views.
  remoteUsers = {};
  // leave the channel
  await client.leave();
}

/*
 * Add the local use to a remote channel.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
// Replace the current subscribe function with the modified one
async function subscribe() {
  const uid = options.otherid; // Get the other user's ID
  const user = remoteUsers[uid]; // Get the remote user based on the UID
  
  if (!user) {
    return message.error(`User: ${uid} not found!`);
  }

  // Subscribe to the remote user's audio and video tracks
  await subscribeToTrack(user, "audio");
  await subscribeToTrack(user, "video");
  
  addSuccessIcon("#step-subscribe");
  message.success("Subscribe and Play success!");
}

// A new function to handle subscription to audio and video tracks for the remote user
async function subscribeToTrack(user, mediaType) {
  const uid = user.uid;

  // Subscribe to the remote user's media track (audio or video)
  await client.subscribe(user, mediaType);
  console.log(`${mediaType} subscribe success`);

  // Check if the mediaType is "video"
  if (mediaType === "video") {
    if ($(`#player-${uid}`).length) {
      return; // If the player already exists, no need to add it again
    }

    // Create a player element for the remote video stream
    const player = $(`
      <div id="player-wrapper-${uid}">
        <div id="player-${uid}" class="player">
          <div class="remote-player-name">uid: ${uid}</div>
        </div>
      </div>
    `);

    // Append the player element to the remote player list
    $("#remote-player").append(player);
    
    // Play the remote video track in the created player
    user.videoTrack.play(`player-${uid}`);
  }

  // Check if the mediaType is "audio"
  if (mediaType === "audio") {
    // Play the remote audio track
    user.audioTrack.play();
  }
}

/*
 * Add a user who has subscribed to the live channel to the local interface.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  if (!$(`#remote-option-${id}`).length) {
    $("#remote-uid-select").append(`<option value="${id}" id="remote-option-${id}">${id}</option>`);
    $("#remote-uid-select").val(id);
  }

  subscribe();
}

/*
 * Remove the user specified from the channel in the local interface.
 *
 * @param  {string} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to remove.
 */
function handleUserUnpublished(user, mediaType) {
  if (mediaType === "video") {
    const id = user.uid;
    delete remoteUsers[id];
    $(`#player-wrapper-${id}`).remove();
    $(`#remote-option-${id}`).remove();
  }
}

/**
 * Remove the user who has left the channel from the local interface.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link hhttps://api-ref.agora.io/en/voice-sdk/web/4.x/interfaces/iagorartcremoteuser.html | remote user} who left.
 */

function handleUserLeft(user) {
  const id = user.uid;
  delete remoteUsers[id];
  $(`#player-wrapper-${id}`).remove();
  $(`#remote-option-${id}`).remove();
}

async function initDevices() {
  // get mics
  mics = await AgoraRTC.getMicrophones();
  $(".mic-list").empty();
  mics.forEach((mic) => {
    const value = mic.label.split(" ").join("");
    $(".mic-list").append(`<option value=${value}>${mic.label}</option>`);
  });

  const audioTrackLabel = localTracks.audioTrack.getTrackLabel();
  currentMic = mics.find((item) => item.label === audioTrackLabel);
  $(".mic-list").val(audioTrackLabel.split(" ").join(""));

  // get cameras
  cams = await AgoraRTC.getCameras();
  $(".cam-list").empty();
  cams.forEach((cam) => {
    const value = cam.label.split(" ").join("");
    $(".cam-list").append(`<option value=${value}>${cam.label}</option>`);
  });

  const videoTrackLabel = localTracks.videoTrack.getTrackLabel();
  currentCam = cams.find((item) => item.label === videoTrackLabel);
  $(".cam-list").val(videoTrackLabel.split(" ").join(""));
}

async function switchCamera(label) {
  currentCam = cams.find((cam) => cam.label.split(" ").join("") === label);
  // switch device of local video track.
  await localTracks.videoTrack.setDevice(currentCam.deviceId);
}

async function switchMicrophone(label) {
  currentMic = mics.find((mic) => mic.label.split(" ").join("") === label);
  // switch device of local audio track.
  await localTracks.audioTrack.setDevice(currentMic.deviceId);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

window.addEventListener("message", async (e) => {

  // parse message
  let data = JSON.parse(e.data);

  // get command from parent and send to server
  var mentorID = data.mentor;
  var studentID = data.student;
  
  var channel = data.channel;
  options.channel = channel;

  var role = data.role;

  if (role == "student")
  {
    options.uid = studentID;
    options.otherid = mentorID;

  }
  else if (role == "mentor")
  {
    options.uid = mentorID;
    options.otherid = studentID;

  }

  await create();
  await join();
  await publish();

  await subscribe();


  console.log("Received message from parent:", e.data);

});
