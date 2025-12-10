import React from "react"
import pageStyles from '../lesson-overlay/Lesson-overlay.module.scss';

export default function MoveTracker({ moves=[] }) {

    let moveElements = []

    let count = 0
    for (let i = 0; i < moves.length; i += 2) {
        count += 1
        moveElements.push(
            <div key={i} className={pageStyles.moveItem}>
                <div>{`${count}.`}</div>
                <div className="move">{moves[i]}</div>
                {(i+1) <= moves.length - 1 ? <div className={pageStyles.move}>{moves[i+1]}</div> : null}
            </div>
        )
    }

    return (
    <> 
        <div className={pageStyles.moveList}>
            <div className={pageStyles.moveTitle}>Moves</div>
            {moveElements.length === 0 ? <p>Make a move to see it here!</p> : moveElements}
        </div>
    </>
    )
}