import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, labAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { BookOpen, CheckCircle, Clock, Award, Terminal, ArrowRight, Bot, ShieldAlert, Sparkles } from 'lucide-react';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    Promise.all([dashboardAPI.getStudentStats(), labAPI.getAll()])
      .then(([statsRes, labsRes]) => {
        setStats(statsRes.data);
        setLabs(labsRes.data);
      })
      .catch((err) => console.error("Error loading student dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Student Laboratory Workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Student Programming Laboratory</h1>
            <p className="text-sm text-slate-400 mt-1">Solve programming assignments, run test cases, and learn with AI tutoring.</p>
          </div>
          <Link
            to="/workspace/1"
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-sky-950 transition flex items-center gap-2 self-start md:self-auto"
          >
            <Terminal className="w-4 h-4" />
            Open Active IDE Lab
          </Link>
        </div>

        {/* Performance Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Assigned Labs
              <BookOpen className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-bold text-slate-100">{stats?.totalAssignedLabs || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Active programming courses</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Completed Labs
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400">{stats?.completedLabs || 0}</div>
            <div className="text-xs text-emerald-500/80 mt-1">Passed all hidden test cases</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Pending Deadline
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400">{stats?.pendingLabs || 0}</div>
            <div className="text-xs text-amber-500/80 mt-1">Assignments due soon</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Accuracy Rate
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400">{stats?.accuracyRate || 0}%</div>
            <div className="text-xs text-slate-400 mt-1">Overall submission pass rate</div>
          </div>
        </div>

        {/* Labs List & Questions Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            Available Programming Labs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {labs.map((lab) => (
              <div key={lab.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-xs font-mono bg-sky-950 text-sky-400 border border-sky-800 rounded">
                      {lab.courseCode}
                    </span>
                    <span className="text-xs text-slate-400">
                      Deadline: {lab.deadline ? new Date(lab.deadline).toLocaleDateString() : 'No deadline'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100">{lab.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{lab.description}</p>

                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Coding Tasks:</div>
                    {lab.questions?.map((q) => (
                      <div
                        key={q.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between group hover:border-slate-700 transition"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-200">{q.title}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            Languages: {q.allowedLanguages || 'C, CPP, JAVA, PYTHON'}
                          </div>
                        </div>

                        <Link
                          to={`/workspace/${q.id}`}
                          className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600 text-sky-400 hover:text-white text-xs font-semibold rounded border border-sky-600/50 transition flex items-center gap-1"
                        >
                          Solve <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions & AI Feedback Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Recent Submission History & AI Diagnostics
          </h2>

          {!stats?.recentSubmissions || stats.recentSubmissions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No submissions recorded yet. Open a lab task to write and submit code!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Language</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Test Cases</th>
                    <th className="py-3 px-4">Time & Memory</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4 text-right">AI Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {stats.recentSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-100">{sub.questionTitle}</td>
                      <td className="py-3.5 px-4 font-mono text-sky-400">{sub.language}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wide uppercase ${
                            sub.status === 'ACCEPTED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {sub.passCount} / {sub.totalTestCases}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {sub.executionTimeMs} ms | {sub.memoryUsedKb} KB
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(sub.submittedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {sub.status !== 'ACCEPTED' ? (
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 text-xs font-semibold rounded transition inline-flex items-center gap-1"
                          >
                            <Bot className="w-3.5 h-3.5" /> View AI Tutor Hint
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-xs font-medium flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Passed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* AI Hint Drawer Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-950 text-amber-400 rounded-lg border border-amber-800">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">AI Educational Tutor Guidance</h3>
                  <p className="text-xs text-slate-400">{selectedSubmission.questionTitle} ({selectedSubmission.language})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-amber-900/50">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Root Cause Explanation</div>
                <p className="text-sm text-slate-200">{selectedSubmission.analysis}</p>
              </div>

              {selectedSubmission.hint1 && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Hint 1: Conceptual Direction</div>
                  <p className="text-sm text-slate-300">{selectedSubmission.hint1}</p>
                </div>
              )}

              {selectedSubmission.hint2 && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Hint 2: Debugging Strategy</div>
                  <p className="text-sm text-slate-300">{selectedSubmission.hint2}</p>
                </div>
              )}

              {selectedSubmission.hint3 && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Hint 3: Logic Check</div>
                  <p className="text-sm text-slate-300">{selectedSubmission.hint3}</p>
                </div>
              )}

              {selectedSubmission.recommendedTopics && selectedSubmission.recommendedTopics.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Topics to Revise</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.recommendedTopics.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs bg-purple-950 text-purple-300 border border-purple-800 rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
