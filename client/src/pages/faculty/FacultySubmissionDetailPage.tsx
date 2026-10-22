import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import Editor from '@monaco-editor/react';
import { CheckCircle, XCircle, Clock, FileCode2, Lightbulb, Brain, User } from 'lucide-react';
import { mapLanguageToMonaco } from '../../utils/starterCode';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useTheme } from '../../components/ThemeProvider';
import { AppBackButton } from '../../components/AppBackButton';

interface TestResult {
  testNumber: number;
  visibility: 'PUBLIC' | 'HIDDEN';
  status: string;
  passed: boolean;
  executionTime: number;
  expectedOutput?: string;
  actualOutput?: string;
}

interface StudentInfo {
  id: string;
  name: string;
  registerNumber: string;
}

interface SubmissionDetail {
  id: string;
  labId: string;
  labTitle: string;
  language: string;
  sourceCode: string;
  status: string;
  passedTests: number;
  totalTests: number;
  failedTests: number;
  executionTime: number;
  createdAt: string;
  tests: TestResult[];
  student: StudentInfo;
}

interface AIHintData {
  errorType: string;
  explanation: string;
  hint: string;
  concepts: string[];
  nextSteps: string[];
}

export const FacultySubmissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiHint, setAiHint] = useState<AIHintData | null>(null);

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
        const res = await api.get(`/faculty/submissions/${id}`);
        // The API returns tests nested under testResults.testCase
        const fetchedSubmission = res.data.submission;
        
        // Transform the nested testResults into a flatter tests array for the UI
        const tests = fetchedSubmission.testResults.map((tr: any, idx: number) => ({
          testNumber: idx + 1,
          visibility: tr.testCase.visibility,
          status: tr.status,
          passed: tr.passed,
          executionTime: tr.executionTime,
          expectedOutput: tr.testCase.expectedOutput,
          actualOutput: tr.actualOutput,
        }));

        setSubmission({
          id: fetchedSubmission.id,
          labId: fetchedSubmission.lab.id,
          labTitle: fetchedSubmission.lab.title,
          language: fetchedSubmission.language,
          sourceCode: fetchedSubmission.sourceCode,
          status: fetchedSubmission.status,
          passedTests: fetchedSubmission.passedTests,
          totalTests: fetchedSubmission.totalTests,
          failedTests: fetchedSubmission.failedTests,
          executionTime: fetchedSubmission.executionTime,
          createdAt: fetchedSubmission.createdAt,
          tests: tests,
          student: fetchedSubmission.student
        });
        
        if (fetchedSubmission.aiFeedback && fetchedSubmission.aiFeedback.length > 0) {
          const feedback = fetchedSubmission.aiFeedback[0];
          setAiHint({
            errorType: feedback.errorType,
            explanation: feedback.explanation,
            hint: feedback.hint,
            concepts: typeof feedback.conceptsToReview === 'string' ? JSON.parse(feedback.conceptsToReview) : feedback.conceptsToReview,
            nextSteps: typeof feedback.nextSteps === 'string' ? JSON.parse(feedback.nextSteps) : feedback.nextSteps,
          });
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load submission details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 min-h-screen">Loading submission details...</div>;
  if (error || !submission) return <div className="p-8 text-center text-red-500 bg-gray-50 dark:bg-gray-900 min-h-screen">{error}</div>;

  const renderStatus = (status: string, size: 'sm' | 'lg' = 'sm') => {
    const isAccepted = status === 'ACCEPTED' || status === 'PASSED';
    const iconSize = size === 'lg' ? 'w-6 h-6 mr-2' : 'w-4 h-4 mr-2';
    const textSize = size === 'lg' ? 'text-lg' : 'text-sm';
    
    if (isAccepted) {
      return (
        <div className={`flex items-center text-green-600 dark:text-green-400 font-bold ${textSize}`}>
          <CheckCircle className={iconSize} /> {status === 'ACCEPTED' ? 'Accepted' : 'Passed'}
        </div>
      );
    }
    return (
      <div className={`flex items-center text-red-600 dark:text-red-400 font-bold ${textSize}`}>
        <XCircle className={iconSize} /> {status.replace(/_/g, ' ')}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors">
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center shrink-0 justify-between">
        <div className="flex items-center space-x-3">
          <AppBackButton fallbackPath={`/faculty/students/${submission.student.id}`} label="Back to Student" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              Submission #{submission.id.substring(0, 8)}
            </h1>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <span className="flex items-center"><User className="w-4 h-4 mr-1"/> {submission.student.name} ({submission.student.registerNumber})</span>
              <span>&bull;</span>
              <Link to={`/faculty/labs/${submission.labId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                {submission.labTitle}
              </Link>
              <span>&bull;</span>
              {new Date(submission.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Summary & Tests */}
        <div className="w-1/3 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col">
          <div className="p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              {renderStatus(submission.status, 'lg')}
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Language</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{submission.language}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Execution Time</div>
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" /> {submission.executionTime} ms
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Passed Tests</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {submission.passedTests} / {submission.totalTests}
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Test Results</h3>
            {submission.tests && submission.tests.length > 0 ? (
              <div className="space-y-3">
                {submission.tests.map((test, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        {test.visibility === 'HIDDEN' ? `Hidden Test ${test.testNumber}` : `Test ${test.testNumber}`}
                        {test.visibility === 'HIDDEN' && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Hidden</span>}
                      </span>
                      {renderStatus(test.status)}
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Execution Time: {test.executionTime} ms
                    </div>

                    {test.status === 'WRONG_ANSWER' && test.expectedOutput && (
                      <div className="mt-3 space-y-2 text-xs font-mono">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">Expected Output:</div>
                          <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-300 whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
                            {test.expectedOutput}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">Actual Output:</div>
                          <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-red-600 dark:text-red-400 whitespace-pre-wrap border border-red-200 dark:border-red-900/50">
                            {test.actualOutput || 'No output'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 italic text-sm bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                No test results available for this submission (e.g. Compilation Error).
              </div>
            )}

            {/* AI Hint Section - Read Only for Faculty */}
            {aiHint && (
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  AI Debugging Hint Generated by Student
                </h3>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="bg-indigo-600 dark:bg-indigo-900/80 px-4 py-3 flex items-center justify-between">
                    <span className="text-white font-medium flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      AI Feedback
                    </span>
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded uppercase font-semibold tracking-wide">
                      {aiHint.errorType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="p-5 space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">What might be happening</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{aiHint.explanation}</p>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-100 dark:border-amber-800/30">
                      <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1">Hint</h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200">{aiHint.hint}</p>
                    </div>

                    {aiHint.concepts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Concepts to review</h4>
                        <ul className="space-y-1">
                          {aiHint.concepts.map((concept, i) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                              <span className="text-indigo-500 mr-2">•</span>
                              {concept}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiHint.nextSteps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Try this next</h4>
                        <ol className="space-y-2">
                          {aiHint.nextSteps.map((step, i) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                              <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-mono px-1.5 py-0.5 rounded mr-2 mt-0.5">{i + 1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Source Code Viewer */}
        <div className={`flex-1 flex flex-col ${resolvedTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#fffffe]'}`}>
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center shrink-0 border-b border-gray-200 dark:border-gray-700 transition-colors">
            <FileCode2 className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="text-gray-800 dark:text-gray-200 font-medium text-sm">Submitted Source Code</span>
            <span className="ml-auto text-xs text-gray-500">Read Only</span>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={mapLanguageToMonaco(submission.language)}
              theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
              value={submission.sourceCode}
              options={{
                readOnly: true,
                minimap: { enabled: true },
                fontSize: 16,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16 }
              }}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};
