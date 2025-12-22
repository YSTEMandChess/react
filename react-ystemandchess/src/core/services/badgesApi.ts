/**
 * Badges API Service
 * 
 * Provides functions to interact with the badges API endpoints.
 * Handles fetching badge catalog and user's earned badges.
 * 
 * Functions:
 * - getBadgeCatalog: Fetches all available badges
 * - getUserBadges: Fetches badges earned by a specific user
 */

import { environment } from "../../environments/environment";
/**
 * Fetches the complete catalog of all available badges
 * 
 * @returns {Promise<Array>} Array of badge objects with id, name, description, icon, criteria
 * @throws {Error} If the API request fails
 */
export async function getBadgeCatalog() {
  const res = await fetch(`${environment.urls.middlewareURL}/badges/catalog`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch badge catalog");
  return (await res.json()).badges;
}

/**
 * Fetches all badges earned by a specific user
 * 
 * @param {string} userId - User's unique identifier
 * @returns {Promise<Array>} Array of earned badge objects with badgeId, earnedAt, meta
 * @throws {Error} If the API request fails
 */
export async function getUserBadges(userId: string) {
  const res = await fetch(`${environment.urls.middlewareURL}/badges/${userId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch earned badges");
  return (await res.json()).earned;
}
