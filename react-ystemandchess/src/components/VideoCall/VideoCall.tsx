import { useEffect, useRef } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { environment } from "../../environments";
import { useAgoraCall } from "./useAgoraCall";

/**
 * VideoCall — reusable two-way Agora video panel.
 *
 * Drop-in replacement for the video portion of the legacy Angular play page.
 * Pass the shared channel id (a meeting id for mentor sessions, or a gameId for
 * student-vs-student) and both peers see each other.
 *
 *   <VideoCall channel={meetingId} />
 *
 * Follow-ups (tracked, not yet ported from Angular):
 *   - mentor screen share (Angular uses a second `screenClient`, uid 789)
 *   - mute / camera-off controls
 */

// environment.js is untyped JS; the appId lives at environment.agora.appId.
const APP_ID = (environment as any)?.agora?.appId as string;

type Props = {
  /** Shared channel — meeting id or gameId. The call joins once this is set. */
  channel: string;
  /** Optional fixed uid; omit to let Agora assign one. */
  uid?: string | number | null;
  className?: string;
};

/** Plays a single remote peer's camera into its own tile. */
const RemoteVideo = ({ user }: { user: IAgoraRTCRemoteUser }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && ref.current) {
      user.videoTrack.play(ref.current);
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [user, user.videoTrack]);

  return <div ref={ref} className="h-full w-full rounded-md bg-black" />;
};

const VideoCall = ({ channel, uid = null, className }: Props) => {
  const { localVideoRef, remoteUsers, joined, error } = useAgoraCall({
    appId: APP_ID,
    channel,
    token: null,
    uid,
    enabled: !!channel,
  });

  if (!APP_ID) {
    return (
      <p className="text-sm text-red-600">
        Video is unavailable: no Agora appId configured in this environment.
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3">
        {/* Local camera */}
        <div className="relative h-40 w-56 overflow-hidden rounded-md bg-black">
          <div ref={localVideoRef} className="h-full w-full" />
          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
            You
          </span>
        </div>

        {/* Remote peers */}
        {remoteUsers.map((user) => (
          <div
            key={String(user.uid)}
            className="relative h-40 w-56 overflow-hidden rounded-md bg-black"
          >
            <RemoteVideo user={user} />
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
              {String(user.uid)}
            </span>
          </div>
        ))}
      </div>

      {!joined && !error && (
        <p className="mt-2 text-sm text-gray">Connecting to video…</p>
      )}
      {joined && remoteUsers.length === 0 && (
        <p className="mt-2 text-sm text-gray">Waiting for the other player to join…</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default VideoCall;
