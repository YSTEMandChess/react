import { useEffect, useRef, useState } from "react";
import {
  useAnalyticsApi,
  ActivityEvent,
  ActivityPage,
  ActivityType,
} from "../../core/hooks/useAnalyticsApi";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBanner from "./ErrorBanner";

interface ActivityFeedProps {
  studentId: string;
}

/** Brand-coloured dot per activity type. */
const TYPE_INDICATOR: Record<ActivityType, string> = {
  lesson: "bg-primary",
  puzzle: "bg-accent",
  game: "bg-secondary",
  badge: "bg-dark",
  login: "bg-muted",
};

/**
 * Infinite-scroll, paginated activity feed for a single student. Each page is
 * fetched via the analytics hook; an IntersectionObserver sentinel loads the
 * next page as it scrolls into view. Falls back to a "Load more" button where
 * IntersectionObserver is unavailable (e.g. jsdom).
 */
const ActivityFeed = ({ studentId }: ActivityFeedProps) => {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ActivityEvent[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, loading, error, refetch } = useAnalyticsApi<ActivityPage>({
    endpoint: `/analytics/individual/${studentId}/activity`,
    params: { page },
    enabled: Boolean(studentId),
  });

  // Reset the accumulated feed whenever the selected student changes.
  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
  }, [studentId]);

  // Append (or replace, on page 0) as each page resolves.
  useEffect(() => {
    if (!data) return;
    setItems((prev) => (page === 0 ? data.items : [...prev, ...data.items]));
    setHasMore(data.nextPage !== null);
    // `page` is intentionally omitted: this should run once per resolved page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Advance to the next page when the sentinel scrolls into view.
  useEffect(() => {
    if (!hasMore || loading) return;
    if (typeof IntersectionObserver === "undefined") return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setPage((p) => p + 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  if (error && items.length === 0) {
    return <ErrorBanner message={error.message} onRetry={refetch} />;
  }

  if (!loading && items.length === 0) {
    return <p className="text-muted text-sm">No data for this period.</p>;
  }

  return (
    <div>
      <ul className="divide-y divide-borderLight border border-borderLight rounded-lg">
        {items.map((evt) => (
          <li key={evt.id} className="p-3 flex items-center gap-3 text-sm">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${TYPE_INDICATOR[evt.type]}`}
              aria-hidden="true"
            />
            <span className="flex-1 text-gray">{evt.title}</span>
            <span className="text-muted whitespace-nowrap">
              {new Date(evt.timestamp).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>

      {/* Sentinel + manual fallback for environments without IntersectionObserver. */}
      <div ref={sentinelRef} className="pt-3">
        {loading && <LoadingSpinner label="Loading more…" />}
        {!loading && hasMore && (
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="w-full text-sm font-medium text-primary hover:opacity-80 py-2"
          >
            Load more
          </button>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-center text-xs text-muted py-2">End of activity</p>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
