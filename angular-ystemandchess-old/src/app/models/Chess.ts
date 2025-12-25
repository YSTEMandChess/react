/**
 * Chess Model Class (Angular)
 * 
 * Manages communication between the Angular application and the embedded
 * chess client iframe. Handles game initialization, move coordination,
 * and lesson completion detection.
 * 
 * @deprecated This is part of the old Angular application. The project
 * is migrating to React (see react-ystemandchess directory).
 */

import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

export class Chess {
  stopTheGameFlag: boolean;
  color: string;
  chessBoard;

  /**
   * Creates a new Chess instance
   * @param frameId - HTML iframe element ID containing the chess client
   * @param isLesson - Whether this is a lesson or free play
   */
  constructor(private frameId: string, private isLesson: boolean) {
    this.preGame();
  }

  /**
   * Sets up iframe communication listener
   * Listens for messages from the chess client iframe via postMessage API
   */
  private preGame() {
    // Cross-browser event listener compatibility
    var eventMethod = window.addEventListener
      ? 'addEventListener'
      : 'attachEvent';
    var eventer = window[eventMethod];
    var messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message';

    // Listen to messages from child iframe (chess client)
    eventer(
      messageEvent,
      (e) => {
        // Get reference to the chess client iframe window
        this.chessBoard = (<HTMLFrameElement>(
          document.getElementById(this.frameId)
        )).contentWindow;
        
        // Ignore object messages (only process strings)
        if (typeof e.data === 'object') return;

        // Check if data is a FEN string (contains '/')
        const isDataAFen = e.data.indexOf('/') > -1;
        
        // Transform and send the board state back to chess client
        const info = this.dataTransform(e.data);
        const msg = this.createAmessage(info, this.color);
        this.chessBoard.postMessage(msg, environment.urls.chessClientURL);
        
        // Check for lesson completion (no pawns left in FEN)
        if (e.data.indexOf('p') === -1 && isDataAFen) {
          setTimeout(() => {
            Swal.fire('Lesson completed', 'Good Job', 'success');
            this.newGameInit('8/8/8/8/8/8/8/8 w - - 0 1'); // Reset to empty board
          }, 200);
        }
      },

      false
    );
  }

  /**
   * Initializes a new chess game with a specific position
   * @param FEN - Chess position in FEN notation
   * @param color - Optional player color (white or black)
   */
  public newGameInit(FEN: string, color? : string) {
    this.stopTheGameFlag = false;
    
    // Set player color if provided
    if (color){
      this.color = color;  
    }
    
    // Create and send initialization message to chess client
    const msg = this.createAmessage(FEN, this.color);
    this.chessBoard.postMessage(msg, environment.urls.chessClientURL);
    
    // Clear any previous move highlights for fresh board state
    this.chessBoard.postMessage(
      JSON.stringify({
        highlightFrom: "remove",
        highlightTo: "remove"
      }),
      environment.urls.chessClientURL
    );
  }

  /**
   * Transforms chess board data into proper FEN format
   * Normalizes FEN strings for consistency
   * @param data - Raw data from chess client
   * @returns Normalized FEN string
   */
  private dataTransform(data) {
    // Initialize with empty board if client is ready
    if (data === 'ReadyToRecieve') data = '8/8/8/8/8/8/8/8 w - - 0 1';
    
    // Normalize FEN string: force white to move, reset castling and en passant
    if (data.split('/')[7]) {
      let laststring = data.split('/')[7].split(' ');
      laststring[1] = 'w';  // Active color: white
      laststring[2] = '-';  // Castling availability: none
      laststring[3] = '-';  // En passant target square: none
      laststring[4] = '0';  // Halfmove clock: 0
      laststring[5] = '1';  // Fullmove number: 1
      laststring = laststring.join(' ');
      let tranfomed = data.split('/');
      tranfomed[7] = laststring;
      return tranfomed.join('/');
    }
    return data;
  }

  /**
   * Creates a JSON message for the chess client iframe
   * @param fen - Chess position in FEN notation
   * @param color - Player color (white or black)
   * @returns JSON string with board state, color, and lesson flag
   */
  private createAmessage(fen: String, color: string) {
    return JSON.stringify({
      boardState: fen,
      color: color,
      lessonFlag: this.isLesson,
    });
  }
}
