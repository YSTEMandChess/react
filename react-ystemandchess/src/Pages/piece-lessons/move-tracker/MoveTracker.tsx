import React from "react"

export default function MoveTracker({ moves=[] }) {

    let moveElements = []

    let count = 0
    for (let i = 0; i < moves.length; i += 2) {
        count += 1
        moveElements.push(
            <div key={i} className="move-item">
                <div>{`${count}.`}</div>
                <div className="move">{moves[i]}</div>
                {(i+1) <= moves.length - 1 ? <div className="move">{moves[i+1]}</div> : null}
            </div>
        )
    }

    return (
    <> 
        <div className="move-list">
            <div className="move-title">Moves</div>
            {moveElements.length === 0 ? <p>Make a move to see it here!</p> : moveElements}
        </div>
    </>
    )
}