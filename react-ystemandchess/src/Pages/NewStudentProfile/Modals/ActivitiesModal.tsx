import React, { useEffect, useState } from "react";
import "./ActivitiesModal.scss";
import { ReactComponent as GrowthBox } from "../../../images/ActivitiesAssets/growth_box.svg";
import { ReactComponent as WaterMeter } from "../../../images/ActivitiesAssets/water_meter.svg";
import { ReactComponent as MiddleVine} from "../../../images/ActivitiesAssets/middle_vine.svg";
import { ReactComponent as TopVine} from "../../../images/ActivitiesAssets/top_vine.svg";
import { ReactComponent as HangingVine} from "../../../images/ActivitiesAssets/hanging_vine.svg";
import { ReactComponent as TopicBag } from "../../../images/ActivitiesAssets/topic_bag.svg";
import { ReactComponent as ShortBottomVine} from "../../../images/ActivitiesAssets/short_bottom_vine.svg";
import { ReactComponent as BottomVine} from "../../../images/ActivitiesAssets/bottom_vine.svg";
import { ReactComponent as Stemmy} from "../../../images/ActivitiesAssets/stemmy.svg";
import { environment } from "../../../environments/environment"; 
import { useCookies } from "react-cookie";
import { parseActivities } from "../../../utils/activityNames";

const ActivitiesModal = ({ onClose, username }: { onClose: () => void; username: string }) => {
  // Close modal only when clicking the background overlay (not child elements)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
    
  const [cookies] = useCookies(['login']);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  

  const fetchActivities = async () => {
    try {
      const url = `${environment.urls.middlewareURL}/activities/${username}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${cookies.login}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      const json = await response.json();
      const data = json.activities.activities;
      const activityNames = parseActivities(data);
      setActivities(activityNames);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
    
  }
  useEffect(() => {
    try {
      fetchActivities();
    } catch (err) {
      console.log(err);
    }
  }, []);

  return ( 
    !loading && 
    <div className="activities-modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {/* Close (X) button */}
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        {/* Growth Box section with vine, SVG, buttons, and water meter */}
        <div className="growth-box-container">
          <MiddleVine className="middle-vine" />
          <GrowthBox className="growth-box" />
          <div className="button-row">
            <button className="growth-btn">Practice</button>
            <button className="growth-btn">Puzzle</button>
          </div>
          <div className="water-meter">
            <WaterMeter />
          </div>
        </div>

        {/* Top vine area with hanging vine, task button, and daily activity buttons */}
        <div className="top-vine-container">
          <div className="top-vine-wrapper">
            <TopVine className="top-vine" />
            <HangingVine className="hanging-vine" />

            {/* Task banner button */}
            <button className="task-button">
              Complete Tasks to Water<br />and Grow your Seed!
            </button>

            {/* Stack of daily activity buttons. Activities are hard coded for now.*/}
            <div className="button-stack">
              {activities.map((activity, idx) => (
                <button className="activity-button" key={idx}>
                  <span className="label">Daily Activity</span><br />
                  <span className="action">{activity}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topic bag area with clickable topic buttons and bottom vines */}
        <div className="topic-bag-container">
          <TopicBag className="bag-image" />
          <button className="topic-button btn-1">Seed Growth</button>
          <button className="topic-button btn-2">Seed Tracker</button>
          <button className="topic-button btn-3">Earning Water</button>
          <button className="topic-button btn-4">Daily Activities</button>
          <ShortBottomVine className="short-bottom-vine" />
          <BottomVine className="bottom-vine" />
        </div>

        {/* Decorative stem character */}
        <div className="stemmy-container">
          <Stemmy className="stemmy" />
        </div>
      </div>
    </div>
  );
};

export default ActivitiesModal;