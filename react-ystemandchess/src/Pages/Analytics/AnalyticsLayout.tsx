import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
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
  const [cookies] = useCookies(['login']);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('individual');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!cookies.login) {
      navigate('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(cookies.login.split('.')[1]));
      if (payload.role !== 'admin') {
        navigate('/login');
        return;
      }
    } catch {
      navigate('/login');
      return;
    }
    setAuthChecked(true);
  }, [cookies.login, navigate]);

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-gray-900">Expand Analytics</h1>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
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

      {/* Content */}
      <div className="p-6">
        {activeTab === 'individual' && <IndividualView dateRange={dateRange} />}
        {activeTab === 'zipcode'    && <ZipcodeView dateRange={dateRange} />}
        {activeTab === 'global'     && <GlobalView  dateRange={dateRange} />}
      </div>
    </div>
  );
};

export default AnalyticsLayout;
