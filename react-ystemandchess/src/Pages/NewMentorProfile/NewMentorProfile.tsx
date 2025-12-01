import React, { useState, useEffect, useRef } from "react";
import "./NewMentorProfile.scss";
import Images from "../../images/imageImporter";
import { SetPermissionLevel } from '../../globals';
import { useCookies } from 'react-cookie';
import { environment } from '../../environments/environment';
import { useNavigate } from "react-router";
import { StatsChart } from "../NewStudentProfile/StatsChart";

interface NewMentorProfileProps {
  userPortraitSrc: string;
}

const NewMentorProfile: React.FC<NewMentorProfileProps> = ({ userPortraitSrc }) => {
  const [activeTab, setActiveTab] = useState("activity");
  const [cookies] = useCookies(['login']);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hasStudent, setHasStudent] = useState(false);

  const [webTime, setWebTime] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [lessonTime, setLessonTime] = useState(0);
  const [puzzleTime, setPuzzleTime] = useState(0);
  const [mentorTime, setMentorTime] = useState(0);

  const [displayMonths] = useState(6);
  const [monthAxis, setMonthAxis] = useState(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
  const [dataAxis, setDataAxis] = useState([0, 0, 0, 0, 0, 0]);

  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [studentUsername, setStudentUsername] = useState("");

  const [events, setEvents] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const [date] = useState(() =>
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  );

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (hasStudent && studentUsername) {
      fetchUsageTime(studentUsername);
      fetchGraphData(studentUsername);
      fetchActivity(studentUsername);
    }
  }, [hasStudent, studentUsername]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        fetchActivity(studentUsername);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [loading]);

  const fetchUserData = async () => {
    const uInfo = await SetPermissionLevel(cookies);
    if (uInfo.error) {
      setUsername("mentorUser");
      setFirstName("Test");
      setLastName("Mentor");
      setHasStudent(true);
      setStudentFirstName("Test");
      setStudentLastName("Student");
      setStudentUsername("testStudent");
    } else {
      setUsername(uInfo.username);
      setFirstName(uInfo.firstName);
      setLastName(uInfo.lastName);
      fetchStudentData();
    }
  };

  const fetchUsageTime = async (username: string) => {
    const responseStats = await fetch(
      `${environment.urls.middlewareURL}/timeTracking/statistics?username=${username}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${cookies.login}` }
      }
    );
    const dataStats = await responseStats.json();
    setWebTime(dataStats.website);
    setLessonTime(dataStats.lesson);
    setPlayTime(dataStats.play);
    setMentorTime(dataStats.mentor);
    setPuzzleTime(dataStats.puzzle);
  };

  const fetchStudentData = async () => {
    const res = await fetch(`${environment.urls.middlewareURL}/user/getMentorship`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${cookies.login}` }
    });
    const data = await res.json();
    if (data) {
      setStudentFirstName(data.firstName);
      setStudentLastName(data.lastName);
      setStudentUsername(data.username);
      setHasStudent(true);
    }
  };

  const fetchActivity = async (username: string) => {
    if (loading || !hasMore) return;

    setLoading(true);
    const limit = 6;
    const skip = page * limit;

    const response = await fetch(
      `${environment.urls.middlewareURL}/timeTracking/latest?username=${username}&limit=${limit}&skip=${skip}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${cookies.login}` }
      }
    );
    const data = await response.json();

    setEvents(prev => [...prev, ...data]);
    setPage(prev => prev + 1);
    setHasMore(data.length === limit && data.length > 0);
    setLoading(false);
  };

  const fetchGraphData = async (username: string) => {
    const response = await fetch(
      `${environment.urls.middlewareURL}/timeTracking/graph-data?username=${username}&eventType=website&months=${displayMonths}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${cookies.login}` }
      }
    );
    const data = await response.json();
    setMonthAxis(data.map(item => item.monthText));
    setDataAxis(data.map(item => item.timeSpent));
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const handleNavigateEvent = (type: string, name: string) => {
    if (type === "lesson") {
      navigate("/lessons", { state: { piece: name } });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "activity":
        return (
          <div id="inventory-content-activity" className="inventory-content active-content">
            <div className="inventory-content-headingbar">
              <h2>Activity</h2>
              <h4>{date}</h4>
            </div>
            <div className="inventory-content-line"></div>
            <div className="inventory-content-body" ref={containerRef}>
              {events.map((event, index) => {
                const dateObj = new Date(event.startTime);
                const dateStr = dateObj.toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                });
                const timeStr = dateObj.toLocaleTimeString('en-US', {
                  hour: 'numeric', minute: '2-digit'
                });
                return (
                  <article key={index} className="inventory-content-timecard">
                    <div className="inventory-content-col1"></div>
                    <div className="inventory-content-col2">
                      <p>{dateStr} {timeStr}</p>
                    </div>
                    <div className="inventory-content-col3">
                      <p>
                        Working on {event.eventType}: <strong onClick={() => handleNavigateEvent(event.eventType, event.eventName)}>{event.eventName}</strong>
                      </p>
                    </div>
                  </article>
                );
              })}
              {loading && <p>Loading more...</p>}
              {!hasMore && <p>No more activity left!</p>}
            </div>
          </div>
        );
      case "mentor":
        return (
          <div id="inventory-content-mentor" className="inventory-content active-content">
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
          <img className="inv-intro-portrait-face" src={userPortraitSrc} alt="portrait" />
          <img className="inv-intro-portrait-camera" src={Images.userPortraitCamera} alt="camera icon" />
        </div>
        <div className="inv-intro-welcome">
          <h1>Hello, {firstName} {lastName}!</h1>
        </div>
      </section>

      {hasStudent ? (
        <section className="inv-inventory">
          <div className="inv-inventory-topbar">
            <h1>Check in on <strong>{studentFirstName} {studentLastName}'s</strong> progress!</h1>
          </div>
          <div className="inv-inventory-analytics">
            <div className="inv-inventory-analytics-graph">
              <StatsChart key={dataAxis.join(',')} monthAxis={monthAxis} dataAxis={dataAxis} />
            </div>
            <div className="inv-inventory-analytics-metrics">
              <h3>Time Spent:</h3>
              <ul>
                <li>Website: <strong>{webTime} minutes</strong></li>
                <li>Playing: <strong>{playTime} minutes</strong></li>
                <li>Lessons: <strong>{lessonTime} minutes</strong></li>
                <li>Puzzle: <strong>{puzzleTime} minutes</strong></li>
                <li>Mentoring: <strong>{mentorTime} minutes</strong></li>
              </ul>
            </div>
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
      ) : (
        <section className="no-student-message">
          <h1>No Student Selected</h1>
          <p>Please select a student to view their progress.</p>
        </section>
      )}
    </main>
  );
};

export default NewMentorProfile;
