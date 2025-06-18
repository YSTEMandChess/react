import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { environment } from "../environments/environment";

const appId = environment.agora.appId;  // You need to get this from your Agora dashboard
const token = "007eJxTYDin8aOCT5P9H2vwe23p8K9Pv0y6HLlD7IL/8cXRWxXscmwUGNKMUsxNU80SLRItDExSE5MtLJLSDCzTLBOTjZINExNNixcHZDQEMjL4vRRjZWSAQBBfhSHZ3MQ0ydLYUtfIMCVJ18TY0kTXMjnFSDfZJNE4Lc0sMTXJIIWBAQDc9ygF";    // You’ll get or generate this from backend

const VideoCall = () => {
  const client = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [channel, setChannel] = useState();

  useEffect(() => {
      const fetchMeetingInfo = async () => {
      try {
        const response = await fetch("http://localhost:8000/meetings/pairUp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InN0dWRlbnQiLCJmaXJzdE5hbWUiOiJzdHVkZW50IiwibGFzdE5hbWUiOiJzdHVkZW50Iiwicm9sZSI6InN0dWRlbnQiLCJlbWFpbCI6InN0dWRlbnRAc3R1ZGVudC5uZXQiLCJpYXQiOjE3NTAxMTI2NzQsImFjY291bnRDcmVhdGVkQXQiOiIxNTkyNDE2ODY5IiwicGFyZW50VXNlcm5hbWUiOiJwYXJlbnQiLCJleHAiOjE3NTA0NzI2NzR9.jo_wZHd0kID_ij64PKozqoio_W08gfMjLRp_-dBhKHU"
          },
        });

        if(!response.ok) throw new Error("Failed to pair up");
        const data = await response.json();
        console.log(data);
        setChannel(data.meetingId);
      } catch (error) {
        console.error("Error fetching meeting info: " + error);
      }
    }

    fetchMeetingInfo();
  });

  useEffect(() => {
    if(!channel) {
      return;
    }

    console.log("Channel: " + channel);

    client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    const startCall = async () => {
      // Join the channel
      console.log("Channel: " + channel)
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