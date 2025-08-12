import React from "react";

interface EventType {
  startTime: string;
  eventType: string;
  eventName: string;
}

interface TabContentProps {
  activeTab: string;
  date: string;
  events: EventType[];
  loading: boolean;
  hasMore: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  handleNavigateEvent: (eventType: string, eventName: string) => void;
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  date,
  events,
  loading,
  hasMore,
  containerRef,
  handleNavigateEvent,
}) => {
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
            {events &&
              events.map((event, index) => {
                const dateObj = new Date(event.startTime);
                const dateStr = dateObj.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const timeStr = dateObj.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <article key={index} className="inventory-content-timecard">
                    <div className="inventory-content-col1"></div>
                    <div className="inventory-content-col2">
                      <p>
                        {dateStr} {timeStr}
                      </p>
                    </div>
                    <div className="inventory-content-col3">
                      <p>
                        Working on {event.eventType}:{" "}
                        <strong
                          onClick={() =>
                            handleNavigateEvent(
                              event.eventType,
                              event.eventName
                            )
                          }
                        >
                          {event.eventName}
                        </strong>
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
        <div
          id="inventory-content-mentor"
          className="inventory-content active-content"
        >
          <h2>Mentor</h2>
          <p>This is the content for the Mentor tab.</p>
        </div>
      );

    case "learning":
      return (
        <div
          id="inventory-content-learning"
          className="inventory-content active-content"
        >
          <h2>Learning</h2>
          <p>This is the content for the Learning tab.</p>
        </div>
      );

    case "chessLessons":
      return (
        <div
          id="inventory-content-lessons"
          className="inventory-content active-content"
        >
          <h2>Chess Lessons</h2>
          <p>This is the content for the Chess Lessons tab.</p>
        </div>
      );

    case "games":
      return (
        <div
          id="inventory-content-games"
          className="inventory-content active-content"
        >
          <h2>Games</h2>
          <p>This is the content for the Games tab.</p>
        </div>
      );

    case "puzzles":
      return (
        <div
          id="inventory-content-puzzles"
          className="inventory-content active-content"
        >
          <h2>Puzzles</h2>
          <p>This is the content for the Puzzles tab.</p>
        </div>
      );

    case "playComputer":
      return (
        <div
          id="inventory-content-computer"
          className="inventory-content active-content"
        >
          <h2>Play with Computer</h2>
          <p>This is the content for the Play with Computer tab.</p>
        </div>
      );

    case "recordings":
      return (
        <div
          id="inventory-content-recordings"
          className="inventory-content active-content"
        >
          <h2>Recordings</h2>
          <p>This is the content for the Recordings tab.</p>
        </div>
      );

    case "backpack":
      return (
        <div
          id="inventory-content-backpack"
          className="inventory-content active-content"
        >
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

export default TabContent;
