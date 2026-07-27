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

    // 2. Build the dynamic query object for filtering
    const query = {};

    // Exact string match for school (based on your DB schema)
    if (school) {
      query.school = school;
    }
    
    // Note: If state and country are added to the leaderboards collection later,
    // you can uncomment these lines:
    // if (state) query.state = state;
    // if (country) query.country = country;

    // 3. Handle Cursor-Based Pagination
    if (cursor) {
      // Decode the base64 cursor string (format: "score_id")
      const decodedCursor = Buffer.from(cursor, "base64").toString("ascii");
      const [cursorScore, cursorId] = decodedCursor.split("_");

      // Find records with lower scores, OR equal scores but a higher ObjectId (to safely break ties)
      query.$or = [
        { score: { $lt: parseInt(cursorScore, 10) } },
        {
          score: parseInt(cursorScore, 10),
          _id: { $gt: new ObjectId(cursorId) }
        }
      ];
    }

    // 4. Execute query with Sort
    // Sort by highest score first (-1), break ties by older _id (1)
    // Fetch limit + 1 to determine if there is a next page
    const results = await leaderboardCollection
      .find(query)
      .sort({ score: -1, _id: 1 }) 
      .limit(parsedLimit + 1)
      .toArray();

    // 5. Determine if there is a next page & generate the next token
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

    // 6. Map the MongoDB documents to the frontend JSON contract
    const formattedLeaderboard = results.map((row) => ({
      id: row._id,
      username: row.username,
      school_name: row.school,
      score: row.score,
      // Fallback for avatar_url until a dedicated profile collection is joined
      avatar_url: row.avatar_url || null 
    }));

    // 7. Send successful response
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