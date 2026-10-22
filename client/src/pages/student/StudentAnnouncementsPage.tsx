import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { 
  Bell, 
  ArrowLeft, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const StudentAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async (pageToFetch: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/student/announcements?page=${pageToFetch}&limit=20`);
      setAnnouncements(res.data.announcements);
      setPagination(res.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(pagination.page);
  }, [pagination.page]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header Banner */}
      <div className="bg-indigo-600 dark:bg-indigo-900 pb-24 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/student/dashboard" 
                className="p-2 rounded-lg bg-indigo-500/50 hover:bg-indigo-500 text-white transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-7 h-7 text-amber-300" /> Announcements & Notices
                </h1>
                <p className="text-indigo-100 dark:text-indigo-200 text-sm mt-1">
                  Stay updated with important programming lab updates, instructions, and notices.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 space-y-6 pb-16">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm">Loading announcements feed...</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">{error}</p>
            <button
              onClick={() => fetchAnnouncements(pagination.page)}
              className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-sm font-medium rounded-lg hover:bg-red-200 transition"
            >
              Retry
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Announcements Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              There are no announcements published at this time. Check back later for updates from your faculty.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div 
                key={announcement.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition hover:shadow-md"
              >
                <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {announcement.title}
                  </h2>
                  <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md shrink-0">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {new Date(announcement.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line leading-relaxed mb-4">
                  {announcement.content}
                </div>

                <div className="pt-3 border-t border-gray-50 dark:border-gray-700/40 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center font-medium">
                    <User className="w-3.5 h-3.5 mr-1 text-indigo-500 dark:text-indigo-400" />
                    Posted by: {announcement.createdBy.name}
                  </span>
                  <span>{new Date(announcement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between text-sm">
                <p className="text-gray-500 dark:text-gray-400">
                  Page <span className="font-semibold text-gray-900 dark:text-white">{pagination.page}</span> of{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalPages}</span>
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center transition"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center transition"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
