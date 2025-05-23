import React from "react"

export default function MoveTracker({ moves }) {

    const moveElements = null

    if (moves) {
        moveElements = moves.map((move, index) => <li key={index}>{move}</li>)
    }
    return <>
        <ol>
            {moveElements}
        </ol>
    </>
}