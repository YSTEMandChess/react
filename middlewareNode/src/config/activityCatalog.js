/**
 * Activity Catalog
 *
 * Single source of truth for daily activity identity and navigation data.
 * Maps internal activity names (as stored in the `activities` collection)
 * to a stable taskId, a display name, and the frontend route a student
 * should be sent to in order to complete that activity.
 *
 * Owned by the backend so a route/URL change is a data update here,
 * not a synchronized change across backend and frontend.
 */

const activityCatalog = {
  captureQueen: {
    taskId: "captureQueen",
    displayName: "Capture a Queen",
    route: "/puzzles/capture-queen",
  },
  captureRook: {
    taskId: "captureRook",
    displayName: "Capture a Rook",
    route: "/puzzles/capture-rook",
  },
  captureKnight: {
    taskId: "captureKnight",
    displayName: "Capture a Knight",
    route: "/puzzles/capture-knight",
  },
  captureBishop: {
    taskId: "captureBishop",
    displayName: "Capture a Bishop",
    route: "/puzzles/capture-bishop",
  },
  capturePawn: {
    taskId: "capturePawn",
    displayName: "Capture a Pawn",
    route: "/puzzles/capture-pawn",
  },
  performCastle: {
    taskId: "performCastle",
    displayName: "Perform a Castle",
    route: "/puzzles/perform-castle",
  },
  playMatch: {
    taskId: "playMatch",
    displayName: "Play a Match",
    route: "/play",
  },
  attendSession: {
    taskId: "attendSession",
    displayName: "Attend a Session",
    route: "/mentor/sessions",
  },
};

/**
 * Looks up catalog data for an activity name.
 * Falls back to a generic entry if the name isn't recognized, so unknown
 * activities still get a usable (if imperfect) taskId/route instead of
 * undefined values reaching the frontend.
 */
function getActivityCatalogEntry(name) {
  return (
    activityCatalog[name] || {
      taskId: name,
      displayName: name,
      route: "/dashboard",
    }
  );
}

module.exports = { activityCatalog, getActivityCatalogEntry };
