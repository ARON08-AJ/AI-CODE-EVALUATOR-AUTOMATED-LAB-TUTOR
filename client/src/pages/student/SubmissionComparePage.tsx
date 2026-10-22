import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import { DiffEditor } from '@monaco-editor/react';
import { GitCompare } from 'lucide-react';
import { starterCode, mapLanguageToMonaco } from '../../utils/starterCode';
import { useTheme } from '../../components/ThemeProvider';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AppBackButton } from '../../components/AppBackButton';

interface SubmissionDetail {
  id: string;
  labId: string;
  labTitle: string;
  language: string;
  sourceCode: string;
  createdAt: string;
}

export const SubmissionComparePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'system') {
      setResolvedTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await api.get(`/student/submissions/${id}`);
        setSubmission(res.data.submission);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load submission details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  if (loading) return (
    <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 min-h-screen">
      Loading comparison...
    </div>
  );
  if (error || !submission) return (
    <div className="p-8 text-center text-red-500 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center">
      <p className="mb-4">{error}</p>
      <AppBackButton fallbackPath={`/student/submissions/${id}`} label="Back to Submission" />
    </div>
  );

  const originalCode = starterCode[submission.language] || '';

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <AppBackButton fallbackPath={`/student/submissions/${id}`} label="Back to Submission" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <GitCompare className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400" />
              Visual Diff: Starter Code vs Your Submission
            </h1>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">{submission.labTitle}</span>
              <span>•</span>
              <span>{submission.language}</span>
              <span>•</span>
              <span>{new Date(submission.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className={`flex-1 relative ${resolvedTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
        <div className="absolute inset-x-0 top-0 h-8 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex">
          <div className="w-1/2 px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Starter Code</div>
          <div className="w-1/2 px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Your Submission</div>
        </div>
        <div className="absolute inset-x-0 bottom-0 top-8">
          <DiffEditor
            original={originalCode}
            modified={submission.sourceCode}
            language={mapLanguageToMonaco(submission.language)}
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 16,
              renderSideBySide: true,
              wordWrap: 'on',
              padding: { top: 16 }
            }}
          />
        </div>
      </div>
    </div>
  );
};
