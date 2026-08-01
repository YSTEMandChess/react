import { useState, useEffect, useCallback, useRef } from "react";
import { useCookies } from "react-cookie";
import { environment } from "../../../environments";

/**
 * PlayStudent — student-vs-student challenge flow (design §5b).
 *
 * A student challenges another student by username. This component owns only the
 * matchmaking handshake against the middleware /challenge endpoints:
 *   - send a challenge and short-poll for the opponent to accept,
 *   - list incoming challenges and accept / decline them.
 *
 * When a challenge is accepted, both sides hold the same `gameId`; the board is
 * then opened with (gameId, challenger, opponent) so the chessServer can pair
 * the two clients via its `newpvpgame` event. The final board-embed step depends
 * on the merge-chessclient-refactor PR landing; until then `openBoard` targets
 * the standalone chess client. See documentation/student-vs-student-weavels-design.md §5c.
 */

const MIDDLEWARE = environment.urls.middlewareURL;
const POLL_MS = 2500;

type ResolvedGame = {
  gameId: string;
  challenger: string;
  opponent: string;
};

type IncomingChallenge = {
  challengeId: string;
  fromUsername: string;
  gameId: string;
};

const PlayStudent = ({ username }: { username: string }) => {
  const [cookies] = useCookies(["login"]);
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${cookies.login}`,
  };

  const [opponent, setOpponent] = useState("");
  const [error, setError] = useState("");
  // The challenge we sent and are waiting on the opponent to answer.
  const [outgoing, setOutgoing] = useState<{ challengeId: string; gameId: string } | null>(null);
  const [outgoingStatus, setOutgoingStatus] = useState<"pending" | "declined">("pending");
  // Challenges other students have sent us.
  const [incoming, setIncoming] = useState<IncomingChallenge[]>([]);
  // Once a challenge is accepted (by either side), the paired game.
  const [resolved, setResolved] = useState<ResolvedGame | null>(null);

  // --- Send a challenge --------------------------------------------------
  const sendChallenge = async () => {
    setError("");
    const to = opponent.trim();
    if (!to) {
      setError("Enter a username to challenge.");
      return;
    }
    if (to === username) {
      setError("You cannot challenge yourself.");
      return;
    }
    try {
      const res = await fetch(`${MIDDLEWARE}/challenge`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ fromUsername: username, toUsername: to }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send challenge.");
        return;
      }
      setOutgoing({ challengeId: data.challengeId, gameId: data.gameId });
      setOutgoingStatus("pending");
    } catch {
      setError("Network error sending challenge.");
    }
  };

  const cancelOutgoing = () => {
    if (outgoing) {
      // Best-effort: let the opponent's list drop it. Fire-and-forget.
      fetch(`${MIDDLEWARE}/challenge/${outgoing.challengeId}/decline`, {
        method: "POST",
        headers: authHeaders,
      }).catch(() => {});
    }
    setOutgoing(null);
    setOutgoingStatus("pending");
  };

  // --- Answer an incoming challenge --------------------------------------
  const accept = async (challengeId: string) => {
    try {
      const res = await fetch(`${MIDDLEWARE}/challenge/${challengeId}/accept`, {
        method: "POST",
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        setResolved({ gameId: data.gameId, challenger: data.challenger, opponent: data.opponent });
      } else {
        setError(data.error || "Could not accept challenge.");
      }
    } catch {
      setError("Network error accepting challenge.");
    }
  };

  const decline = async (challengeId: string) => {
    try {
      await fetch(`${MIDDLEWARE}/challenge/${challengeId}/decline`, {
        method: "POST",
        headers: authHeaders,
      });
      setIncoming((prev) => prev.filter((c) => c.challengeId !== challengeId));
    } catch {
      /* leave it; the next poll will refresh */
    }
  };

  // --- Polling -----------------------------------------------------------
  // Poll incoming challenges continuously while idle (not yet in a game).
  const pollIncoming = useCallback(async () => {
    try {
      const res = await fetch(`${MIDDLEWARE}/challenge/incoming/${username}`, {
        headers: { Authorization: `Bearer ${cookies.login}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setIncoming(data.challenges || []);
    } catch {
      /* transient; ignore */
    }
  }, [username, cookies.login]);

  // Poll the status of the challenge we sent, until it's accepted or declined.
  const pollOutgoing = useCallback(async () => {
    if (!outgoing) return;
    try {
      const res = await fetch(`${MIDDLEWARE}/challenge/${outgoing.challengeId}`, {
        headers: { Authorization: `Bearer ${cookies.login}` },
      });
      if (!res.ok) return; // 404 => expired; leave the UI, user can resend
      const data = await res.json();
      if (data.status === "accepted") {
        setResolved({
          gameId: data.gameId,
          challenger: data.fromUsername,
          opponent: data.toUsername,
        });
      } else if (data.status === "declined") {
        setOutgoingStatus("declined");
      }
    } catch {
      /* transient; ignore */
    }
  }, [outgoing, cookies.login]);

  // Keep a single interval that drives both polls while we're still matchmaking.
  const savedPoll = useRef<() => void>(() => {});
  savedPoll.current = () => {
    pollIncoming();
    if (outgoing && outgoingStatus === "pending") pollOutgoing();
  };
  useEffect(() => {
    if (resolved) return; // stop polling once we have a game
    savedPoll.current();
    const id = setInterval(() => savedPoll.current(), POLL_MS);
    return () => clearInterval(id);
  }, [resolved]);

  // --- Open the board once paired ---------------------------------------
  const openBoard = () => {
    if (!resolved) return;
    // TODO(merge-chessclient-refactor): once the board is embedded in the
    // profile, mount it here and pass these via postMessage instead of a URL.
    const chessClientURL = (environment.urls as any).chessClientURL;
    if (!chessClientURL) {
      setError("Board client URL is not configured in this environment yet.");
      return;
    }
    const params = new URLSearchParams({
      gameId: resolved.gameId,
      username,
      challenger: resolved.challenger,
      opponent: resolved.opponent,
    });
    window.open(`${chessClientURL}?${params.toString()}`, "_blank");
  };

  // --- Render ------------------------------------------------------------
  if (resolved) {
    const youAreWhite = resolved.challenger === username;
    const other = youAreWhite ? resolved.opponent : resolved.challenger;
    return (
      <div className="w-full h-full">
        <h2 className="text-2xl font-bold text-dark mb-4">Play a Student</h2>
        <div className="rounded-md bg-white p-4 shadow">
          <p className="text-dark">
            Ready to play <span className="font-bold">{other}</span>. You are{" "}
            <span className="font-bold">{youAreWhite ? "White" : "Black"}</span>.
          </p>
          <button
            onClick={openBoard}
            className="mt-3 rounded-md bg-yellow-300 px-4 py-2 font-bold text-black shadow"
          >
            Open Board
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <h2 className="text-2xl font-bold text-dark mb-4">Play a Student</h2>

      {/* Send a challenge */}
      <div className="mb-6 rounded-md bg-white p-4 shadow">
        <label className="block text-sm font-semibold text-dark mb-1">
          Challenge a student by username
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="Opponent username"
            disabled={!!outgoing}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
          />
          {outgoing ? (
            <button onClick={cancelOutgoing} className="rounded-md bg-gray-200 px-4 py-2 font-semibold">
              Cancel
            </button>
          ) : (
            <button onClick={sendChallenge} className="rounded-md bg-yellow-300 px-4 py-2 font-bold text-black">
              Challenge
            </button>
          )}
        </div>
        {outgoing && outgoingStatus === "pending" && (
          <p className="mt-2 text-sm text-gray">Waiting for {opponent.trim()} to accept…</p>
        )}
        {outgoing && outgoingStatus === "declined" && (
          <p className="mt-2 text-sm text-red-600">Challenge declined.</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Incoming challenges */}
      <div className="rounded-md bg-white p-4 shadow">
        <h3 className="text-lg font-bold text-dark mb-2">Incoming challenges</h3>
        {incoming.length === 0 ? (
          <p className="text-sm text-gray">No incoming challenges.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {incoming.map((c) => (
              <li key={c.challengeId} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                <span className="text-dark">
                  <span className="font-bold">{c.fromUsername}</span> challenged you
                </span>
                <span className="flex gap-2">
                  <button onClick={() => accept(c.challengeId)} className="rounded-md bg-green-500 px-3 py-1 font-semibold text-white">
                    Accept
                  </button>
                  <button onClick={() => decline(c.challengeId)} className="rounded-md bg-gray-200 px-3 py-1 font-semibold">
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlayStudent;
