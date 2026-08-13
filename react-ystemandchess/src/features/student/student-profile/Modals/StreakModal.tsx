/**
 * Streak Modal Component
 *
 * Displays a modal showing the user's daily activity streak progress.
 * Features animated characters (Stemette and Stemmy) with encouraging messages,
 * a visual streak tracker with clock icon, and a month calendar of completed days.
 *
 * Features:
 * - Animated character mascots with speech bubbles
 * - Real streak figures from GET /streak
 * - Month calendar built from GET /streak/calendar, with month navigation
 * - Click outside to close functionality
 *
 * Day bucketing is UTC on the server (it keys events by
 * `new Date(startTime).toISOString().slice(0, 10)`), so the calendar grid is
 * built with the UTC date parts too. Using local parts here would shift the
 * grid by a day for anyone west of UTC and mark the wrong squares.
 *
 * The API only returns days that have at least one recorded event, so a date
 * missing from the response means "nothing recorded", which renders the same
 * as an incomplete day.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useCookies } from "react-cookie";
import "./StreakModal.scss";
import { environment } from "../../../../environments";
import { ReactComponent as Polygon } from "../../../../assets/images/StreakProgressAssets/polygon.svg";
import { ReactComponent as Polygon_2 } from "../../../../assets/images/StreakProgressAssets/polygon_2.svg";
import streakClock from "../../../../assets/images/StreakProgressAssets/streak_progress_clock.png";
import { ReactComponent as Stemette } from "../../../../assets/images/StreakProgressAssets/stemette.svg";
import { ReactComponent as Stemmy } from "../../../../assets/images/StreakProgressAssets/stemmy.svg";

type StreakSummary = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
};

type CalendarDay = {
  date: string; // YYYY-MM-DD
  completed: boolean;
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/** Formats a Date as the YYYY-MM the calendar endpoint expects. */
const toMonthParam = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

/** Formats a Date as the YYYY-MM-DD key the calendar endpoint returns. */
const toDayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * StreakModal component - displays user's streak progress
 * @param {Function} onClose - Callback to close the modal
 * @param {string} username - Username to fetch streak data for (must match the JWT)
 */
const StreakModal = ({ onClose, username }: { onClose: () => void; username: string }) => {
  const [cookies] = useCookies(["login"]);
  const [summary, setSummary] = useState<StreakSummary | null>(null);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // First of the month currently shown in the grid, anchored in UTC so the
  // month never flips early or late for users away from UTC.
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const shiftMonth = (offset: number) => {
    setViewMonth((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + offset, 1)));
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const base = environment.urls.middlewareURL;
        const headers = { Authorization: `Bearer ${cookies.login}` };
        const user = encodeURIComponent(username);

        const [summaryRes, calendarRes] = await Promise.all([
          fetch(`${base}/streak?username=${user}`, { headers }),
          fetch(`${base}/streak/calendar?username=${user}&month=${toMonthParam(viewMonth)}`, { headers }),
        ]);

        if (!summaryRes.ok || !calendarRes.ok) {
          throw new Error(`streak request failed (${summaryRes.status}/${calendarRes.status})`);
        }

        const summaryJson = await summaryRes.json();
        const calendarJson = await calendarRes.json();
        if (cancelled) return;

        setSummary({
          currentStreak: summaryJson.currentStreak ?? 0,
          longestStreak: summaryJson.longestStreak ?? 0,
          lastCompletedDate: summaryJson.lastCompletedDate ?? null,
        });
        setDays(calendarJson.days || []);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching streak:", err);
        // Leave the modal usable rather than stuck on a spinner — the mascots
        // and layout still render, with the figures replaced by a notice.
        setError("Couldn't load your streak right now.");
        setSummary(null);
        setDays([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username, cookies.login, viewMonth]);

  const completedDates = useMemo(
    () => new Set(days.filter((d) => d.completed).map((d) => d.date)),
    [days]
  );

  /**
   * Cells for the month grid: leading blanks so the 1st lands under its
   * weekday, then one entry per day of the month.
   */
  const cells = useMemo(() => {
    const year = viewMonth.getUTCFullYear();
    const month = viewMonth.getUTCMonth();
    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    // Day 0 of the next month is the last day of this one.
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const leading: (null | { day: number; key: string })[] = Array(firstWeekday).fill(null);
    const dates = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      key: toDayKey(new Date(Date.UTC(year, month, i + 1))),
    }));

    return [...leading, ...dates];
  }, [viewMonth]);

  const todayKey = toDayKey(new Date());
  const monthLabel = viewMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  // "Today is" reads as month/day to match the mock-up's 6/9 format.
  const now = new Date();
  const todayLabel = `${now.getUTCMonth() + 1}/${now.getUTCDate()}`;

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
            <p className="big">{loading ? "–" : summary?.currentStreak ?? 0}</p>
            <p className="small">Day Streak</p>
          </div>

          <div className="streak-text streak-right">
            <p className="small">Today is</p>
            <p className="big">{todayLabel}</p>
          </div>
        </div>

        {error && <p className="streak-error">{error}</p>}

        <div className="streak-calendar">
          <div className="calendar-nav">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              &lsaquo;
            </button>
            <span className="calendar-month">{monthLabel}</span>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
              &rsaquo;
            </button>
          </div>

          <div className="calendar-grid" role="grid" aria-label={`Completed days in ${monthLabel}`}>
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={`wd-${i}`} className="calendar-weekday" aria-hidden="true">
                {label}
              </div>
            ))}

            {cells.map((cell, i) =>
              cell === null ? (
                <div key={`blank-${i}`} className="calendar-day is-blank" />
              ) : (
                <div
                  key={cell.key}
                  className={[
                    "calendar-day",
                    completedDates.has(cell.key) ? "is-completed" : "",
                    cell.key === todayKey ? "is-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={`${cell.key}${completedDates.has(cell.key) ? ", completed" : ""}`}
                >
                  {cell.day}
                </div>
              )
            )}
          </div>

          {summary && summary.longestStreak > 0 && (
            <p className="calendar-footnote">Longest streak: {summary.longestStreak} days</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreakModal;
