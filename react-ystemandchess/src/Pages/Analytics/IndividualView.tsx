import { useMemo, useState } from "react";
import { useAnalyticsApi, AnalyticsRecord } from "../../core/hooks/useAnalyticsApi";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBanner from "./ErrorBanner";

interface IndividualViewProps {
  startDate: string;
  endDate: string;
}

const IndividualView = ({ startDate, endDate }: IndividualViewProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const dateRangeReady = Boolean(startDate && endDate);

  const { data, loading, error, refetch } = useAnalyticsApi<AnalyticsRecord[]>({
    endpoint: "/analytics/individual",
    params: { startDate, endDate, q: submittedQuery },
    enabled: dateRangeReady,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!submittedQuery) return data;
    const needle = submittedQuery.toLowerCase();
    return data.filter((row) => row.metric.toLowerCase().includes(needle));
  }, [data, submittedQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchInput.trim());
  };

  if (!dateRangeReady) {
    return <p className="text-muted">Select a start and end date to load analytics.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex gap-2" role="search">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by metric…"
          aria-label="Search individual analytics"
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
            <li className="p-3 text-sm text-muted">No results.</li>
          ) : (
            filtered.map((row, idx) => (
              <li
                key={`${row.date}-${row.metric}-${idx}`}
                className="p-3 flex justify-between text-sm"
              >
                <span className="text-gray">
                  <span className="font-medium">{row.metric}</span>
                  <span className="text-muted"> · {row.date}</span>
                </span>
                <span className="font-mono text-dark">{row.value}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default IndividualView;
