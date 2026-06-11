import { useState } from "react";
import DateRangeFilter from "./DateRangeFilter";
import IndividualView from "./IndividualView";
import ZipcodeView from "./ZipcodeView";
import GlobalView from "./GlobalView";

export type AnalyticsTab = "individual" | "zipcode" | "global";

const TABS: Array<{ id: AnalyticsTab; label: string }> = [
  { id: "individual", label: "Individual" },
  { id: "zipcode", label: "Zipcode" },
  { id: "global", label: "Global" },
];

const AnalyticsLayout = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("individual");
  // Date range is shared across all three views (S4.1).
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Analytics</h1>

      {/* Tab bar */}
      <div role="tablist" aria-label="Analytics views" className="flex border-b border-borderLight mb-4 overflow-x-auto">
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
                  ? "border-primary text-primary"
                  : "border-transparent text-gray hover:text-dark"
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
        className="bg-white border border-borderLight rounded-lg p-4 min-h-[12rem]"
      >
        {activeTab === "individual" ? (
          <IndividualView startDate={startDate} endDate={endDate} />
        ) : activeTab === "zipcode" ? (
          <ZipcodeView startDate={startDate} endDate={endDate} />
        ) : (
          <GlobalView startDate={startDate} endDate={endDate} />
        )}
      </section>
    </div>
  );
};

export default AnalyticsLayout;
