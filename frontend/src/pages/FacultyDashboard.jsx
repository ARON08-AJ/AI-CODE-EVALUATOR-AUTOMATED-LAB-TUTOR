import React, { useEffect, useState } from 'react';
import { dashboardAPI, labAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Plus, BookOpen, Users, CheckCircle, ShieldAlert, BarChart3, Bot, X } from 'lucide-react';

export default function FacultyDashboard() {
  const [stats, setStats] = useState(null);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Lab Form State
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('CS102');
  const [description, setDescription] = useState('');
  const [qTitle, setQTitle] = useState('');
  const [qProblem, setQProblem] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [publicInput, setPublicInput] = useState('');
  const [publicOutput, setPublicOutput] = useState('');
  const [hiddenInput, setHiddenInput] = useState('');
  const [hiddenOutput, setHiddenOutput] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    Promise.all([dashboardAPI.getFacultyStats(), labAPI.getAll()])
      .then(([statsRes, labsRes]) => {
        setStats(statsRes.data);
        setLabs(labsRes.data);
      })
      .catch((err) => console.error("Error loading faculty dashboard:", err))
      .finally(() => setLoading(false));
  };

  const handleCreateLab = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        title,
        courseCode,
        description,
        deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
        questions: [
          {
            title: qTitle,
            problemStatement: qProblem,
            sampleInput,
            sampleOutput,
            allowedLanguages: "C,CPP,JAVA,PYTHON",
            timeLimitMs: 2000,
            memoryLimitMb: 256,
            testCases: [
              { input: publicInput || sampleInput, expectedOutput: publicOutput || sampleOutput, isPublic: true },
              { input: hiddenInput, expectedOutput: hiddenOutput, isPublic: false }
            ]
          }
        ]
      };

      await labAPI.create(payload);
      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setQTitle('');
      setQProblem('');
      fetchDashboardData();
    } catch (err) {
      alert("Failed to create lab. Ensure all required fields are filled.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Faculty Management Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Create Lab Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Faculty Laboratory Management Portal</h1>
            <p className="text-sm text-slate-400 mt-1">Manage programming labs, upload public/hidden test cases, and monitor AI tutor feedback.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-950 transition flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create New Programming Lab
          </button>
        </div>

        {/* Faculty Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Labs Created
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-slate-100">{stats?.totalLabsCreated || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Active lab modules</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Total Coding Tasks
              <BarChart3 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-bold text-sky-400">{stats?.totalQuestionsCreated || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Configured problems</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Student Submissions
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400">{stats?.totalStudentSubmissions || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Total evaluated runs</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Class Pass Rate
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400">{stats?.overallPassRate || 0}%</div>
            <div className="text-xs text-emerald-500/80 mt-1">Accepted submissions</div>
          </div>
        </div>

        {/* Manage Labs Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Active Programming Labs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {labs.map((lab) => (
              <div key={lab.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                    {lab.courseCode}
                  </span>
                  <span className="text-xs text-slate-400">
                    Created by {lab.createdBy?.fullName || 'Faculty'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100">{lab.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{lab.description}</p>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Configured Tasks ({lab.questions?.length || 0}):</div>
                  {lab.questions?.map((q) => (
                    <div key={q.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-slate-200">{q.title}</div>
                      <div className="text-slate-400 font-mono">
                        Test Cases: {q.testCases?.length || 0} ({q.testCases?.filter(t => t.isPublic).length || 0} Public, {q.testCases?.filter(t => !t.isPublic).length || 0} Hidden)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Student Submission Monitor */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            Live Student Submission & Evaluation Feed
          </h2>

          {!stats?.recentStudentSubmissions || stats.recentStudentSubmissions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No student submissions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Language</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Test Cases Passed</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {stats.recentStudentSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-100">{sub.studentName}</td>
                      <td className="py-3.5 px-4 text-slate-300">{sub.questionTitle}</td>
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
                      <td className="py-3.5 px-4 font-mono text-slate-400">{sub.executionTimeMs} ms</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(sub.submittedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Lab Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> Create Programming Lab Assignment
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLab} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Lab Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lab 2: Data Structures & Dynamic Allocation"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lab Description</label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions for students..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <h4 className="font-bold text-indigo-400 mb-2">Coding Question 1</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Problem Title</label>
                    <input
                      type="text"
                      required
                      value={qTitle}
                      onChange={(e) => setQTitle(e.target.value)}
                      placeholder="e.g. Reverse an Array"
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Problem Statement</label>
                    <textarea
                      rows="3"
                      required
                      value={qProblem}
                      onChange={(e) => setQProblem(e.target.value)}
                      placeholder="Given N integers..."
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Sample Input</label>
                      <textarea
                        rows="2"
                        value={sampleInput}
                        onChange={(e) => setSampleInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 font-mono"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Sample Output</label>
                      <textarea
                        rows="2"
                        value={sampleOutput}
                        onChange={(e) => setSampleOutput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 font-mono"
                      ></textarea>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="font-bold text-sky-400">Public Test Case</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Public Input"
                        value={publicInput}
                        onChange={(e) => setPublicInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 p-1.5 rounded text-slate-100 font-mono"
                      />
                      <input
                        placeholder="Public Expected Output"
                        value={publicOutput}
                        onChange={(e) => setPublicOutput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 p-1.5 rounded text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="font-bold text-amber-400">Hidden Test Case (Automated Evaluation)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Hidden Input"
                        value={hiddenInput}
                        onChange={(e) => setHiddenInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 p-1.5 rounded text-slate-100 font-mono"
                      />
                      <input
                        placeholder="Hidden Expected Output"
                        value={hiddenOutput}
                        onChange={(e) => setHiddenOutput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 p-1.5 rounded text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded shadow-lg shadow-indigo-950 disabled:opacity-50"
                >
                  {creating ? 'Saving Lab...' : 'Publish Lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
