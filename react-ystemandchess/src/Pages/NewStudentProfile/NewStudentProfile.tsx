import React, { useState, useEffect } from "react";
import "./NewStudentProfile.scss";
import Images from "../../images/imageImporter";
import { SetPermissionLevel } from '../../globals'; 
import { useCookies } from 'react-cookie';
import { environment } from '../../environments/environment';

const NewStudentProfile = ({ userPortraitSrc }: any) => {

  const [activeTab, setActiveTab] = useState("activity");
  const [cookies] = useCookies(['login']); // get login info from cookie
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState(" ");
  const [lastName, setLastName] = useState(" ");
  const [webTime, setWebTime] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [lessonTime, setLessonTime] = useState(0);
  const [puzzleTime, setPuzzleTime] = useState(0);
  const [mentorTime, setMentorTime] = useState(0);

  useEffect(()=>{
    try {
      fetchUserData(); // asynchronously fetch user data
    } catch (err) {
      console.log(err)
    }
  }, [])

  const fetchUserData = async () => {
      const uInfo = await SetPermissionLevel(cookies); // get logged-in user info
      if (uInfo.error) {
        console.log("Error: user not logged in.") // error if the user is not logged in
      } else {
        // record user info
        setUsername(uInfo.username);
        setFirstName(uInfo.firstName);
        setLastName(uInfo.lastName)
      }

      // fetch usage data
      const response = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/statistics?username=${uInfo.username}`, 
        {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cookies.login}` }
        }
      );
      const data = await response.json();
      // update usage for different events
      setWebTime(data.website);
      setLessonTime(data.lesson);
      setPlayTime(data.play);
      setMentorTime(data.mentor);
      setPuzzleTime(data.puzzle);
  }

  const handleTabClick = (tab: any) => {
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
          <h1>Hello, {firstName} {lastName}!</h1>
        </div>
      </section>

      <section className="inv-inventory">
        <div className="inv-inventory-topbar"></div>
        <div className="inv-inventory-analytics">
          <div className="inv-inventory-analytics-graph">
            <img src="/placeholder_chart.png"/>
          </div>
          <div className="inv-inventory-analytics-metrics">
            <h3>Time Spent:</h3>
            <ul>
              <li>Website: {webTime} minutes</li>
              <li>Playing: {playTime} minutes</li>
              <li>Lessons: {lessonTime} minutes</li>
              <li>Puzzle: {puzzleTime} minutes</li>
              <li>Mentoring: {mentorTime} minutes</li>
            </ul>
          </div>
        </div>
        <div className="inv-inventory-content-section">
          <nav className="inv-inventory-content-tabs">
            <ul>
              {["activity", "mentor", "learning",
                "chessLessons", "games", "puzzles",
                "playComputer", "recordings", "backpack"].map((tab) => { const displayName =
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
                <img src={Images[`${tab}Icon` as keyof typeof Images]} alt={`${tab} icon`} />
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

export default NewStudentProfile;
