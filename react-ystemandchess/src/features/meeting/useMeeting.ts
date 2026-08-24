import { useCallback, useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { environment } from "../../environments";

/**
 * useMeeting — drives the mentor⇄student live-lesson lifecycle against the
 * existing middleware /meetings endpoints. This is the React port of the meeting
 * side of the legacy Angular play page.
 *
 * Recording is NOT started here: the server starts cloud recording automatically
 * inside POST /meetings/pairUp (startRecording) and stops it in
 * PUT /meetings/endMeeting (stopRecording). The client only drives the lifecycle:
 *
 *   idle ── startLesson ─▶ searching ──(paired)──▶ in-meeting ── endLesson ─▶ ended
 *                            │
 *                            └── cancelSearch ─▶ idle
 *
 * Pairing: both sides join their queue (POST /queue) and poll POST /pairUp; whoever
 * calls pairUp while the opposite queue is non-empty creates the meeting. We also
 * poll GET /inMeeting so the side that DIDN'T create it still discovers the meeting.
 */

const MIDDLEWARE = environment.urls.middlewareURL;
const POLL_MS = 2500;
const NO_MEETING = "There are no current meetings with this user.";

export type MeetingState = "idle" | "searching" | "in-meeting" | "ended";

export type Meeting = {
  meetingId: string;
  mentorUsername?: string;
  studentUsername?: string;
};

export function useMeeting({
  role,
  enabled = true,
}: {
  role: "mentor" | "student";
  enabled?: boolean;
}) {
  const [cookies] = useCookies(["login"]);
  const token = cookies.login;

  const [state, setState] = useState<MeetingState>("idle");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);

  const auth = useCallback(
    (extra?: RequestInit): RequestInit => ({
      ...extra,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(extra?.headers || {}),
      },
    }),
    [token],
  );

  // GET /inMeeting → the meeting if we're in one, else null.
  const checkInMeeting = useCallback(async (): Promise<Meeting | null> => {
    const res = await fetch(`${MIDDLEWARE}/meetings/inMeeting`, auth());
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data === NO_MEETING || !Array.isArray(data) || data.length === 0) {
      return null;
    }
    const m = data[0];
    return {
      meetingId: m.meetingId,
      mentorUsername: m.mentorUsername,
      studentUsername: m.studentUsername,
    };
  }, [auth]);

  // On mount: if we're already in a meeting (e.g. after a refresh), resume it.
  useEffect(() => {
    if (!enabled || !token) return;
    let cancelled = false;
    (async () => {
      const m = await checkInMeeting().catch(() => null);
      if (!cancelled && m) {
        setMeeting(m);
        setState("in-meeting");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, token, checkInMeeting]);

  // Poll while searching: attempt to pair, then see if a meeting now exists.
  const poll = useRef<() => void>(() => {});
  poll.current = async () => {
    try {
      // Fire pairUp (creates the meeting if the opposite queue has someone).
      await fetch(`${MIDDLEWARE}/meetings/pairUp`, auth({ method: "POST" })).catch(
        () => {},
      );
      const m = await checkInMeeting();
      if (m) {
        setMeeting(m);
        setState("in-meeting");
      }
    } catch {
      /* transient; keep polling */
    }
  };

  useEffect(() => {
    if (state !== "searching") return;
    poll.current();
    const id = setInterval(() => poll.current(), POLL_MS);
    return () => clearInterval(id);
  }, [state]);

  const startLesson = useCallback(async () => {
    setError(null);
    try {
      // If somehow already in a meeting, jump straight in.
      const existing = await checkInMeeting();
      if (existing) {
        setMeeting(existing);
        setState("in-meeting");
        return;
      }
      const res = await fetch(`${MIDDLEWARE}/meetings/queue`, auth({ method: "POST" }));
      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        setError(typeof msg === "string" ? msg : "Could not join the queue.");
        return;
      }
      setState("searching");
    } catch {
      setError("Network error joining the queue.");
    }
  }, [auth, checkInMeeting]);

  const cancelSearch = useCallback(async () => {
    await fetch(`${MIDDLEWARE}/meetings/dequeue`, auth({ method: "DELETE" })).catch(
      () => {},
    );
    setState("idle");
  }, [auth]);

  const endLesson = useCallback(async () => {
    await fetch(`${MIDDLEWARE}/meetings/endMeeting`, auth({ method: "PUT" })).catch(
      () => {},
    );
    setMeeting(null);
    setState("ended");
  }, [auth]);

  const reset = useCallback(() => {
    setError(null);
    setState("idle");
  }, []);

  return { state, meeting, error, role, startLesson, cancelSearch, endLesson, reset };
}
