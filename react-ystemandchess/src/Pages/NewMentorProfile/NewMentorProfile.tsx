import React, { useState, useEffect, useRef } from "react";
import "./NewMentorProfile.scss";
import Images from "../../images/imageImporter";
import { SetPermissionLevel } from '../../globals'; 
import { useCookies } from 'react-cookie';
import { environment } from '../../environments/environment';
import { useNavigate } from "react-router";
import { StatsChart } from "../NewStudentProfile/StatsChart";
import VideoCall from "../../components/VideoCall";
import PlayStudent from "./PlayStudent";
import { start } from "node:repl";

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
  const [monthAxis, setMonthAxis] = useState(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
  const [dataAxis, setDataAxis] = useState([0, 0, 0, 0, 0, 0]); // time spent on events each month

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

  // interval timer for polling whether other users have joined
  let pollingInterval = null;

  // current date for display
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })
);

  // Runs once upon first render
  useEffect(()=>{
    // setStubStudent("joeyman43"); // set a stub student for testing purposes, setting students should happen outside of this component
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

  useEffect(() => {
    if(activeTab == "mentor") {
      fetchMeetingData();
    }
    return () => {
      // if navigated away, stop waiting for others to join
      clearInterval(pollingInterval);
    }
  }, [activeTab]);


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
          setHasStudent(true)
          console.log(data)
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
        `${environment.urls.middlewareURL}/timeTracking/graph-data?username=${username}&eventType=website&months=${displayMonths}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${cookies.login}` }
        }
      );
      const data = await response.json();
      const months = data.map(item => item.monthText); // month list for plotting
      const times = data.map(item => item.timeSpent); // timeSpent for plotting

      // update for graph plotting
      setMonthAxis(months);
      setDataAxis(times);
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  }
  
  const [meetingId, setMeetingId] = useState("");
  const [meetingToken, setMeetingToken] = useState("");

  // try to connect to a meeting
  const fetchMeetingData = async () => {
    try {
      // try to pair up with another user
      const response = await fetch(`${environment.urls.middlewareURL}/meetings/pairUp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cookies.login}` },
        body: ''
      });

      const data = await response.json();
      console.log("Meeting data:", data);
      console.log("Meeting status:", response.status);

      if (data.meetingId && data.token) { // there is another user waiting
        // set up info to start meeting
        setMeetingId(data.meetingId);
        setMeetingToken(data.token);
      } else if (data === "No one is available for matchmaking. Please wait for the next available person") {
        // no others users are available, queue current user & poll to wait 
        fetchQueue();
        startPollingForMatch();
      }

    } catch (error) {
      console.error("Error fetching meeting data:", error);
    }
  };

  // queue the mentor if there are no students waiting to be matched
  const fetchQueue = async () => {
    try {
      const response = await fetch(`${environment.urls.middlewareURL}/meetings/queue`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cookies.login}` }
      });

      // logging data
      const data = await response.json();
      console.log("Queue data:", data);

    } catch (error) {
      console.error("Error fetching queue:", error);
    }
  };

  // fetch periodically to see if another user has requested a pair up
  const startPollingForMatch = () => {
    pollingInterval = setInterval(async () => {
      // checking if the user is being paired up in a meeting
      const response = await fetch(`${environment.urls.middlewareURL}/meetings/inMeeting`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cookies.login}`,
          'Content-Type': 'application/json',
        }
      });

      // logging data
      const data = await response.json();
      console.log(data);

      if (Array.isArray(data) && data[0].meetingId && data[0].token) {
        // if being paired up, stop polling
        clearInterval(pollingInterval);

        // set up info to start meeting
        console.log("Matched! Meeting ID:", data[0].meetingId);
        setMeetingId(data[0].meetingId);
        setMeetingToken(data[0].token);
      } else {
        console.log("Still waiting...");
      }
    }, 3000); // fetch every 3 seconds
  };
  
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
            
            <PlayStudent chessLessonSrc={environment.urls.chessClientURL} meetingId={meetingId} />
            <VideoCall meetingId={meetingId} meetingToken={meetingToken} />
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

      { hasStudent ? (
      <section className="inv-inventory">
        <div className="inv-inventory-topbar">
            <h1 className="topbar-greeting">Check in on <strong>{studentFirstName} {studentLastName}'s</strong> progress! </h1>
        </div>
        <div className="inv-inventory-analytics">
          <div className="inv-inventory-analytics-graph">
            <StatsChart key={dataAxis.join(',')} monthAxis={monthAxis} dataAxis={dataAxis}/>
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
