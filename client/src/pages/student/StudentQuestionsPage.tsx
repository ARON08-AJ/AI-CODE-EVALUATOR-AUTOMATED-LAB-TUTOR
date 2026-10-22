import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { BookOpen, Terminal } from 'lucide-react';
import { AppBackButton } from '../../components/AppBackButton';
import { ThemeToggle } from '../../components/ThemeToggle';

interface Tag {
  id: string;
  name: string;
}

interface Lab {
  id: string;
  title: string;
  difficulty: string;
  supportedLanguages: string;
  createdAt: string;
  tags?: Tag[];
}

interface Topic {
  id: string;
  name: string;
  description: string;
}

export const StudentQuestionsPage: React.FC = () => {
  const { id: topicId } = useParams<{ id: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/tags').then(res => setAllTags(res.data.tags)).catch(() => {});
  }, []);

  const fetchLabs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedTagId) params.tagId = selectedTagId;

      const res = await api.get(`/student/topics/${topicId}/labs`, { params });
      setTopic(res.data.topic);
      setLabs(res.data.labs);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else if (err.response?.status === 403) {
        setError("You don't have permission to access this page.");
      } else {
        setError('Unable to load questions. Please try again.');
      }
      console.error('Failed to fetch questions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [topicId, selectedTagId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
          <div className="mb-4 flex items-center justify-between">
            <AppBackButton fallbackPath="/student/topics" label="Back to Topics" />
            <ThemeToggle />
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Terminal className="mr-3 text-indigo-600 dark:text-indigo-400" /> {topic ? topic.name : 'Questions'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{topic ? topic.description : 'Browse and solve questions for this topic.'}</p>
            </div>
            {allTags.length > 0 && (
              <div>
                <select
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  className="rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                >
                  <option value="">All Tags</option>
                  {allTags.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading questions...</div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Error Loading Questions</h3>
            <p className="text-red-500 dark:text-red-300 mt-2">{error}</p>
            <button 
              onClick={fetchLabs}
              className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900 transition"
            >
              Retry
            </button>
          </div>
        ) : labs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No assigned questions</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">You currently have no questions matching your filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map((lab) => (
              <div key={lab.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      lab.difficulty === 'EASY' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                      lab.difficulty === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {lab.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{lab.title}</h3>
                  {lab.tags && lab.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {lab.tags.map(t => (
                        <span key={t.id} className="px-2 py-0.5 text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-mono">
                    Languages: {lab.supportedLanguages}
                  </div>
                </div>
                <div className="p-4 border-t border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Link 
                    to={`/student/labs/${lab.id}`}
                    className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors"
                  >
                    View Problem
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
