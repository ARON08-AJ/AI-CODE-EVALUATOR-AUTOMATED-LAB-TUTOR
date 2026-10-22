import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Users, Clock, FileCode2, Target, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

interface FacultyDashboardData {
  faculty: {
    name: string;
    department: string | null;
  };
  stats: {
    students: number;
    labs: number;
    publishedLabs: number;
    assignments: number;
    submissions: number;
    acceptedSubmissions: number;
  };
  labs: Array<{
    id: string;
    title: string;
    difficulty: string;
    published: boolean;
    _count: {
      assignments: number;
      submissions: number;
    };
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
    student: {
      name: string;
      registerNumber: string | null;
    };
    lab: { title: string };
  }>;
}

export const FacultyDashboardPage: React.FC = () => {
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/faculty/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data.dashboard);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [apiUrl, token]);

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
      {/* Header Area */}
      <div className="bg-indigo-900 dark:bg-gray-900 pb-32 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Prof. {data.faculty.name}</h1>
            <p className="text-indigo-200">Here's what's happening in your programming labs today.</p>
          </div>
          <div className="flex items-center gap-6 text-right">
            <nav className="hidden md:flex gap-4">
              <Link to="/faculty/dashboard" className="text-sm font-medium text-white bg-indigo-800/50 px-3 py-1.5 rounded-md">Dashboard</Link>
              <Link to="/faculty/labs" className="text-sm font-medium text-indigo-200 hover:text-white px-3 py-1.5 rounded-md transition-colors">Labs</Link>
              <Link to="/faculty/students" className="text-sm font-medium text-indigo-200 hover:text-white px-3 py-1.5 rounded-md transition-colors">Students</Link>
              <Link to="/faculty/analytics" className="text-sm font-medium text-indigo-200 hover:text-white px-3 py-1.5 rounded-md transition-colors">Analytics</Link>
              <Link to="/faculty/announcements" className="text-sm font-medium text-indigo-200 hover:text-white px-3 py-1.5 rounded-md transition-colors">Announcements</Link>
            </nav>
            <ThemeToggle />
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="text-sm font-medium text-indigo-200 hover:text-white transition-colors ml-2"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center border border-gray-100 dark:border-gray-700">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Students</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.students}</h3>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center border border-gray-100 dark:border-gray-700">
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mr-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Labs (Published)</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.labs} <span className="text-sm font-normal text-gray-400">({data.stats.publishedLabs})</span></h3>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center border border-gray-100 dark:border-gray-700">
            <div className="p-4 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Assignments</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.assignments}</h3>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center border border-gray-100 dark:border-gray-700">
            <div className="p-4 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Submissions (Accepted)</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.submissions} <span className="text-sm font-normal text-gray-400">({data.stats.acceptedSubmissions})</span></h3>
            </div>
          </div>
        </div>

        {/* Layout for Labs and Recent Submissions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Column: Lab Overview */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FileCode2 className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  Lab Overview
                </h2>
                <Link to="/faculty/labs" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                  Manage Labs &rarr;
                </Link>
              </div>
              
              {data.labs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>You haven't created any labs yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto divide-y divide-gray-100 dark:divide-gray-700">
                  {Object.entries(
                    data.labs.reduce((acc, lab) => {
                      const topicName = lab.topic ? lab.topic.name : 'General';
                      if (!acc[topicName]) acc[topicName] = [];
                      acc[topicName].push(lab);
                      return acc;
                    }, {} as Record<string, typeof data.labs>)
                  ).map(([topicName, labsInTopic]) => (
                    <div key={topicName} className="p-4">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3 ml-2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                        {topicName} <span className="text-sm font-normal text-gray-400 ml-2">({labsInTopic.length} labs)</span>
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submissions</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                            {labsInTopic.map((lab) => (
                              <tr key={lab.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="font-medium text-gray-900 dark:text-white text-sm">{lab.title}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{lab.difficulty}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-4 font-semibold rounded-full ${
                                    lab.published ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                                  }`}>
                                    {lab.published ? 'Published' : 'Draft'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                  {lab._count.assignments} students
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                  {lab._count.submissions}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                  <Link to={`/faculty/labs/${lab.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                                    View
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Recent Activity */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  Recent Submissions
                </h2>
              </div>
              
              {data.recentSubmissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  <p>No student submissions yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.recentSubmissions.map((sub) => (
                    <li key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <Link to={`/faculty/submissions/${sub.id}`} className="block p-4">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {sub.student.name}
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{sub.student.registerNumber}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{sub.lab.title}</p>
                          </div>
                          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                            sub.status === 'ACCEPTED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                            sub.status === 'WRONG_ANSWER' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {sub.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{sub.language}</span>
                          <span>{new Date(sub.createdAt).toLocaleString()}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
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
