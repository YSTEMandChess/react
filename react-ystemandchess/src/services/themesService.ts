/**
 * Chess Themes Service
 * 
 * This service provides mappings for chess puzzle and game themes,
 * including human-readable names and detailed descriptions for each theme.
 * Used throughout the application for chess puzzles, lessons, and educational content.
 */

/**
 * Mapping of chess theme keys to their display names
 * 
 * This object provides human-readable names for chess themes used in
 * puzzles, lessons, and educational content. The keys correspond to
 * internal theme identifiers, while values are user-friendly names.
 * 
 * Theme Categories:
 * - Checkmate patterns (mate, mateIn1, mateIn2, mateIn3)
 * - Game phases (opening, middlegame, endgame)
 * - Tactical patterns (fork, pin, skewer, etc.)
 * - Special moves (castling, enPassant, promotion)
 * - Strategic concepts (advantage, equality, zugzwang)
 * - Puzzle difficulty (short, long, veryLong)
 */
export const themesName = {
    // Checkmate-related themes
    "mate": "Checkmate",                    // Direct checkmate puzzles
    "mateIn1": "Mate in 1",                // One-move checkmate puzzles
    "mateIn2": "Mate in 2",                // Two-move checkmate sequences
    "mateIn3": "Mate in 3",                // Three-move checkmate sequences
    
    // Game phase themes
    "middlegame": "Middlegame",            // Middle game position puzzles
    "endgame": "Endgame",                  // End game position puzzles
    "opening": "Opening",                  // Opening position puzzles
    
    // Positional and strategic themes
    "advantage": "Advantage",              // Gaining material or positional advantage
    "crushing": "Crushing",                // Decisive tactical blows
    "equality": "Equality",                // Achieving balanced positions
    
    // Tactical pattern themes
    "fork": "Fork",                        // Attacking multiple pieces simultaneously
    "pin": "Pin",                          // Restricting piece movement
    "skewer": "Skewer",                    // Forcing valuable piece to move
    "discoveredAttack": "Discovered Attack", // Revealing attacks by moving pieces
    "deflection": "Deflection",            // Forcing pieces away from defense
    "sacrifice": "Sacrifice",              // Giving up material for advantage
    
    // Special move themes
    "promotion": "Promotion",              // Pawn promotion puzzles
    "underPromotion": "Under Promotion",   // Promoting to pieces other than queen
    "castling": "Castling",                // Using the castling move effectively
    "enPassant": "En Passant",             // En passant capture puzzles
    
    // Attack pattern themes
    "kingsideAttack": "Kingside Attack",   // Attacking the opponent's kingside
    "queensideAttack": "Queenside Attack", // Attacking the opponent's queenside
    "defensiveMove": "Defensive Move",     // Defensive tactical solutions
    
    // Advanced tactical themes
    "clearance": "Clearance",              // Clearing squares or lines for pieces
    "interference": "Interference",        // Blocking opponent's piece coordination
    "intermezzo": "Intermezzo",            // In-between moves in sequences
    "zugzwang": "Zugzwang",                // Positions where any move worsens position
    
    // Game quality and source themes
    "master": "Master Game",               // Puzzles from master-level games
    "masterVsMaster": "Master vs Master",  // Puzzles from games between masters
    
    // Puzzle length and difficulty themes
    "short": "Short Puzzle",               // Quick, simple puzzles
    "long": "Long Puzzle",                 // Multi-move puzzle sequences
    "veryLong": "Very Long Puzzle",        // Extended puzzle sequences
    "oneMove": "One Move",                 // Single-move solution puzzles
    
    // Endgame-specific themes
    "advancedPawn": "Advanced Pawn",       // Advanced pawn endgame techniques
    "pawnEndgame": "Pawn Endgame"          // Pawn endgame-specific puzzles
};

/**
 * Detailed descriptions for each chess theme
 * 
 * This object provides comprehensive descriptions for each chess theme,
 * used for educational purposes, tooltips, and help text throughout
 * the application. Each description explains what the theme involves
 * and what the player should look for or accomplish.
 * 
 * These descriptions are used in:
 * - Puzzle selection interfaces
 * - Educational tooltips
 * - Help documentation
 * - Theme-based filtering explanations
 */
export const themesDescription = {
    // Checkmate pattern descriptions
    "mate": "Deliver checkmate to win the game immediately.",
    "mateIn1": "Find the move that delivers checkmate in one move.",
    "mateIn2": "Find the sequence that leads to checkmate in two moves.",
    "mateIn3": "Find the sequence that leads to checkmate in three moves.",
    
    // Game phase descriptions
    "middlegame": "A puzzle from the middle phase of the game.",
    "endgame": "A puzzle from the final phase of the game.",
    "opening": "A puzzle from the opening phase of the game.",
    
    // Strategic and positional descriptions
    "advantage": "Gain a significant advantage over your opponent.",
    "crushing": "Deliver a crushing blow to your opponent's position.",
    "equality": "Achieve an equal position.",
    
    // Tactical pattern descriptions
    "fork": "Attack two or more pieces simultaneously.",
    "pin": "Restrict an opponent's piece from moving.",
    "skewer": "Force a valuable piece to move and capture a less valuable piece behind it.",
    "discoveredAttack": "Move one piece to reveal an attack from another piece.",
    "deflection": "Force an opponent's piece away from defending something important.",
    "sacrifice": "Give up material to gain a positional or tactical advantage.",
    
    // Special move descriptions
    "promotion": "Promote a pawn to a more powerful piece.",
    "underPromotion": "Promote a pawn to something other than a queen.",
    "castling": "Use the special castling move.",
    "enPassant": "Use the special en passant capture.",
    
    // Attack pattern descriptions
    "kingsideAttack": "Launch an attack on the opponent's kingside.",
    "queensideAttack": "Launch an attack on the opponent's queenside.",
    "defensiveMove": "Make a defensive move to protect your position.",
    
    // Advanced tactical descriptions
    "clearance": "Clear a square or line for another piece.",
    "interference": "Block an opponent's piece from defending.",
    "intermezzo": "Play an in-between move before the expected continuation.",
    "zugzwang": "Put your opponent in a position where any move worsens their position.",
    
    // Game source descriptions
    "master": "A puzzle from a master-level game.",
    "masterVsMaster": "A puzzle from a game between masters.",
    
    // Puzzle difficulty descriptions
    "short": "A puzzle that can be solved quickly.",
    "long": "A puzzle that requires several moves to solve.",
    "veryLong": "A puzzle that requires many moves to solve.",
    "oneMove": "A puzzle that can be solved in one move.",
    
    // Endgame-specific descriptions
    "advancedPawn": "Use an advanced pawn effectively.",
    "pawnEndgame": "A puzzle focusing on pawn endgame technique."
};