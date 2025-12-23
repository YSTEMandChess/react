// src/Pages/NewStudentProfile/Modals/LeaderboardModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import "./LeaderboardModal.scss";
import { ReactComponent as LeaderboardIcon } from "../../../images/student/leaderboard_sidebar_icon.svg";

import rank1Img from "../../../images/student/Leaderboard_rank_1.svg";
import rank2Img from "../../../images/student/Leaderboard_rank_2.svg";
import rank3Img from "../../../images/student/Leaderboard_rank_3.svg";

// AVATAR IMAGES
import avatar1 from "../../../images/student/Leaderboard_User_avatar_1.png";
import avatar2 from "../../../images/student/Leaderboard_User_avatar_2.png";
import avatar3 from "../../../images/student/Leaderboard_User_avatar_3.png";
import avatarAll from "../../../images/student/Leaderboard_User_avatar_all.png";

type Props = { onClose: () => void };

type Row = {
  rank: number;
  name: string;
  school: string;
  score: number;
};

const LeaderboardModal: React.FC<Props> = ({ onClose }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // SAMPLE DATA
  const rows: Row[] = [
    { rank: 1, name: "princel04", school: "Jefferson Middle", score: 3882 },
    { rank: 2, name: "jesse_chess", school: "Pine View School", score: 3790 },
    { rank: 3, name: "mary_rose", school: "Archimedean Middle Conservatory", score: 3780 },
    { rank: 4, name: "user_name", school: "school-name", score: 3680 },
    { rank: 5, name: "user_name", school: "school-name", score: 3480 },
    { rank: 6, name: "user_name", school: "school-name", score: 3110 },
    { rank: 7, name: "user_name", school: "school-name", score: 2950 },
    { rank: 8, name: "user_name", school: "school-name", score: 2856 },
    { rank: 9, name: "user_name", school: "school-name", score: 2712 },
    { rank: 10, name: "user_name", school: "school-name", score: 2636 },
    { rank: 11, name: "user_name", school: "school-name", score: 2632 },
  ];

  const [rankAsc, setRankAsc] = useState(true);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (rankAsc ? a.rank - b.rank : b.rank - a.rank));
    return copy;
  }, [rows, rankAsc]);

  // SHOW ONLY FIRST 4 ROWS INITIALLY
  const [visibleCount, setVisibleCount] = useState(4);
  const visibleRows = sortedRows.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(sortedRows.length);
  };

  const allLoaded = visibleCount >= sortedRows.length;

  // RANK BADGES
  const badgeForRank = (rank: number) => {
    if (rank === 1) return rank1Img;
    if (rank === 2) return rank2Img;
    if (rank === 3) return rank3Img;
    return null;
  };

  // AVATAR IMAGE SELECTION
  const avatarForRank = (rank: number) => {
    if (rank === 1) return avatar1;
    if (rank === 2) return avatar2;
    if (rank === 3) return avatar3;
    return avatarAll;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-title"
      >
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        {/* Header */}
        <header className="lb-header">
          <div className="lb-heading">
            <button className="lb-backpill" type="button">
              Go To
              <br />
              Backpack
            </button>
            <h2 id="leaderboard-title" className="lb-title">
              Leaderboard
            </h2>
          </div>
          <LeaderboardIcon className="lb-crown-img" aria-hidden />
        </header>

        {/* Filters */}
        <div className="lb-filters">
          <select>
            <option>Country</option>
            <option>USA</option>
            <option>Canada</option>
          </select>
          <select>
            <option>State</option>
            <option>FL</option>
            <option>GA</option>
          </select>
          <select>
            <option>School</option>
            <option>Jefferson Middle</option>
            <option>Pine View School</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="lb-table-wrap">
          <table className="lb-table">
            <colgroup>
              <col className="col-rank" />
              <col className="col-name" />
              <col className="col-school" />
              <col className="col-score" />
            </colgroup>

            <thead>
              <tr>
                <th>
                  <button
                    className="lb-sort-btn"
                    type="button"
                    onClick={() => setRankAsc((v) => !v)}
                  >
                    <span>Rank</span>
                    <svg
                      className={`lb-sort-icon ${rankAsc ? "asc" : ""}`}
                      viewBox="0 0 20 12"
                      aria-hidden="true"
                    >
                      <path d="M2 2l8 8 8-8" />
                    </svg>
                  </button>
                </th>
                <th>Name</th>
                <th>School</th>
                <th>Score</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((r) => {
                const badge = badgeForRank(r.rank);
                const avatar = avatarForRank(r.rank);

                return (
                  <tr key={`${r.rank}-${r.name}`} data-rank={r.rank}>
                    <td className="lb-rank">
                      {badge ? (
                        <span
                          className="lb-rank-img"
                          style={{ backgroundImage: `url(${badge})` }}
                        />
                      ) : (
                        r.rank
                      )}
                    </td>

                    <td className="lb-user">
                      <img
                        src={avatar}
                        alt={`${r.name} avatar`}
                        className="lb-avatar-img"
                      />
                      <span className="lb-name">{r.name}</span>
                    </td>

                    <td className="lb-school">{r.school}</td>
                    <td className="lb-score">{r.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* LOAD MORE (OUTSIDE TABLE WRAP, POPUP SCROLLS) */}
        <div className="lb-loadmore">
          <button
            className="lb-load-btn"
            type="button"
            onClick={handleLoadMore}
            disabled={allLoaded}
          >
            {allLoaded ? "No more data" : "Load More"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
