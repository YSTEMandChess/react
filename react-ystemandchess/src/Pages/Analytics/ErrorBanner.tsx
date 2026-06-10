interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorBanner = ({ message, onRetry, className = "" }: ErrorBannerProps) => {
  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 border border-red bg-redLight text-red rounded-lg px-4 py-3 ${className}`}
    >
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-red underline hover:opacity-80"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
