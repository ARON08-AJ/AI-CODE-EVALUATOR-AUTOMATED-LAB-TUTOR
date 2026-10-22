import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { 
  Trophy, 
  Medal, 
  Award, 
  Target, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  ArrowLeft,
  XCircle,
  FileCode2
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

interface LeaderboardStudent {
  rank: number;
  student: {
    id: string;
    name: string;
    registerNumber: string | null;
    department: string | null;
    year: number | null;
    section: string | null;
  };
  score: number;
  solvedProblems: number;
  assignedProblems: number;
  completionRate: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
}

interface CurrentStudentData {
  rank: number;
  score: number;
  solvedProblems: number;
  assignedProblems: number;
  completionRate: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  student: {
    id: string;
    name: string;
    registerNumber: string | null;
    department: string | null;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const StudentLeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
  const [currentStudent, setCurrentStudent] = useState<CurrentStudentData | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (pageToFetch: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/student/leaderboard?page=${pageToFetch}&limit=20`);
      setLeaderboard(res.data.leaderboard);
      setPagination(res.data.pagination);
      setCurrentStudent(res.data.currentStudent);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(pagination.page);
  }, [pagination.page]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-bold">
          <Trophy className="w-5 h-5" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
          <Medal className="w-5 h-5" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-800/20 text-amber-700 dark:text-amber-500 font-bold">
          <Award className="w-5 h-5" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 font-semibold text-gray-500 dark:text-gray-400 text-sm">
        #{rank}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header Banner */}
      <div className="bg-indigo-600 dark:bg-indigo-900 pb-24 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
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
                  <Trophy className="w-7 h-7 text-amber-300" /> AutoLab Leaderboard
                </h1>
                <p className="text-indigo-100 dark:text-indigo-200 text-sm mt-1">
                  Track performance and ranking across assigned programming labs.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 space-y-6 pb-16">
        
        {/* Scoring Rule Explanation Box */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 border border-indigo-100 dark:border-gray-700 flex items-start gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-white font-semibold">Scoring Rule: </strong> 
            Score is based on uniquely solved problems. Each uniquely solved assigned problem earns <span className="font-semibold text-indigo-600 dark:text-indigo-400">10 points</span>. 
            Multiple accepted submissions for the same problem count as 1 solved problem.
          </div>
        </div>

        {/* Logged-in Student Stats Summary */}
        {currentStudent && (
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 dark:from-indigo-950 dark:via-indigo-900 dark:to-purple-950 text-white rounded-xl shadow-md p-6 border border-indigo-500/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200 bg-indigo-800/50 px-2.5 py-1 rounded-md">
                  Your Current Standing
                </span>
                <h2 className="text-xl sm:text-2xl font-bold mt-2">
                  {currentStudent.student.name}
                  {currentStudent.student.registerNumber && (
                    <span className="text-indigo-200 text-sm font-normal ml-2">
                      ({currentStudent.student.registerNumber})
                    </span>
                  )}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center">
                  <p className="text-xs text-indigo-200 font-medium">Rank</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-amber-300">#{currentStudent.rank}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center">
                  <p className="text-xs text-indigo-200 font-medium">Score</p>
                  <p className="text-xl sm:text-2xl font-extrabold">{currentStudent.score} pts</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center">
                  <p className="text-xs text-indigo-200 font-medium">Solved</p>
                  <p className="text-xl sm:text-2xl font-extrabold">{currentStudent.solvedProblems} / {currentStudent.assignedProblems}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center">
                  <p className="text-xs text-indigo-200 font-medium">Acceptance</p>
                  <p className="text-xl sm:text-2xl font-extrabold">{currentStudent.acceptanceRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <FileCode2 className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Student Rankings
            </h2>
            {pagination.total > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Total Students: {pagination.total}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3"></div>
              <p className="text-sm">Loading leaderboard statistics...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              <XCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">{error}</p>
              <button
                onClick={() => fetchLeaderboard(pagination.page)}
                className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-sm font-medium rounded-lg hover:bg-red-200 transition"
              >
                Retry
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No leaderboard data available yet.</p>
              <p className="text-sm mt-1">Complete assigned labs to appear on the leaderboard!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                    <th className="py-3.5 px-4 text-center w-16">Rank</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4 text-center">Solved / Assigned</th>
                    <th className="py-3.5 px-4 text-center">Score</th>
                    <th className="py-3.5 px-4 text-center">Completion Rate</th>
                    <th className="py-3.5 px-4 text-center">Acceptance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                  {leaderboard.map((item) => {
                    const isSelf = currentStudent && item.student.id === currentStudent.student.id;
                    return (
                      <tr 
                        key={item.student.id}
                        className={`transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/40 ${
                          isSelf ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-medium' : ''
                        }`}
                      >
                        <td className="py-4 px-4 text-center">
                          {renderRankBadge(item.rank)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                {item.student.name}
                                {isSelf && (
                                  <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                {item.student.registerNumber || 'No Reg No'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700 dark:text-gray-300 font-medium">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.solvedProblems}</span>
                          <span className="text-gray-400"> / </span>
                          <span>{item.assignedProblems}</span>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-gray-900 dark:text-white">
                          <span className="inline-block px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                            {item.score} pts
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden hidden sm:block">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(item.completionRate, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 font-semibold">{item.completionRate}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center text-gray-700 dark:text-gray-300 font-semibold">
                            <Target className="w-3.5 h-3.5 mr-1 text-green-500" />
                            {item.acceptanceRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls Footer */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
              <p className="text-gray-500 dark:text-gray-400">
                Showing Page <span className="font-semibold text-gray-900 dark:text-white">{pagination.page}</span> of{' '}
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
      </div>
    </div>
  );
};
