import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { Code, Clock, AlertTriangle } from 'lucide-react';
import { AppBackButton } from '../../components/AppBackButton';
import { ThemeToggle } from '../../components/ThemeToggle';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface Lab {
  id: string;
  title: string;
  description: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  difficulty: string;
  supportedLanguages: string;
  dueDate?: string | null;
  deadlineStatus?: 'NO_DEADLINE' | 'ACTIVE' | 'OVERDUE';
  testCases: TestCase[];
}

export const StudentLabDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLab = async () => {
      try {
        const res = await api.get(`/student/labs/${id}`);
        setLab(res.data.lab);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load lab. It may not exist or is unpublished.');
      } finally {
        setLoading(false);
      }
    };
    fetchLab();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 text-center text-gray-500 dark:text-gray-400">
      Loading lab details...
    </div>
  );
  if (error || !lab) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 text-center flex flex-col items-center justify-center">
      <p className="text-red-500 mb-4">{error}</p>
      <AppBackButton fallbackPath="/student/topics" label="Back to Topics" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <AppBackButton fallbackPath="/student/topics" label="Back" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {lab.title}
                </h1>
                <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${
                  lab.difficulty === 'EASY' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                  lab.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                }`}>
                  {lab.difficulty}
                </span>
              </div>
              <div className="mt-2">
                {lab.deadlineStatus === 'OVERDUE' ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Deadline Passed ({new Date(lab.dueDate!).toLocaleString()})
                  </span>
                ) : lab.dueDate ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                    <Clock className="w-3.5 h-3.5 mr-1" /> Due {new Date(lab.dueDate).toLocaleString()}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    No deadline
                  </span>
                )}
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-8">
          
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Problem Statement</h2>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {lab.description}
            </div>
          </div>

          <div>
            <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Constraints</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md font-mono text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
              {lab.constraints}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Sample Input</h3>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md font-mono text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                {lab.sampleInput}
              </div>
            </div>
            <div>
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Sample Output</h3>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md font-mono text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                {lab.sampleOutput}
              </div>
            </div>
          </div>

          {lab.testCases && lab.testCases.length > 0 && (
            <div>
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">Public Test Cases</h3>
              <div className="space-y-4">
                {lab.testCases.map((tc, idx) => (
                  <div key={tc.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Test Case #{idx + 1}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Input</span>
                        <div className="bg-white dark:bg-gray-900 p-2 mt-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">{tc.input}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Expected Output</span>
                        <div className="bg-white dark:bg-gray-900 p-2 mt-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">{tc.expectedOutput}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">Supported Languages: {lab.supportedLanguages}</div>
            <Link 
              to={`/student/labs/${lab.id}/editor`}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md font-bold flex items-center hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors shadow-sm"
            >
              <Code className="w-5 h-5 mr-2" /> Open Editor
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
