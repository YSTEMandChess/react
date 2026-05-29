interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorBanner = ({ message, onRetry, className = "" }: ErrorBannerProps) => {
  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 ${className}`}
    >
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-red-700 underline hover:text-red-900"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
