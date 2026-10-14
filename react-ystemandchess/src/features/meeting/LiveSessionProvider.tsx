import { ReactNode } from "react";
import { environment } from "../../environments";
import { useAgoraCall } from "../../components/VideoCall";
import { useMeeting } from "./useMeeting";
import LiveSessionContext, { CAMERA_UID, LiveSession, SessionRole } from "./LiveSessionContext";
import LiveSessionWindow from "./LiveSessionWindow";

/**
 * LiveSessionProvider — owns the mentor⇄student video session for a whole
 * profile page, so the call keeps running while the user switches tabs.
 *
 *   <LiveSessionProvider role="student"> …profile… </LiveSessionProvider>
 *
 * Inside it:
 *   - <MentorSessionPanel /> (the "Mentor Session" tab) starts / joins a session
 *   - <LiveSessionWindow />  floats over the page while connected (rendered here)
 *   - <SharedScreenView />   shows the other side's shared screen, if any
 *
 * Camera UIDs mirror the Angular client (mentor 123, student 456) so a mentor
 * still on the Angular app and a student on React land on the same channel.
 * Any other uid in the channel is the peer's screen-share publisher.
 */

// environment.js is untyped JS; the appId lives at environment.agora.appId.
const APP_ID = ((environment as any)?.agora?.appId as string) || "";

const LiveSessionProvider = ({
  role,
  children,
}: {
  role: SessionRole;
  children: ReactNode;
}) => {
  const meeting = useMeeting({ role });
  const peerRole: SessionRole = role === "mentor" ? "student" : "mentor";
  const isConnected = meeting.state === "in-meeting" && !!meeting.meeting;

  const call = useAgoraCall({
    appId: APP_ID,
    channel: meeting.meeting?.meetingId ?? "",
    uid: CAMERA_UID[role],
    enabled: isConnected,
  });

  const peerUid = CAMERA_UID[peerRole];
  const peerCamera = call.remoteUsers.find((u) => u.uid === peerUid);
  const peerScreen = call.remoteUsers.find((u) => u.uid !== peerUid && u.hasVideo);

  const value: LiveSession = {
    role,
    peerRole,
    meetingState: meeting.state,
    hasOngoingMeeting: meeting.hasOngoingMeeting,
    meetingError: meeting.error,
    isVideoConfigured: !!APP_ID,
    call,
    peerCamera,
    peerScreen,
    joinSession: meeting.startLesson,
    cancelSearch: meeting.cancelSearch,
    leaveSession: meeting.leave,
    endSession: meeting.endLesson,
  };

  return (
    <LiveSessionContext.Provider value={value}>
      {children}
      {isConnected && <LiveSessionWindow />}
    </LiveSessionContext.Provider>
  );
};

export default LiveSessionProvider;
