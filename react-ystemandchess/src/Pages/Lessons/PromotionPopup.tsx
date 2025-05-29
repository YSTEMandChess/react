import React from 'react';

export default function PromotionPopup({ position=null, promoteToPiece = (position: any, piece) => {console.log(piece)}, }) { 
    // This component is a placeholder for the PromotionPopup functionality.
    // It can be expanded later to include specific logic related to pawn promotion in chess.

    function handlePromotion(position: any, piece) {
        promoteToPiece(position, piece);
    }

    return (
        <div className="promotion-popup">
            <h2>Pawn Promotion</h2>
            <p>Select a piece to promote your pawn:</p>
            <div className="promotion-options">
                <button className="promotion-option" onClick={() => handlePromotion(position, "Q")}>Queen</button>
                <button className="promotion-option" onClick={() => handlePromotion(position, "R")}>Rook</button>
                <button className="promotion-option" onClick={() => handlePromotion(position, "B")}>Bishop</button>
                <button className="promotion-option" onClick={() => handlePromotion(position, "N")}>Knight</button>
            </div>
        </div>
    );
}