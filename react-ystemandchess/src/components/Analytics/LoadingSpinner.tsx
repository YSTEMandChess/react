import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-12">
    <div className="w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin" />
  </div>
);

export default LoadingSpinner;
