let flag = false
let lessonFlag = false
let isLesson = false
let lessonStarted = false
let lessonBoard = ''
let lessonEnd = ''
let endSquare = ''
let previousEndSquare = ''
var squareClass = 'square-55d63'
var $board = $('#myBoard')
var board = null
var currentState = new Chess()
var whiteSquareGrey = '#eebe7bf7'
var blackSquareGrey = '#ae5716d6'

var serverStartNotified = false

var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent'
var eventer = window[eventMethod]
var messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message'

var mentor = ''
var student = ''
var role = 'student'

var playerColor

var freemoveFlag = false

var myMouseX
var myMouseY
const mouseImage = 'img/cursor.png'

var opponentMouseX = 0
var opponentMouseY = 0

var nextPuzzleMove = []
var isPuzzle = false

var highlightFrom = ''
var highlightTo = ''

// Listen for mouse position change
document.addEventListener('mousemove', (event) => {
  myMouseX = event.clientX
  myMouseY = event.clientY

  if (mentor && student) {
    sendMouseXY()
  }
})

// Update the position of the other players mouse
function updateOpponentMouseXY () {
  const img = document.getElementById('cursor')

  // Set absolute position values (top and left in pixels)
  img.style.top = `${opponentMouseY}px`
  img.style.left = `${opponentMouseX}px`
}

// References to chess piece images
const chessPieceFolder = 'img/chesspieces/wikipedia/'

const chessImages = {
  bB: 'bB.png', // Black Bishop
  bK: 'bK.png', // Black King
  bN: 'bN.png', // Black Knight
  bP: 'bP.png', // Black Pawn
  bQ: 'bQ.png', // Black Queen
  bR: 'bR.png', // Black Rook
  wB: 'wB.png', // White Bishop
  wK: 'wK.png', // White King
  wN: 'wN.png', // White Knight
  wP: 'wP.png', // White Pawn
  wQ: 'wQ.png', // White Queen
  wR: 'wR.png' // White Rook
}

function getChessPieceImage (peice) {
  chessString = chessPieceFolder + chessImages[peice]
  return chessString
}

const socket = io('http://localhost:3001')

let defaultFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'

letParentKnow()

function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
  $('#myBoard .square-55d63').css('background-image', '')
  $('#myBoard .square-55d63').css('background-position', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
  $square.css('background-position', 'center')
  $square.css('background-image', "url('img/chesspieces/wikipedia/dot.png')")
}

function sendNewGame () {
  console.log('starting new game with server')
  var data = {'mentor': mentor, 'student': student, 'role': role}
  console.log(data)
  socket.emit('newgame', JSON.stringify(data))
}

// similar to sendNewGame, but for puzzles specifically
function sendNewPuzzle () {
  console.log('starting new puzzle with server')
  var data = {'mentor': mentor, 'student': student, 'role': role}
  console.log(data)
  socket.emit('newPuzzle', JSON.stringify(data))
}

// for chess server to modify the game's board state & player color, (designed just for puzzles for now)
function sendSetState (fen) {
  console.log('setting a new board state')
  var data = {'state': fen}
  console.log(data)
  socket.emit('setstate', JSON.stringify(data))
}

// for chess server to modify the game's board state & player color, (designed just for puzzles for now)
function sendSetStateColor (fen, color, hints) {
  console.log('setting a new board state')
  var data = {'state': fen, 'color': color, 'hints': hints}
  console.log(data)
  socket.emit('setstateColor', JSON.stringify(data))
}

function sendMove (from, to) {
  console.log('sending move to server')
  var data = {'mentor': mentor, 'student': student, 'role': role, 'from': from, 'to': to}
  console.log(data)
  socket.emit('move', JSON.stringify(data))
}

function sendEndGame () {
  console.log('sending end game to server')
  var data = {'mentor': mentor, 'student': student, 'role': role}
  console.log(data)
  socket.emit('endgame', JSON.stringify(data))
}

function sendMouseXY () {
  let data = {'x': myMouseX, 'y': myMouseY, 'mentor': mentor, 'student': student}
  socket.emit('mousexy', JSON.stringify(data))
}

function sendLastMove (from, to) {
  let data = {'from': from, 'to': to, 'mentor': mentor, 'student': student}
  socket.emit('lastmove', JSON.stringify(data))
}

function sendHighLight (from, to) {
  console.log('sending highlihgt')
  let data = {'from': from, 'to': to, 'mentor': mentor, 'student': student}
  socket.emit('highlight', JSON.stringify(data))
}

function sendUndo () {
  console.log('sending undo to server')
  var data = {'mentor': mentor, 'student': student, 'role': role}
  console.log(data)
  socket.emit('undo', JSON.stringify(data))
}

function sendRemoveGrey () {
  var data = {'mentor': mentor, 'student': student}
  socket.emit('removegrey', JSON.stringify(data))
}

function sendGreySquare (to) {
  var data = {'mentor': mentor, 'student': student, 'to': to}
  socket.emit('addgrey', JSON.stringify(data))
}

function sendPieceDrag (piece) {
  console.log('sending drag')
  var data = {'mentor': mentor, 'student': student, 'piece': piece}
  socket.emit('piecedrag', JSON.stringify(data))
}

function sendPieceDrop () {
  console.log('sending drop')
  var data = {'mentor': mentor, 'student': student}
  socket.emit('piecedrop', JSON.stringify(data))
}

// sending simple string messages
function sendMessage (message) {
  console.log('sending message:', message)
  var data = {'message': message}
  socket.emit('message', JSON.stringify(data))
}

// notify front end that their user has created a new game/puzzle as host
socket.on('host', () => {
  parent.postMessage('host', '*')
  isPuzzle = true
})

// notify front end that their user has joined an existing new game/puzzle as guest
socket.on('guest', () => {
  parent.postMessage('guest', '*')
  isPuzzle = true
})

socket.on('message', (msg) => {
  parsedMsg = JSON.parse(msg)
  parent.postMessage(parsedMsg.message, '*')
})

// Handle boardstate message from the client
socket.on('boardstate', (msg) => {
  parsedMsg = JSON.parse(msg)

    // if served as a client for a puzzle host (a guest does not store nextPuzzleMove for simplicity)
  if (nextPuzzleMove.length == 2) {
      // for a puzzle host, 'boardstate' message is either initiated by host itself or its guest

      // if initiated by host itself, ignore the message
    if (parsedMsg.boardState == currentState.fen()) return
      // else 'boardstate' message is initiated by puzzle guest

      // the expected puzzle moves
    var source = nextPuzzleMove[0]
    var target = nextPuzzleMove[1]

      // the expected chess board based on expected moves
    const testState = new Chess(currentState.fen())
    testState.move({ from: source, to: target })

      // new board state is different from expected board, so client has made an incorrect move
    if (testState.fen() != parsedMsg.boardState) {
        // snap back, reset puzzle to current state
      sendSetState(currentState.fen())
      highlightMove(highlightFrom, highlightTo, 'lastmove')
    } else {
      // else client has made the expected move
      nextPuzzleMove = [] // clear next moves
      currentState = new Chess(parsedMsg.boardState) // rearrange board according to guest move
      board.position(currentState.fen())
      sendToParent( // notify front end that a move has been made
          JSON.stringify({
            from: source,
            to: target
          })
        )
    }
    return
  }

    // update state of chess board
  console.log(currentState)
  console.log(currentState.fen())
  currentState = new Chess(parsedMsg.boardState)
  console.log('received board state', parsedMsg)

    // setting player color
  if (parsedMsg.color) {
      // setting player color for turn keeping
    playerColor = parsedMsg.color
    console.log(playerColor)

      // setting chess board orientation
    config.orientation = parsedMsg.color
    board = Chessboard('myBoard', config)
    parent.postMessage('new game received', '*')
  }

    // update visuals of chessboard
  board.position(currentState.fen())
})

socket.on('piecedrag', (msg) => {
  console.log('recieved piece drag')
  parsedMsg = JSON.parse(msg)

  // Change the image of the cursor back to default
  cursor = document.getElementById('cursor')
  pieceImage = getChessPieceImage(parsedMsg.piece)

  console.log(pieceImage)
  console.log(parsedMsg.piece)

  cursor.src = pieceImage
})

socket.on('color', (msg) => {
  console.log('received color', msg)
  parsedMsg = JSON.parse(msg)
  playerColor = parsedMsg.color
})

socket.on('piecedrop', () => {
  console.log('recieved piece drop')

  // Change the image of the cursor back to default
  cursor = document.getElementById('cursor')
  cursor.src = mouseImage
})

socket.on('highlight', (msg) => {
  // Highlight the anticipated space
  console.log('highlight recieved')
  parsedMsg = JSON.parse(msg)
  highlightMove(parsedMsg.from, parsedMsg.to, 'lastMove')
})

socket.on('addgrey', (msg) => {
  // Highlight the last moved spaces
  parsedMsg = JSON.parse(msg)
  greySquare(parsedMsg.to)
})

socket.on('removegrey', () => {
  removeGreySquares()
})

// handle change of opponents mousexy
socket.on('mousexy', (msg) => {
  let parsedMsg = JSON.parse(msg)

  let viewportWidth = window.innerWidth
  let viewportHeight = window.innerHeight

  if (parsedMsg.x && parsedMsg.y) {
    if (isPuzzle) {
      opponentMouseX = parsedMsg.x - 28
      opponentMouseY = parsedMsg.y - 28
    } else {
      opponentMouseX = (-1 * parsedMsg.x) + viewportWidth - 28
      opponentMouseY = (-1 * parsedMsg.y) + viewportHeight - 28
    }

    updateOpponentMouseXY()
  }
})

// Handle reset message from the client
socket.on('reset', () => {
  // reload page
  location.reload()
  // deleteAllCookies();
  console.log('resetting board')
})

// Handle lastmove message from the client
socket.on('lastmove', (msg) => {
  // Highlight the last moved spaces
  parsedMsg = JSON.parse(msg)
  if (!parsedMsg.from && !parsedMsg.to && nextPuzzleMove.length > 0) return
  highlightMove(parsedMsg.from, parsedMsg.to, 'lastmove')
})

// Deletes all cookies on iframe
function deleteAllCookies () {
  const cookies = document.cookie.split(';')

  for (let cookie of cookies) {
    const cookieName = cookie.split('=')[0].trim()
    deleteCookie(cookieName)
  }
}

// Listen to message from parent window
eventer(
  messageEvent,
  (e) => {
    console.log('client event: ', e) // uncomment for debugging
    let data
    try {
      data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
    } catch (err) {
      console.error('Invalid JSON message from parent:', e.data)
      return
    }

    updateStatus()
    board.position(currentState.fen())
    sendToParent(currentState.fen())

    // get command from parent and send to server
    var command = data.command
    if (command == 'newgame') { // front end wants to create / join game
      sendNewGame()
    } else if (command == 'newPuzzle') { // front end wants to create / join puzzle
      sendNewPuzzle()
    } else if (command == 'message') { // front end wants to broadcast a message
      sendMessage(data.message)
    } else if (command == 'endgame') { // front end wants to end existing game / puzzle
      // delete game on server
      sendEndGame()
    } else if (command == 'userinfo') {
      mentor = data.mentor
      student = data.student
      role = data.role
    } else if (command == 'undo') { sendUndo() }

    // check if puzzle
    if (data.PuzzleId) {
      console.log('loading puzzle: ', data.PuzzleId)
      currentState.load(data.FEN)
      board.position(data.FEN)

      // find the starting color
      var activeColor = data.FEN.split(' ')[1]
      // the computer makes the first move
      // change board orientation accordingly
      // i.e. if active color is w, then player is black, and vice versa
      if (activeColor === 'w') {
        playerColor = 'black'
        board.orientation('black')
      } else {
        playerColor = 'white'
        board.orientation('white')
      }

      sendSetStateColor(currentState.fen(), playerColor, data.Hints)
      sendToParent(currentState.fen())
    }

    // get and set lessonflag
    lessonFlag = data.lessonFlag
    if (lessonFlag == true) {
      isLesson = true
    }

    // move a piece if it's a move message
    if ('from' in data && 'to' in data) {
      currentState.move({ from: data.from, to: data.to })

      // move highlight
      highlightMove(data.from, data.to)

      updateStatus()
      sendToParent(currentState.fen())
    }

    // highlight message
    if ('highlightFrom' in data && 'highlightTo' in data) {
      highlightMove(data.highlightFrom, data.highlightTo, 'lastmove')
    }

    if ('clearhighlight' in data) {
      $board.find('.' + squareClass).removeClass('lastmove')
    }

    // if this is a lesson, setup lesson
    if (isLesson == true) {
      endSquare = data.endSquare
      lessonBoard = data.boardState
      lessonEnd = data.endState

      if (
        (data.color === 'black' || data.color === 'white') &&
        data.color !== playerColor
      ) {
        playerColor = data.color
        console.log('data.color: ' + data.color)
        console.log('setting orientation to: ' + playerColor)
        board.orientation(playerColor)
      }

      previousEndSquare = data.previousEndSquare

      if (previousEndSquare !== '') {
        $board.find('.square-' + previousEndSquare).removeClass('highlight')
      }

      if (lessonStarted == false) {
        var lessonConfig = {
          draggable: true,
          showNotation: true,
          position: lessonBoard,
          onDragStart: onDragStart,
          onDrop: onDrop,
          onMouseoutSquare: onMouseoutSquare,
          onMouseoverSquare: onMouseoverSquare,
          onSnapEnd: onSnapEnd
        }
        board = Chessboard('myBoard', lessonConfig)
        // var overlay = new ChessboardArrows('board_wrapper');
        lessonStarted = true
        currentState.load(lessonBoard)
      } else {
        board.position(data.boardState)
        currentState.load(data.boardState)
        updateStatus()
      }

      $board.find('.square-' + endSquare).addClass('highlight')
    } else if (data.boardState == defaultFEN) {
      currentState = new Chess()
    }

    if (isLesson == false && data.color && data.boardState) {
      playerColor = data.color
      board.orientation(playerColor)
      currentState.load(data.boardState)
      board.position(data.boardState)
      updateStatus()
    }

    // highlight message
    // if ("highlightFrom" in data && "highlightTo" in data) {
    //   highlightMove(data.highlightFrom, data.highlightTo);
    // }
  },
  false
)

function highlightMove (from, to, style) {
  console.log('hightlight!!!', from, to)
  $board.find('.' + squareClass).removeClass(style)
  if (from !== 'remove' || to !== 'remove') {
    if (from && to) {
      highlightFrom = from
      highlightTo = to
    }
    $board.find('.square-' + from).addClass(style)
    $board.find('.square-' + to).addClass(style)
  }
}

function flip () {
  board.flip()
}

function letParentKnow () {
  if (flag === false) {
    parent.postMessage('ReadyToRecieve', '*')
  }
  flag = true
}

function onDragStart (source, piece, position, orientation) {
  // if freeplay mode is off
  if (!freemoveFlag) {
    if (!playerColor) {
      console.log('Player color not set')
    }

    // if it's your turn
    if (playerColor && playerColor[0] == currentState.turn()) {
        // do not pick up pieces if the game is over
      if (isLesson == false) {
        if (currentState.game_over()) {
          sendGameOver()
          return false
        }
      }

      if (playerColor === 'black') {
        if (piece.search(/^w/) !== -1) return false
      } else if (playerColor === 'white') {
        if (piece.search(/^b/) !== -1) return false
      }

        // only pick up pieces for the side to move
      if (
          (currentState.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (currentState.turn() === 'b' && piece.search(/^w/) !== -1)
        ) {
        return false
      }

      sendPieceDrag(piece)
    }
  } else {
    return true
  }
}

function onDrop (source, target, draggedPieceSource) {
  removeGreySquares()
  sendPieceDrop()

  // if we're not in freeplay
  if (!freemoveFlag) {
    // if we're doing a puzzle, check if the move is correct
    if (nextPuzzleMove.length == 2) {
      // incorrect move, snapback
      if (source !== nextPuzzleMove[0] || target !== nextPuzzleMove[1]) {
        return 'snapback'
      }
      // correct move, clear the next expected move
      else { nextPuzzleMove = [] }
    }

    // see if the move is legal
    var move = currentState.move({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })

    // illegal move
    if (move === null) { return 'snapback' }
    // legal move
    else { sendMove(source, target) };

    if (isLesson == false) {
      if (currentState.game_over()) {
        sendGameOver()
      }
    }

    // move highlight
    highlightMove(source, target, 'lastmove')
    // move highlight of mentor/student
    sendLastMove(source, target)

    updateStatus()
    sendToParent(`piece-${draggedPieceSource}`)
    sendToParent(
      JSON.stringify({
        from: source,
        to: target
      })
    )
    sendToParent(`target:${move.to}`)
    sendToParent(currentState.fen())
  }
}
// To add possible move suggestion on chessboard
function onMouseoverSquare (square, piece) {
  if (playerColor && playerColor[0] == currentState.turn()) {
    // get list of possible moves for this square
    var moves = currentState.moves({
      square: square,
      verbose: true
    })

    // exit if there are no moves available for this square
    if (moves.length === 0) return

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
      greySquare(moves[i].to)
      sendGreySquare(moves[i].to)
    }
  }
}
// To remove possible move suggestion on chessboard
function onMouseoutSquare (square, piece) {
  removeGreySquares()
  sendRemoveGrey()
}

function sendToParent (fen) {
  parent.postMessage(fen, '*')
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(currentState.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'

  if (currentState.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (isLesson == false) {
    if (currentState.in_checkmate()) {
      status = 'Game over, ' + moveColor + ' is in checkmate.'
      sendCheckmate()
    }

    // draw?
    else if (currentState.in_draw()) {
      status = 'Game over, drawn position'
      sendDraw()
    }
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (currentState.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }

    if (currentState.game_over()) {
      if (currentState.in_check() && moveColor == 'Black') {
        parent.postMessage('won:white', '*')
      } else if (currentState.in_check() && moveColor == 'Black') {
        parent.postMessage('won:black', '*')
      } else {
        parent.postMessage('restart', '*')
      }
    }
  }
}

function sendGameOver () {
  parent.postMessage('gameOver', '*')
}

function sendDraw () {
  parent.postMessage('draw', '*')
}

function sendCheckmate () {
  parent.postMessage('checkmate', '*')
}

// chessboard arrows
var ChessboardArrows = function (
  id,
  RES_FACTOR = 2,
  COLOUR = 'rgb(0, 128,0,1)'
) {
  const NUM_SQUARES = 8
  var resFactor,
    colour,
    drawCanvas,
    drawContext,
    primaryCanvas,
    primaryContext,
    initialPoint,
    mouseDown

  resFactor = RES_FACTOR
  colour = COLOUR

  // drawing canvas
  drawCanvas = document.getElementById('drawing_canvas')
  drawContext = changeResolution(drawCanvas, resFactor)
  setContextStyle(drawContext)

  // primary canvas
  primaryCanvas = document.getElementById('primary_canvas')
  primaryContext = changeResolution(primaryCanvas, resFactor)
  setContextStyle(primaryContext)

  // setup mouse event callbacks
  var board = document.getElementById(id)
  board.addEventListener('mousedown', function (event) {
    onMouseDown(event)
  })
  board.addEventListener('mouseup', function (event) {
    onMouseUp(event)
  })
  board.addEventListener('mousemove', function (event) {
    onMouseMove(event)
  })
  board.addEventListener(
    'contextmenu',
    function (e) {
      e.preventDefault()
    },
    false
  )

  // initialise vars
  initialPoint = { x: null, y: null }
  finalPoint = { x: null, y: null }
  arrowWidth = 15
  mouseDown = false

  // source: https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
  function drawArrow (context, fromx, fromy, tox, toy, r) {
    var x_center = tox
    var y_center = toy
    var angle, x, y

    context.beginPath()

    angle = Math.atan2(toy - fromy, tox - fromx)
    x = r * Math.cos(angle) + x_center
    y = r * Math.sin(angle) + y_center

    context.moveTo(x, y)

    angle += (1 / 3) * (2 * Math.PI)
    x = r * Math.cos(angle) + x_center
    y = r * Math.sin(angle) + y_center

    context.lineTo(x, y)

    angle += (1 / 3) * (2 * Math.PI)
    x = r * Math.cos(angle) + x_center
    y = r * Math.sin(angle) + y_center

    context.lineTo(x, y)
    context.closePath()
    context.fill()
  }

  function getMousePos (canvas, evt) {
    var rect = canvas.getBoundingClientRect()
    return {
      x: Q(evt.clientX - rect.left),
      y: Q(evt.clientY - rect.top)
    }
  }

  function setContextStyle (context) {
    context.strokeStyle = context.fillStyle = colour
    context.lineJoin = 'butt'
  }

  function onMouseDown (event) {
    if (event.which == 3) {
      // right click
      mouseDown = true
      initialPoint = finalPoint = getMousePos(drawCanvas, event)
      drawCircle(
        drawContext,
        initialPoint.x,
        initialPoint.y,
        primaryCanvas.width / (resFactor * NUM_SQUARES * 2) - 1
      )
    }
  }

  function onMouseUp (event) {
    if (event.which == 3) {
      // right click
      mouseDown = false
      // if starting position == ending position, draw a circle to primary canvas
      if (initialPoint.x == finalPoint.x && initialPoint.y == finalPoint.y) {
        drawCircle(
          primaryContext,
          initialPoint.x,
          initialPoint.y,
          primaryCanvas.width / (resFactor * NUM_SQUARES * 2) - 1
        ) // reduce radius of square by 1px
      }
      // otherwise draw an arrow
      else {
        drawArrowToCanvas(primaryContext)
      }
      drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height)
    } else if (event.which == 1) {
      // left click
      // clear canvases
      drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height)
      primaryContext.clearRect(0, 0, primaryCanvas.width, primaryCanvas.height)
    }
  }

  function onMouseMove (event) {
    finalPoint = getMousePos(drawCanvas, event)

    if (!mouseDown) return
    if (initialPoint.x == finalPoint.x && initialPoint.y == finalPoint.y) { return }

    drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height)
    drawArrowToCanvas(drawContext)
  }

  function drawArrowToCanvas (context) {
    // offset finalPoint so the arrow head hits the center of the square
    var xFactor, yFactor, offsetSize
    if (finalPoint.x == initialPoint.x) {
      yFactor = Math.sign(finalPoint.y - initialPoint.y) * arrowWidth
      xFactor = 0
    } else if (finalPoint.y == initialPoint.y) {
      xFactor = Math.sign(finalPoint.x - initialPoint.x) * arrowWidth
      yFactor = 0
    } else {
      // find delta x and delta y to achieve hypotenuse of arrowWidth
      slope_mag = Math.abs(
        (finalPoint.y - initialPoint.y) / (finalPoint.x - initialPoint.x)
      )
      xFactor =
        (Math.sign(finalPoint.x - initialPoint.x) * arrowWidth) /
        Math.sqrt(1 + Math.pow(slope_mag, 2))
      yFactor =
        Math.sign(finalPoint.y - initialPoint.y) *
        Math.abs(xFactor) *
        slope_mag
    }

    // draw line
    context.beginPath()
    context.lineCap = 'round'
    context.lineWidth = 8
    context.moveTo(initialPoint.x, initialPoint.y)
    context.lineTo(finalPoint.x - xFactor, finalPoint.y - yFactor)
    context.stroke()

    // draw arrow head
    drawArrow(
      context,
      initialPoint.x,
      initialPoint.y,
      finalPoint.x - xFactor,
      finalPoint.y - yFactor,
      arrowWidth
    )
  }

  function Q (x, d) {
    // mid-tread quantiser
    d = primaryCanvas.width / (resFactor * NUM_SQUARES)
    return d * (Math.floor(x / d) + 0.5)
  }

  function drawCircle (context, x, y, r) {
    context.beginPath()
    context.lineWidth = 4
    context.arc(x, y, r, 0, 2 * Math.PI)
    context.stroke()
  }

  // source: https://stackoverflow.com/questions/14488849/higher-dpi-graphics-with-html5-canvas
  function changeResolution (canvas, scaleFactor) {
    // Set up CSS size.
    canvas.style.width = canvas.style.width || canvas.width + 'px'
    canvas.style.height = canvas.style.height || canvas.height + 'px'

    // Resize canvas and scale future draws.
    canvas.width = Math.ceil(canvas.width * scaleFactor)
    canvas.height = Math.ceil(canvas.height * scaleFactor)
    var ctx = canvas.getContext('2d')
    ctx.scale(scaleFactor, scaleFactor)
    return ctx
  }
}
var config = {
  draggable: true,
  showNotation: true,
  position: 'start',
  orientation: 'white',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
}

if (isLesson == false) {
  board = Chessboard('myBoard', config)
  // var overlay = new ChessboardArrows('board_wrapper');
}

$(window).resize(board.resize)

updateStatus()
