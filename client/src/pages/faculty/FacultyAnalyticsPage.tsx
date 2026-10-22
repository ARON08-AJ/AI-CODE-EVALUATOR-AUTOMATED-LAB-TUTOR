import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { BarChart2, TrendingUp, Users, CheckCircle, AlertTriangle, Search, Layers } from 'lucide-react';
import { AppBackButton } from '../../components/AppBackButton';
import { ThemeToggle } from '../../components/ThemeToggle';

interface StudentAnalytics {
  studentId: string;
  name: string;
  registerNumber: string;
  department: string | null;
  year: number | null;
  section: string | null;
  assigned: number;
  solved: number;
  completionRate: number;
  submissionCount: number;
  acceptedCount: number;
  acceptanceRate: number;
  statusTag: string;
  lastSubmissionDate: string | null;
}

interface TopicAnalytics {
  topicId: string;
  name: string;
  assigned: number;
  solved: number;
  completionRate: number;
  submissions: number;
  acceptanceRate: number;
}

interface DifficultyAnalytics {
  difficulty: string;
  assigned: number;
  solved: number;
  completionRate: number;
  submissions: number;
  acceptanceRate: number;
}

interface AnalyticsData {
  summary: {
    totalAssigned: number;
    totalSolved: number;
    overallCompletionRate: number;
    totalSubmissions: number;
    acceptedSubmissionsCount: number;
    overallAcceptanceRate: number;
    avgAttemptsPerSolved: number;
    noSubmissionsCount: number;
    needsAttentionCount: number;
  };
  students: StudentAnalytics[];
  topics: TopicAnalytics[];
  difficulties: DifficultyAnalytics[];
}

export const FacultyAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Student list filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/faculty/analytics');
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading performance analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error Loading Analytics</h2>
          <p className="text-red-500 dark:text-red-400 mt-2">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, students, topics, difficulties } = data;

  const filteredStudents = students.filter(s => {
    const matchesSearch = search === '' || 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.registerNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || s.statusTag === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <AppBackButton fallbackPath="/faculty/dashboard" label="Back to Dashboard" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart2 className="mr-3 text-indigo-600 dark:text-indigo-400" /> Faculty Performance Analytics
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Authoritative real-time class metrics, student completion rates, and topic performance.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Aggregate Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned / Solved</span>
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalSolved} / {summary.totalAssigned}</div>
            <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              {summary.overallCompletionRate}% Overall Completion
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Submissions & Acceptance</span>
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.acceptedSubmissionsCount} / {summary.totalSubmissions}</div>
            <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-semibold">
              {summary.overallAcceptanceRate}% Acceptance Rate
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Attempts per Solved</span>
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.avgAttemptsPerSolved}</div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              Submissions required per solved lab
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Attention Metrics</span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.needsAttentionCount}</div>
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
              {summary.noSubmissionsCount} student(s) with 0 submissions
            </div>
          </div>
        </div>

        {/* Topic & Difficulty Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Topic Performance */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" /> Topic Performance
            </h2>
            {topics.length === 0 ? (
              <div className="text-gray-500 text-sm">No topics assigned yet.</div>
            ) : (
              <div className="space-y-4">
                {topics.map(t => (
                  <div key={t.topicId} className="border-b border-gray-50 dark:border-gray-700/50 pb-3 last:border-none">
                    <div className="flex justify-between text-sm font-medium text-gray-900 dark:text-white mb-1">
                      <span>{t.name}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{t.completionRate}% Completed</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${t.completionRate}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Assigned: {t.assigned} | Solved: {t.solved}</span>
                      <span>Submissions: {t.submissions} ({t.acceptanceRate}% acc)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty Performance */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> Difficulty Breakdown
            </h2>
            <div className="space-y-4">
              {difficulties.map(d => (
                <div key={d.difficulty} className="border-b border-gray-50 dark:border-gray-700/50 pb-3 last:border-none">
                  <div className="flex justify-between text-sm font-medium text-gray-900 dark:text-white mb-1">
                    <span className="flex items-center">
                      <span className={`w-2.5 h-2.5 rounded-full mr-2 ${
                        d.difficulty === 'EASY' ? 'bg-green-500' :
                        d.difficulty === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      {d.difficulty}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{d.completionRate}% Completion</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${
                      d.difficulty === 'EASY' ? 'bg-green-500' :
                      d.difficulty === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} style={{ width: `${d.completionRate}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Assigned: {d.assigned} | Solved: {d.solved}</span>
                    <span>Submissions: {d.submissions} ({d.acceptanceRate}% acc)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Student Level Analytics Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Student Progress & Status</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Neutral descriptive status tags and completion metrics.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="pointer-events-none absolute inset-y-0 left-0 h-4 w-4 my-auto ml-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student name/reg..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-md border-0 py-1.5 pl-9 pr-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="On Track">On Track</option>
                <option value="Low Completion">Low Completion</option>
                <option value="No Recent Submission">No Recent Submission</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned / Solved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acceptance Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No student record matches filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(st => (
                    <tr key={st.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/faculty/students/${st.studentId}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                          {st.name}
                        </Link>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{st.registerNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {st.solved} / {st.assigned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${st.completionRate}%` }}></div>
                          </div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{st.completionRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {st.submissionCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {st.acceptanceRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          st.statusTag === 'On Track' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                            : st.statusTag === 'Low Completion'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        }`}>
                          {st.statusTag}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
