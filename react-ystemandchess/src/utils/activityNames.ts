type Activity = {
    name: string,
    type: string,
    completed: boolean
}

const activityNameMap: Record<string, string> = {
    captureQueen: "Capture a Queen",
    captureRook: "Capture a Rook",
    captureKnight: "Capture a Knight",
    captureBishop: "Capture a Bishop",
    capturePawn: "Capture a Pawn",
    performCastle: "Perform a Castle",
    playMatch: "Play a Match",
    attendSession: "Attend a Session"
}


export const parseActivities = (names: Array<Activity>): Array<string> => {
    const namesArray = names.map((activity) => activityNameMap[activity.name] || activity.name);
    return namesArray;
    //make api call to send array of activity names, get array back and use map() to convert display names
}
