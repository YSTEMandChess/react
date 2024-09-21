require("dotenv").config();
var app = require("express")();
var http = require("http")
  .createServer(app)
  .listen(process.env.PORT, () =>
    console.log(`listening on ${process.env.PORT}`)
  );
var io = require("socket.io")(http, {
  cors: true,
  origins: [process.env.URL],
  credentials: true,
});

var ongoingGames = [];

/// Purpose: Triggered when a client connects to the socket.
/// Input: N/A (Automatically triggered by the connection)
/// Output: Logs "a user connected to socket" in the server console.

io.sockets.on("connection", (socket) => {
  console.log("a user connected to socket");
  
  /// Purpose: Handle new game initialization or join an existing game.
  /// Input: { student: string (e.g., "Alice"), mentor: string (e.g., "Bob"), role: string ("mentor"/"student") }
  /// Output: { boardState: string (e.g., "initial_board_state"), color: string ("black"/"white") }

  socket.on("newGame", (msg) => {
    newGame = true;
    var parsedmsg = JSON.parse(msg);

    ongoingGames.forEach((game) => {
      // checking if student/mentor already in an ongoeing game
      if ( game.student.username == parsedmsg.student || game.mentor.username == parsedmsg.mentor ) 
      {
        newGame = false;  
        // Set the new client id for student or mentor.
        let color;
        
        if (parsedmsg.role == "student") {
          game.student.id = socket.id;
          color = game.student.color;
        } 
        else if (parsedmsg.role == "mentor") {
          game.mentor.id = socket.id;
          color = game.mentor.color;
        }

        io.to(socket.id).emit(
          "boardState",
          JSON.stringify({ boardState: game.boardState, color: color })
        );
      }
    });

    if (newGame) {
      let colors = [];

      if (parsedmsg.role == "student") 
      {
        colors = ["black", "white"];
      } 
      else 
      {
        colors = ["white", "black"];
      }

      if (parsedmsg.role == "student") {
        ongoingGames.push({
          student: {
            username: parsedmsg.student,
            id: socket.id,
            color: colors[0],
          },
          mentor: { username: parsedmsg.mentor, id: "", color: colors[1] },
          boardState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
        });
        io.emit(
          "boardState",
          JSON.stringify({
            boardState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
            color: colors[0],
          })
        );
      } else if (parsedmsg.role == "mentor") {
        ongoingGames.push({
          student: { username: parsedmsg.student, id: "", color: colors[0] },
          mentor: {
            username: parsedmsg.mentor,
            id: socket.id,
            color: colors[1],
          },
          boardState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
        });
        io.emit(
          "boardState",
          JSON.stringify({
            boardState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
            color: colors[1],
          })
        );
      }
      // Set client ids,
    }
  });

  /// Purpose: End an ongoing game and remove it from the list.
  /// Input: { username: string (e.g., "Alice") }
  /// Output: { success: boolean (true/false) }

  socket.on("endGame", (msg) => {
    var parsedmsg = JSON.parse(msg);
    let index = 0;
    ongoingGames.forEach((element) => {
      if (
        element.student.username == parsedmsg.username ||
        element.mentor.username == parsedmsg.username
      ) {
        ongoingGames.splice(index, 1);
      }
      index++;
    });
    io.emit(
      "deleteCookies",
      JSON.stringify(msg)
    );
  });

  /// Purpose: Request to undo the last moves.
  /// Input: { moveId: string (e.g., "move123"), playerId: string (e.g., "player1") }
  /// Output: { success: boolean (true/false), moveId: string (e.g., "move123") }

  socket.on("undoMoves", (data) => {
    const moves = JSON.parse(data);
    io.emit(
      "undoMoves",
      JSON.stringify(moves)
    );
  });

  /// Purpose: Inform both players whether the current step is the last update.
  /// Input: boolean (true/false)
  /// Output: boolean (true/false)

  socket.on("isStepLastUpdate", (data) => {
    const isStepLast = JSON.parse(data);
    io.emit(
      "isStepLastUpdate",
      isStepLast
    );
  });

  socket.on("isStepLast", (data) => {
    const isStepLast = JSON.parse(data);
    io.emit(
      "isStepLast",
      isStepLast
    );
  });

  /// Purpose: Send information about the last move in the game.
  /// Input: { moveId: string (e.g., "move123"), playerId: string (e.g., "player1"), position: string (e.g., "A3") }
  /// Output: { moveId: string (e.g., "move123"), playerId: string (e.g., "player1"), position: string (e.g., "A3") }

  socket.on("lastMoveInfo", (data) => {
    const moves = JSON.parse(data);
    io.emit(
      "lastMoveInfo",
      JSON.stringify(moves)
    );
  });

  /// Purpose: Block undo actions after the game ends.
  /// Input: { gameId: string (e.g., "game567") }
  /// Output: { success: boolean (true/false) }

  socket.on("preventUndoAfterGameOver", (data) => {
    const info = JSON.parse(data);
    io.emit(
      "preventUndoAfterGameOver",
      JSON.stringify(info)
    );
  });

  /// Purpose: Update the board state for the game.
  /// Input: { username: string (e.g., "Alice"), boardState: string (e.g., "updated_board_state") }
  /// Output: { boardState: string (e.g., "updated_board_state"), color: string ("black"/"white") }

  socket.on("newState", (msg) => {
    //msg contains boardstate, find boardstate
    var parsedmsg = JSON.parse(msg);
    ongoingGames.forEach((element) => {
      if (element.student.username == parsedmsg.username) {
        //pull json out of ongoing
        element.boardState = parsedmsg.boardState;
        io.to(element.mentor.id).emit(
          "boardState",
          JSON.stringify({
            boardState: element.boardState,
            color: element.mentor.color,
          })
        );
      } else if (element.mentor.username == parsedmsg.username) {
        element.boardState = parsedmsg.boardState;
        io.to(element.student.id).emit(
          "boardState",
          JSON.stringify({
            boardState: element.boardState,
            color: element.student.color,
          })
        );
      }
    });
    // update the board state and send to the other person.
    // {boardState: sdlfkjsk, username: sfjdslk}
  });

  /// Purpose: Create a new game instance with default settings.
  /// Input: { student: string (e.g., "Alice"), mentor: string (e.g., "Bob") }
  /// Output: { boardState: string (e.g., "initial_board_state"), color: string ("black"/"white") }

  socket.on("createNewGame", (msg) => {
    //msg contains boardstate, find boardstate
    io.emit(
      "gameOverMsg",
      JSON.stringify(msg)
    );
    io.emit(
      "undoAfterGameOver",
      JSON.stringify(msg)
    );
    let colors;
    if (Math.random() > 0.5) {
      colors = ["black", "white"];
    } else {
      colors = ["white", "black"];
    }

    var parsedmsg = JSON.parse(msg);
    ongoingGames.forEach((element) => {
      if (element.student.username == parsedmsg.username) {
        element.boardState = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
        element.student.color = colors[0];
        element.mentor.color = colors[1];

        io.to(element.student.id).emit(
          "boardState",
          JSON.stringify({
            boardState: element.boardState,
            color: element.student.color,
          })
        );
        io.to(element.mentor.id).emit(
          "boardState",
          JSON.stringify({
            boardState: element.boardState,
            color: element.mentor.color,
          })
        );
      } else if (element.mentor.username == parsedmsg.username) {
        element.student.color = colors[0];
        element.mentor.color = colors[1];
        element.boardState = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

        io.to(element.mentor.id).emit(
          "boardState",
          JSON.stringify({
            boardState: element.boardState,
            color: element.mentor.color,
          })
        );
        io.to(element.student.id).emit(
          "boardState",
          JSON.stringify({
            boardState: element.boardState,
            color: element.student.color,
          })
        );
      }
    });
    // update the board state and send to the other person.
    // {boardState: sdlfkjsk, username: sfjdslk}
  });

  /// Purpose: Switch the colors between student and mentor.
  /// Input: { username: string (e.g., "Alice") }
  /// Output: { boardState: string (e.g., "flipped_board_state"), color: string ("black"/"white") }

  socket.on("flipBoard", (msg) => {
    var parsedmsg = JSON.parse(msg);
    ongoingGames.forEach((element) => {
      if (
        element.student.username == parsedmsg.username ||
        element.mentor.username == parsedmsg.username
      ) {
        element.student.color =
          element.student.color == "black" ? "white" : "black";
        element.mentor.color =
          element.mentor.color == "black" ? "white" : "black";
        io.to(element.student.id).emit(
          "boardState",
          JSON.stringify({
            boardState: element.boardState,
            color: element.student.color,
          })
        );
        io.to(element.mentor.id).emit(
          "boardState",
          JSON.stringify({
            boardState: element.boardState,
            color: element.mentor.color,
          })
        );
      }
    });
  });

  /// Purpose: Handle game-over status for both players.
  /// Input: { username: string (e.g., "Alice") }
  /// Output: { boardState: string (e.g., "final_board_state"), color: string ("black"/"white") }

  socket.on("gameOver", (msg) => {
    var parsedmsg = JSON.parse(msg);
    ongoingGames.forEach((element) => {
      if (
        element.student.username == parsedmsg.username ||
        element.mentor.username == parsedmsg.username
      ) {
        io.to(element.student.id).emit(
          "gameOver",
          JSON.stringify({
            boardState: element.boardState,
            color: element.student.color,
          })
        );
        io.to(element.mentor.id).emit(
          "gameOver",
          JSON.stringify({
            boardState: element.boardState,
            color: element.mentor.color,
          })
        );
      }
    });
  });
});
