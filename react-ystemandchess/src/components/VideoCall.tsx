import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { environment } from "../environments/environment"
import { useCookies } from "react-cookie";
import userEvent from "@testing-library/user-event";

const appId = "f2d75e6a8a804eac88bf09f9ac2c1aa5";  // You need to get this from your Agora dashboarde

const VideoCall = ({meetingId, meetingToken}) => {
  const client = useRef(null);
  const joined = useRef(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [cookies] = useCookies(['login']);

  const [token, setToken] = useState("");
  const [channel, setChannel] = useState(""); // The meeting ID or unique room nam

  console.log("Meeting ID: " + meetingId + ", Meeting Token: " + meetingToken);

  useEffect(() => {
    window.addEventListener('beforeunload', endMeeting); // end meeting if closed browser window
    return () => {
      window.removeEventListener('beforeunload', endMeeting);
      endMeeting(); // end meeting if navigated away
    }
  }, [])

  useEffect(() => {
    if(!meetingId || !meetingToken) return;

    console.log("Meeting ID: " + meetingId + ", Meeting Token: " + meetingToken);

    client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    const startCall = async () => {
      // Join the channel
      console.log("Joining channel");
      console.log("Meeting ID: " + meetingId + ", Meeting Token: " + meetingToken);
      await client.current.join(appId, meetingId, meetingToken, null);

      // Create local audio and video tracks
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const localVideoTrack = await AgoraRTC.createCameraVideoTrack();

      // Play local video
      localVideoTrack.play(localVideoRef.current);

      // Publish local tracks
      await client.current.publish([localAudioTrack, localVideoTrack]);
      joined.current = true;

      // Subscribe and play remote users’ tracks when they publish
      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        if (mediaType === "video") {
          console.log("bbbbbbb");
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
          joined.current = false;
        }
      });
    };

    startCall();

  }, [meetingId, meetingToken]);

  // stop recording the meeting 
  const fetchEndMeeting = async () => {
    try {
      const response = await fetch(`${environment.urls.middlewareURL}/meetings/endMeeting`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${cookies.login}` }
      });
      const data = await response.json();

      console.log("Ended meeting with:", data);

    } catch (error) {
      console.error("Error ending meeting:", error);
    }
  };

  // remove the user from queue
  const fetchDequeue = async () => {
    try {
      const response = await fetch(`${environment.urls.middlewareURL}/meetings/dequeue`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${cookies.login}` }
      });
      const data = await response.json();

      console.log("Dequeued with:", data);

    } catch (error) {
      console.error("Error with dequeue:", error);
    }
  };

  // ending the meeting
  const endMeeting = () => {
    if(joined.current) fetchEndMeeting(); // if meeting started, stop recording
    else fetchDequeue(); // if still queued, remove user from queue
    if(client.current) client.current.leave();
  }

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