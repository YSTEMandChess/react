import { useMemo, useState } from "react";
import { useAnalyticsApi, ZipcodeRow } from "../../core/hooks/useAnalyticsApi";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBanner from "./ErrorBanner";
import ZipcodeDetailPanel from "./ZipcodeDetailPanel";

interface ZipcodeViewProps {
  startDate: string;
  endDate: string;
}

type SortKey = keyof Pick<ZipcodeRow, "zipcode" | "studentCount" | "avgHours">;
type SortDir = "asc" | "desc";

const COLUMNS: Array<{ key: SortKey; label: string; numeric: boolean }> = [
  { key: "zipcode", label: "Zipcode", numeric: false },
  { key: "studentCount", label: "Students", numeric: true },
  { key: "avgHours", label: "Avg hours", numeric: true },
];

/**
 * Zipcode analytics: a searchable, sortable table of all zipcodes (student
 * counts, average hours). Selecting a row opens the comparison detail panel.
 */
const ZipcodeView = ({ startDate, endDate }: ZipcodeViewProps) => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("zipcode");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<string | null>(null);

  const dateRangeReady = Boolean(startDate && endDate);

  const { data, loading, error, refetch } = useAnalyticsApi<ZipcodeRow[]>({
    endpoint: "/analytics/zipcode",
    params: { startDate, endDate },
    enabled: dateRangeReady,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    const filtered = needle
      ? data.filter((r) => r.zipcode.toLowerCase().includes(needle))
      : data;
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (!dateRangeReady) {
    return <p className="text-muted">Select a start and end date to load analytics.</p>;
  }
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error.message} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by zipcode…"
        aria-label="Search zipcodes"
        className="w-full sm:max-w-xs border border-borderLight rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {rows.length === 0 ? (
        <p className="text-muted text-sm">No data for this period.</p>
      ) : (
        <div className="overflow-x-auto border border-borderLight rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borderLight bg-light text-left">
                {COLUMNS.map((col) => {
                  const active = col.key === sortKey;
                  return (
                    <th
                      key={col.key}
                      className="p-3 font-medium text-gray"
                      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 ${
                          active ? "text-primary" : "hover:text-dark"
                        }`}
                      >
                        {col.label}
                        <span aria-hidden="true">
                          {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = row.zipcode === selected;
                return (
                  <tr
                    key={row.zipcode}
                    onClick={() => setSelected(row.zipcode)}
                    className={`border-b border-borderLight last:border-0 cursor-pointer ${
                      isSelected ? "bg-soft" : "hover:bg-light"
                    }`}
                  >
                    <td className="p-3 font-medium text-dark">{row.zipcode}</td>
                    <td className="p-3 text-gray">{row.studentCount}</td>
                    <td className="p-3 text-gray font-mono">{row.avgHours}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <section className="border border-borderLight rounded-lg p-4">
          <ZipcodeDetailPanel zipcode={selected} startDate={startDate} endDate={endDate} />
        </section>
      )}
    </div>
  );
};

export default ZipcodeView;
