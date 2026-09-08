# Student-vs-Student Play + Chess Score — Feature Guide

How the student-vs-student feature works, how to test it, and how to replicate
the behavior locally.

**Status:** backend, challenge handshake and result scoring complete and tested;
in-profile board embedding pending (see [Pending](#what-works-today-vs-pending)).
**Related:** [student-vs-student-design.md](student-vs-student-design.md)

---

## 1. What we built (the flow)

Two students play chess from their profiles; the result feeds a **chess score**
shown as its own leaderboard column (deliberately not blended into the existing
engagement score — see the design doc §1). Three layers cooperate:

```
Student A profile ──"Challenge cara"──▶ middleware /challenge ──▶ B's incoming list
        (PlayStudent.tsx)                    (in-memory)                (B short-polls)
                                                                            │ Accept
        both sides now hold the same gameId ◀───────────────────────────────┘
                                    │
   each client ─"newpvpgame {gameId, challenger, opponent, username, credentials}"─▶ chessServer
                                    │  (createOrJoinPvpGame pairs them: challenger = white)
                        ...moves sync over sockets...
                                    │
        a move causes checkmate ──▶ detectOutcome() resolves winner BY COLOR
                                    │
        chessServer emits "gameover" {winnerUsername, loserUsername, reason} to BOTH
                                    │
        POST /gameResults ──▶ one immutable record, idempotent on gameId
                                    │
        leaderboard / analytics compute W-D-L + chessScore on read
```

### Key files

| File | Responsibility |
|---|---|
| `react-ystemandchess/src/features/student/student-profile/PlayStudent.tsx` | "Play a Student" tab: send challenge, poll for acceptance, accept/decline incoming |
| `react-ystemandchess/.../Modals/LeaderboardModal.tsx` | Sortable **Chess** column (score + W–D–L), separate from Score |
| `middlewareNode/src/routes/challenge.js` | Challenge handshake endpoints (in-memory, TTL-swept) |
| `middlewareNode/src/routes/gameResults.js` | `POST /gameResults` (idempotent, participant-only), `GET /gameResults/:username` |
| `middlewareNode/src/models/gameResults.js` | One immutable record per finished game; `gameId` unique |
| `middlewareNode/src/utils/studentStats.js` | `getChessRecord` / `getChessRecords` / `chessScoreFrom` — the single scoring source |
| `chessServer/src/managers/GameManager.js` | `createOrJoinPvpGame`, `detectOutcome`, `resign`, the `isOver` latch |
| `chessServer/src/managers/EventHandlers.js` | `newpvpgame` / `resign` socket events, `emitGameOver` + `reportGameResult` |

---

## 2. Reproduce the automated verification (fastest)

### Unit tests — game logic (checkmate / draw / resign / PvP-join / no-double-award)

```bash
cd chessServer && npx jest src/tests/GameManager.test.js
# → Tests: 17 passed
```

### Result API — idempotency, participant guard, scoring

```bash
cd middlewareNode && npx jest tests/gameResults.test.js
# → Tests: 16 passed

# The separation guarantee (chess results never move the engagement score):
cd middlewareNode && npx jest tests/leaderboard.test.js
```

### End-to-end — real challenge router + real socket server, two clients play

```bash
# 1. start the chess server
cd chessServer && PORT=3001 node src/index.js   # leave running

# 2. in another shell, run the E2E driver
NODE_PATH=middlewareNode/node_modules:chessServer/node_modules \
  node <path-to>/e2e.js
# → 11/11 checks passed
```

The E2E script exercises the whole backend path (challenge → accept → join same
game → play to checkmate → resign → disconnect-forfeit) without a browser.

---

## 3. Exercise it manually in the browser

Run all services, each in its own terminal:

```bash
cd middlewareNode      && npm start   # :8000  (needs Mongo — the /challenge route is
                                      #         in-memory, but the server boots connectDB())
cd chessServer         && npm start   # :3001
cd react-ystemandchess && npm start   # :3000
```

Then:

1. Log in as **student A** in one browser and **student B** in another (use a
   second browser or an incognito window so the two `login` cookies don't collide).
2. Both go to their profile → **"Play a Student"** tab.
3. A types B's username → **Challenge**. A now shows "Waiting for B to accept…".
4. B's tab shows "**A challenged you**" within ~2.5s (short-poll) → **Accept**.
5. Both flip to "Ready to play — you are White/Black" with a shared `gameId`.
   **Open Board** launches the game.

### Watch just the handshake API (no browser)

```bash
# with middleware (or the E2E's in-process router) up:
curl -sX POST localhost:8000/challenge -H 'Content-Type: application/json' \
  -d '{"fromUsername":"alice","toUsername":"cara"}'          # → {challengeId, gameId}
curl -s localhost:8000/challenge/incoming/cara               # cara sees it
curl -sX POST localhost:8000/challenge/<challengeId>/accept  # → {gameId, challenger, opponent}
```

### Watch the result API (no browser)

```bash
TOKEN=<a player's JWT>

# record a game (as one of the two players)
curl -sX POST localhost:8000/gameResults \
  -H 'Content-Type: application/json' -H "Authentication: Bearer $TOKEN" \
  -d '{"gameId":"g1","result":"win","reason":"checkmate",
       "winnerUsername":"alice","loserUsername":"cara"}'   # → 201 {duplicate:false}

# report it again — idempotent, nothing changes
curl -sX POST localhost:8000/gameResults \
  -H 'Content-Type: application/json' -H "Authentication: Bearer $TOKEN" \
  -d '{"gameId":"g1","result":"win","reason":"checkmate",
       "winnerUsername":"alice","loserUsername":"cara"}'   # → 200 {duplicate:true}

curl -s localhost:8000/gameResults/alice -H "Authentication: Bearer $TOKEN"
# → {wins, draws, losses, gamesPlayed, chessScore}

# the leaderboard shows it as its own column, and can rank by it
curl -s 'localhost:8000/leaderboard?sortBy=chess' -H "Authentication: Bearer $TOKEN"
```

---

## 4. What each test guarantees

| Check | Proven by |
|---|---|
| Winner resolved correctly (by color, both game types) | unit: Fool's-mate → `cara` wins |
| Draws detected, no winner | unit: insufficient-material |
| Resign / disconnect forfeit to opponent | unit + E2E |
| Both seats keep their own token for the end-of-game report | unit: per-seat credentials |
| No double-count after a decided game | unit: "cannot be resigned again" + `gameId` idempotency tests |
| A non-participant cannot report a game | `gameResults.test.js` — 403 |
| Chess results never move the engagement score | `leaderboard.test.js` — separation tests |
| Full handshake → paired game → gameover on both clients | E2E 11/11 |

---

## 5. What works today vs. pending

**Works end-to-end today:** the entire **challenge handshake** — send / accept /
decline, live polling, self-challenge rejection, duplicate dedup — all of the
**game and outcome logic** (pairing by `gameId`, move sync, checkmate/draw/resign/
disconnect detection, single-count guarantee), and **result recording + scoring**
(`POST /gameResults` → leaderboard Chess column and analytics `chess` block).

**Pending:**

- **In-profile board embedding.** "Open Board" currently targets the standalone
  chess client; embedding the board in the profile via `postMessage` waits on the
  chess-client refactor. Until a client emits `newpvpgame`, the reporting path is
  exercised by tests and the E2E driver rather than by real browser play.
- **Trust model.** The reporting client is a player, so a determined student
  could report a loss as a win. See the design doc §10 — the fix is a chessServer
  service credential instead of a relayed player token.
