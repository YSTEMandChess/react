import React from 'react';
import styles from "./Lessons.module.scss";

export default function PromotionPopup({ position=null, promoteToPiece = (position: any, piece) => {console.log(piece)}, }) { 
    // This component is a placeholder for the PromotionPopup functionality.
    // It can be expanded later to include specific logic related to pawn promotion in chess.

    function handlePromotion(position: any, piece) {
        promoteToPiece(position, piece);
    }

    return (
        <div className={styles.promotionPopup}>
            <h2>Pawn Promotion</h2>
            <p>Select a piece to promote your pawn:</p>
            <div className={styles.promotionOptions}>
                <button className={styles.promotionOption} onClick={() => handlePromotion(position, "Q")}>Queen</button>
                <button className={styles.promotionOption} onClick={() => handlePromotion(position, "R")}>Rook</button>
                <button className={styles.promotionOption} onClick={() => handlePromotion(position, "B")}>Bishop</button>
                <button className={styles.promotionOption} onClick={() => handlePromotion(position, "N")}>Knight</button>
            </div>
        </div>
    );
}