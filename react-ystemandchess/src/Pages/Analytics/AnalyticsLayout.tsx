import { useState } from "react";
import { useAnalyticsApi } from "../../core/hooks/useAnalyticsApi";
import DateRangeFilter from "./DateRangeFilter";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBanner from "./ErrorBanner";
import IndividualView from "./IndividualView";

export type AnalyticsTab = "individual" | "zipcode" | "global";

const TABS: Array<{ id: AnalyticsTab; label: string }> = [
  { id: "individual", label: "Individual" },
  { id: "zipcode", label: "Zipcode" },
  { id: "global", label: "Global" },
];

const AnalyticsLayout = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("individual");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const dateRangeReady = Boolean(startDate && endDate);

  // Individual tab manages its own fetch; the layout-level fetch backs the
  // remaining tabs until they get dedicated views.
  const { data, loading, error } = useAnalyticsApi<unknown>({
    endpoint: `/analytics/${activeTab}`,
    params: { startDate, endDate },
    enabled: dateRangeReady && activeTab !== "individual",
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Analytics</h1>

      {/* Tab bar */}
      <div role="tablist" aria-label="Analytics views" className="flex border-b border-gray-300 mb-4 overflow-x-auto">
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              aria-controls={`analytics-panel-${tab.id}`}
              id={`analytics-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                selected
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        className="mb-6"
      />

      <section
        role="tabpanel"
        id={`analytics-panel-${activeTab}`}
        aria-labelledby={`analytics-tab-${activeTab}`}
        className="bg-white border border-gray-200 rounded-lg p-4 min-h-[12rem]"
      >
        {activeTab === "individual" ? (
          <IndividualView startDate={startDate} endDate={endDate} />
        ) : !dateRangeReady ? (
          <p className="text-gray-500">Select a start and end date to load analytics.</p>
        ) : loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorBanner message={error.message} />
        ) : data ? (
          <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <p className="text-gray-500">No data.</p>
        )}
      </section>
    </div>
  );
};

export default AnalyticsLayout;
