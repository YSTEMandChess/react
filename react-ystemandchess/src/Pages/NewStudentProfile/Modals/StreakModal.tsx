import React from "react";
import "./StreakModal.scss";
import { ReactComponent as Polygon } from "../../../images/StreakProgressAssets/polygon.svg";
import { ReactComponent as Polygon_2 } from "../../../images/StreakProgressAssets/polygon_2.svg";
import streakClock from "../../../images/StreakProgressAssets/streak_progress_clock.png";
import { ReactComponent as ChessPiece } from "../../../images/StreakProgressAssets/chess_piece.svg";
import { ReactComponent as Stemette } from "../../../images/StreakProgressAssets/stemette.svg";
import { ReactComponent as Stemmy } from "../../../images/StreakProgressAssets/stemmy.svg";

// Calendar placeholder. Delete once an actual calendar is implemented
import calendarIcon from "../../../images/StreakProgressAssets/Calendar.png";

// Type alias and props interface for a day's progress state
type DayStatus = "complete" | "current" | "incomplete";

interface DayProps {
  label: string;
  status: DayStatus;
}

// Renders a single day with label and a ChessPiece icon styled by its status
const DayProgress: React.FC<DayProps> = ({ label, status }) => {
  return (
    <div className={`day-progress ${status}`}>
      <span className="day-label">{label}</span>
      <ChessPiece className="chess-piece" />
    </div>
  );
};

// Displays the modal with streak information, visual characters, and daily progress
const StreakModal = ({ onClose }: { onClose: () => void }) => {
  // Overlay click handler - closes modal only if clicking outside modal content
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Days of the week
  const week = ["Sat", "Mon", "Tue", "Wed", "Thu", "Fri", "Sun"];

  // ===============================
  // Placeholder hardcoded statuses
  // This will eventually be replaced with data from the backend
  // ===============================
  const statuses: DayStatus[] = [
    "complete",
    "complete",
    "complete",
    "complete",
    "complete",
    "current",
    "incomplete",
  ];

  return (
    <div className="streak-modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {/* Close button in top-right */}
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        {/* Left speech bubble with tail and character */}
        <div className="speech-bubble-container left">
          <div className="speech-box">Keep up the great work!</div>
          <Polygon className="speech-tail" />
        </div>

        <Stemette className="leaning-left-inside" />

        {/* Right speech bubble with tail and character */}
        <div className="speech-bubble-container right">
          <div className="speech-box">
            You are almost at the end<br />of the week!
          </div>
          <Polygon_2 className="speech-tail" />
        </div>

        <Stemmy className="leaning-right-inside" />

        {/* Streak header with clock and stats */}
        <div className="streak-header">
          <img src={streakClock} alt="Streak Clock" className="streak-clock" />

          <div className="streak-text streak-left">
            <p className="big">9</p>
            <p className="small">Day Streak</p>
          </div>

          <div className="streak-text streak-right">
            <p className="small">Today is</p>
            <p className="big">6/9</p>
          </div>
        </div>

        {/* Weekly progress section with mapped days */}
        <div className="weekly-progress">
          <h3 className="weekly-title">Weekly Progress</h3>
          <div className="weekly-days">
            {week.map((day, index) => (
              <DayProgress key={day} label={day} status={statuses[index]} />
            ))}
          </div>
        </div>

        {/* Calendar placeholder. Delete once an actual calendar is implemented */}
        <div className="calendar-image-wrapper">
          <img src={calendarIcon} alt="Calendar Icon" className="calendar-image" />
        </div>
      </div>
    </div>
  );
};

export default StreakModal;