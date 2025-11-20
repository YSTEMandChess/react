/**
 * Badge Catalog
 * 
 * Defines all available badges/achievements in the platform.
 * Each badge has criteria that users must meet to earn it.
 * 
 * Badge Types:
 * - lesson_completed: Based on number of lessons finished
 * - streak: Based on consecutive days of activity
 * - activities_days: Based on total days with activities completed
 * 
 * Used by the badge service to check eligibility and award badges to users.
 */

const BADGE_CATALOG = [
  {
    id: "first_lesson",
    name: "First Lesson",
    description: "Completed your first lesson",
    icon: "/img/badges/first_lesson.svg",
    criteria: { type: "lesson_completed", value: 1 },
  },
  {
    id: "streak_5",
    name: "On a Roll",
    description: "Maintain a 5-day streak",
    icon: "/img/badges/streak_5.svg",
    criteria: { type: "streak", value: 5 },
  },
  {
    id: "streak_10",
    name: "Blazing",
    description: "Maintain a 10-day streak",
    icon: "/img/badges/streak_10.svg",
    criteria: { type: "streak", value: 10 },
  },
  {
    id: "activities_10",
    name: "Persistent",
    description: "10 days of activities completed",
    icon: "/img/badges/activities_10.svg",
    criteria: { type: "activities_days", value: 10 },
  }
];

module.exports = { BADGE_CATALOG };
