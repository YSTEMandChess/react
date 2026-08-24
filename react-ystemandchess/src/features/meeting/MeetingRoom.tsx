import { VideoCall } from "../../components/VideoCall";
import { useMeeting } from "./useMeeting";

/**
 * MeetingRoom — the mentor⇄student live lesson, ported from the Angular play page.
 *
 * Drop into either profile:
 *   <MeetingRoom role="student" />   // student side (finds a mentor)
 *   <MeetingRoom role="mentor" />    // mentor side  (finds a student)
 *
 * The lesson is recorded automatically by the server the moment the pair is
 * matched (pairUp → startRecording) and stopped on End Lesson (endMeeting →
 * stopRecording); this component just drives the lifecycle and shows the video.
 *
 * UIDs mirror the Angular client (mentor 123, student 456) so a mentor still on
 * the Angular app and a student on React land on the same channel correctly.
 */

const MeetingRoom = ({ role }: { role: "mentor" | "student" }) => {
  const { state, meeting, error, startLesson, cancelSearch, endLesson, reset } =
    useMeeting({ role });

  const otherRole = role === "mentor" ? "student" : "mentor";
  const uid = role === "mentor" ? 123 : 456;

  return (
    <div className="w-full h-full">
      <h2 className="text-2xl font-bold text-dark mb-4">
        {role === "mentor" ? "Teach a Student" : "Mentor Session"}
      </h2>

      {state === "idle" && (
        <div className="rounded-md bg-white p-4 shadow">
          <p className="text-dark mb-3">
            Start a live lesson. You'll be matched with an available {otherRole},
            and the session is <span className="font-semibold">recorded</span> so it
            can be reviewed later.
          </p>
          <button
            onClick={startLesson}
            className="rounded-md bg-yellow-300 px-4 py-2 font-bold text-black shadow"
          >
            Start Lesson
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {state === "searching" && (
        <div className="rounded-md bg-white p-4 shadow">
          <p className="text-dark">Looking for an available {otherRole}…</p>
          <button
            onClick={cancelSearch}
            className="mt-3 rounded-md bg-gray-200 px-4 py-2 font-semibold"
          >
            Cancel
          </button>
        </div>
      )}

      {state === "in-meeting" && meeting && (
        <div className="rounded-md bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-red-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />
              Recording
            </span>
            <button
              onClick={endLesson}
              className="rounded-md bg-red-500 px-4 py-2 font-bold text-white shadow"
            >
              End Lesson
            </button>
          </div>
          <VideoCall channel={meeting.meetingId} uid={uid} />
        </div>
      )}

      {state === "ended" && (
        <div className="rounded-md bg-white p-4 shadow">
          <p className="text-dark">Lesson ended. The recording has been saved.</p>
          <button
            onClick={reset}
            className="mt-3 rounded-md bg-yellow-300 px-4 py-2 font-bold text-black shadow"
          >
            Start Another
          </button>
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;
