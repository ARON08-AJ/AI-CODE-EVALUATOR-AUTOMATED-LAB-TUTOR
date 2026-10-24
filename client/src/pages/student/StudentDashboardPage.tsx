import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, CheckCircle, Clock, FileCode2, Target, Trophy, Bell, UserCircle, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

interface TopicProgress {
  topicId: string;
  name: string;
  assigned: number;
  solved: number;
  completionRate: number;
}

interface DifficultyProgress {
  difficulty: string;
  assigned: number;
  solved: number;
  completionRate: number;
}

interface StudentDashboardData {
  student: {
    name: string;
    registerNumber: string;
    department: string | null;
    year: number | null;
    section: string | null;
  };
  stats: {
    assignedLabs: number;
    completedLabs: number;
    pendingLabs: number;
    completionRate?: number;
    totalSubmissions: number;
    acceptedSubmissions: number;
    acceptanceRate: number;
  };
  topicProgress?: TopicProgress[];
  difficultyProgress?: DifficultyProgress[];
  labs: Array<{
    id: string;
    title: string;
    difficulty: string;
    progress: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
    dueDate?: string | null;
    deadlineStatus?: 'NO_DEADLINE' | 'ACTIVE' | 'OVERDUE';
    lastSubmissionStatus: string | null;
    lastSubmissionAt: string | null;
    topic: {
      id: string;
      name: string;
    } | null;
  }>;
  recentSubmissions: Array<{
    id: string;
    labId: string;
    language: string;
    status: string;
    passedTests: number;
    totalTests: number;
    executionTime: number | null;
    createdAt: string;
    lab: { title: string };
  }>;
}

export const StudentDashboardPage: React.FC = () => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const { updateUser } = useAuth();
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/student/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dashboardData = response.data.dashboard;
        setData(dashboardData);

        // Check if student has a placeholder name (First time login)
        const studentInfo = dashboardData.student;
        const isPlaceholder = Boolean(
          (studentInfo as any).needsNameSetup ||
          !studentInfo.name ||
          studentInfo.name.trim().toLowerCase().startsWith('student ') ||
          studentInfo.name === studentInfo.registerNumber
        );

        if (isPlaceholder) {
          setShowNameModal(true);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [apiUrl, token]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Please enter your name.');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters long.');
      return;
    }

    try {
      setSavingName(true);
      setNameError('');
      await axios.put(
        `${apiUrl}/auth/profile`,
        { name: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data) {
        setData({
          ...data,
          student: {
            ...data.student,
            name: trimmed
          }
        });
      }

      updateUser({ name: trimmed, needsNameSetup: false });
      setShowNameModal(false);
    } catch (err: any) {
      setNameError(err.response?.data?.error || 'Failed to save name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircleIcon className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* First-Time Student Name Setup Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 dark:border-gray-700 relative">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 text-white shadow-lg mx-auto">
              <UserCircle className="w-10 h-10" />
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> First-Time Setup
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to AutoLab!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Since this is your first time logging in, please tell us your name to set up your profile.
              </p>
            </div>

            <form onSubmit={handleSaveName} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  What is your name?
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. John Doe"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-base shadow-sm"
                />
                {nameError && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{nameError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={savingName}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingName ? 'Saving...' : 'Save & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="bg-indigo-600 dark:bg-indigo-900 pb-32 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {data.student.name}</h1>
            <p className="text-indigo-100 dark:text-indigo-200">Continue your programming labs and monitor your progress.</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <Link 
              to="/student/announcements"
              className="inline-flex items-center text-sm font-medium text-indigo-100 hover:text-white dark:text-indigo-200 dark:hover:text-white transition-colors bg-indigo-500/40 hover:bg-indigo-500/60 px-3 py-1.5 rounded-lg border border-indigo-400/30"
            >
              <Bell className="w-4 h-4 mr-1.5 text-amber-300" />
              Announcements
            </Link>
            <Link 
              to="/student/leaderboard"
              className="inline-flex items-center text-sm font-medium text-indigo-100 hover:text-white dark:text-indigo-200 dark:hover:text-white transition-colors bg-indigo-500/40 hover:bg-indigo-500/60 px-3 py-1.5 rounded-lg border border-indigo-400/30"
            >
              <Trophy className="w-4 h-4 mr-1.5 text-amber-300" />
              Leaderboard
            </Link>
            {data.student.registerNumber && (
              <span className="inline-block bg-indigo-500 dark:bg-indigo-700 text-white text-sm px-3 py-1 rounded-full font-medium shadow-sm">
                {data.student.registerNumber}
              </span>
            )}
            <ThemeToggle />
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="text-sm font-medium text-indigo-100 hover:text-white dark:text-indigo-200 dark:hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 space-y-8 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned Labs</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.assignedLabs}</h3>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
            <div className="p-4 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Completed Labs</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.completedLabs}</h3>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mr-4">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Completion Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.stats.completionRate ?? (data.stats.assignedLabs > 0 ? Math.round((data.stats.completedLabs / data.stats.assignedLabs) * 100) : 0)}%
              </h3>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
            <div className="p-4 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Acceptance Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.acceptanceRate}%</h3>
            </div>
          </div>
        </div>

        {/* Topic and Difficulty Progress */}
        {(data.topicProgress || data.difficultyProgress) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.topicProgress && data.topicProgress.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">Topic Progress</h3>
                <div className="space-y-3">
                  {data.topicProgress.map(tp => (
                    <div key={tp.topicId}>
                      <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <span>{tp.name} ({tp.solved}/{tp.assigned})</span>
                        <span>{tp.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${tp.completionRate}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.difficultyProgress && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">Difficulty Progress</h3>
                <div className="space-y-3">
                  {data.difficultyProgress.map(dp => (
                    <div key={dp.difficulty}>
                      <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <span>{dp.difficulty} ({dp.solved}/{dp.assigned})</span>
                        <span>{dp.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          dp.difficulty === 'EASY' ? 'bg-green-500' :
                          dp.difficulty === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${dp.completionRate}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Layout for Labs and Recent Submissions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column: Assigned Labs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FileCode2 className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  My Assigned Labs
                </h2>
                <Link to="/student/labs" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                  View All &rarr;
                </Link>
              </div>
              
              {data.labs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>No labs assigned yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {Object.entries(
                    data.labs.reduce((acc, lab) => {
                      const topicName = lab.topic ? lab.topic.name : 'General';
                      if (!acc[topicName]) acc[topicName] = [];
                      acc[topicName].push(lab);
                      return acc;
                    }, {} as Record<string, typeof data.labs>)
                  ).map(([topicName, labsInTopic]) => (
                    <div key={topicName} className="p-4 bg-gray-50/50 dark:bg-gray-800/50">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3 ml-2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                        {topicName} <span className="text-sm font-normal text-gray-400 ml-2">({labsInTopic.filter(l => l.progress === 'COMPLETED').length}/{labsInTopic.length} completed)</span>
                      </h3>
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                        {labsInTopic.map((lab) => (
                          <li key={lab.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition flex items-center justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{lab.title}</h4>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  lab.difficulty === 'EASY' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                                  lab.difficulty === 'MEDIUM' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                                  'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                }`}>
                                  {lab.difficulty}
                                </span>
                                
                                {/* Progress Badge */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  lab.progress === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                                  lab.progress === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {lab.progress === 'COMPLETED' ? 'Completed' :
                                   lab.progress === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                                </span>

                                {/* Deadline Badge */}
                                {lab.deadlineStatus === 'OVERDUE' ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                                    Deadline Passed
                                  </span>
                                ) : lab.dueDate ? (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
                                    Due {new Date(lab.dueDate).toLocaleDateString()}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <Link 
                                to={`/student/labs/${lab.id}`}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                                  lab.progress === 'COMPLETED' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                              >
                                {lab.progress === 'COMPLETED' ? 'Review' : 'Continue'}
                              </Link>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Recent Submissions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  Recent Submissions
                </h2>
              </div>
              
              {data.recentSubmissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  <p>No submissions yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.recentSubmissions.map((sub) => (
                    <li key={sub.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <Link to={`/student/submissions/${sub.id}`} className="block">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">{sub.lab.title}</p>
                          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap ${
                            sub.status === 'ACCEPTED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                            sub.status === 'WRONG_ANSWER' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {sub.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{sub.language}</span>
                          <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              
              {data.recentSubmissions.length > 0 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center">
                  <Link to="/student/submissions" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                    View full history &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Helper
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);
