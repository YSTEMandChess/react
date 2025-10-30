import React, { useEffect, useMemo, useState } from "react";
import "./LeaderboardModal.scss";
import { ReactComponent as LeaderboardIcon } from "../../../images/student/leaderboard_sidebar_icon.svg";

import rank1Img from "../../../images/student/Leaderboard_rank_1.svg";
import rank2Img from "../../../images/student/Leaderboard_rank_2.svg";
import rank3Img from "../../../images/student/Leaderboard_rank_3.svg";

type Props = { onClose: () => void };

type Row = {
  rank: number;
  name: string;
  school: string;
  score: number;
  avatar?: "blue" | "red" | "teal" | "gold";
};

const LeaderboardModal: React.FC<Props> = ({ onClose }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows: Row[] = [
    { rank: 1,  name: "princel04",   school: "Jefferson Middle",                score: 3882, avatar: "blue" },
    { rank: 2,  name: "jesse_chess", school: "Pine View School",                score: 3790, avatar: "red"  },
    { rank: 3,  name: "mary_rose",   school: "Archimedean Middle Conservatory", score: 3780, avatar: "teal" },
    { rank: 4,  name: "user_name",   school: "school-name",                     score: 3680, avatar: "gold" },
    { rank: 5,  name: "user_name",   school: "school-name",                     score: 3480, avatar: "gold" },
    { rank: 6,  name: "user_name",   school: "school-name",                     score: 3110, avatar: "gold" },
    { rank: 7,  name: "user_name",   school: "school-name",                     score: 2950, avatar: "gold" },
    { rank: 8,  name: "user_name",   school: "school-name",                     score: 2856, avatar: "gold" },
    { rank: 9,  name: "user_name",   school: "school-name",                     score: 2712, avatar: "gold" },
    { rank: 10, name: "user_name",   school: "school-name",                     score: 2636, avatar: "gold" },
    { rank: 11, name: "user_name",   school: "school-name",                     score: 2632, avatar: "gold" }
  ];

  const [rankAsc, setRankAsc] = useState(true); // rank 1 on top by default

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (rankAsc ? a.rank - b.rank : b.rank - a.rank));
    return copy;
  }, [rows, rankAsc]);

  const badgeForRank = (rank: number) => {
    if (rank === 1) return rank1Img;
    if (rank === 2) return rank2Img;
    if (rank === 3) return rank3Img;
    return null;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title">
        <button className="close-button" onClick={onClose} aria-label="Close modal">&times;</button>

        {/* Header */}
        <header className="lb-header">
          <div className="lb-heading">
            <button className="lb-backpill" type="button">
              Go To<br />Backpack
            </button>
            <h2 id="leaderboard-title" className="lb-title">Leaderboard</h2>
          </div>
          <LeaderboardIcon className="lb-crown-img" aria-hidden />
        </header>

        {/* Filters */}
        <div className="lb-filters" role="group" aria-label="Filters">
          <select aria-label="Country">
            <option>Country</option><option>USA</option><option>Canada</option>
          </select>
          <select aria-label="State">
            <option>State</option><option>FL</option><option>GA</option><option>ID</option>
          </select>
          <select aria-label="School">
            <option>School</option><option>Jefferson Middle</option><option>Pine View School</option>
          </select>
        </div>

        {/* Table */}
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
                <th scope="col" aria-sort={rankAsc ? "ascending" : "descending"}>
                  <button
                    className="lb-sort-btn"
                    type="button"
                    onClick={() => setRankAsc(v => !v)}
                    aria-label="Sort by rank"
                  >
                    <span>Rank</span>
                    <svg className={`lb-sort-icon ${rankAsc ? "asc" : ""}`} viewBox="0 0 20 12" aria-hidden="true">
                      <path d="M2 2l8 8 8-8" />
                    </svg>
                  </button>
                </th>
                <th scope="col">Name</th>
                <th scope="col">School</th>
                <th scope="col">Score</th>
              </tr>
            </thead>

            <tbody>
              {sortedRows.map((r) => {
                const badge = badgeForRank(r.rank);
                return (
                  <tr key={`${r.rank}-${r.name}`} data-rank={r.rank}>
                    <td className="lb-rank">
                      {badge ? (
                        <span
                          className={`lb-rank-img rank-${r.rank}`}
                          style={{ backgroundImage: `url(${badge})` }}
                          aria-label={`Rank ${r.rank}`}
                          role="img"
                        />
                      ) : (
                        r.rank
                      )}
                    </td>
                    <td className="lb-user">
                      <span className={`lb-avatar ${r.avatar ?? ""}`} aria-hidden />
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

        {/* Load More */}
        <div className="lb-loadmore">
          <button type="button" className="lb-load-btn">Load More</button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
