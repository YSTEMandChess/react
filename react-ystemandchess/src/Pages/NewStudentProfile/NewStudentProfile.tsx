import React, { useState, useEffect, useRef } from "react";
import "./NewStudentProfile.scss";
import Images from "../../images/imageImporter";
import { SetPermissionLevel } from '../../globals'; 
import { useCookies } from 'react-cookie';
import { environment } from '../../environments/environment';
import { useNavigate } from "react-router";
import { StatsChart } from "./StatsChart";
import Lessons from "../Lessons/Lessons";
import LessonSelection from "../LessonsSelection/LessonsSelection";
import LessonOverlay from "../piece-lessons/lesson-overlay/lesson-overlay";

const NewStudentProfile = ({ userPortraitSrc }: any) => {

  const [activeTab, setActiveTab] = useState("activity");
  const [cookies] = useCookies(['login']);
  const navigate = useNavigate();

  // user info
  const [username, setUsername] = useState(" ");
  const [firstName, setFirstName] = useState(" ");
  const [lastName, setLastName] = useState(" ");

  // time usage for different events, displayed on header
  const [webTime, setWebTime] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [lessonTime, setLessonTime] = useState(0);
  const [puzzleTime, setPuzzleTime] = useState(0);
  const [mentorTime, setMentorTime] = useState(0);

  // data for chart plotting
  const [displayMonths, setDisplayMonths] = useState(6); // display data from 6 many months back 
  const [displayEvents, setDisplayEvents] = useState(["website", "play", "lesson", "puzzle", "mentor"])
  const [monthAxis, setMonthAxis] = useState(["Jan", "Feb", "Mar", "Apr", "May"]); // display the time as X-axis
  const [dataAxis, setDataAxis] = useState<{[key: string]: number[]}>({website: [0, 0, 0, 0, 0],}); // time spent on events each month

  // event tracking for pagination
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0); // page number
  const [loading, setLoading] = useState(false); // if loading for more events
  const [hasMore, setHasMore] = useState(true); // if there are more events
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation states
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrateAction, setCelebrateAction] = useState(false);

  // current date for display
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  }));

  const [lessonSelected, setLessonSelected] = useState(false);
  const [piece, setPiece] = useState("");
  const [lessonNum, setLessonNum] = useState(0);

  useEffect(()=>{
    try {
      fetchUserData(); 
    } catch (err) {
      console.log(err)
    }
  }, [])

  // loading changes, update listener to update handler closures
  useEffect(() => {
    const el = containerRef.current; // get the activity element 
    if (!el) return;

    const handleScroll = () => {
      // if scrolling within 50px of displayed height
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) { 
        fetchActivity(username); // fetch new acitivty
      }
    };
    el.addEventListener("scroll", handleScroll); // add listener to the updated activity element

    return () => el.removeEventListener("scroll", handleScroll); // remove listener when dependencies are updated
  }, [loading]);

  const fetchUserData = async () => {
      const uInfo = await SetPermissionLevel(cookies); // get logged-in user info
      if (uInfo.error) {
        navigate("/login") // if user is not logged in, go to login page
      } else {
        // record user info
        setUsername(uInfo.username);
        setFirstName(uInfo.firstName);
        setLastName(uInfo.lastName)
      }

      // fetch usage time stats to disaply in header
      fetchUsageTime(uInfo.username)
      // fetch data for graph plotting
      fetchGraphData(uInfo.username)
      // fetch latest usage history to show in Activity tab
      fetchActivity(uInfo.username)
  }

  // fetch usage time stats to display in header
  const fetchUsageTime = async (username) => {
      // fetch from back end
      const responseStats = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/statistics?username=${username}`, 
        {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cookies.login}` }
        }
      );
      const dataStats = await responseStats.json();
      // update time usage for different events in header display
      setWebTime(dataStats.website);
      setLessonTime(dataStats.lesson);
      setPlayTime(dataStats.play);
      setMentorTime(dataStats.mentor);
      setPuzzleTime(dataStats.puzzle);
  }

  // fetch latest usage history (Activity Tab)
  const fetchActivity = async (username) => {
    if (loading || !hasMore) return; // return if already fetching or no more activity left

    setLoading(true);
    const limit = 6; // fetch at most 6 activities at a time
    const skip = page * limit; // skip over previously fetched data

    try {
      // fetch another batch of usage history
      const responseLatest = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/latest?username=${username}&limit=${limit}&skip=${skip}`, 
        {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cookies.login}` }
        }
      );
      const dataLatest = await responseLatest.json();

      setEvents(prev => [...prev, ...dataLatest]); // append more events to old list
      setPage(prev => prev + 1); // update pagination number
      setHasMore(dataLatest.length === limit && dataLatest.length > 0); // if there are more activities
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  }

  // fetch data needed for updating graph plot
  const fetchGraphData = async (username) => {
    try {
      // fetch the time spent on the website in the past few months
      const response = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/graph-data?username=${username}&events=${displayEvents.join(",")}&months=${displayMonths}`, 
        {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cookies.login}` }
        }
      );
      const data = await response.json(); 

      const newDataAxis = {} as {[key: string]: number[]};
      for(let i = 0; i < displayEvents.length; i++)
      {
        // get time spent for each event for plotting
        let event = displayEvents[i];
        let value = data[event];
        let months = value.map(item => item.monthText); // month list for ploting
        let times = value.map(item => item.timeSpent); // timeSpent for plotting

        setMonthAxis(months);
        newDataAxis[event] = times;
      }

      // update for graph plotting
      setDataAxis(newDataAxis); 
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  }

  const handleTabClick = (tab: any) => {
    setActiveTab(tab);
    // Add celebration animation for certain tabs
    if (tab === "learning" || tab === "chessLessons") {
      setCelebrateAction(true);
      setTimeout(() => setCelebrateAction(false), 1000);
    }
  };

  // navigate to previous activities
  const handleNavigateEvent = (type: string, name: string) => {
    if(type === "lesson") { // if event is a lesson
      navigate("/lessons", { state: { piece: name } });
    }
  }

  // Fun click handler for portrait
  const handlePortraitClick = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
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
              <h4>{date}</h4>
            </div>
            <div className="inventory-content-line"></div>
            <div className="inventory-content-body" ref={containerRef}>
              {events && events.map((event, index) => { // render list of usage history
                const dateObj = new Date(event.startTime);
                const dateStr = dateObj.toLocaleDateString('en-US', { // date of each history
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
                const timeStr = dateObj.toLocaleTimeString('en-US', { // time of each history
                  hour: 'numeric',
                  minute: '2-digit'
                });

                return (
                  <article key={index} className="inventory-content-timecard">
                    <div className="inventory-content-col1"></div>
                    <div className="inventory-content-col2">
                      <p>{dateStr} {timeStr}</p>
                    </div>
                    <div className="inventory-content-col3">
                      <p>
                        Working on {event.eventType}:{' '}
                        <strong onClick={() => handleNavigateEvent(event.eventType, event.eventName)}>{event.eventName}</strong>
                      </p>
                    </div>
                  </article>
                );
              })}
              {loading && (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading more amazing activities...</p>
                </div>
              )}
              {!hasMore && <p style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>🎉 You've seen all your awesome activities!</p>}
            </div>
          </div>
        );
      case "mentor":
        return (
          <div id="inventory-content-mentor" className="inventory-content active-content">
            <h2>🎓 Mentor</h2>
            <p>This is the content for the Mentor tab.</p>
          </div>
        );
      case "learning":
        return (
          <div id="inventory-content-learning" className="inventory-content active-content">
            <Lessons />
          </div>
        );
      case "chessLessons":
        return (
          <div id="inventory-content-lessons" className="inventory-content active-content">
            {lessonSelected ? (
              <LessonOverlay propPieceName={piece} propLessonNumber={lessonNum} navigateFunc={() => {
                setLessonSelected(false);
              }} styleType="profile"/>
            ) : (
              <LessonSelection styleType="profile" onGo={(selectedScenario, lessonNum) => { 
                setLessonSelected(true);
                setPiece(selectedScenario);
                setLessonNum(lessonNum);
                // Add celebration for starting a lesson
                setCelebrateAction(true);
                setTimeout(() => setCelebrateAction(false), 1000);
              }}/>
            )}
          </div>
        );
      case "games":
        return (
          <div id="inventory-content-games" className="inventory-content active-content">
            <h2>🎮 Games</h2>
            <p>This is the content for the Games tab.</p>
          </div>
        );
      case "puzzles":
        return (
          <div id="inventory-content-puzzles" className="inventory-content active-content">
            <h2>🧩 Puzzles</h2>
            <p>This is the content for the Puzzles tab.</p>
          </div>
        );
      case "playComputer":
        return (
          <div id="inventory-content-computer" className="inventory-content active-content">
            <h2>🤖 Play with Computer</h2>
            <p>This is the content for the Play with Computer tab.</p>
          </div>
        );
      case "recordings":
        return (
          <div id="inventory-content-recordings" className="inventory-content active-content">
            <h2>📹 Recordings</h2>
            <p>This is the content for the Recordings tab.</p>
          </div>
        );
      case "backpack":
        return (
          <div id="inventory-content-backpack" className="inventory-content active-content">
            <h2>🎒 Backpack</h2>
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
      {/* Confetti effect */}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#3a7cca', '#d64309', '#ffd700', '#ff6b6b', '#4ecdc4'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
      )}

      <section className="inv-intro">
        <div className="inv-intro-portrait" onClick={handlePortraitClick}>
          <img
            className="inv-intro-portrait-face"
            src={userPortraitSrc}
            alt="user portrait"
          />
          <img
            className="inv-intro-portrait-camera"
            src={Images.userPortraitCamera}
            alt="user portrait camera icon"
          />
        </div>
        <div className="inv-intro-welcome">
          <h1>Hello, {firstName} {lastName}!</h1>
        </div>
      </section>

      <section className={`inv-inventory ${celebrateAction ? 'celebrate' : ''}`}>
        <div className="inv-inventory-topbar"></div>
        <div className="inv-inventory-analytics">
          <div className="inv-inventory-analytics-graph">
            <StatsChart key={monthAxis.join(',')} monthAxis={monthAxis} dataAxis={dataAxis as any}/>
          </div>
          <div className="inv-inventory-analytics-metrics">
            <h3>🏆 Time Spent:</h3>
            <ul>
              <li>🌐 Website: <strong>{webTime} minutes</strong></li>
              <li>🎯 Playing: <strong>{playTime} minutes</strong></li>
              <li>📚 Lessons: <strong>{lessonTime} minutes</strong></li>
              <li>🧩 Puzzle: <strong>{puzzleTime} minutes</strong></li>
              <li>👨‍🏫 Mentoring: <strong>{mentorTime} minutes</strong></li>
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
                      ? "♟️ Chess Lessons"
                      : tab === "playComputer"
                        ? "🤖 Play Computer"
                        : tab === "activity"
                          ? "📊 Activity"
                          : tab === "mentor"
                            ? "🎓 Mentor"
                            : tab === "learning"
                              ? "📖 Learning"
                              : tab === "games"
                                ? "🎮 Games"
                                : tab === "puzzles"
                                  ? "🧩 Puzzles"
                                  : tab === "recordings"
                                    ? "📹 Recordings"
                                    : tab === "backpack"
                                      ? "🎒 Backpack"
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

      {/* Inline styles for confetti animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .confetti-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            overflow: hidden;
          }

          .confetti-piece {
            position: absolute;
            width: 10px;
            height: 10px;
            animation: confetti-fall 3s linear infinite;
          }

          @keyframes confetti-fall {
            to {
              transform: translateY(100vh) rotate(360deg);
            }
          }

          .celebrate {
            animation: celebrate-pulse 1s ease-in-out;
          }

          @keyframes celebrate-pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.02);
            }
          }
        `
      }} />
    </main>
  );
};

export default NewStudentProfile;