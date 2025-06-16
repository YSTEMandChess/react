import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const appId = "f2d75e6a8a804eac88bf09f9ac2c1aa5";  // You need to get this from your Agora dashboard
const token = "007eJxTYDin8aOCT5P9H2vwe23p8K9Pv0y6HLlD7IL/8cXRWxXscmwUGNKMUsxNU80SLRItDExSE5MtLJLSDCzTLBOTjZINExNNixcHZDQEMjL4vRRjZWSAQBBfhSHZ3MQ0ydLYUtfIMCVJ18TY0kTXMjnFSDfZJNE4Lc0sMTXJIIWBAQDc9ygF";    // You’ll get or generate this from backend
const channel = "c745b939-21db-4394-9cd2-c4a3ff6aeb0d";       // The meeting ID or unique room name

const VideoCall = () => {
  const client = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    const startCall = async () => {
      // Join the channel
      await client.current.join(appId, channel, token, null);

      // Create local audio and video tracks
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const localVideoTrack = await AgoraRTC.createCameraVideoTrack();

      // Play local video
      localVideoTrack.play(localVideoRef.current);

      // Publish local tracks
      await client.current.publish([localAudioTrack, localVideoTrack]);
      setJoined(true);

      // Subscribe and play remote users’ tracks when they publish
      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        if (mediaType === "video") {
          user.videoTrack.play(remoteVideoRef.current);
        }
        if (mediaType === "audio") {
          user.audioTrack.play();
        }
      });

      // Handle remote user leaving
      client.current.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          remoteVideoRef.current.innerHTML = "";
        }
      });
    };

    startCall();

    // Cleanup when component unmounts
    return () => {
      client.current.leave();
    };
  }, []);

  return (
    <div>
      <h2>Agora Video Call</h2>
      <div>
        <h3>Local Video</h3>
        <div ref={localVideoRef} style={{ width: "400px", height: "300px", backgroundColor: "#000" }}></div>
      </div>
      <div>
        <h3>Remote Video</h3>
        <div ref={remoteVideoRef} style={{ width: "400px", height: "300px", backgroundColor: "#000" }}></div>
      </div>
      {!joined && <p>Joining the call...</p>}
    </div>
  );
};

export default VideoCall;