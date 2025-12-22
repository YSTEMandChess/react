/**
 * Activity Names Utility
 * 
 * Provides utilities for converting activity identifiers to display names.
 * Maps internal activity IDs (camelCase) to user-friendly display strings.
 * 
 * Used by the Activities Modal to show readable activity names to users.
 */

/**
 * Type definition for an activity object
 */
type Activity = {
    name: string,      // Activity identifier (e.g., 'captureQueen')
    type: string,      // Activity category (e.g., 'puzzle', 'lesson')
    completed: boolean // Whether the activity is completed
}

/**
 * Mapping of activity IDs to their display names
 * 
 * Internal IDs are in camelCase format (e.g., 'captureQueen')
 * Display names are user-friendly strings (e.g., 'Capture a Queen')
 */
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

/**
 * Converts an array of activity objects to an array of display names
 * 
 * Takes activity objects with internal IDs and returns user-friendly names.
 * If an activity ID is not found in the mapping, uses the original name.
 * 
 * @param {Array<Activity>} names - Array of activity objects
 * @returns {Array<string>} Array of display names for the activities
 */
export const parseActivities = (names: Array<Activity>): Array<string> => {
    const namesArray = names.map((activity) => activityNameMap[activity.name] || activity.name);
    return namesArray;
    // TODO: Consider making API call to fetch display names dynamically
}
