import { useMemo, useState } from "react";
import { useAnalyticsApi, StudentSummary } from "../../core/hooks/useAnalyticsApi";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBanner from "./ErrorBanner";
import StudentDetailPanel from "./StudentDetailPanel";

interface IndividualViewProps {
  startDate: string;
  endDate: string;
}

/**
 * Individual analytics: search/list of students on the left, the selected
 * student's detail panel on the right. Selecting a student opens
 * StudentDetailPanel (stat cards, profile, time chart, activity feed).
 */
const IndividualView = ({ startDate, endDate }: IndividualViewProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dateRangeReady = Boolean(startDate && endDate);

  // The student list is fetched per date range; search filters it client-side
  // (no refetch). Swap to a server-side `q` param once the real endpoint lands.
  const { data, loading, error, refetch } = useAnalyticsApi<StudentSummary[]>({
    endpoint: "/analytics/individual",
    params: { startDate, endDate },
    enabled: dateRangeReady,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!submittedQuery) return data;
    const needle = submittedQuery.toLowerCase();
    return data.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.username.toLowerCase().includes(needle),
    );
  }, [data, submittedQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchInput.trim());
    setSelectedId(null);
  };

  if (!dateRangeReady) {
    return <p className="text-muted">Select a start and end date to load analytics.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      {/* Search + student list */}
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex gap-2" role="search">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search students"
            className="flex-1 border border-borderLight rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
          >
            Search
          </button>
        </form>

        {loading && <LoadingSpinner />}
        {error && <ErrorBanner message={error.message} onRetry={refetch} />}

        {!loading && !error && (
          <ul className="divide-y divide-borderLight border border-borderLight rounded-lg">
            {filtered.length === 0 ? (
              <li className="p-3 text-sm text-muted">No data for this period.</li>
            ) : (
              filtered.map((student) => {
                const selected = student.id === selectedId;
                return (
                  <li key={student.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(student.id)}
                      aria-pressed={selected}
                      className={`w-full text-left p-3 flex justify-between text-sm transition ${
                        selected ? "bg-soft" : "hover:bg-light"
                      }`}
                    >
                      <span className="text-gray">
                        <span className="font-medium text-dark">{student.name}</span>
                        <span className="text-muted"> · @{student.username}</span>
                      </span>
                      <span className="font-mono text-dark">{student.totalHours}h</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {/* Selected student detail */}
      <div>
        {selectedId ? (
          <StudentDetailPanel
            studentId={selectedId}
            startDate={startDate}
            endDate={endDate}
          />
        ) : (
          <p className="text-muted text-sm">Select a student to view details.</p>
        )}
      </div>
    </div>
  );
};

export default IndividualView;
