interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

const LoadingSpinner = ({ label = "Loading…", className = "" }: LoadingSpinnerProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 py-10 text-muted ${className}`}
    >
      <span
        className="inline-block h-12 w-12 rounded-full border-4 border-soft border-t-primary animate-spin"
        aria-hidden="true"
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
