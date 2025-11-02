import { environment } from "../environments/environment";

// fetch all available badges
export async function getBadgeCatalog() {
  const res = await fetch(`${environment.urls.middlewareURL}/badges/catalog`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch badge catalog");
  return (await res.json()).badges;
}

// fetch earned badges for a user
export async function getUserBadges(userId: string) {
  const res = await fetch(`${environment.urls.middlewareURL}/badges/${userId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch earned badges");
  return (await res.json()).earned;
}
