require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);

// Use CORS middleware to allow all origins
app.use(cors({
  origin: "*", // Allow all origins
  methods: ["GET", "POST"], // Allowed methods
  credentials: true // Allow credentials (if needed)
}));

const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allowed methods
    credentials: true // Allow credentials if needed
  }
});

const ongoingGames = [];

server.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.PORT}`);
});

/// Purpose: Triggered when a client connects to the socket.
/// Input: N/A (Automatically triggered by the connection)
/// Output: Logs "a user connected to socket" in the server console.
io.on("connection", (socket) => {
  console.log("a user connected to socket");
  


  /// Purpose: Handle new game initialization or join an existing game.
  /// Input: { student: string (e.g., "Alice"), mentor: string (e.g., "Bob"), role: string ("mentor"/"student") }
  /// Output: { boardState: string (e.g., "initial_board_state"), color: string ("black"/"white") }

  socket.on("newgame", (msg) => {
    
    let currentGame;
    let newGame = true;
    var parsedmsg = JSON.parse(msg);
    console.log(msg);


    // checking if student/mentor already in an ongoing game
    for (let game of ongoingGames) {
      
      if (game.student.username == parsedmsg.student || game.mentor.username == parsedmsg.mentor) {
        newGame = false;
        currentGame = game;
        break;  // breaks early, since we no longer need to go through this loop
      }
    }

    // if student/mentor not in ongoing game, create a newgame
    if (newGame) {
      let chessState = new Chess();
      
      let colors = [];
      
      var studentSocket = "";
      var mentorSocket = "";

      // determining outputs based on role of client
      if (parsedmsg.role == "student") 
      {
        colors = ["black", "white"];
        studentSocket = socket.id;
      } 
      else if (parsedmsg.role == "mentor")
      {
        colors = ["white", "black"];
        mentorSocket = socket.id;
      }
      else { 
        io.emit("error : invalid value for msg.role. Requires student/mentor")  
      }

      // determining color of client peices
      let clientColor = (parsedmsg) => 
        parsedmsg.role === "student" ? colors[0] : 
        parsedmsg.role === "mentor" ? colors[1] : 
        null;
      
      const color = clientColor(parsedmsg);

      // saving game to ongoingGames
      currentGame = {
        student: {
          username: parsedmsg.student,
          id: studentSocket,
          color: colors[0],
        },
        mentor: { 
          username: parsedmsg.mentor, 
          id: mentorSocket, 
          color: colors[1] 
        },
        boardState: chessState,
        pastStates: []
      };

      ongoingGames.push(currentGame);

      // emitting board state to client
      io.emit(
        "boardstate",
        JSON.stringify({ boardState: currentGame.boardState.fen(), color: color
        })
      );
    
      // Set client ids,
    }
    else if (newGame == false)
    {
      // Set the new client id for student or mentor.
      let color;
        
      if (parsedmsg.role == "student") 
      {
        currentGame.student.id = socket.id;
        color = currentGame.student.color;
      } 
      else if (parsedmsg.role == "mentor") 
      {
        currentGame.mentor.id = socket.id;
        color = currentGame.mentor.color;
      } 
      
      

      // emitting board state
      io.to(socket.id).emit(
        "boardstate",
        JSON.stringify({ boardState: currentGame.boardState.fen(), color: color})
      );
    }
    else {
      // TODO : implement exception : newgame is null
    }
    
  });

  /// Purpose: Changes state of existing game.
  /// Input: { from: e2, to: e3 }
  /// Output: { boardState: string (e.g., "initial_board_state"), color: string ("black"/"white") }
  socket.on("move", (msg) => {
    
    let currentGame;
    var clientSocket = socket.id;
    console.log(msg);

    parsedmsg = JSON.parse(msg);
    move = parsedmsg.move;

    // checking student/mentor is in an ongoing game
    for (let game of ongoingGames) {
      
      if (game.student.id == clientSocket || game.mentor.id == clientSocket) {
        newGame = false;
        currentGame = game;
        break;  // breaks early, since we no longer need to go through this loop
      }
    }

    if (currentGame)
    {
      


      let currentState = currentGame.boardState;
      let pastState = currentState;
      // Get initial state




      // Attempt to make a legal move
      let move = currentState.move({ from: parsedmsg.from, to: parsedmsg.to }); // Move the pawn to e4

      // Testing legal move
      if (move) {
        currentGame.boardState = currentState;
        console.log('Move made:', move);
      } else {
        console.log('Illegal move');
      }

      // broadcast current board state to mentor and student
      
      
      io.to(currentGame.mentor.id).emit(
        "boardstate",
        JSON.stringify({ boardState: currentGame.boardState.fen()})

      );

      io.to(currentGame.student.id).emit(
        "boardstate",
        JSON.stringify({boardState: currentGame.boardState.fen()})
      )

    }

  });

  /// Purpose: End an ongoing game and remove it from the list.
  /// Input: { username: string (e.g., "Alice") }
  /// Output: { success: boolean (true/false) }

  socket.on("endgame", (msg) => {
    var parsedmsg = JSON.parse(msg);
    console.log(msg);
    console.log("ending game on server");

    let index = 0;
    ongoingGames.forEach((game) => {
      if (
        game.student.username == parsedmsg.student &&
        game.mentor.username == parsedmsg.mentor
      ) {

        io.to(game.mentor.id).emit(
          "reset"
        );
    
        io.to(game.student.id).emit(
          "reset"
        );

        ongoingGames.splice(index, 1);
        console.log(ongoingGames);
      }
      index++;
    });     
    
    

  });

  /// Purpose: Request to undo the last moves.
  /// Input: { moveId: string (e.g., "move123"), playerId: string (e.g., "player1") }
  /// Output: { success: boolean (true/false), moveId: string (e.g., "move123") }

  socket.on("undo", (msg) => {
    
    let currentGame;
    var clientSocket = socket.id;

    console.log(msg);

    parsedmsg = JSON.parse(msg);
    
    move = parsedmsg.move;

    // checking student/mentor is in an ongoing game
    for (let game of ongoingGames) {
      
      if (game.student.id == clientSocket || game.mentor.id == clientSocket) {
        newGame = false;
        currentGame = game;
        break;  // breaks early, since we no longer need to go through this loop
      }
    }

    if (currentGame)
    {
      
      let currentState = currentGame.boardState;
      
      currentState.undo();

      currentGame.boardState = currentState;

      console.log(currentGame.boardState.fen());

      // broadcast current board state to mentor and student
      io.to(currentGame.mentor.id).emit(
        "boardstate",
        JSON.stringify({ boardState: currentGame.boardState.fen()})
      );

      io.to(currentGame.student.id).emit(
        "boardstate",
        JSON.stringify({boardState: currentGame.boardState.fen()})
      );

      
      console.log(currentGame);

    }
  });



  socket.on("setstate", (msg) => {

    let currentGame;
    var clientSocket = socket.id;

    console.log(msg);

    parsedmsg = JSON.parse(msg);
    
    state = parsedmsg.state;

    // checking student/mentor is in an ongoing game
    for (let game of ongoingGames) {
      
      if (game.student.id == clientSocket || game.mentor.id == clientSocket) {
        
        currentGame = game;
        break;  // breaks early, since we no longer need to go through this loop
      }
    }

    if (currentGame)
    {
      currentGame.boardState = state;
    }

    io.to(currentGame.mentor.id).emit(
      "boardstate",
      JSON.stringify({ boardState: currentGame.boardState.fen()})

    );

    io.to(currentGame.student.id).emit(
      "boardstate",
      JSON.stringify({boardState: currentGame.boardState.fen()})
    )


  });

  socket.on("lastmove", (msg) => {

    let currentGame;
    var clientSocket = socket.id;

    // checking student/mentor is in an ongoing game
    for (let game of ongoingGames) {
      
      if (game.student.id == clientSocket || game.mentor.id == clientSocket) {
        newGame = false;
        currentGame = game;
        break;  // breaks early, since we no longer need to go through this loop
      }
    }

    // getting message variables
    parsedmsg = JSON.parse(msg);
    let from = parsedmsg.from;
    let to = parsedmsg.to;

    //const validCoordinate = (letter, number) => ['a','b','c','d','e','f','g','h'].includes(letter) && number > 0 && number < 9;

    // checking for good coordinate
    //if (from.letter && from.number && to.letter && to.number)
    //{
        
      //if (validCoordinate(from.letter, from.number) && validCoordinate(to.letter, to.number))
      //{
              
    io.to(currentGame.mentor.id).emit(
      "lastmove",
      JSON.stringify({ from, to})

    );

    io.to(currentGame.student.id).emit(
      "lastmove",
      JSON.stringify({from, to})
    )
      //}
      //else
      //{
        // bad highlight
      //}
    //}
    //else { 
      // bad entry
    //}


      

  });

  socket.on("addgrey", (msg) => {
    
    let currentGame;
    var clientSocket = socket.id;

    // checking student/mentor is in an ongoing game
    for (let game of ongoingGames) {
      
      if (game.student.id == clientSocket || game.mentor.id == clientSocket) {
        newGame = false;
        currentGame = game;
        break;  // breaks early, since we no longer need to go through this loop
      }
    }

    // getting message variables
    parsedmsg = JSON.parse(msg);
    let to = parsedmsg.to;

    if (currentGame)
    {
      if (currentGame.mentor.id != clientSocket)
      {
            
        io.to(currentGame.mentor.id).emit(
          "addgrey",
          JSON.stringify({to})

        );

      }      
      else if (currentGame.student.id != clientSocket)
      {
          
        io.to(currentGame.student.id).emit(
          "addgrey",
          JSON.stringify({to})
        )
      }
      else {console.log("bad request, no client to send greysquare to")}
    }

  }); 

  
  socket.on("removegrey", (msg) => {
    
    let currentGame;
    var clientSocket = socket.id;

    // checking student/mentor is in an ongoing game
    for (let game of ongoingGames) {
      
      if (game.student.id == clientSocket || game.mentor.id == clientSocket) {
        newGame = false;
        currentGame = game;
        break;  // breaks early, since we no longer need to go through this loop
      }
    }

    // getting message variables
    parsedmsg = JSON.parse(msg);
    let to = parsedmsg.to;

    if (currentGame)
    {
        
      if (currentGame.mentor.id != clientSocket)
        {
              
          io.to(currentGame.mentor.id).emit(
            "removegrey",
            JSON.stringify({})
    
          );
    
        }      
        else if (currentGame.student.id != clientSocket)
        {
            
          io.to(currentGame.student.id).emit(
            "removegrey",
            JSON.stringify({})
          )
        }
        else {console.log("bad request, no client to send greysquare to")}
    }
   

  }); 
  

  /*
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
    ongoingGames.forEach((game) => {
      // testing to see if 
      if (
        game.student.username == parsedmsg.username ||
        game.mentor.username == parsedmsg.username
      ) {
        io.to(game.student.id).emit(
          "gameOver",
          JSON.stringify({
            boardState: game.boardState,
            color: game.student.color,
          })
        );
        io.to(game.mentor.id).emit(
          "gameOver",
          JSON.stringify({
            boardState: game.boardState,
            color: game.mentor.color,
          })
        );
      }
    });
  });
  */
});
