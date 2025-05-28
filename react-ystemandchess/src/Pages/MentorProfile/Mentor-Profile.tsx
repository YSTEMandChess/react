import React, { useState, useEffect } from "react";
import "./Mentor-Profile.scss";

// Import images
import activityTab from "../../images/student/activity_tab.png";
import mentorTab from "../../images/student/mento_tab.png";
import prodevTab from "../../images/student/prodev_tab.png";
import chessTab from "../../images/student/chess_tab.png";
import gamesTab from "../../images/student/games_tab.png";
import puzzlesTab from "../../images/student/puzzles_tab.png";
import playTab from "../../images/student/play_tab.png";
import recordingsTab from "../../images/student/recordings_tab.png";
import inventoryTab from "../../images/student/inventory_tab.png";
import progressChart from "../../images/student/chart.png";


type Record  = {
  sid: string;
  meetingId: string;
  meetingStartTime: string;
  [key: string]: any; // This allows any other fields to be added with any type
}



const MentorProfile = ({
                         firstName = "First",
                         lastName = "Last",
                         accountCreatedAt = "N/A",
                         recordingList = [],
                         students = [
                           {
                             name: "Student Name 1",
                             statistics: {
                               website: "45 minutes",
                               lesson: "10 minutes",
                               puzzle: "5 minutes",
                               playing: "15 minutes",
                               mentoring: "15 minutes",
                             },
                           },
                           {
                             name: "Student Name 2",
                             statistics: {
                               website: "30 minutes",
                               lesson: "20 minutes",
                               puzzle: "10 minutes",
                               playing: "10 minutes",
                               mentoring: "10 minutes",
                             },
                           },
                           {
                             name: "Student Name 3",
                             statistics: {
                               website: "60 minutes",
                               lesson: "15 minutes",
                               puzzle: "15 minutes",
                               playing: "5 minutes",
                               mentoring: "25 minutes",
                             },
                           },
                         ],
                       }) => {
  const [activeTab, setActiveTab] = useState("Activity");
  const [activeStudent, setActiveStudent] = useState(students[0].name);

  useEffect(() => {
    openTab(activeTab);
  }, [activeTab]);

  const openTab = (tabName: any) => {
    setActiveTab(tabName);
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
      const ele = tabcontent[i] as HTMLElement
      ele.style.display = "none";
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

  const handleStudentClick = (studentName: any) => {
    setActiveStudent(studentName);
  };

  const handleAddPoints = () => {
    console.log(`Adding points for ${activeStudent}`);
  };

  const activeStudentStats = students.find(
      (student) => student.name === activeStudent,
  )?.statistics;

  return (
      <div className="background-wrapper">
        <div className="userProfileDiv">
          <header className="header">
            <div className="profile-image">
              <img src="https://via.placeholder.com/100" alt="Profile" />
              <h2>{`Hello, ${firstName} ${lastName}!`}</h2>
            </div>
          </header>

          <div className="top-bar">
            {students.map((student, index) => (
                <div
                    key={index}
                    className={`student-column ${
                        activeStudent === student.name ? "active" : ""
                    }`}
                    onClick={() => handleStudentClick(student.name)}
                >
                  {student.name}
                </div>
            ))}
          </div>

          <div className="mentor-container">
            <div className="top-container">
              <div className="chart">
                <img src={progressChart} alt="Progress Chart" />
              </div>

              <div className="logged-times">
                <h3>Time Spent:</h3>
                <ul className="time-spent">
                  <li>Website: {activeStudentStats?.website}</li>
                  <li>Playing: {activeStudentStats?.playing}</li>
                  <li>Lessons: {activeStudentStats?.lesson}</li>
                  <li>Puzzle: {activeStudentStats?.puzzle}</li>
                  <li>Mentoring: {activeStudentStats?.mentoring}</li>
                </ul>
                <button className="add-points-button" onClick={handleAddPoints}>
                  Add Points
                </button>
              </div>
            </div>

            <div className="bottom-container">
              <div className="tabs-container">
                <div className="tab">
                  <button
                      className="tablinks active"
                      onClick={() => openTab("Activity")}
                      id="ActivityBtn"
                  >
                    <img
                        src={activityTab}
                        className="tab-image"
                        alt="Activity Tab"
                    />
                  </button>
                  <button
                      className="tablinks"
                      onClick={() => openTab("Mentor_Session")}
                      id="Mentor_SessionBtn"
                  >
                    <img
                        src={mentorTab}
                        className="tab-image2"
                        alt="Mentor Session Tab"
                    />
                  </button>
                  <button
                      className="tablinks"
                      onClick={() => openTab("Professional_Development")}
                      id="Professional_DevelopmentBtn"
                  >
                    <img
                        src={prodevTab}
                        className="tab-image2"
                        alt="Professional Development Tab"
                    />
                  </button>
                  <button
                      className="tablinks"
                      onClick={() => openTab("Chess_Lesson")}
                      id="Chess_LessonBtn"
                  >
                    <img
                        src={chessTab}
                        className="tab-image2"
                        alt="Chess Lesson Tab"
                    />
                  </button>
                  <button
                      className="tablinks"
                      onClick={() => openTab("Games")}
                      id="GamesBtn"
                  >
                    <img src={gamesTab} className="tab-image2" alt="Games Tab" />
                  </button>
                  <button
                      className="tablinks"
                      onClick={() => openTab("Puzzles")}
                      id="PuzzlesBtn"
                  >
                    <img
                        src={puzzlesTab}
                        className="tab-image2"
                        alt="Puzzles Tab"
                    />
                  </button>
                  <button
                      className="tablinks"
                      onClick={() => openTab("computer")}
                      id="computerBtn"
                  >
                    <img
                        src={playTab}
                        className="tab-image2"
                        alt="Computer Tab"
                    />
                  </button>
                  <button
                      className="tablinks"
                      onClick={() => openTab("Recordings")}
                      id="RecordingsBtn"
                  >
                    <img
                        src={recordingsTab}
                        className="tab-image3"
                        alt="Recordings Tab"
                    />
                  </button>

                  <button
                      className="tablinks"
                      onClick={() => openTab("Inventory")}
                      id="InventoryBtn"
                  >
                    <img
                        src={inventoryTab}
                        className="tab-image4"
                        alt="Inventory Tab"
                    />
                  </button>
                </div>
              </div>

              <div className="tab-content-container">
                <div id="Activity" className="tabcontent active">
                  <div className="rightbox">
                    <div className="rb-container">
                      <ul className="rb">
                        <li className="rb-item">
                          <div className="timestamp">
                            23rd July 2022
                            <br /> 7:00 PM
                          </div>
                          <div className="item-title">
                            Solved 2 tactical puzzles
                          </div>
                        </li>
                        <li className="rb-item">
                          <div className="timestamp">
                            19th July 2022
                            <br /> 3:00 PM
                          </div>
                          <div className="item-title">
                            Practiced 7 positions on{" "}
                            <a href="/learnings">Piece Checkmates I</a>
                          </div>
                        </li>
                        <li className="rb-item">
                          <div className="timestamp">
                            17st July 2022
                            <br /> 7:00 PM
                          </div>
                          <div className="item-title">
                            Signed up to{" "}
                            <a
                                href="http://www.ystemandchess.com"
                                target="_blank"
                                rel="noreferrer"
                            >
                              ystemandchess.com
                            </a>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div id="Mentor_Session" className="tabcontent">
                  <h3>Mentor Sessions</h3>
                  <p>Details about mentor sessions will go here.</p>
                </div>
                <div id="Professional_Development" className="tabcontent">
                  <h3>Professional Development</h3>
                  <p>Details about professional development will go here.</p>
                </div>
                <div id="Chess_Lesson" className="tabcontent">
                  <h3>Chess Lesson</h3>
                  <p>Details about chess lessons will go here.</p>
                </div>
                <div id="Games" className="tabcontent">
                  <h3>Games</h3>
                  <p>Details about games will go here.</p>
                </div>
                <div id="Puzzles" className="tabcontent">
                  <h3>Puzzles</h3>
                  <p>Details about puzzles will go here.</p>
                </div>
                <div id="computer" className="tabcontent">
                  <h3>Computer</h3>
                  <p>Details about computer activities will go here.</p>
                </div>
                <div id="Recordings" className="tabcontent">
                  <h3>Recordings</h3>
                  {recordingList.map((record: Record, index) => (
                      <div key={index}>
                        <h4>{record.title}</h4>
                        <p>{record.description}</p>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default MentorProfile;
