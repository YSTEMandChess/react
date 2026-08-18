const GameManager = require('../managers/GameManager');

describe('GameManager', () => {
  let gameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  test('creates a new game correctly', () => {
    const result = gameManager.createOrJoinGame({
      student: 'Alice',
      mentor: 'Bob',
      role: 'student',
      socketId: 'socket1'
    });

    expect(result.newGame).toBe(true);
    expect(result.game.student.username).toBe('Alice');
    expect(result.color).toBe('black');
  });

  test('joins an existing game correctly', () => {
    gameManager.createOrJoinGame({
      student: 'Alice',
      mentor: 'Bob',
      role: 'student',
      socketId: 'socket1'
    });

    const result = gameManager.createOrJoinGame({
      student: 'Alice',
      mentor: 'Bob',
      role: 'mentor',
      socketId: 'socket2'
    });

    expect(result.newGame).toBe(false);
    expect(result.color).toBe('white');
  });

  test('makes a valid move', () => {
    const { game } = gameManager.createOrJoinGame({
      student: 'Alice',
      mentor: 'Bob',
      role: 'student',
      socketId: 'socket1'
    });

    game.mentor.id = 'socket2';
    const moveResult = gameManager.makeMove('socket1', 'e2', 'e4');

    expect(moveResult.result.move.from).toBe('e2');
    expect(moveResult.result.move.to).toBe('e4');
  });

  test('throws error for invalid move', () => {
    gameManager.createOrJoinGame({
      student: 'Alice',
      mentor: 'Bob',
      role: 'student',
      socketId: 'socket1'
    });

    expect(() => {
      gameManager.makeMove('socket1', 'e2', 'e9');
    }).toThrow(/Invalid move/);
  });

  test('undoes a move', () => {
    gameManager.createOrJoinGame({
      student: 'Alice',
      mentor: 'Bob',
      role: 'student',
      socketId: 'socket1'
    });

    gameManager.makeMove('socket1', 'e2', 'e4');
    const undoResult = gameManager.undoMove('socket1');

    expect(undoResult.undoneMove.to).toBe('e4');
  });

  // --- Game-over detection (§6) ------------------------------------------

  // Sets up a mentor(white)-vs-student(black) game with both sockets seated
  // and plays Fool's Mate: 1. f3 e5 2. g4 Qh4#. Black (the student) wins.
  const playFoolsMate = () => {
    const { game } = gameManager.createOrJoinGame({
      student: 'Alice', mentor: 'Bob', role: 'student', socketId: 'sBlack'
    });
    game.mentor.id = 'sWhite';
    gameManager.makeMove('sWhite', 'f2', 'f3'); // white
    gameManager.makeMove('sBlack', 'e7', 'e5'); // black
    gameManager.makeMove('sWhite', 'g2', 'g4'); // white
    return gameManager.makeMove('sBlack', 'd8', 'h4'); // black Qh4#
  };

  test('detects checkmate and resolves the winner by color', () => {
    const { result } = playFoolsMate();
    expect(result.outcome.over).toBe(true);
    expect(result.outcome.reason).toBe('checkmate');
    expect(result.outcome.winnerUsername).toBe('Alice'); // black, who mated
    expect(result.outcome.loserUsername).toBe('Bob');    // white, mated
  });

  test('reports no outcome for an ordinary move', () => {
    gameManager.createOrJoinGame({
      student: 'Alice', mentor: 'Bob', role: 'student', socketId: 'socket1'
    });
    const { result } = gameManager.makeMove('socket1', 'e2', 'e4');
    expect(result.outcome.over).toBe(false);
  });

  test('detects a draw by insufficient material after a capture', () => {
    gameManager.createOrJoinGame({
      student: 'Alice', mentor: 'Bob', role: 'student', socketId: 'socket1'
    });
    // White king g6 next to a lone black queen g5; capturing leaves K vs K.
    gameManager.setBoardState('socket1', '7k/8/6K1/6q1/8/8/8/8 w - - 0 1');
    const { result } = gameManager.makeMove('socket1', 'g6', 'g5');
    expect(result.outcome.over).toBe(true);
    expect(result.outcome.reason).toBe('draw');
    expect(result.outcome.winnerUsername).toBeUndefined();
  });

  // --- Resignation & forfeit (§6) ----------------------------------------

  test('resignation makes the resigning player lose', () => {
    const { game } = gameManager.createOrJoinGame({
      student: 'Alice', mentor: 'Bob', role: 'student', socketId: 'sBlack'
    });
    game.mentor.id = 'sWhite';
    const res = gameManager.resign('sBlack', 'resign'); // Alice resigns
    expect(res.outcome.over).toBe(true);
    expect(res.outcome.reason).toBe('resign');
    expect(res.outcome.winnerUsername).toBe('Bob');
    expect(res.outcome.loserUsername).toBe('Alice');
  });

  test('resign returns null when the socket has no game', () => {
    expect(gameManager.resign('ghost')).toBeNull();
  });

  // --- Student-vs-student (PvP) join by gameId (§5) -----------------------

  test('creates a PvP game and seats the challenger as white', () => {
    const res = gameManager.createOrJoinPvpGame({
      gameId: 'g1', challenger: 'Alice', opponent: 'Cara',
      username: 'Alice', socketId: 'sA'
    });
    expect(res.newGame).toBe(true);
    expect(res.color).toBe('white');
    expect(res.game.isPvp).toBe(true);
    expect(gameManager.getGameByGameId('g1')).toBe(res.game);
  });

  test('each PvP seat keeps its own credentials for the end-of-game report', () => {
    // Resign and disconnect carry no payload, so the token has to be captured
    // at join time or the result can never be reported to the middleware.
    gameManager.createOrJoinPvpGame({
      gameId: 'g1', challenger: 'Alice', opponent: 'Cara',
      username: 'Alice', socketId: 'sA', credentials: 'token-alice'
    });
    const res = gameManager.createOrJoinPvpGame({
      gameId: 'g1', challenger: 'Alice', opponent: 'Cara',
      username: 'Cara', socketId: 'sC', credentials: 'token-cara'
    });

    const seats = Object.fromEntries(res.game.players.map((p) => [p.username, p.credentials]));
    expect(seats).toEqual({ Alice: 'token-alice', Cara: 'token-cara' });
  });

  test('reconnecting refreshes the seat credentials rather than blanking them', () => {
    gameManager.createOrJoinPvpGame({
      gameId: 'g1', challenger: 'Alice', opponent: 'Cara',
      username: 'Alice', socketId: 'sA', credentials: 'token-alice'
    });
    // Reconnect with no token supplied — keep the one we already had.
    const res = gameManager.createOrJoinPvpGame({
      gameId: 'g1', challenger: 'Alice', opponent: 'Cara',
      username: 'Alice', socketId: 'sA2'
    });
    const alice = res.game.players.find((p) => p.username === 'Alice');
    expect(alice.id).toBe('sA2');
    expect(alice.credentials).toBe('token-alice');
  });

  test('second PvP player joins the same game by gameId as black', () => {
    gameManager.createOrJoinPvpGame({
      gameId: 'g1', challenger: 'Alice', opponent: 'Cara',
      username: 'Alice', socketId: 'sA'
    });
    const res = gameManager.createOrJoinPvpGame({
      gameId: 'g1', challenger: 'Alice', opponent: 'Cara',
      username: 'Cara', socketId: 'sC'
    });
    expect(res.newGame).toBe(false);
    expect(res.color).toBe('black');
    expect(gameManager.ongoingGames.length).toBe(1);
  });

  test('rejects a non-player trying to join a PvP game', () => {
    expect(() => gameManager.createOrJoinPvpGame({
      gameId: 'g1', challenger: 'Alice', opponent: 'Cara',
      username: 'Mallory', socketId: 'sM'
    })).toThrow(/not a player/);
  });

  test('a decided game cannot be resigned again (no double-award)', () => {
    const { result } = playFoolsMate(); // checkmate latches the game as over
    expect(result.outcome.over).toBe(true);
    // A follow-up resign/disconnect on the same game must be a no-op.
    expect(gameManager.resign('sWhite', 'disconnect')).toBeNull();
    expect(gameManager.resign('sBlack', 'resign')).toBeNull();
  });

  test('a forfeit in a PvP game awards the win to the opponent', () => {
    gameManager.createOrJoinPvpGame({
      gameId: 'g1', challenger: 'Alice', opponent: 'Cara',
      username: 'Alice', socketId: 'sA'
    });
    gameManager.createOrJoinPvpGame({
      gameId: 'g1', challenger: 'Alice', opponent: 'Cara',
      username: 'Cara', socketId: 'sC'
    });
    const res = gameManager.resign('sC', 'disconnect'); // Cara drops
    expect(res.outcome.winnerUsername).toBe('Alice');
    expect(res.outcome.reason).toBe('disconnect');
  });

  // --- Puzzle rooms: student solves, mentor observes (Socratic) ----------

  // Minimal io stub that records every event emitted to each socket.
  const makeIo = () => {
    const emitted = {};
    const sockets = new Map();
    const addSocket = (id) => {
      emitted[id] = [];
      sockets.set(id, { id, emit: (event, data) => emitted[id].push({ event, data }) });
    };
    const io = { sockets: { sockets }, to: () => ({ emit: () => {} }) };
    return { io, emitted, addSocket };
  };
  const eventsFor = (emitted, id) => emitted[id].map((e) => e.event);

  test('puzzle: the connecting student becomes the host (solver)', () => {
    const { io, emitted, addSocket } = makeIo();
    addSocket('sStudent');
    gameManager.createOrJoinPuzzle(
      { student: 'Alice', mentor: 'Bob', role: 'student', socketId: 'sStudent' }, io
    );
    expect(eventsFor(emitted, 'sStudent')).toContain('host');
  });

  test('puzzle: the connecting mentor becomes a guest (observer) and gets the board', () => {
    const { io, emitted, addSocket } = makeIo();
    addSocket('sMentor');
    gameManager.createOrJoinPuzzle(
      { student: 'Alice', mentor: 'Bob', role: 'mentor', socketId: 'sMentor' }, io
    );
    const events = eventsFor(emitted, 'sMentor');
    expect(events).toContain('guest');
    expect(events).toContain('boardstate'); // mentor sees the current position immediately
    expect(events).not.toContain('host');
  });

  test('puzzle: the student solves even when the mentor connects first', () => {
    const { io, emitted, addSocket } = makeIo();
    addSocket('sMentor');
    addSocket('sStudent');

    // Mentor connects FIRST — must still end up as the observer.
    gameManager.createOrJoinPuzzle(
      { student: 'Alice', mentor: 'Bob', role: 'mentor', socketId: 'sMentor' }, io
    );
    // Student connects second.
    gameManager.createOrJoinPuzzle(
      { student: 'Alice', mentor: 'Bob', role: 'student', socketId: 'sStudent' }, io
    );

    expect(eventsFor(emitted, 'sMentor')).toContain('guest');
    expect(eventsFor(emitted, 'sMentor')).not.toContain('host'); // mentor is never the driver
    expect(eventsFor(emitted, 'sStudent')).toContain('host');    // student always drives
    expect(gameManager.ongoingGames.length).toBe(1);             // one shared room

    const room = gameManager.ongoingGames[0];
    expect(room.student.id).toBe('sStudent');
    expect(room.mentor.id).toBe('sMentor');
  });

  test('puzzle: rejects an invalid role', () => {
    const { io, addSocket } = makeIo();
    addSocket('sX');
    expect(() =>
      gameManager.createOrJoinPuzzle(
        { student: 'Alice', mentor: 'Bob', role: 'parent', socketId: 'sX' }, io
      )
    ).toThrow(/Invalid role/);
  });
});
