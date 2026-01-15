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
});
