import React from "react";
import "./LeaderboardModal.scss";

const LeaderboardModal = ({ onClose }: { onClose: () => void }) => {
  // Click handler that closes only when clicking the overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        <h2>Leaderboard</h2>
        <p>Here’s the Leaderboard</p>
      </div>
    </div>
  );
};

export default LeaderboardModal;