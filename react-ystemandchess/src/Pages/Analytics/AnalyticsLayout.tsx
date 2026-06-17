import React, { useState } from 'react';
import DateRangeFilter, { DateRange } from '../../components/Analytics/DateRangeFilter';
import IndividualView from './IndividualView';
import ZipcodeView from './ZipcodeView';
import GlobalView from './GlobalView';

type Tab = 'individual' | 'zipcode' | 'global';

const TABS: { key: Tab; label: string }[] = [
  { key: 'individual', label: 'Individual' },
  { key: 'zipcode',    label: 'Zipcode' },
  { key: 'global',     label: 'Global' },
];

const AnalyticsLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('individual');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-xl font-bold text-gray-900">Expand Analytics</h1>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="max-w-screen-xl mx-auto flex gap-1 mt-4"
          role="tablist"
          aria-label="Analytics views"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={activeTab === tab.key}
              aria-controls={`panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content panels */}
      <div className="p-6 max-w-screen-xl mx-auto">
        <div
          role="tabpanel"
          id="panel-individual"
          aria-labelledby="tab-individual"
          hidden={activeTab !== 'individual'}
        >
          {activeTab === 'individual' && <IndividualView dateRange={dateRange} />}
        </div>
        <div
          role="tabpanel"
          id="panel-zipcode"
          aria-labelledby="tab-zipcode"
          hidden={activeTab !== 'zipcode'}
        >
          {activeTab === 'zipcode' && <ZipcodeView dateRange={dateRange} />}
        </div>
        <div
          role="tabpanel"
          id="panel-global"
          aria-labelledby="tab-global"
          hidden={activeTab !== 'global'}
        >
          {activeTab === 'global' && <GlobalView dateRange={dateRange} />}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsLayout;
