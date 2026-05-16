import React from 'react';

export interface DateRange {
  from: string;
  to: string;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const DateRangeFilter: React.FC<Props> = ({ value, onChange }) => (
  <div className="flex items-center gap-3">
    <label className="text-sm text-gray-600 font-medium">From</label>
    <input
      type="date"
      value={value.from}
      onChange={(e) => onChange({ ...value, from: e.target.value })}
      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
    />
    <label className="text-sm text-gray-600 font-medium">To</label>
    <input
      type="date"
      value={value.to}
      onChange={(e) => onChange({ ...value, to: e.target.value })}
      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
    />
    {(value.from || value.to) && (
      <button
        onClick={() => onChange({ from: '', to: '' })}
        className="text-sm text-gray-400 hover:text-gray-600 underline"
      >
        Clear
      </button>
    )}
  </div>
);

export default DateRangeFilter;
