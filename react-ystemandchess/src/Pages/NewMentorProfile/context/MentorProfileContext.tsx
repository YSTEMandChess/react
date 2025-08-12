import React, { createContext, useContext, useState } from "react";

interface MentorProfileContextProps {
  // mentor info
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  firstName: string;
  setFirstName: React.Dispatch<React.SetStateAction<string>>;
  lastName: string;
  setLastName: React.Dispatch<React.SetStateAction<string>>;
  hasStudent: boolean; // if the mentor has a student
  setHasStudent: React.Dispatch<React.SetStateAction<boolean>>;

  // student usage stats in different modules
  webTime: number;
  setWebTime: React.Dispatch<React.SetStateAction<number>>;
  playTime: number;
  setPlayTime: React.Dispatch<React.SetStateAction<number>>;
  lessonTime: number;
  setLessonTime: React.Dispatch<React.SetStateAction<number>>;
  puzzleTime: number;
  setPuzzleTime: React.Dispatch<React.SetStateAction<number>>;
  mentorTime: number;
  setMentorTime: React.Dispatch<React.SetStateAction<number>>;

  // data for chart plotting
  displayMonths: number; // display data from N months back
  setDisplayMonths: React.Dispatch<React.SetStateAction<number>>;
  displayEvents: string[]; // list of events to display in the chart
  setDisplayEvents: React.Dispatch<React.SetStateAction<string[]>>;
  monthAxis: string[]; // month labels for X-axis
  setMonthAxis: React.Dispatch<React.SetStateAction<string[]>>;
  dataAxis: { [key: string]: number[] }; // event → time spent per month
  setDataAxis: React.Dispatch<
    React.SetStateAction<{ [key: string]: number[] }>
  >;

  // student info
  studentFirstName: string;
  setStudentFirstName: React.Dispatch<React.SetStateAction<string>>;
  studentLastName: string;
  setStudentLastName: React.Dispatch<React.SetStateAction<string>>;
  studentUsername: string;
  setStudentUsername: React.Dispatch<React.SetStateAction<string>>;

  // event tracking for pagination
  events: any[]; // usage events
  setEvents: React.Dispatch<React.SetStateAction<any[]>>;
  page: number; // pagination page number
  setPage: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean; // loading more events
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  hasMore: boolean; // whether there are more events to load
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
}

const MentorProfileContext = createContext<
  MentorProfileContextProps | undefined
>(undefined);

export const useMentorProfile = () => {
  const context = useContext(MentorProfileContext);
  if (!context) {
    throw new Error(
      "useMentorProfile must be used within MentorProfileProvider"
    );
  }
  return context;
};

export const MentorProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // mentor info
  const [username, setUsername] = useState<string>("");
  const [firstName, setFirstName] = useState<string>(" ");
  const [lastName, setLastName] = useState<string>(" ");
  const [hasStudent, setHasStudent] = useState<boolean>(false); // if the mentor has a student

  // student usage stats in different modules
  const [webTime, setWebTime] = useState<number>(0);
  const [playTime, setPlayTime] = useState<number>(0);
  const [lessonTime, setLessonTime] = useState<number>(0);
  const [puzzleTime, setPuzzleTime] = useState<number>(0);
  const [mentorTime, setMentorTime] = useState<number>(0);

  // data for chart plotting
  const [displayMonths, setDisplayMonths] = useState<number>(6); // display data from 6 months back
  const [displayEvents, setDisplayEvents] = useState<string[]>([
    "website",
    "play",
    "lesson",
    "puzzle",
    "mentor",
  ]);
  const [monthAxis, setMonthAxis] = useState<string[]>([
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
  ]); // display the time as X-axis
  const [dataAxis, setDataAxis] = useState<{ [key: string]: number[] }>({
    website: [0, 0, 0, 0, 0],
  }); // time spent on events each month

  // student info
  const [studentFirstName, setStudentFirstName] = useState<string>("");
  const [studentLastName, setStudentLastName] = useState<string>("");
  const [studentUsername, setStudentUsername] = useState<string>("");

  // event tracking for pagination
  const [events, setEvents] = useState<any[]>([]);
  const [page, setPage] = useState<number>(0); // page number
  const [loading, setLoading] = useState<boolean>(false); // if loading for more events
  const [hasMore, setHasMore] = useState<boolean>(true);

  return (
    <MentorProfileContext.Provider
      value={{
        username,
        setUsername,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        hasStudent,
        setHasStudent,
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
        displayEvents,
        setDisplayEvents,
        monthAxis,
        setMonthAxis,
        dataAxis,
        setDataAxis,
        studentFirstName,
        setStudentFirstName,
        studentLastName,
        setStudentLastName,
        studentUsername,
        setStudentUsername,
        events,
        setEvents,
        page,
        setPage,
        loading,
        setLoading,
        hasMore,
        setHasMore,
      }}
    >
      {children}
    </MentorProfileContext.Provider>
  );
};
