import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Layers, ChevronRight, Folder } from 'lucide-react';
import { AppBackButton } from '../../components/AppBackButton';
import { ThemeToggle } from '../../components/ThemeToggle';

interface Topic {
  id: string;
  name: string;
  description: string;
  _count?: {
    labs: number;
  };
}

export const StudentTopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/student/topics');
      setTopics(res.data.topics);
    } catch (err: any) {
      setError('Unable to load topics. Please try again.');
      console.error('Failed to fetch topics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <AppBackButton fallbackPath="/student/dashboard" label="Back to Dashboard" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Layers className="mr-3 text-indigo-600 dark:text-indigo-400" /> Topics
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Select a topic to view questions.</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading topics...</div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Error Loading Topics</h3>
            <p className="text-red-500 dark:text-red-300 mt-2">{error}</p>
            <button 
              onClick={fetchTopics}
              className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900 transition"
            >
              Retry
            </button>
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Folder className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No assigned topics</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">You currently have no assigned questions categorized by topics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <Link key={topic.id} to={`/student/topics/${topic.id}`} className="block group">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow hover:border-indigo-300 dark:hover:border-indigo-700/50 h-full flex flex-col p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{topic.name}</h3>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">{topic.description}</p>
                  <div className="mt-4 inline-flex items-center text-xs font-semibold bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full w-max">
                    <Folder className="w-3 h-3 mr-1.5" />
                    {topic._count?.labs || 0} Questions
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
