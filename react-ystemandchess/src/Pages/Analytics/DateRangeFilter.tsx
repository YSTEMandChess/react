interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  className?: string;
}

const DateRangeFilter = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = "",
}: DateRangeFilterProps) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <label className="flex flex-col text-sm">
        <span className="text-gray-700 mb-1">Start date</span>
        <input
          type="date"
          value={startDate}
          max={endDate || undefined}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <label className="flex flex-col text-sm">
        <span className="text-gray-700 mb-1">End date</span>
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
    </div>
  );
};

export default DateRangeFilter;
