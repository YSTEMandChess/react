const UserBadges = require("../models/UserBadges");
const { BADGE_CATALOG } = require("./catalog");

async function getEarned(userId) {
  const doc = await UserBadges.findOne({ userId });
  return doc?.earned || [];
}

async function awardIfEligible(userId, predicates) {
  const doc = await UserBadges.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, earned: [] } },
    { new: true, upsert: true }
  );

  const alreadyEarned = new Set(doc.earned.map(e => e.badgeId));
  const newlyAwarded = [];

  for (const badge of BADGE_CATALOG) {
    const { id, criteria } = badge;
    const current = predicates[criteria.type] || 0;
    const meets = criteria.value ? current >= criteria.value : current > 0;

    if (meets && !alreadyEarned.has(id)) {
      doc.earned.push({
        badgeId: id,
        earnedAt: new Date(),
        meta: { at: current }
      });
      newlyAwarded.push(id);
    }
  }

  if (newlyAwarded.length) await doc.save();
  return newlyAwarded;
}

module.exports = {
  getEarned,
  awardIfEligible
};
