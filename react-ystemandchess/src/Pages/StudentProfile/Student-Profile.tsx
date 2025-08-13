import React, { useEffect } from "react";
import "./Student-Profile.scss";

// Import images
import activityTab from "../../images/student/activity_tab.png";
import mentorTab from "../../images/student/mento_tab1.png";
import prodevTab from "../../images/student/prodev_tab.png";
import chessTab from "../../images/student/chess_tab.png";
import gamesTab from "../../images/student/games_tab.png";
import puzzlesTab from "../../images/student/puzzles_tab.png";
import playTab from "../../images/student/play_tab.png";
import recordingsTab from "../../images/student/recordings_tab.png";
import inventoryTab from "../../images/student/inventory_tab.png";
import progressChart from "../../images/student/chart.png";
import profileButton from "../../images/student/profile_button.svg";
import streakButton from "../../images/student/streak_button.svg";
import activitiesButton from "../../images/student/activities_button.svg";
import badgesButton from "../../images/student/badges_button.svg";
import leaderboardButton from "../../images/student/leaderboard_button.svg";

type Record = {
  sid: string;
  meetingId: string;
  meetingStartTime: string;
  [key: string]: any;
};

type Props = {
  firstName?: string;
  lastName?: string;
  accountCreatedAt?: string;
  recordingList?: Record[];
};

const StudentProfile = ({
  firstName = "First",
  lastName = "Last",
  accountCreatedAt = "N/A",
  recordingList = [],
}: Props) => {
  useEffect(() => {
    openTab("Activity");
  }, []);

  const openTab = (tabName: string) => {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
      const ele = tabcontent[i] as HTMLElement;
      ele.style.display = "none";

      // Prevent state classes
      ele.classList.remove("active");
    }
    const tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    const tab = document.getElementById(tabName);
    if (tab) {
      tab.style.display = "block";
      tab.classList.add("active");
    } else {
      console.error(`Tab with ID ${tabName} not found`);
    }
    const btn = document.getElementById(tabName + "Btn");
    if (btn) {
      btn.classList.add("active");
    } else {
      console.error(`Button with ID ${tabName}Btn not found`);
    }
  };

  const GreenBarButton = ({ src, alt }: { src: string; alt: string }) => (
    <button className="green-bar-button">
      <img src={src} alt={alt} />
    </button>
  );

  const TabButton = ({
    idSuffix,
    imgSrc,
    imgClass,
    alt,
    initiallyActive = false,
  }: {
    idSuffix: string;
    imgSrc: string;
    imgClass: string;
    alt: string;
    initiallyActive?: boolean;
  }) => (
    <button
      className={`tablinks${initiallyActive ? " active" : ""}`}
      onClick={() => openTab(idSuffix)}
      id={`${idSuffix}Btn`}
    >
      <img src={imgSrc} className={imgClass} alt={alt} />
    </button>
  );

  // Improved config
  const TAB_BUTTONS = [
    { id: "Activity", img: activityTab, cls: "tab-image", alt: "Activity Tab", active: true },
    { id: "Mentor_Session", img: mentorTab, cls: "tab-image2", alt: "Mentor Session Tab" },
    { id: "Professional_Development", img: prodevTab, cls: "tab-image2", alt: "Professional Development Tab" },
    { id: "Chess_Lesson", img: chessTab, cls: "tab-image2", alt: "Chess Lesson Tab" },
    { id: "Games", img: gamesTab, cls: "tab-image2", alt: "Games Tab" },
    { id: "Puzzles", img: puzzlesTab, cls: "tab-image2", alt: "Puzzles Tab" },
    { id: "computer", img: playTab, cls: "tab-image2", alt: "Computer Tab" },
    { id: "Recordings", img: recordingsTab, cls: "tab-image3", alt: "Recordings Tab" },
    { id: "Inventory", img: inventoryTab, cls: "tab-image4", alt: "Inventory Tab" },
  ] as const;

  return (
    <div className="background-wrapper">
      <div className="green-bar">
        <GreenBarButton src={profileButton} alt="Profile" />
        <GreenBarButton src={streakButton} alt="Streak" />
        <GreenBarButton src={activitiesButton} alt="Activities" />
        <GreenBarButton src={badgesButton} alt="Badges" />
        <GreenBarButton src={leaderboardButton} alt="Leaderboard" />
      </div>

      <div className="userProfileDiv">
        <header className="header">
          <div className="profile-image">
            <img src="https://via.placeholder.com/100" alt="Profile" />
            <h2>{`Hello, ${firstName} ${lastName}!`}</h2>
          </div>
        </header>

        <div className="container">
          <div className="inner-container">
            <div className="top-container">
              <div className="chart">
                <img src={progressChart} alt="Progress Chart" />
              </div>

              <div className="logged-times">
                <h3>Time Spent:</h3>
                <ul className="time-spent">
                  <li>Website: 45 minutes</li>
                  <li>Lesson: 10 minutes</li>
                  <li>Puzzle: 5 minutes</li>
                  <li>Playing: 15 minutes</li>
                  <li>Mentoring: 15 minutes</li>
                </ul>
              </div>
            </div>

            <div className="bottom-container">
              <div className="tabs-container">
                <div className="tab">
                  {TAB_BUTTONS.map((t) => (
                    <TabButton
                      key={t.id}
                      idSuffix={t.id}
                      imgSrc={t.img}
                      imgClass={t.cls}
                      alt={t.alt}
                      initiallyActive={!!t.active}
                    />
                  ))}
                </div>
              </div>

              <div className="tab-content-container">
                {/* Activity */}
                <div id="Activity" className="tabcontent active">
                  <div className="rightbox">
                    <div className="rb-container">
                      <ul className="rb">
                        <li className="rb-item">
                          <div className="timestamp">
                            23rd July 2022
                            <br /> 7:00 PM
                          </div>
                          <div className="item-title">Solved 2 tactical puzzles</div>
                        </li>
                        <li className="rb-item">
                          <div className="timestamp">
                            19th July 2022
                            <br /> 3:00 PM
                          </div>
                          <div className="item-title">
                            Practiced 7 positions on <a href="/learnings">Piece Checkmates I</a>
                          </div>
                        </li>
                        <li className="rb-item">
                          <div className="timestamp">
                            17st July 2022
                            <br /> 7:00 PM
                          </div>
                          <div className="item-title">
                            Signed up to{" "}
                            <a href="http://www.ystemandchess.com" target="_blank" rel="noreferrer">
                              ystemandchess.com
                            </a>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Mentor Session */}
                <div id="Mentor_Session" className="tabcontent">
                  <h3>Mentor Sessions</h3>
                  <p>Details about mentor sessions will go here.</p>
                </div>

                {/* Professional Development */}
                <div id="Professional_Development" className="tabcontent">
                  <h3>Professional Development</h3>
                  <p>Details about professional development will go here.</p>
                </div>

                {/* Chess Lesson */}
                <div id="Chess_Lesson" className="tabcontent">
                  <h3>Chess Lesson</h3>
                  <p>Details about chess lessons will go here.</p>
                </div>

                {/* Games */}
                <div id="Games" className="tabcontent">
                  <h3>Games</h3>
                  <p>Details about games will go here.</p>
                </div>

                {/* Puzzles */}
                <div id="Puzzles" className="tabcontent">
                  <h3>Puzzles</h3>
                  <p>Details about puzzles will go here.</p>
                </div>

                {/* Computer */}
                <div id="computer" className="tabcontent">
                  <h3>Computer</h3>
                  <p>Details about computer activities will go here.</p>
                </div>

                {/* Recordings */}
                <div id="Recordings" className="tabcontent">
                  <h3>Recordings</h3>
                  {recordingList.map((record: Record, index) => (
                    <div key={index}>
                      <h4>{record.title}</h4>
                      <p>{record.description}</p>
                    </div>
                  ))}
                </div>

                {/* Inventory */}
                <div id="Inventory" className="tabcontent">
                  <h3>Inventory</h3>
                  <p>Details about inventory will go here.</p>
                </div>
              </div>
              {/* /tab-content-container */}
            </div>
            {/* /bottom-container */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
