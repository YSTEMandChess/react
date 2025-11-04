/**
 * Badges Modal Component
 * 
 * Displays a modal showing all available badges and which ones the user has earned.
 * Fetches badge catalog and user's earned badges from the API.
 * Earned badges are displayed in color, unearned badges are grayed out.
 * 
 * Features:
 * - Fetches badge catalog and user's earned badges
 * - Visual distinction between earned and unearned badges
 * - Badge details including name, description, and icon
 * - Loading state while fetching data
 * - Click outside to close functionality
 */

import React, { useEffect, useState, useMemo } from "react";
import "./BadgesModal.scss";
import { getBadgeCatalog, getUserBadges } from "../../../services/badgesApi";

/**
 * BadgesModal component - displays user's badge achievements
 * @param {Function} onClose - Callback to close the modal
 */
const BadgesModal = ({ onClose }: { onClose: () => void }) => {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [badges, earned] = await Promise.all([
          getBadgeCatalog(),
          getUserBadges("teststudent") // replace with dynamic userId later if needed
        ]);
        setCatalog(badges);
        setEarnedIds(earned.map((b: any) => b.badgeId));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const badgeList = useMemo(() => {
    return catalog.map(b => ({
      ...b,
      isEarned: earnedIds.includes(b.id)
    }));
  }, [catalog, earnedIds]);

  console.log(" catalog:", catalog);
  console.log(" earnedIds:", earnedIds);
  console.log(" badgeList:", badgeList);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        <h2>Badges</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="badges-grid">
            {badgeList.map(b => (
              <div key={b.id} className={`badge-card ${b.isEarned ? "earned" : "locked"}`}>
                <div className="badge-icon">
                  <img src={b.icon} alt={b.name} />
                </div>
                <div className="badge-name">{b.name}</div>
                {!b.isEarned && <div className="badge-locked-text">Locked</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgesModal;
