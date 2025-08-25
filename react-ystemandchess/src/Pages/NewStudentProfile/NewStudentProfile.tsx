import React, { useState, useEffect, useRef } from "react";
import "./NewStudentProfile.scss";
import Images from "../../images/imageImporter";
import { SetPermissionLevel } from '../../globals'; 
import { useCookies } from 'react-cookie';
import { environment } from '../../environments/environment';
import { useNavigate } from "react-router";
import { useLocation } from "react-router";
import Lessons from "../Lessons/Lessons";
import LessonSelection from "../LessonsSelection/LessonsSelection";
import LessonOverlay from "../piece-lessons/lesson-overlay/lesson-overlay";
import Puzzles from "../Puzzles/Puzzles";
import StreakModal from "./Modals/StreakModal";
import ActivitiesModal from "./Modals/ActivitiesModal";
import BadgesModal from "./Modals/BadgesModal";
import LeaderboardModal from "./Modals/LeaderboardModal";
import { StatsChart } from "./StatsChart";

// Toolbar buttons
import { ReactComponent as StreakIcon } from "../../images/student/streak_button.svg";
import { ReactComponent as ActivitiesIcon } from "../../images/student/activities_button.svg";
import { ReactComponent as BadgesIcon } from "../../images/student/badges_button.svg";
import { ReactComponent as LeaderboardIcon } from "../../images/student/leaderboard_button.svg";

// Tab images
import activityTab from "../../images/student/activity_tab.png";
import mentorTab from "../../images/student/mento_tab.png";
import prodevTab from "../../images/student/prodev_tab.png";
import mathTab from "../../images/student/math_tab.png";
import gamesTab from "../../images/student/games_tab.png";
import puzzlesTab from "../../images/student/puzzles_tab.png";
import playTab from "../../images/student/play_tab.png";
import recordingsTab from "../../images/student/recordings_tab.png";

// Main Student Profile Component
const NewStudentProfile = ({ userPortraitSrc }: any) => {

  // State for managing currently open modal
  const [activeModal, setActiveModal] = useState<null | "streak" | "activities" | "badges" | "leaderboard">(null);

  // State for managing active content tab
  const [activeTab, setActiveTab] = useState("activity");
  const [previousTab, setPreviousTab] = useState("");

  // Animation states
  const [isLoading, setIsLoading] = useState(true);
  const [animateContent, setAnimateContent] = useState(false);
  const [visibleTimeCards, setVisibleTimeCards] = useState<number[]>([]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Cookie state to get login token
  const [cookies] = useCookies(['login']);

  // Hooks for routing
  const navigate = useNavigate();
  const location = useLocation();

  // User info
  const [username, setUsername] = useState(" ");
  const [firstName, setFirstName] = useState(" ");
  const [lastName, setLastName] = useState(" ");
  const [mentorUsername, setMentorUsername] = useState("");

  // Time spent on different activities (header display)
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

  // Event tracking for pagination
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

   // Mapping of tab keys to custom image imports
  const tabImages: Record<string, string> = {
    activity: activityTab,
    mentor: mentorTab,
    prodev: prodevTab,
    mathLessons: mathTab,
    games: gamesTab,
    puzzles: puzzlesTab,
    playComputer: playTab,
    recordings: recordingsTab,
  };

  // states for lessons tab
  const [lessonSelected, setLessonSelected] = useState(false); // whether user has navigated into a lesson
  const [piece, setPiece] = useState(""); // lesson name for props
  const [lessonNum, setLessonNum] = useState(0); // lesson number for props

  // Current date for display
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    })
  );

  // Animation utility functions
  const staggerTimeCards = () => {
    setVisibleTimeCards([]);
    events.forEach((_, index) => {
      setTimeout(() => {
        setVisibleTimeCards(prev => [...prev, index]);
      }, index * 100); // 100ms delay between each card
    });
  };

  const handleTabTransition = (newTab: string) => {
    if (newTab !== activeTab) {
      setPreviousTab(activeTab);
      setAnimateContent(false);
      
      // Small delay to allow fade out, then switch tab and fade in
      setTimeout(() => {
        setActiveTab(newTab);
        setAnimateContent(true);
      }, 150);
    }
  };

  // Fetch user data and stats when component mounts
  useEffect(() => {
    const initializeComponent = async () => {
      setIsLoading(true);
      try {
        await fetchUserData(); // asynchronously fetch user data upon mounting
        await fetchMentorData();
      } catch (err) {
        console.log(err);
      } finally {
        // Simulate minimum loading time for smooth animation
        setTimeout(() => {
          setIsLoading(false);
          setAnimateContent(true);
        }, 800);
      }
    };
    
    initializeComponent();
  }, []);

  // Stagger time card animations when events change
  useEffect(() => {
    if (events.length > 0 && !loading) {
      staggerTimeCards();
    }
  }, [events, loading]);

  // Add scroll listener to activity feed container for infinite scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const handleScroll = () => {
      // If scrolling within 50px of displayed height
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        fetchActivity(username); // Fetch new activity
      }
    };
    
    el.addEventListener("scroll", handleScroll); // Add listener to the updated activity element
    return () => el.removeEventListener("scroll", handleScroll); // Remove listener when dependencies are updated
  }, [loading, username]);

  // Fetch user info, usage stats, and activity history
  const fetchUserData = async () => {
    const uInfo = await SetPermissionLevel(cookies);
    //if (uInfo.error) {
    //  navigate("/login");
    //} else {
    //  setUsername(uInfo.username);
     // setFirstName(uInfo.firstName);
     // setLastName(uInfo.lastName);
    //}
    //fetchUsageTime(uInfo.username);
    //fetchGraphData(uInfo.username);
    //fetchActivity(uInfo.username);
  }

  // Fetch mentor data
  const fetchMentorData = async () => {
    fetch(`${environment.urls.middlewareURL}/user/getMentorship`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${cookies.login}` }
    }).then(data => data.json())
      .then(data => {
        if (data) {
          setMentorUsername(data.username);
        }
      });
  }

  // Fetch time spent on different categories
  const fetchUsageTime = async (username: string) => {
    const responseStats = await fetch(
      `${environment.urls.middlewareURL}/timeTracking/statistics?username=${username}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${cookies.login}` }
      }
    );
    const dataStats = await responseStats.json();
    // Update time usage for different events in header display
    setWebTime(dataStats.website);
    setLessonTime(dataStats.lesson);
    setPlayTime(dataStats.play);
    setMentorTime(dataStats.mentor);
    setPuzzleTime(dataStats.puzzle);
  }

  // Fetch latest usage history (Activity Tab)
  const fetchActivity = async (username: string) => {
    if (loading || !hasMore) return; // Return if already fetching or no more activity left
    setLoading(true);
    const limit = 6; // Fetch at most 6 activities at a time
    const skip = page * limit; // Skip over previously fetched data
    try {
      // Fetch another batch of usage history
      const responseLatest = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/latest?username=${username}&limit=${limit}&skip=${skip}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${cookies.login}` }
        }
      );
      const dataLatest = await responseLatest.json();
      setEvents(prev => [...prev, ...dataLatest]); //Append more events to old list
      setPage(prev => prev + 1); // Update pagination number
      setHasMore(dataLatest.length === limit && dataLatest.length > 0); // If there are more activities
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch events", err);
      setLoading(false);
    }
  }

  // Fetch data for graph visualization
  const fetchGraphData = async (username: string) => {
    try {
      // Fetch time spent on the website in the past few months
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
        let months = value.map((item: any) => item.monthText); // month list for ploting
        let times = value.map((item: any) => item.timeSpent); // timeSpent for plotting

        setMonthAxis(months);
        newDataAxis[event] = times;
      }

      // update for graph plotting
      setDataAxis(newDataAxis); 
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  }

  // Handle tab switch with animation
  const handleTabClick = (tab: string) => {
    handleTabTransition(tab);
  };

  // Handle modal opening with animation
  const handleModalOpen = (modalType: "streak" | "activities" | "badges" | "leaderboard") => {
    // Add a small delay for button press animation
    setTimeout(() => {
      setActiveModal(modalType);
    }, 100);
  };

  // Redirect user when clicking on an activity item (e.g., lesson)
  const handleNavigateEvent = (type: string, name: string) => {
    if (type == "lesson") {
      navigate("/lessons", { state: { piece: name } });
    } else if (type =="puzzle") {
      navigate("/puzzles");
    }
  }

  // Render content based on active tab
  const renderTabContent = () => {
    const contentClass = `inventory-content ${animateContent ? 'active-content' : ''}`;
    
    switch (activeTab) {
      case "activity":
        return (
          <div id="inventory-content-activity" className={contentClass}>
            <div className="inventory-content-headingbar">
              <h2>Activity</h2>
              <h4>{date}</h4>
            </div>
            <div className="inventory-content-line"></div>
            <div className="inventory-content-body" ref={containerRef}>
              {events && events.map((event: any, index: number) => {
                const dateObj = new Date(event.startTime);
                const dateStr = dateObj.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
                const timeStr = dateObj.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                });

                const isVisible = visibleTimeCards.includes(index);
                const cardStyle = {
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.5s ease ${index * 0.1}s`
                };

                return (
                  <article key={index} className="inventory-content-timecard" style={cardStyle}>
                    <div className="inventory-content-col1"></div>
                    <div className="inventory-content-col2">
                      <p>
                        <span className="inventory-date">{dateStr}</span>
                        <br />
                        <span className="inventory-time">{timeStr}</span>
                      </p>
                    </div>
                    <div className="inventory-content-col3">
                      <p>
                        Working on :{' '}
                        {event.eventName == "Untitled event" ? (
                          <strong 
                            onClick={() => handleNavigateEvent(event.eventType, event.eventName)}
                            className="clickable-event"
                          >
                            {event.eventType}
                          </strong>
                        ) : (
                          <strong 
                            onClick={() => handleNavigateEvent(event.eventType, event.eventName)}
                            className="clickable-event"
                          >
                            {event.eventName}
                          </strong>
                        )}
                      </p>
                    </div>
                  </article>
                );
              })}
              {loading && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px',
                  animation: 'pulse 1.5s infinite'
                }}>
                  <p>Loading more...</p>
                </div>
              )}
              {!hasMore && events.length > 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px',
                  opacity: '0.7'
                }}>
                  <p>No more activity left!</p>
                </div>
              )}
            </div>
          </div>
        );
      case "mentor":
        return (
          <div id="inventory-content-mentor" className={contentClass}>
            <div className="inventory-content-headingbar">
              <h2>Mentor</h2>
              <h4>{date}</h4>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>This is the content for the Mentor tab.</p>
            </div>
          </div>
        );
      case "prodev":
        return (
          <div id="inventory-content-learning" className={contentClass}>
            <Lessons styleType={"profile"}/>
          </div>
        );
      case "mathLessons":
        return (
          <div id="inventory-content-lessons" className={contentClass}>
            {lessonSelected ? (
              <LessonOverlay 
                propPieceName={piece} 
                propLessonNumber={lessonNum} 
                navigateFunc={() => {
                  setLessonSelected(false);
                }} 
                styleType="profile"
              />
            ) : (
              <LessonSelection 
                styleType="profile" 
                onGo={(selectedScenario: string, lessonNum: number) => { 
                  setLessonSelected(true);
                  setPiece(selectedScenario);
                  setLessonNum(lessonNum);
                }}
              />
            )}
          </div>
        );
      case "games":
        return (
          <div id="inventory-content-games" className={contentClass}>
            <div className="inventory-content-headingbar">
              <h2>Games</h2>
              <h4>{date}</h4>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>This is the content for the Games tab.</p>
            </div>
          </div>
        );
      case "puzzles":
        return (
          <div id="inventory-content-puzzles" className={contentClass}>
            <Puzzles 
              student={username} 
              mentor={mentorUsername} 
              role={"student"} 
              styleType="profile" 
            />
          </div>
        );
      case "playComputer":
        return (
          <div id="inventory-content-computer" className={contentClass}>
            <div className="inventory-content-headingbar">
              <h2>Play with Computer</h2>
              <h4>{date}</h4>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>This is the content for the Play with Computer tab.</p>
            </div>
          </div>
        );
      case "recordings":
        return (
          <div id="inventory-content-recordings" className={contentClass}>
            <div className="inventory-content-headingbar">
              <h2>Recordings</h2>
              <h4>{date}</h4>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>This is the content for the Recordings tab.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className={contentClass}>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h2>Select a tab to view its content.</h2>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#e5f3d2',
        fontSize: '1.5rem',
        fontFamily: '"Roboto", sans-serif'
      }}>
        <div style={{ animation: 'pulse 1.5s infinite' }}>
          Loading your profile...
        </div>
      </div>
    );
  }

  // Final render return block
  return (
    <main id="main-inventory-content">
      {/* Toolbar with modal triggers */}
      <section className="inv-toolbar">
        <div className="inv-toolbar-buttons">
          <button
            className={`toolbar-button ${activeModal === "streak" ? "active" : ""} ${hoveredButton === "streak" ? "hovered" : ""}`}
            aria-label="Streak"
            onClick={() => handleModalOpen("streak")}
            onMouseEnter={() => setHoveredButton("streak")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <StreakIcon className="toolbar-icon" />
          </button>
          <button
            className={`toolbar-button ${activeModal === "activities" ? "active" : ""} ${hoveredButton === "activities" ? "hovered" : ""}`}
            aria-label="Activities"
            onClick={() => handleModalOpen("activities")}
            onMouseEnter={() => setHoveredButton("activities")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <ActivitiesIcon className="toolbar-icon" />
          </button>
          <button
            className={`toolbar-button ${activeModal === "badges" ? "active" : ""} ${hoveredButton === "badges" ? "hovered" : ""}`}
            aria-label="Badges"
            onClick={() => handleModalOpen("badges")}
            onMouseEnter={() => setHoveredButton("badges")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <BadgesIcon className="toolbar-icon" />
          </button>
          <button
            className={`toolbar-button ${activeModal === "leaderboard" ? "active" : ""} ${hoveredButton === "leaderboard" ? "hovered" : ""}`}
            aria-label="Leaderboard"
            onClick={() => handleModalOpen("leaderboard")}
            onMouseEnter={() => setHoveredButton("leaderboard")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <LeaderboardIcon className="toolbar-icon" />
          </button>
        </div>
      </section>

      {/* Welcome section with portrait */}
      <section className="inv-intro">
        <div className="inv-intro-portrait">
          <img className="inv-intro-portrait-face" src={userPortraitSrc} alt="user portrait" />
          <img className="inv-intro-portrait-camera" src={Images.userPortraitCamera} alt="user portrait camera icon" />
        </div>
        <div className="inv-intro-welcome">
          <h1>Hello, {firstName} {lastName}!</h1>
        </div>
      </section>

      {/* Analytics section: graph and metrics */}
      <section className="inv-inventory">
        <div className="inv-inventory-topbar">
          <h2 className="progress-heading">Your Progress</h2>
        </div>
        <div className="inv-inventory-analytics">
          <div className="inv-inventory-analytics-graph">
            <StatsChart key={monthAxis.join(',')} monthAxis={monthAxis} dataAxis={dataAxis}/>
          </div>
          <div className="inv-inventory-analytics-metrics">
            <h3>Time Spent:</h3>
            <ul>
              <li style={{ animationDelay: '1.0s' }}>Website: <strong>{webTime} min</strong></li>
              <li style={{ animationDelay: '1.1s' }}>Playing: <strong>{playTime} min</strong></li>
              <li style={{ animationDelay: '1.2s' }}>Lessons: <strong>{lessonTime} min</strong></li>
              <li style={{ animationDelay: '1.3s' }}>Puzzle: <strong>{puzzleTime} min</strong></li>
              <li style={{ animationDelay: '1.4s' }}>Mentoring: <strong>{mentorTime} min</strong></li>
            </ul>
          </div>
        </div>

        {/* Tab buttons and tab content section */}
        <div className="inv-inventory-content-section">
          <nav className="inv-inventory-content-tabs">
            <ul>
            {Object.keys(tabImages).map((tab, index) => (
              <li key={tab} style={{ animationDelay: `${1.5 + index * 0.1}s` }}>
                <button
                  className={`inventory-tab ${activeTab === tab ? "active-tab" : ""}`}
                  onClick={() => handleTabClick(tab)}
                  aria-label={tab}
                  style={{
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <img src={tabImages[tab]} alt={`${tab} icon`} />
              </button>
            </li>
            ))}
            </ul>
          </nav>
          <div className="inv-inventory-content-content">
            {renderTabContent()}
          </div>
        </div>
      </section>
      
      {/* Render modals conditionally with fade in animation */}
      {activeModal === "streak" && (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          <StreakModal onClose={() => setActiveModal(null)} />
        </div>
      )}
      {activeModal === "activities" && (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          <ActivitiesModal onClose={() => setActiveModal(null)} />
        </div>
      )}
      {activeModal === "badges" && (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          <BadgesModal onClose={() => setActiveModal(null)} />
        </div>
      )}
      {activeModal === "leaderboard" && (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          <LeaderboardModal onClose={() => setActiveModal(null)} />
        </div>
      )}
      
    </main>
  );
};

export default NewStudentProfile;