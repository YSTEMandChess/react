import React from "react";
import "./BadgesModal.scss";

const BadgesModal = ({ onClose }: { onClose: () => void }) => {
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
        <h2>Badges</h2>
        <p>Here’s your Badges</p>
      </div>
    </div>
  );
};

export default BadgesModal;