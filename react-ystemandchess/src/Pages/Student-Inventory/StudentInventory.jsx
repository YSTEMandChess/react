import React, { useState } from "react";
import "./StudentInventory.scss";
import Images from "../../images/imageImporter";

const StudentInventory = ({ userPortraitSrc, userName }) => {
  const [activeTab, setActiveTab] = useState("activity");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "activity":
        return (
          <div
            id="inventory-content-activity"
            className="inventory-content active-content"
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
        );
      case "mentor":
        return (
          <div id="inventory-content-mentor" className="inventoinventory-content active-contentry-content">
            <h2>Mentor</h2>
            <p>This is the content for the Mentor tab.</p>
          </div>
        );
      case "learning":
        return (
          <div id="inventory-content-learning" className="inventory-content active-content">
            <h2>Learning</h2>
            <p>This is the content for the Learning tab.</p>
          </div>
        );
      case "chessLessons":
        return (
          <div id="inventory-content-lessons" className="inventory-content active-content">
            <h2>Chess Lessons</h2>
            <p>This is the content for the Chess Lessons tab.</p>
          </div>
        );
      case "games":
        return (
          <div id="inventory-content-games" className="inventory-content active-content">
            <h2>Games</h2>
            <p>This is the content for the Games tab.</p>
          </div>
        );
      case "puzzles":
        return (
          <div id="inventory-content-puzzles" className="inventory-content active-content">
            <h2>Puzzles</h2>
            <p>This is the content for the Puzzles tab.</p>
          </div>
        );
      case "playComputer":
        return (
          <div id="inventory-content-computer" className="inventory-content active-content">
            <h2>Play with Computer</h2>
            <p>This is the content for the Play with Computer tab.</p>
          </div>
        );
      case "recordings":
        return (
          <div id="inventory-content-recordings" className="inventory-content active-content">
            <h2>Recordings</h2>
            <p>This is the content for the Recordings tab.</p>
          </div>
        );
      case "backpack":
        return (
          <div id="inventory-content-backpack" className="inventory-content active-content">
            <h2>Backpack</h2>
            <p>This is the content for the Backpack tab.</p>
          </div>
        );
      default:
        return (
          <div className="inventory-content active-content">
            <h2>Select a tab to view its content.</h2>
          </div>
        );
    }
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
        <div className="inv-inventory-content-section">
          <nav className="inv-inventory-content-tabs">
            <ul>
              {["activity", "mentor", "learning", 
              "chessLessons", "games", "puzzles", 
              "playComputer", "recordings", "backpack"].map((tab) => {
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

          <div className="inv-inventory-content-content">{renderTabContent()}</div>
        </div>
      </section>
    </main>
  );
};

export default StudentInventory;
