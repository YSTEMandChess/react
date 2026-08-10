import { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

/**
 * useAgoraCall — React port of the Agora video call that lives in the legacy
 * Angular app (angular-ystemandchess-old/src/app/pages/play/play.component.ts).
 *
 * Faithful to the Angular behavior:
 *   - App-ID-only auth (no token / no App Certificate) — Angular calls
 *     `client.join(null, channel, uid, ...)`, so we pass token = null.
 *   - The channel is the meeting/game id, shared by both peers.
 *   - codec "h264" matches the Angular client so a mentor still on Angular and a
 *     student on React interoperate inside the same channel during the migration.
 *
 * Simplified vs Angular (intentional): both peers publish mic + camera and
 * subscribe to whatever the other publishes, instead of the Angular code's
 * hard-coded uid checks (123/456/789) and video-only/audio-only branches.
 * Screen sharing (Angular's separate `screenClient`) is a follow-up — see
 * VideoCall.tsx.
 */

type Options = {
  appId: string;
  channel: string;
  /** App-ID-only projects pass null (default), matching the Angular client. */
  token?: string | null;
  /** Omit to let Agora assign the uid; avoids the Angular fixed-uid collisions. */
  uid?: string | number | null;
  /** Gate joining until we actually have a channel (e.g. game not yet paired). */
  enabled?: boolean;
};

export type AgoraCall = {
  /** Attach to the <div> that should show the local camera. */
  localVideoRef: React.RefObject<HTMLDivElement>;
  /** Remote peers currently in the channel (render their video via RemoteVideo). */
  remoteUsers: IAgoraRTCRemoteUser[];
  joined: boolean;
  error: string | null;
};

export function useAgoraCall({
  appId,
  channel,
  token = null,
  uid = null,
  enabled = true,
}: Options): AgoraCall {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const camTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !appId || !channel) return;

    let cancelled = false;
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
    clientRef.current = client;

    // Keep our remote-user list in sync with the SDK's view of the channel.
    const syncRemotes = () => setRemoteUsers([...client.remoteUsers]);

    const handleUserPublished = async (
      user: IAgoraRTCRemoteUser,
      mediaType: "audio" | "video",
    ) => {
      try {
        await client.subscribe(user, mediaType);
      } catch {
        return; // subscribe can race with a peer leaving; ignore
      }
      if (mediaType === "audio") user.audioTrack?.play();
      syncRemotes();
    };

    const handleUserUnpublished = () => syncRemotes();
    const handleUserLeft = () => syncRemotes();

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);

    (async () => {
      try {
        await client.join(appId, channel, token ?? null, uid ?? null);

        const [micTrack, camTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();
        if (cancelled) {
          micTrack.close();
          camTrack.close();
          return;
        }
        micTrackRef.current = micTrack;
        camTrackRef.current = camTrack;

        if (localVideoRef.current) camTrack.play(localVideoRef.current);
        await client.publish([micTrack, camTrack]);
        setJoined(true);
      } catch (err: any) {
        setError(err?.message || "Failed to join the video call.");
      }
    })();

    return () => {
      cancelled = true;
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);

      micTrackRef.current?.stop();
      micTrackRef.current?.close();
      camTrackRef.current?.stop();
      camTrackRef.current?.close();
      micTrackRef.current = null;
      camTrackRef.current = null;

      client.removeAllListeners();
      client.leave().catch(() => {});
      clientRef.current = null;
      setJoined(false);
      setRemoteUsers([]);
    };
  }, [appId, channel, token, uid, enabled]);

  return { localVideoRef, remoteUsers, joined, error };
}
