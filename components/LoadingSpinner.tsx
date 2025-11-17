import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-20">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-orange-500"></div>
      <p className="mt-4 text-lg text-gray-300">Fetching Hacker News Stories...</p>
    </div>
  );
};

export default LoadingSpinner;
