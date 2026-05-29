interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

const LoadingSpinner = ({ label = "Loading…", className = "" }: LoadingSpinnerProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 text-gray-500 ${className}`}
    >
      <span
        className="inline-block h-4 w-4 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
};

export default LoadingSpinner;
