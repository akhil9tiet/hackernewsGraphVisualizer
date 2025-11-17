
import React, { useState, useEffect, useCallback } from 'react';
import { getGraphData } from './services/hackerNewsService';
import type { GraphData } from './types';
import ForceGraph from './components/ForceGraph';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [storyCount, setStoryCount] = useState<number>(50);

  const fetchData = useCallback(async (count: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getGraphData(count);
      setGraphData(data);
    } catch (err) {
      setError('Failed to fetch Hacker News data. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(storyCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(storyCount);
  };

  const handleStoryCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCount = parseInt(e.target.value, 10);
    setStoryCount(newCount);
    fetchData(newCount);
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-100 font-sans relative">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg p-4 absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-500">
            Hacker News Graph Visualizer
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="story-count" className="text-sm font-medium text-gray-300">Stories:</label>
              <select
                id="story-count"
                value={storyCount}
                onChange={handleStoryCountChange}
                disabled={isLoading}
                className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:opacity-50"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out disabled:bg-orange-800 disabled:cursor-not-allowed flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 11v-5h-5m-6-1a7.5 7.5 0 1 0 7.5-7.5" />
              </svg>
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full h-full">
        {isLoading && <LoadingSpinner />}
        {error && !isLoading && (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-lg text-red-400">{error}</p>
          </div>
        )}
        {!isLoading && !error && graphData && (
          <ForceGraph data={graphData} />
        )}
      </main>
    </div>
  );
};

export default App;
