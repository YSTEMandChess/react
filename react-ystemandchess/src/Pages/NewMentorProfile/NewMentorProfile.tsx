import React, { useState, useEffect, useRef, useMemo } from "react";
import "./NewMentorProfile.scss";
import Images from "../../images/imageImporter";
import { SetPermissionLevel } from '../../globals'; 
import { useCookies } from 'react-cookie';
import { environment } from '../../environments/environment';
import { useNavigate } from "react-router";
import StatsChart from "../NewStudentProfile/StatsChart";
import Lessons from "../Lessons/Lessons";
import LessonSelection from "../LessonsSelection/LessonsSelection";
import LessonOverlay from "../piece-lessons/lesson-overlay/lesson-overlay";
import Puzzles from "../Puzzles/Puzzles";

interface NewMentorProfileProps {
  userPortraitSrc: string;
  student?: Student; // optional student prop
}

interface Student {
  username: string;
  firstName: string;
  lastName: string;
}

const NewMentorProfile: React.FC<NewMentorProfileProps> = ({ userPortraitSrc }) => {

  const [activeTab, setActiveTab] = useState("activity");
  const [cookies] = useCookies(['login']);
  const navigate = useNavigate();

  // mentor info
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState(" ");
  const [lastName, setLastName] = useState(" ");
  const [hasStudent, setHasStudent] = useState(false); // if the mentor has a student

  // student usage stats in different modules
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

  // student info
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [studentUsername, setStudentUsername] = useState("");

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

  // states for lessons tab
  const [lessonSelected, setLessonSelected] = useState(false); // whether user has navigated into a lesson
  const [piece, setPiece] = useState(""); // lesson name for props
  const [lessonNum, setLessonNum] = useState(0); // lesson number for props

  // Runs once upon first render
  useEffect(()=>{
    fetchStudentData().catch(err => console.log(err)); // fetch student data when the component mounts
    fetchUserData().catch(err => console.log(err)); // fetch user data when the component mounts
  }, [])

  // Loads student data only after hasStudent has been updated
  useEffect(() => {
    if (hasStudent && studentUsername) {
        // fetch student usage time stats to disaply in header
        fetchUsageTime(studentUsername)
        // fetch student data for graph plotting
        fetchGraphData(studentUsername)
        // fetch latest usage history to show in Activity tab
        fetchActivity(studentUsername)
      }
  }, [hasStudent, studentUsername])

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
      const uInfo = await SetPermissionLevel(cookies); // get logged-in user info
      if (uInfo.error) {
        console.log("Error: user not logged in.") // error if the user is not logged in
        navigate("/login"); // redirect to login page
      } else {
        // record user info
        setUsername(uInfo.username);
        setFirstName(uInfo.firstName);
        setLastName(uInfo.lastName)
      }
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

  const fetchStudentData = async () => {
    fetch(`${environment.urls.middlewareURL}/user/getMentorship`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${cookies.login}` }
    }).then(data => data.json())
      .then(data => {
        if (data) {
          setStudentFirstName(data.firstName);
          setStudentLastName(data.lastName);
          setStudentUsername(data.username);
          setHasStudent(true);
        }
      });
  }

  const setStubStudent = async (stubStudentUsername) => {
    console.log("Setting stub student:", stubStudentUsername);
    fetch(`${environment.urls.middlewareURL}/user/updateMentorship?mentorship=${stubStudentUsername}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${cookies.login}`,
                'Content-Type': 'application/json'}
    }).then(data => data.json())
      .then(data => {
        console.log("Set student response:", data);
      });
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
            <Lessons styleType={"profile"}/>
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
              }}/>
            )}
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
            <Puzzles student={studentUsername} mentor={username} role={"mentor"} styleType="profile"/>
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

  const tabContent = useMemo(() => renderTabContent(), [activeTab, events, loading, hasMore]);

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

      { hasStudent ? (
      <section className="inv-inventory">
        <div className="inv-inventory-topbar">
            <h1 className="topbar-greeting">Check in on <strong>{studentFirstName} {studentLastName}'s</strong> progress! </h1>
        </div>
        <div className="inv-inventory-analytics">
          <div className="inv-inventory-analytics-graph">
            <StatsChart key={monthAxis.join(',')} monthAxis={monthAxis} dataAxis={dataAxis}/>
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

          <div className="inv-inventory-content-content">{tabContent}</div>
        </div>
      </section>) : (
      <section className="no-student-message">
        <h1>No Student Selected</h1>
        <p>Please select a student to view their progress.</p>
      </section>
      )}
    </main>
  );
};

export default NewMentorProfile;
