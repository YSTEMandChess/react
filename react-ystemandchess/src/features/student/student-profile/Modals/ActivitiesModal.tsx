/**
 * Activities Modal Component
 * 
 * Displays a modal showing the user's daily activities in a garden-themed interface.
 * Each completed activity is represented by a watered plant growing on vines.
 * The modal fetches activities from the backend and visualizes progress.
 * 
 * Features:
 * - Fetches daily activities from API
 * - Garden/plant theme with animated vines and growth
 * - Water meter visualization for progress
 * - Interactive activity checkboxes
 * - Stemmy character mascot
 * - Click outside to close functionality
 */

import React, { useEffect, useState } from "react";
import "./ActivitiesModal.scss";
import { ReactComponent as GrowthBox } from "../../../../assets/images/ActivitiesAssets/growth_box.svg";
import { ReactComponent as WaterMeter } from "../../../../assets/images/ActivitiesAssets/water_meter.svg";
import { ReactComponent as MiddleVine} from "../../../../assets/images/ActivitiesAssets/middle_vine.svg";
import { ReactComponent as TopVine} from "../../../../assets/images/ActivitiesAssets/top_vine.svg";
import { ReactComponent as HangingVine} from "../../../../assets/images/ActivitiesAssets/hanging_vine.svg";
import { ReactComponent as TopicBag } from "../../../../assets/images/ActivitiesAssets/topic_bag.svg";
import { ReactComponent as ShortBottomVine} from "../../../../assets/images/ActivitiesAssets/short_bottom_vine.svg";
import { ReactComponent as BottomVine} from "../../../../assets/images/ActivitiesAssets/bottom_vine.svg";
import { ReactComponent as Stemmy} from "../../../../assets/images/ActivitiesAssets/stemmy.svg";
import { environment } from "../../../../environments/environment";
import { useCookies } from "react-cookie";
import { parseActivities } from "../../../../core/utils/activityNames";

type ActivityDisplay = { name: string; type: string; completed: boolean };
type FilterType = "all" | "puzzle" | "practice";

/**
 * ActivitiesModal component - displays daily activities in garden theme
 * @param {Function} onClose - Callback to close the modal
 * @param {string} username - Username to fetch activities for
 */
const ActivitiesModal = ({
  onClose,
  username,
  refreshKey = 0,
}: {
  onClose: () => void;
  username: string;
  refreshKey?: number;
}) => {
  const [cookies] = useCookies(['login']);
  const [activities, setActivities] = useState<ActivityDisplay[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const fetchActivities = async () => {
    try {
      const url = `${environment.urls.middlewareURL}/activities/${username}`;
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          'Authorization': `Bearer ${cookies.login}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await response.json();
      const raw: any[] = json.activities.activities;
      const parsed = parseActivities(raw);
      // Merge display names with raw type field for filtering
      const mapped: ActivityDisplay[] = parsed.map((p, i) => ({
        name: p.name,
        type: raw[i].type,
        completed: p.completed,
      }));
      setActivities(mapped);
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  useEffect(() => {
    if (!username || !username.trim()) return;
    fetchActivities().catch(console.error);
  }, [refreshKey, username]);

  if (!activities) return null;

  const completedCount = activities.filter(a => a.completed).length;
  const totalCount = activities.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredActivities = activities.filter(a => {
    if (activeFilter === "puzzle") return a.type === "midMatch" || a.type === "puzzle";
    if (activeFilter === "practice") return a.type === "lesson" || a.type === "practice";
    return true;
  });

  const toggleFilter = (f: FilterType) =>
    setActiveFilter(prev => (prev === f ? "all" : f));

  return (
    <div className="activities-modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        {/* Growth Box — filter tabs + water meter progress */}
        <div className="growth-box-container">
          <MiddleVine className="middle-vine" />
          <GrowthBox className="growth-box" />
          <div className="button-row">
            <button
              className={`growth-btn ${activeFilter === "practice" ? "growth-btn--active" : ""}`}
              onClick={() => toggleFilter("practice")}
            >
              Practice
            </button>
            <button
              className={`growth-btn ${activeFilter === "puzzle" ? "growth-btn--active" : ""}`}
              onClick={() => toggleFilter("puzzle")}
            >
              Puzzle
            </button>
          </div>
          <div className="water-meter">
            <WaterMeter />
            <div
              className="water-fill"
              style={{ height: `${progressPercent}%` }}
              aria-label={`${progressPercent}% complete`}
            />
            <span className="water-percent">{progressPercent}%</span>
          </div>
        </div>

        {/* Top vine — activity list */}
        <div className="top-vine-container">
          <div className="top-vine-wrapper">
            <TopVine className="top-vine" />
            <HangingVine className="hanging-vine" />

            <button className="task-button">
              Complete Tasks to Water<br />and Grow your Seed!
            </button>

            <div className="button-stack">
              {filteredActivities.length === 0 && (
                <p className="no-activities">No activities for this filter.</p>
              )}
              {filteredActivities.map((activity, idx) => (
                <button
                  key={idx}
                  className={`activity-button ${activity.completed ? "activity-button--completed" : ""}`}
                >
                  <span className="label">Daily Activity</span>
                  <span className="action">{activity.name}</span>
                  <span className="status-icon">
                    {activity.completed ? "✓" : "○"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topic bag */}
        <div className="topic-bag-container">
          <TopicBag className="bag-image" />
          <button className="topic-button btn-1">Seed Growth</button>
          <button className="topic-button btn-2">Seed Tracker</button>
          <button className="topic-button btn-3">Earning Water</button>
          <button className="topic-button btn-4">Daily Activities</button>
          <ShortBottomVine className="short-bottom-vine" />
          <BottomVine className="bottom-vine" />
        </div>

        <div className="stemmy-container">
          <Stemmy className="stemmy" />
        </div>
      </div>
    </div>
  );
};

export default ActivitiesModal;