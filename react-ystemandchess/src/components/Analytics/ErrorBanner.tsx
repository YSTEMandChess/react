import React from 'react';

interface Props {
  message: string;
}

const ErrorBanner: React.FC<Props> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg my-4">
    {message}
  </div>
);

export default ErrorBanner;
