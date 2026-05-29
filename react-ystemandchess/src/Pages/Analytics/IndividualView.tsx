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

  const { data, loading, error } = useAnalyticsApi<AnalyticsRecord[]>({
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
    return <p className="text-gray-500">Select a start and end date to load analytics.</p>;
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
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Search
        </button>
      </form>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error.message} />}

      {!loading && !error && (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
          {filtered.length === 0 ? (
            <li className="p-3 text-sm text-gray-500">No results.</li>
          ) : (
            filtered.map((row, idx) => (
              <li
                key={`${row.date}-${row.metric}-${idx}`}
                className="p-3 flex justify-between text-sm"
              >
                <span className="text-gray-700">
                  <span className="font-medium">{row.metric}</span>
                  <span className="text-gray-500"> · {row.date}</span>
                </span>
                <span className="font-mono text-gray-900">{row.value}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default IndividualView;
