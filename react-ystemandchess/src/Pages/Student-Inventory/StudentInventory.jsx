import React, { useState } from "react";
import "./StudentInventory.scss";
import Images from "../../images/imageImporter";

const StudentInventory = ({ userPortraitSrc, userName }) => {
  const [activeTab, setActiveTab] = useState("activity");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <main id="main-inventory-content">
      <section className="inv-intro">
        <div className="inv-intro-portrait">
          <img
            className="inv-intro-portrait-face"
            src={userPortraitSrc}
            alt="user portrait"
          ></img>
          <img
            className="inv-intro-portrait-camera"
            src={Images.userPortraitCamera}
            alt="user portrait camera icon"
          ></img>
        </div>
        <div className="inv-intro-welcome">
          <h1>Hello, {userName}!</h1>
        </div>
      </section>

      <section className="inv-inventory">

        <div className="inv-inventory-topbar">
          <h2>Your Progress</h2>
        </div>
        <div className="inv-inventory-analytics">
          <div className="inv-inventory-analytics-graph">
            <img src={Images.lineGraphPlaceholder} alt="progress graph" />
          </div>
          <div className="inv-inventory-analytics-metrics">
            <h3>Time Spent</h3>
            <ul>
              <li>
                Website: <strong>45 Min</strong>
              </li>
              <li>
                Playing: <strong>15 Min</strong>
              </li>
              <li>
                Lessons: <strong>10 Min</strong>
              </li>
              <li>
                Puzzle: <strong>5 Min</strong>
              </li>
              <li>
                Mentoring: <strong>10 Min</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="inv-inventory-content-section">
          <nav className="inv-inventory-content-tabs">
            <ul>
              {["activity", "mentor", "learning", "chessLessons", "games", "puzzles", "playComputer", "recordings", "backpack"].map((tab) => {
                const displayName =
                  tab === "chessLessons"
                    ? "Chess Lessons"
                    : tab === "playComputer"
                      ? "Play with Computer"
                      : tab.charAt(0).toUpperCase() + tab.slice(1);

                return (
                  <div
                    key={tab}
                    className={`inventory-tab ${activeTab === tab ? "active-tab" : ""}`}
                    onClick={() => handleTabClick(tab)}
                  >
                    <img src={Images[`${tab}Icon`]} alt={`${tab} icon`} />
                    <li>{displayName}</li>
                  </div>
                );
              })}
            </ul>
          </nav>


          <div className="inv-inventory-content-content">
            <div
              id="inventory-content-activity"
              class="inventory-content active-content"
            >
              <div className="inventory-content-headingbar">
                <h2>Activity</h2>
                <h4>May 2024</h4>
              </div>
              <div className="inventory-content-body">
                <div className="inventory-content-line"></div>
                <article className="inventory-content-timecard">
                  <div className="inventory-content-col1"></div>
                  <div className="inventory-content-col2">
                    <p>May 24 2024</p>
                    <p>7:00 PM</p>
                  </div>
                  <div className="inventory-content-col3">
                    <p>Solved 2 tactical puzzles.</p>
                  </div>
                </article>
                <article className="inventory-content-timecard">
                  <div className="inventory-content-col1"></div>
                  <div className="inventory-content-col2">
                    <p>May 19 2024</p>
                    <p>3:00 PM</p>
                  </div>
                  <div className="inventory-content-col3">
                    <p>Practiced 7 positions on Piece Checkmates I.</p>
                  </div>
                </article>
                <article className="inventory-content-timecard">
                  <div className="inventory-content-col1"></div>
                  <div className="inventory-content-col2">
                    <p>May 16 2024</p>
                    <p>4:00 PM</p>
                  </div>
                  <div className="inventory-content-col3">
                    <p>Completed 100 games of chess.</p>
                  </div>
                </article>
              </div>
            </div>
            <div id="inventory-content-mentor" class="inventory-content">
              <h2>Content 2</h2>
              <p>This is the content for Tab 2.</p>
            </div>
            <div id="inventory-content-learning" class="inventory-content">
              <h2>Content 3</h2>
              <p>This is the content for Tab 3.</p>
            </div>
            <div id="inventory-content-lessons" class="inventory-content">
              <h2>Content 4</h2>
              <p>This is the content for Tab 4.</p>
            </div>
            <div id="inventory-content-games" class="inventory-content">
              <h2>Content 4</h2>
              <p>This is the content for Tab 4.</p>
            </div>
            <div id="inventory-content-puzzles" class="inventory-content">
              <h2>Content 4</h2>
              <p>This is the content for Tab 4.</p>
            </div>
            <div id="inventory-content-computer" class="inventory-content">
              <h2>Content 4</h2>
              <p>This is the content for Tab 4.</p>
            </div>
            <div id="inventory-content-recordings" class="inventory-content">
              <h2>Content 4</h2>
              <p>This is the content for Tab 4.</p>
            </div>
            <div id="inventory-content-backpack" class="inventory-content">
              <h2>Content 4</h2>
              <p>This is the content for Tab 4.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="inv-streaks">
        <h2>Welcome to Your Streak Progress Page!</h2>
        <div>
          <h3>Streak Clock</h3>
          <img src="" alt="streak clock graphic" />
        </div>
        <div>
          <h3>Weekly Progress</h3>
          <img src="" alt="weekly progress graphic" />
        </div>
        <div>
          <h3>Calendar</h3>
          <img src="" alt="calendar graphic" />
        </div>
      </section>
      <section className="inv-growth-quest"></section>
      <section className="inv-badges"></section>
      <section className="inv-leaderboard"></section>
    </main>
  );
};

export default StudentInventory;
