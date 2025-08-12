import { environment } from "../../../environments/environment";
import { SetPermissionLevel } from "../../../globals";

// Get logged-in user info
export const fetchUserData = async (
  cookies,
  setUsername,
  setFirstName,
  setLastName,
  navigate
) => {
  const uInfo = await SetPermissionLevel(cookies);
  if (uInfo.error) {
    console.log("Error: user not logged in.");
    navigate("/login");
  } else {
    setUsername(uInfo.username);
    setFirstName(uInfo.firstName);
    setLastName(uInfo.lastName);
  }
};

// Get usage time statistics
export const fetchUsageTime = async (
  username,
  cookies,
  setWebTime,
  setLessonTime,
  setPlayTime,
  setMentorTime,
  setPuzzleTime
) => {
  const responseStats = await fetch(
    `${environment.urls.middlewareURL}/timeTracking/statistics?username=${username}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${cookies.login}` },
    }
  );
  const dataStats = await responseStats.json();
  setWebTime(dataStats.website);
  setLessonTime(dataStats.lesson);
  setPlayTime(dataStats.play);
  setMentorTime(dataStats.mentor);
  setPuzzleTime(dataStats.puzzle);
};

// Get student mentorship info
export const fetchStudentData = async (
  cookies,
  setStudentFirstName,
  setStudentLastName,
  setStudentUsername,
  setHasStudent
) => {
  const res = await fetch(
    `${environment.urls.middlewareURL}/user/getMentorship`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${cookies.login}` },
    }
  );
  const data = await res.json();
  if (data) {
    setStudentFirstName(data.firstName);
    setStudentLastName(data.lastName);
    setStudentUsername(data.username);
    setHasStudent(true);
    console.log(data);
  }
};

// Assign a stub student to mentorship
export const setStubStudent = async (cookies, stubStudentUsername) => {
  console.log("Setting stub student:", stubStudentUsername);
  const res = await fetch(
    `${environment.urls.middlewareURL}/user/updateMentorship?mentorship=${stubStudentUsername}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cookies.login}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();
  console.log("Set student response:", data);
};

// Get latest activity events
export const fetchActivity = async (
  username,
  cookies,
  loading,
  hasMore,
  page,
  setEvents,
  setPage,
  setHasMore,
  setLoading
) => {
  if (loading || !hasMore) return;

  setLoading(true);
  const limit = 6;
  const skip = page * limit;

  try {
    const res = await fetch(
      `${environment.urls.middlewareURL}/timeTracking/latest?username=${username}&limit=${limit}&skip=${skip}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${cookies.login}` },
      }
    );
    const dataLatest = await res.json();

    setEvents((prev) => [...prev, ...dataLatest]);
    setPage((prev) => prev + 1);
    setHasMore(dataLatest.length === limit && dataLatest.length > 0);
    setLoading(false);
  } catch (err) {
    console.error("Failed to fetch events", err);
    setLoading(false);
  }
};

// Get graph plotting data
export const fetchGraphData = async (
  username,
  displayMonths,
  cookies,
  setMonthAxis,
  setDataAxis
) => {
  try {
    const res = await fetch(
      `${environment.urls.middlewareURL}/timeTracking/graph-data?username=${username}&eventType=website&months=${displayMonths}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${cookies.login}` },
      }
    );
    const data = await res.json();
    const months = data.map((item) => item.monthText);
    const times = data.map((item) => item.timeSpent);

    setMonthAxis(months);
    setDataAxis(times);
  } catch (err) {
    console.error("Failed to fetch graph data", err);
  }
};
