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

// Routes must match real entries in react-ystemandchess/src/AppRoutes.tsx —
// there is no per-puzzle deep link today, so all puzzle-type activities land
// on the flat /puzzles page (same granularity the frontend's own type-based
// routing used before this catalog existed).
const activityCatalog = {
  captureQueen: {
    taskId: "captureQueen",
    displayName: "Capture a Queen",
    route: "/puzzles",
  },
  captureRook: {
    taskId: "captureRook",
    displayName: "Capture a Rook",
    route: "/puzzles",
  },
  captureKnight: {
    taskId: "captureKnight",
    displayName: "Capture a Knight",
    route: "/puzzles",
  },
  captureBishop: {
    taskId: "captureBishop",
    displayName: "Capture a Bishop",
    route: "/puzzles",
  },
  capturePawn: {
    taskId: "capturePawn",
    displayName: "Capture a Pawn",
    route: "/puzzles",
  },
  performCastle: {
    taskId: "performCastle",
    displayName: "Perform a Castle",
    route: "/puzzles",
  },
  playMatch: {
    taskId: "playMatch",
    displayName: "Play a Match",
    route: "/play",
  },
  attendSession: {
    taskId: "attendSession",
    displayName: "Attend a Session",
    route: "/mentor",
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
      route: "/student",
    }
  );
}

module.exports = { activityCatalog, getActivityCatalogEntry };
