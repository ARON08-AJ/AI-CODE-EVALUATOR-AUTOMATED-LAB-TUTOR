import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Terminal, BrainCircuit, Activity, Users, FileCode2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

export const HomePage = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState({ status: 'checking', database: 'unknown' });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await axios.get(`${apiUrl}/health`);
        setHealth({ status: 'online', database: res.data.database });
      } catch (e) {
        setHealth({ status: 'offline', database: 'unknown' });
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Terminal className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white hidden sm:block">
                AutoLab
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700">
                <Activity className={`w-3.5 h-3.5 ${health.status === 'online' ? 'text-green-500' : 'text-red-500'}`} />
                <span className={health.status === 'online' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                  System {health.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {user ? (
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <Link
                    to={user.role === 'FACULTY' ? "/faculty/dashboard" : "/student/dashboard"}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold mb-6 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-300/20">
              <BrainCircuit className="w-4 h-4" />
              <span>AI-Assisted Educational Platform</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8 leading-tight">
              Programming Laboratory Management & Online Coding
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              A comprehensive platform combining faculty lab management, secure code execution, automated evaluation, and GenAI-powered debugging assistance to elevate computing education.
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md hover:shadow-lg transition-all"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Student Portal
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 dark:border-gray-700 text-base font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md transition-all"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Faculty Portal
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="bg-gray-50 dark:bg-gray-900 py-24 border-t border-gray-100 dark:border-gray-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Capabilities</h2>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Everything needed for a modern programming curriculum.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6">
                  <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Faculty Lab Management</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  Create labs, manage hidden and public test cases, assign students, and monitor real-time class progress and statistics.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                  <Terminal className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Online Code Editor</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  Students write, compile, and run code directly in the browser across multiple languages (C, C++, Java, Python) without local setup.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Automated Evaluation</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  Strictly controlled code execution sandbox providing instant verdicts (Accepted, Wrong Answer, TLE, OLE) against faculty test cases.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                  <BrainCircuit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">GenAI Debugging</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  LLM-powered conceptual hints for failing submissions. Evaluates errors educationally without giving away answers or leaking hidden tests.
                </p>
              </div>
              
              {/* Feature 5 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-6">
                  <FileCode2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Submission History</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  Full traceability of every student submission attempt, test case result, and execution metric safely persisted in the database.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-6">
                  <Activity className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Data-Driven Dashboards</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  Dynamic insights relying entirely on real database aggregation rather than mock states, providing authoritative progress tracking.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} AutoLab Programming Platform. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <span>Powered by React, Node, Express, Prisma, and Groq AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
