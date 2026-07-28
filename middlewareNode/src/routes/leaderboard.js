const express = require("express");
const router = express.Router();
const { MongoClient, ObjectId } = require("mongodb");
const config = require("config");
require("dotenv").config();

// Cache database client to prevent repeated connections
let cachedClient = null;

/**
 * Gets database client, creating connection if needed
 * @returns {import('mongodb').Db} Database instance
 */
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(config.get("mongoURI"));
    await cachedClient.connect();
  }
  return cachedClient.db("ystem");
}

/**
 * GET /
 * Fetches paginated leaderboard data with dynamic filters.
 * (Note: If this router is mounted at /api/v1/gamification, the endpoint becomes /api/v1/gamification/leaderboard)
 */
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const leaderboardCollection = db.collection("leaderboards");

    // 1. Extract query parameters from frontend request
    const { school, state, country, limit = 10, cursor } = req.query;
    const parsedLimit = parseInt(limit, 10);

    // 2. Build the dynamic query object for root filtering (cursor)
    const rootMatch = {};

    // 3. Handle Cursor-Based Pagination
    if (cursor) {
      // Decode the base64 cursor string (format: "score_id")
      const decodedCursor = Buffer.from(cursor, "base64").toString("ascii");
      const [cursorScore, cursorId] = decodedCursor.split("_");

      // Find records with lower scores, OR equal scores but a higher ObjectId (to safely break ties)
      rootMatch.$or = [
        { score: { $lt: parseInt(cursorScore, 10) } },
        {
          score: parseInt(cursorScore, 10),
          _id: { $gt: new ObjectId(cursorId) }
        }
      ];
    }

    // 4. Build profile filter match (for dynamically joined user data)
    const profileMatch = {};
    if (school && school !== "School") {
      // Fallback: match school on leaderboard doc OR joined user doc
      profileMatch.$or = [{ school: school }, { "userProfile.school": school }];
    }
    if (state && state !== "State") {
      profileMatch["userProfile.state"] = state;
    }
    if (country && country !== "Country") {
      profileMatch["userProfile.country"] = country;
    }

    // 5. Execute Mongoose Aggregation Pipeline to join users collection
    const pipeline = [
      { $match: rootMatch },
      {
        $lookup: {
          from: "users",
          localField: "username", // Joining on username
          foreignField: "username",
          as: "userProfile"
        }
      },
      {
        $unwind: {
          path: "$userProfile",
          preserveNullAndEmptyArrays: true // Keep leaderboards even if user profile is missing
        }
      },
      { $match: Object.keys(profileMatch).length > 0 ? profileMatch : {} },
      { $sort: { score: -1, _id: 1 } },
      { $limit: parsedLimit + 1 }
    ];

    const results = await leaderboardCollection.aggregate(pipeline).toArray();

    // 6. Determine if there is a next page & generate the next token
    const hasMore = results.length > parsedLimit;
    if (hasMore) {
      results.pop(); // Remove the extra item so we only return the exact limit
    }

    let nextCursor = null;
    if (results.length > 0 && hasMore) {
      const lastItem = results[results.length - 1];
      // Encode the last item's score and ID into a base64 string for the frontend
      nextCursor = Buffer.from(`${lastItem.score}_${lastItem._id}`).toString("base64");
    }

    // 7. Map the MongoDB documents to the frontend JSON contract
    const formattedLeaderboard = results.map((row) => ({
      id: row._id,
      username: row.username,
      // Favor the user collection's school, fallback to leaderboard's school
      school_name: row.userProfile?.school || row.school || "N/A",
      score: row.score,
      // Pull avatar directly from the joined user profile
      avatar_url: row.userProfile?.avatar_url || null 
    }));

    // 8. Send successful response
    return res.status(200).json({
      success: true,
      data: {
        leaderboard: formattedLeaderboard,
        pagination: {
          has_more: hasMore,
          next_cursor: nextCursor
        }
      }
    });

  } catch (error) {
    console.error("Leaderboard API Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
});

module.exports = router;
