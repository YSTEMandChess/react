import React, { useEffect } from "react";
import "./Mentor-Profile.scss";

const MentorProfile = ({
  firstName = "Frist",
  lastName = "Last",
  accountCreatedAt = "N/A",
  recordingList = [],
}) => {
  useEffect(() => {
    openTab("Activity");
  }, []);

  const openTab = (tabName) => {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
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

  return (
    <div className="userProfileDiv">
      <header className="header">
        <div className="profile-image">
          <img src="https://via.placeholder.com/100" alt="Profile" />
          <h2>{`Hello, ${firstName} ${lastName}!`}</h2>
        </div>
      </header>

      <div className="top-bar">
        <div className="student-column">Student Name 1</div>
        <div className="student-column">Student Name 2</div>
        <div className="student-column">Student Name 3</div>
      </div>

      <div className="mentor-container">
        <div className="top-container">
          <div className="chart">
            <img
              src="https://via.placeholder.com/400x300"
              alt="Progress Chart"
            />
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
              <button
                className="tablinks active"
                onClick={() => openTab("Activity")}
                id="ActivityBtn"
              >
                <img
                  src="https://via.placeholder.com/100"
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
                  src="https://via.placeholder.com/100"
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
                  src="https://via.placeholder.com/100"
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
                  src="https://via.placeholder.com/100"
                  className="tab-image2"
                  alt="Chess Lesson Tab"
                />
              </button>
              <button
                className="tablinks"
                onClick={() => openTab("Games")}
                id="GamesBtn"
              >
                <img
                  src="https://via.placeholder.com/100"
                  className="tab-image2"
                  alt="Games Tab"
                />
              </button>
              <button
                className="tablinks"
                onClick={() => openTab("Puzzles")}
                id="PuzzlesBtn"
              >
                <img
                  src="https://via.placeholder.com/100"
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
                  src="https://via.placeholder.com/100"
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
                  src="https://via.placeholder.com/100"
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
                  src="https://via.placeholder.com/100"
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
              {recordingList.map((record, index) => (
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
  );
};

export default MentorProfile;
