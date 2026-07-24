const GameManager = require("./GameManager");

const gameManager = new GameManager();

/**
 * STUB — awards weavels to the winner of a student-vs-student game.
 *
 * This is intentionally a no-op placeholder until Karthik confirms the
 * gamification currency contract (see the open questions in
 * documentation/student-vs-student-weavels-design.md §7):
 *   - where the weavels balance lives,
 *   - the credit API shape / whether to call it vs emit an event,
 *   - the award amount and idempotency key (should be the gameId).
 *
 * Mirrors the existing activity pattern in the "move" handler, which PUTs to
 * `${MIDDLEWARE_URL}/activities/:username/activity` with a Bearer credential.
 *
 * @param {string} winnerUsername
 * @param {string} credentials - Bearer token of the reporting client
 */
const awardWeavels = async (winnerUsername, credentials) => {
    console.log(`[weavels][stub] would award weavels to winner: ${winnerUsername}`);
    // TODO(Karthik contract): replace with real credit call, e.g.
    // await fetch(`${process.env.MIDDLEWARE_URL}/weavels/credit`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json", Authentication: `Bearer ${credentials}` },
    //     body: JSON.stringify({ username: winnerUsername, amount: /* TBD */, reason: "pvp_win", gameId: /* TBD */ }),
    // });
};

/**
 * Notifies both players that the game is over and, for a decisive result,
 * awards weavels to the winner. Shared by the checkmate/draw path (a move that
 * ends the game), resignation, and disconnect-as-forfeit so all three behave
 * identically. A draw has no winnerUsername, so no award fires.
 *
 * @param {string[]} playerIds - both players' socket ids (nulls tolerated)
 * @param {Object} outcome - { over, reason, winnerUsername?, loserUsername? }
 * @param {Server} io
 * @param {string} [credentials] - Bearer token of the reporting client
 */
const emitGameOver = async (playerIds, outcome, io, credentials) => {
    const payload = JSON.stringify(outcome);
    playerIds.forEach((id) => {
        if (id) io.to(id).emit("gameover", payload);
    });

    // Award on any decisive result (checkmate / resign / disconnect forfeit),
    // never on a draw. Keyed on the game so a reconnect/replay can't double-award.
    // STUB until Karthik's real weavels credit API (§7) lands.
    if (outcome.winnerUsername) {
        await awardWeavels(outcome.winnerUsername, credentials);
    }
};

/**
 * Registers all socket event handlers for a given connection.
 * @param {Socket} socket - The connected socket instance
 * @param {Server} io - The Socket.IO server instance
 */
const registerSocketHandlers = (socket, io) => {
    console.log("A user connected to socket:", socket.id);

    /**
     * Handles creating a new game or joining an existing one
     * Expected payload: { student, mentor, role }
     */
    socket.on("newgame", (msg) => {
        try {
            const parsed = JSON.parse(msg);

            const result = gameManager.createOrJoinGame({
                student: parsed.student,
                mentor: parsed.mentor,
                role: parsed.role,
                socketId: socket.id
            });

            socket.emit(
                "boardstate",
                JSON.stringify({
                boardState: result.game.boardState.fen(),
                color: result.color
                })
            );
        }
        catch (err) {
            socket.emit("gameerror", err.message);
        }
    });

    /**
     * Handles creating or joining a student-vs-student (PvP) game by gameId.
     * The gameId + both usernames come from an accepted challenge (middleware).
     * Expected payload: { gameId, challenger, opponent, username }
     */
    socket.on("newpvpgame", (msg) => {
        try {
            const parsed = JSON.parse(msg);

            const result = gameManager.createOrJoinPvpGame({
                gameId: parsed.gameId,
                challenger: parsed.challenger,
                opponent: parsed.opponent,
                username: parsed.username,
                socketId: socket.id
            });

            socket.emit(
                "boardstate",
                JSON.stringify({
                    boardState: result.game.boardState.fen(),
                    color: result.color
                })
            );
        }
        catch (err) {
            socket.emit("gameerror", err.message);
        }
    });

    /**
     * Handles a player resigning the current game.
     * The resigning player loses; the opponent wins and is awarded weavels.
     */
    socket.on("resign", async () => {
        try {
            const res = gameManager.resign(socket.id, "resign");
            if (!res) {
                return; // no active game for this socket
            }
            const { game, outcome } = res;
            await emitGameOver([game.student.id, game.mentor.id], outcome, io);
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    /**
     * Handles creating a new puzzle or joining an existing one
     * Expected payload: { student, mentor, role }
     */
    socket.on("newPuzzle", (msg) => {
        try {
            const parsed = JSON.parse(msg);
            console.log('data',parsed, msg);
            // create the new puzzle
            gameManager.createOrJoinPuzzle({
                student: parsed.student,
                mentor: parsed.mentor,
                role: parsed.role,
                socketId: socket.id,
                credentials: parsed.credentials,
            }, io);
        }
        catch (err) {
            socket.emit("gameerror", err.message);
            console.log(err.message);
        }
    });

    /**
     * Handles player move request
     * Expected payload: { from, to }
     */
    socket.on("move", async (msg) => {
        try {
            const { from, to, computerMove, username, credentials } = JSON.parse(msg);
            const res = await gameManager.makeMove(socket.id, from, to);
            const state = res.result;
            gameManager.broadcastBoardState(res.result, io);
            console.log('Move: ', res);

            // Game over? Notify both players and (once confirmed) award weavels
            // to the winner. See documentation/student-vs-student-weavels-design.md.
            const outcome = state.outcome;
            if (outcome && outcome.over) {
                await emitGameOver([state.studentId, state.mentorId], outcome, io, credentials);
            }
            if(!computerMove && credentials) {
                const activityEvents = res.activityEvents;   
                if (activityEvents && activityEvents.length > 0) {
                    const studentId = state.studentId;   
                    const payload = {
                        activities: activityEvents, 
                        lastMove: { from, to, san: state.move?.san }
                    };
                    console.log('Payload', payload);
                    const studentSocket = io.sockets.sockets.get(studentId);
                    //console.log('student socket', studentSocket);
                    if (studentSocket) {
                        try {
                            console.log('route:', `${process.env.MIDDLEWARE_URL}/activities/${username}/activity`);
                            const response = await fetch(`${process.env.MIDDLEWARE_URL}/activities/${username}/activity`, {
                                method: "PUT",
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authentication' : `Bearer ${credentials}`,
                                },
                                body: JSON.stringify({
                                    activityName: payload.activities[0].name,
                                })
                            });
                            console.log('response',response);
                            socket.emit("completeActivity");
                        } catch (e) {
                            console.log('Error: ', e);                            
                        }
                    }
                }

            }

            /*

            */
        }
        catch (err) {
            socket.emit("error", err.message);
            console.log('error thrown', err)
        }
    });
    socket.on("completeActivity", () => {
        console.log('activity completed');
    });

    /**
     * Handles undo move request
     */
    socket.on("undo", () => {
        try {
            const result = gameManager.undoMove(socket.id);
            gameManager.broadcastBoardState(result, io);
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    /**
     * Ends the current game
     * Expected payload: { student, mentor }
     */
    socket.on("endgame", (msg) => {
        try {
            const { student, mentor } = JSON.parse(msg);
            const result = gameManager.endGame(student, mentor);
            io.to(result.studentId).emit("reset");
            io.to(result.mentorId).emit("reset");
            console.log("game ended successfully")
        } 
        catch (err) {
            console.log("error", err.message);
            socket.emit("error", err.message);
        }
    });

    /**
     * Allows board state override
     * Expected payload: { state: fenString }
     */
    socket.on("setstate", (msg) => {
        try {
            const { state } = JSON.parse(msg);
            const result = gameManager.setBoardState(socket.id, state);
            gameManager.broadcastBoardState(result, io);
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    /**
     * Allows board state & color override (specifically for puzzles)
     * Expected payload: { state: fenString, color, hints }
     */
    socket.on("setstateColor", (msg) => {
        try {
            const { state, color, hints } = JSON.parse(msg);
            gameManager.setBoardColor(socket.id, state, color, hints, io); // modify the game in the server game manager
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    /**
     * Broadcasts the last move made (for highlighting)
     * Expected payload: { from, to }
     */
    socket.on("lastmove", (msg) => {
        try {
            const { from, to } = JSON.parse(msg);
            gameManager.broadcastLastMove(socket.id, from, to, io);
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    /**
     * Broadcasts any simple string messages
     * Expected payload: { message }
     */
    socket.on("message", (msg) => {
        try {
            const { message } = JSON.parse(msg);
            gameManager.broadcastSimpleMessage(socket.id, message, io);
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    const relayEvents = [
        "addgrey",
        "removegrey",
        "mousexy",
        "piecedrag",
        "piecedrop",
        "highlight"
    ];

    // Generic relay handler
    relayEvents.forEach((eventName) => {
        socket.on(eventName, (msg) => {
        try {
            const data = JSON.parse(msg);
            gameManager.relayToOpponent(socket.id, eventName, data, io);
        } catch (err) {
            socket.emit("error", err.message);
        }
        });
    });

    socket.on("disconnect", async () => {
        const game = gameManager.getGameBySocketId(socket.id);
        if (!game) {
            console.log("game not found for this socket")
            return;
        }

        // In a student-vs-student game, leaving mid-game is a forfeit: the
        // opponent wins (and is awarded weavels). Mentor-vs-student games are
        // practice, so a disconnect just resets with no result. §6.
        if (game.isPvp) {
            const res = gameManager.resign(socket.id, "disconnect");
            if (res && res.outcome.winnerUsername) {
                await emitGameOver([game.student.id, game.mentor.id], res.outcome, io);
            }
        }

        const result = gameManager.endGame(game.student.username, game.mentor.username);

        // reset game
        io.to(result.studentId).emit("reset");
        io.to(result.mentorId).emit("reset");
        console.log("game ended successfully")
    });
}

module.exports = registerSocketHandlers;