import React, { useState, useEffect, useRef } from "react";
import "./NewMentorProfile.scss";
import Images from "../../images/imageImporter";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router";
import { StatsChart } from "../NewStudentProfile/StatsChart";
import TabContent from "./components/tabContent";
import { useMentorProfile } from "./context/MentorProfileContext";
import {
  fetchUserData,
  fetchUsageTime,
  fetchStudentData,
  setStubStudent,
  fetchActivity,
  fetchGraphData,
} from "./helpers/mentorProfileApi";

interface NewMentorProfileProps {
  userPortraitSrc: string;
  student?: Student; // optional student prop
}

interface Student {
  username: string;
  firstName: string;
  lastName: string;
}

const NewMentorProfile: React.FC<NewMentorProfileProps> = ({
  userPortraitSrc,
}) => {
  const [activeTab, setActiveTab] = useState("activity");
  const [cookies] = useCookies(["login"]);
  const navigate = useNavigate();

  const {
    username,
    setUsername,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    hasStudent,
    setHasStudent,
    studentFirstName,
    setStudentFirstName,
    studentLastName,
    setStudentLastName,
    studentUsername,
    setStudentUsername,
    webTime,
    setWebTime,
    playTime,
    setPlayTime,
    lessonTime,
    setLessonTime,
    puzzleTime,
    setPuzzleTime,
    mentorTime,
    setMentorTime,
    displayMonths,
    setDisplayMonths,
    monthAxis,
    setMonthAxis,
    dataAxis,
    setDataAxis,
    events,
    setEvents,
    page,
    setPage,
    loading,
    setLoading,
    hasMore,
    setHasMore,
  } = useMentorProfile();

  const containerRef = useRef<HTMLDivElement>(null);

  // current date for display
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })
  );

  // Runs once upon first render
  useEffect(() => {
    fetchStudentData(
      cookies,
      setStudentFirstName,
      setStudentLastName,
      setStudentUsername,
      setHasStudent
    ).catch((err) => console.log(err)); // fetch student data when the component mounts
    fetchUserData(cookies, setUsername, setFirstName, setLastName, navigate);
  }, []);

  // Loads student data only after hasStudent has been updated
  useEffect(() => {
    if (hasStudent && studentUsername) {
      // fetch student usage time stats to disaply in header
      fetchUsageTime(
        studentUsername,
        cookies,
        setWebTime,
        setLessonTime,
        setPlayTime,
        setMentorTime,
        setPuzzleTime
      );
      // fetch student data for graph plotting
      fetchGraphData(
        studentUsername,
        displayMonths,
        cookies,
        setMonthAxis,
        setDataAxis
      );
      // fetch latest usage history to show in Activity tab
      fetchActivity(
        studentUsername,
        cookies,
        loading,
        hasMore,
        page,
        setEvents,
        setPage,
        setHasMore,
        setLoading
      );
    }
  }, [hasStudent, studentUsername]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        fetchActivity(
          studentUsername,
          cookies,
          loading,
          hasMore,
          page,
          setEvents,
          setPage,
          setHasMore,
          setLoading
        );
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [loading]);

  const handleTabClick = (tab: any) => {
    setActiveTab(tab);
  };

  const handleNavigateEvent = (type: string, name: string) => {
    if (type == "lesson") {
      navigate("/lessons", { state: { piece: name } });
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
          <h1>
            Hello, {firstName} {lastName}!
          </h1>
        </div>
      </section>

      {hasStudent ? (
        <section className="inv-inventory">
          <div className="inv-inventory-topbar">
            <h1 className="topbar-greeting">
              Check in on{" "}
              <strong>
                {studentFirstName} {studentLastName}'s
              </strong>{" "}
              progress!{" "}
            </h1>
          </div>
          <div className="inv-inventory-analytics">
            <div className="inv-inventory-analytics-graph">
              {/* <StatsChart
                key={monthAxis.join(",")}
                monthAxis={monthAxis}
                dataAxis={dataAxis}
              /> */}
            </div>
            <div className="inv-inventory-analytics-metrics">
              <h3>Time Spent:</h3>
              <ul>
                <li>
                  Website: <strong>{webTime} minutes</strong>
                </li>
                <li>
                  Playing: <strong>{playTime} minutes</strong>
                </li>
                <li>
                  Lessons: <strong>{lessonTime} minutes</strong>
                </li>
                <li>
                  Puzzle: <strong>{puzzleTime} minutes</strong>
                </li>
                <li>
                  Mentoring: <strong>{mentorTime} minutes</strong>
                </li>
              </ul>
            </div>
          </div>
          <div className="inv-inventory-content-section">
            <nav className="inv-inventory-content-tabs">
              <ul>
                {[
                  "activity",
                  "mentor",
                  "learning",
                  "chessLessons",
                  "games",
                  "puzzles",
                  "playComputer",
                  "recordings",
                  "backpack",
                ].map((tab) => {
                  const displayName =
                    tab === "chessLessons"
                      ? "Chess Lessons"
                      : tab === "playComputer"
                      ? "Play with Computer"
                      : tab.charAt(0).toUpperCase() + tab.slice(1);

                  return (
                    <div
                      key={tab}
                      className={`inventory-tab ${
                        activeTab === tab ? "active-tab" : ""
                      }`}
                      onClick={() => handleTabClick(tab)}
                    >
                      <img
                        src={Images[`${tab}Icon` as keyof typeof Images]}
                        alt={`${tab} icon`}
                      />
                      <li>{displayName}</li>
                    </div>
                  );
                })}
              </ul>
            </nav>

            <div className="inv-inventory-content-content">
              <TabContent
                activeTab={activeTab}
                date={date}
                events={events}
                loading={loading}
                hasMore={hasMore}
                containerRef={containerRef}
                handleNavigateEvent={handleNavigateEvent}
              />
            </div>
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
