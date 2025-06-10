import React, { useState, useEffect, useRef } from "react";
import "./NewStudentProfile.scss";
import Images from "../../images/imageImporter";
import { SetPermissionLevel } from '../../globals'; 
import { useCookies } from 'react-cookie';
import { environment } from '../../environments/environment';
import { useNavigate } from "react-router";

const NewStudentProfile = ({ userPortraitSrc }: any) => {

  const [activeTab, setActiveTab] = useState("activity");
  const [cookies] = useCookies(['login']);
  const navigate = useNavigate();

  // user info
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState(" ");
  const [lastName, setLastName] = useState(" ");

  // user usage in different modules
  const [webTime, setWebTime] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [lessonTime, setLessonTime] = useState(0);
  const [puzzleTime, setPuzzleTime] = useState(0);
  const [mentorTime, setMentorTime] = useState(0);

  // event tracking for pagination
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0); // page number
  const [loading, setLoading] = useState(false); // if loading for more events
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // current date for display
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })
);

  useEffect(()=>{
    try {
      fetchUserData(); // asynchronously fetch user data
    } catch (err) {
      console.log(err)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        fetchEvents(username);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [events, loading]);


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

      // fetch usage time stats
      const responseStats = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/statistics?username=${uInfo.username}`, 
        {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cookies.login}` }
        }
      );
      const dataStats = await responseStats.json();
      // update time usage for different events
      setWebTime(dataStats.website);
      setLessonTime(dataStats.lesson);
      setPlayTime(dataStats.play);
      setMentorTime(dataStats.mentor);
      setPuzzleTime(dataStats.puzzle);

      // fetch latest usage history
      fetchEvents(uInfo.username)
  }

  // fetch latest usage history
  const fetchEvents = async (username) => {
    if (loading || !hasMore) return; // return if already fetching

    // start fetching
    setLoading(true);
    const limit = 6;
    const skip = page * limit;

    try {
      // fetch latest usage history
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
      setHasMore(dataLatest.length === limit && dataLatest.length > 0);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false); // stop fetching
    }
  }

  const handleTabClick = (tab: any) => {
    setActiveTab(tab);
  };

  const handleNavigateEvent = (type: string, name: string) => {
    if(type == "lesson") {
      navigate("/lessons", { state: { piece: name } });
    }
  }

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
              {loading && <p>Loading more...</p>}
              {!hasMore && <p>No more activity left!</p>}
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
