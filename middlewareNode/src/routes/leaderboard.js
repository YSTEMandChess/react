const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
const config = require("config");

let cachedClient = null;

async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(config.get("mongoURI"));
    await cachedClient.connect();
  }
  return cachedClient.db("ystem");
}

// 1. NEW: Fetch distinct, dynamic list of schools directly from the database
router.get("/schools", async (req, res) => {
  try {
    const db = await getDb();
    const users = db.collection("users");
    // Get all unique schools, filtering out empty or null values
    const distinctSchools = await users.distinct("school", { school: { $nin: ["", null] } });
    res.json({ success: true, schools: distinctSchools });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// 2. UPDATED: Main Leaderboard Route with Search, Sort, and Offset Pagination
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const leaderboardCollection = db.collection("leaderboards");

    const { school, search, sortBy = "score", sortDir = "desc", page = 1, limit = 10 } = req.query;
    
    // Setup Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Filter by School
    const profileMatch = {};
    if (school && school !== "All Schools") {
      profileMatch["userProfile.school"] = school;
    }

    // Search by Name
    const rootMatch = {};
    if (search) {
      rootMatch.username = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Dynamic Sorting (Name alphabetically or Score high/low)
    const sortStage = {};
    const direction = sortDir === "asc" ? 1 : -1;
    if (sortBy === "name") {
        sortStage["username"] = direction;
    } else {
        sortStage["score"] = direction;
        sortStage["_id"] = 1; // Tie breaker
    }

    // Mongoose Aggregation Pipeline
    const pipeline = [
      { $match: rootMatch },
      {
        $lookup: {
          from: "users",
          localField: "username",
          foreignField: "username",
          as: "userProfile"
        }
      },
      {
        $unwind: {
          path: "$userProfile",
          preserveNullAndEmptyArrays: true
        }
      },
      { $match: Object.keys(profileMatch).length > 0 ? profileMatch : {} },
      { $sort: sortStage },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                username: "$username",
                score: 1,
                // Check new profile first, fallback to old leaderboard data, then N/A
                school: { $ifNull: ["$userProfile.school", { $ifNull: ["$school", "N/A"] }] },
                avatar_url: { $ifNull: ["$userProfile.avatar_url", null] }
              }
            }
          ],
          totalCount: [{ $count: "count" }]
        }
      }
    ];

    const results = await leaderboardCollection.aggregate(pipeline).toArray();
    const data = results[0]?.data || [];
    const total = results[0]?.totalCount[0]?.count || 0;

    // Map and assign true rank based on pagination skip
    const formattedLeaderboard = data.map((row, index) => ({
      id: row._id,
      username: row.username,
      school_name: row.school,
      score: row.score,
      avatar_url: row.avatar_url,
      rank: skip + index + 1
    }));

    return res.status(200).json({
      success: true,
      data: {
        leaderboard: formattedLeaderboard,
        pagination: {
          has_more: skip + data.length < total,
          total: total
        }
      }
    });

  } catch (error) {
    console.error("Leaderboard API Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
