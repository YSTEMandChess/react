# Design: Student-vs-Student Play + Weavels Reward

**Author:** Sarita Himthani
**Status:** Draft for review (align with Karthik before implementation)
**Related:** gamification (Karthik), chess board integration PR `merge-chessclient-refactor`

---

## 1. Goal

Let two **students** play a chess game against each other from their profile
pages. When the game ends, the **winner is awarded weavels** (the in-game
currency owned by the gamification work).

Chosen v1 matchmaking model: **direct challenge by username** (a student
challenges a named student; the other accepts). No queue, no auto-pairing.

---

## 2. What exists today (verified in code)

| Piece | State | Reference |
|---|---|---|
| Multiplayer chess server | ✅ Works, but **student/mentor** shaped | `chessServer/src/managers/GameManager.js` |
| Two players join one game | ✅ `createOrJoinGame({student, mentor, role, socketId})` | GameManager |
| Move sync between players | ✅ `move` socket event | `chessServer/src/managers/EventHandlers.js` |
| **Winner / game-over detection** | ❌ **Missing** — `makeMove` never checks `isCheckmate`/`isGameOver` | GameManager `makeMove` |
| Activity events → gamification | ✅ Server already emits e.g. `completeActivity`, capture/castle events | EventHandlers `move` handler |
| **Weavels currency (store + award)** | ❌ **Does not exist** — no field on user model, string absent from repo | `middlewareNode/src/models/users.js` |
| Student-vs-student entry / matchmaking | ❌ Does not exist — profile has only Lessons / Games / Play Computer | `NewStudentProfile.tsx` |

**Two gaps are mine** (winner detection, PvP play), **one is Karthik's**
(weavels store + award API). The board being embedded in the profile depends on
the separate `merge-chessclient-refactor` PR landing first.

---

## 3. Ownership split

| # | Work | Owner |
|---|---|---|
| 1 | Student-vs-student play (challenge UI + wire to `createOrJoinGame`) | **Sarita** |
| 2 | Game-result detection in `chessServer` (emit winner on game over) | **Sarita** |
| 3 | Weavels balance storage + credit API | **Karthik** |
| 4 | The award call that connects #2 → #3 | **Sarita**, against Karthik's contract |

---

## 4. Proposed flow

```
Student A profile ──"Challenge princel04"──▶ middleware ──▶ notify Student B
                                                              │
                          Student B: [Accept] ◀───────────────┘
                                     │
                     both clients open the chess board with a shared gameId
                                     │
                        chessServer.createOrJoinGame (see §5 note)
                                     │
                         ...they play; moves sync over socket...
                                     │
                   a move produces checkmate  ──▶  chessServer detects it (§6)
                                     │
                   emit  "gameover" { winnerUsername, reason }
                                     │
        award step (§7): credit weavels to winner via Karthik's API
                                     │
              both clients show result + weavels awarded
```

---

## 5. Part 1 — Student-vs-student play (Sarita)

### 5a. Server model change
`createOrJoinGame` is hardcoded to one `student` + one `mentor` slot with fixed
colors. Two options for two students:

- **Option A (minimal):** reuse the existing slots — treat the challenger as the
  `mentor` slot and the opponent as the `student` slot internally. Fastest, but
  leaks confusing role names into a student-vs-student game.
- **Option B (clean, recommended):** generalize the game to
  `players: [{ username, id, color }, { username, id, color }]` keyed by a
  `gameId`, and keep the student/mentor path as a thin wrapper for backward
  compatibility. More work but removes the role confusion and makes
  matchmaking-by-gameId natural.

**Recommendation:** Option B, but ship Option A behind a `gameId` first if we're
time-constrained, then refactor.

### 5b. Challenge handshake (middleware + frontend)
- New middleware endpoints (draft):
  - `POST /challenge` `{ fromUsername, toUsername }` → creates a pending challenge, returns `gameId`.
  - `POST /challenge/:id/accept` → marks accepted, both sides get `gameId`.
  - `POST /challenge/:id/decline`.
  - Delivery of the incoming challenge to Student B: reuse existing socket
    connection if there is one, else short-poll. (Confirm what real-time channel
    already exists — the chess socket server is per-game, so challenge delivery
    may need its own lightweight channel.)
- Frontend: a **"Play a Student"** entry in `NewStudentProfile.tsx` (new inventory
  tile next to "Play with Computer") → opponent username input → send challenge →
  on accept, open the board with `?gameId=...&role=...`.

### 5c. Board wiring
Reuse the chess client's existing `userinfo` postMessage
(`{command:'userinfo', student, mentor, role}`) — extend/replace it to carry the
shared `gameId` and both usernames so both clients join the **same** game.

---

## 6. Part 2 — Winner detection (Sarita, chessServer)

`makeMove` already applies the move via chess.js `board.move()`. chess.js
exposes everything needed — just add a check after a successful move:

```js
// in GameManager.makeMove, after board.move() succeeds:
let outcome = null;
if (board.isCheckmate()) {
  // the side that just moved won; board.turn() is now the loser's color
  const loserColor = board.turn();               // 'w' | 'b'
  outcome = { over: true, reason: "checkmate", loserColor };
} else if (board.isDraw() || board.isStalemate() || board.isThreefoldRepetition()) {
  outcome = { over: true, reason: "draw" };
}
// return `outcome` alongside the existing result
```

Then in the `move` handler in `EventHandlers.js`, if `outcome.over`, resolve the
winning **username** from the game's players and emit to both sockets:

```js
io.to(playerA.id).emit("gameover", payload);
io.to(playerB.id).emit("gameover", payload);
// payload = { winnerUsername, loserUsername, reason }  // reason may be "draw"
```

Also handle **resignation** (add a `resign` socket event) and **disconnect**
(the existing `disconnect` handler resets the game — decide whether a disconnect
counts as a loss). These are the non-checkmate ways a game ends.

This mirrors the server's existing pattern of emitting activity events
(`completeActivity`, captures) that the gamification side already consumes.

---

## 7. Part 3/4 — Awarding weavels (Karthik's API, Sarita's call)

The award is a single side-effect on the `gameover` event. **The exact shape
below is the contract to confirm with Karthik** — do not implement against it
until confirmed.

**Open questions for Karthik:**
1. Where does a weavels balance live — a field on the `users` document, or a
   separate wallet/ledger collection?
2. What is the credit API? Draft assumption:
   `POST /weavels/credit { username, amount, reason: "pvp_win", gameId }`
   → returns new balance.
3. Should the chess server call this **directly**, or **emit an event** the
   middleware/gamification consumes (matching the existing `completeActivity`
   pattern)? Preference: emit an event, keep chessServer free of currency logic.
4. How many weavels for a win? Draw handling (split / none)? Idempotency so a
   game can't be credited twice (use `gameId` as the idempotency key)?
5. Does gamification already model a "match" / "game result" I should write to,
   or is that mine to define?

**Idempotency note:** whichever path, key the award on `gameId` so a
reconnect/replay can't double-award.

---

## 8. Dependencies & sequencing

1. **Blocked on Karthik:** §7 (weavels store + credit contract). Everything else
   can proceed with a stubbed `awardWeavels(winnerUsername, gameId)`.
2. **Blocked on chess board PR:** embedding the board in the student profile
   depends on `merge-chessclient-refactor` (or its cleaned-up successor) merging.
   Until then, PvP can be developed against the standalone chess client.
3. Suggested order: §6 winner detection (self-contained, testable) → §5 PvP
   handshake + entry UI → §7 swap the stub for Karthik's real API.

---

## 9. Testing

- Unit: extend `chessServer/src/tests/GameManager.test.js` with a
  checkmate/draw sequence asserting the `gameover` outcome and winner.
- Integration: two socket clients play a scholar's-mate line; assert both
  receive `gameover` with the correct `winnerUsername`.
- Award: assert `awardWeavels` is called exactly once per `gameId` (idempotency).

---

## 10. Out of scope for v1

Matchmaking queue / ELO, spectators, rematch, weavels spending/economy balancing,
anti-cheat. Direct-challenge only.
