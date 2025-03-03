import React from "react";
import "./Puzzles.scss";

// URL of the chess client (chessboard) hosted on apache
const chessClientURL = "http://localhost:80";

function Puzzles() {
    return (
        <div id="mainElements">
        
            <iframe src={chessClientURL}></iframe>

            <div id="hintMenu">
                <button id="newPuzzle">Get New Puzzle</button>
                <button id='openDialog'>Show Hint</button>
                <p id="hint-text">Hints will show here</p>
            </div>
        
        </div>
    );
}

export default Puzzles