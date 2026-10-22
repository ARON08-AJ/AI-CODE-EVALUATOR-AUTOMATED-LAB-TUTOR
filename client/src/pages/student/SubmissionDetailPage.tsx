import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import Editor from '@monaco-editor/react';
import { CheckCircle, XCircle, Clock, FileCode2, Lightbulb, Brain, GitCompare } from 'lucide-react';
import { mapLanguageToMonaco } from '../../utils/starterCode';
import { useTheme } from '../../components/ThemeProvider';
import { ThemeToggle } from '../../components/ThemeToggle';
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
}

interface AIHintData {
  hintLevel: number;
  errorType: string;
  explanation: string;
  hint: string;
  concepts: string[];
  nextSteps: string[];
}

export const SubmissionDetailPage: React.FC = () => {
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

  // 3-Hint State
  const [hintsMap, setHintsMap] = useState<Record<number, AIHintData>>({});
  const [activeHintLevel, setActiveHintLevel] = useState<number>(1);
  const [loadingHint, setLoadingHint] = useState(false);
  const [hintError, setHintError] = useState('');

  const handleGetHint = async (levelToRequest?: number) => {
    if (levelToRequest && hintsMap[levelToRequest]) {
      setActiveHintLevel(levelToRequest);
      return;
    }

    setLoadingHint(true);
    setHintError('');
    try {
      const res = await api.post(`/student/submissions/${id}/hint`, {
        hintLevel: levelToRequest
      });
      const fb = res.data.feedback;
      const newHintLevel = fb.hintLevel || levelToRequest || 1;
      const newHint: AIHintData = {
        hintLevel: newHintLevel,
        errorType: fb.errorType,
        explanation: fb.explanation,
        hint: fb.hint,
        concepts: Array.isArray(fb.concepts) 
          ? fb.concepts 
          : (typeof fb.concepts === 'string' ? JSON.parse(fb.concepts) : (fb.conceptsToReview || [])),
        nextSteps: Array.isArray(fb.nextSteps) 
          ? fb.nextSteps 
          : (typeof fb.nextSteps === 'string' ? JSON.parse(fb.nextSteps) : (fb.nextSteps || [])),
      };

      setHintsMap(prev => ({
        ...prev,
        [newHintLevel]: newHint
      }));
      setActiveHintLevel(newHintLevel);
    } catch (err: any) {
      setHintError(err.response?.data?.error || 'Failed to generate AI hint.');
    } finally {
      setLoadingHint(false);
    }
  };

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await api.get(`/student/submissions/${id}`);
        const fetchedSubmission = res.data.submission;
        setSubmission(fetchedSubmission);
        
        if (fetchedSubmission.aiFeedback && Array.isArray(fetchedSubmission.aiFeedback) && fetchedSubmission.aiFeedback.length > 0) {
          const map: Record<number, AIHintData> = {};
          fetchedSubmission.aiFeedback.forEach((feedback: any) => {
            const level = feedback.hintLevel || 1;
            map[level] = {
              hintLevel: level,
              errorType: feedback.errorType,
              explanation: feedback.explanation,
              hint: feedback.hint,
              concepts: Array.isArray(feedback.concepts) 
                ? feedback.concepts 
                : (typeof feedback.conceptsToReview === 'string' ? JSON.parse(feedback.conceptsToReview) : (feedback.conceptsToReview || [])),
              nextSteps: Array.isArray(feedback.nextSteps) 
                ? feedback.nextSteps 
                : (typeof feedback.nextSteps === 'string' ? JSON.parse(feedback.nextSteps) : (feedback.nextSteps || [])),
            };
          });
          setHintsMap(map);
          const levels = Object.keys(map).map(Number);
          if (levels.length > 0) {
            setActiveHintLevel(Math.max(...levels));
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load submission details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading submission details...</div>;
  if (error || !submission) return <div className="p-8 text-center text-red-500">{error}</div>;

  const renderStatus = (status: string, size: 'sm' | 'lg' = 'sm') => {
    const isAccepted = status === 'ACCEPTED' || status === 'PASSED';
    const iconSize = size === 'lg' ? 'w-6 h-6 mr-2' : 'w-4 h-4 mr-2';
    const textSize = size === 'lg' ? 'text-lg' : 'text-sm';
    
    if (isAccepted) {
      return (
        <div className={`flex items-center text-green-600 font-bold ${textSize}`}>
          <CheckCircle className={iconSize} /> {status === 'ACCEPTED' ? 'Accepted' : 'Passed'}
        </div>
      );
    }
    return (
      <div className={`flex items-center text-red-600 font-bold ${textSize}`}>
        <XCircle className={iconSize} /> {status.replace(/_/g, ' ')}
      </div>
    );
  };

  const usedHintCount = Object.keys(hintsMap).length;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors">
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <AppBackButton fallbackPath="/student/submissions" label="Back to Submissions" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Submission #{submission.id.substring(0, 8)}
            </h1>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Link to={`/student/labs/${submission.labId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                {submission.labTitle}
              </Link>
              <span>•</span>
              <span>{new Date(submission.createdAt).toLocaleString()}</span>
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
                    <Clock className="w-4 h-4 mr-1 text-gray-400" /> {submission.executionTime} ms
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
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {test.visibility === 'HIDDEN' ? `Hidden Test ${test.testNumber}` : `Test ${test.testNumber}`}
                      </span>
                      {renderStatus(test.status)}
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Execution Time: {test.executionTime} ms
                    </div>

                    {test.visibility === 'PUBLIC' && test.status === 'WRONG_ANSWER' && test.expectedOutput && (
                      <div className="mt-3 space-y-2 text-xs font-mono">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">Expected Output:</div>
                          <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-200 whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
                            {test.expectedOutput}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">Actual Output:</div>
                          <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-red-600 dark:text-red-400 whitespace-pre-wrap border border-red-200 dark:border-red-900/40">
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

            {/* AI Hint Section */}
            {submission.status !== 'ACCEPTED' && submission.status !== 'PASSED' && (
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    AI Debugging Hints
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    Hints used: {usedHintCount} / 3
                  </span>
                </div>
                
                {/* Progressive 3-Hint Controls */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1, 2, 3].map(level => {
                    const isGenerated = !!hintsMap[level];
                    const isNextToGenerate = level === 1 || !!hintsMap[level - 1];
                    const isActive = activeHintLevel === level && isGenerated;

                    let label = `Hint ${level}`;
                    let subText = level === 1 ? 'Conceptual' : level === 2 ? 'Specific' : 'Deep Guidance';

                    return (
                      <button
                        key={level}
                        disabled={loadingHint || (!isGenerated && !isNextToGenerate)}
                        onClick={() => handleGetHint(level)}
                        className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : isGenerated
                            ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                            : isNextToGenerate
                            ? 'bg-white text-gray-800 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                            : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-sm">{label}</span>
                          {isGenerated && <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/20">Saved</span>}
                        </div>
                        <span className={`text-xs ${isActive ? 'text-indigo-100' : isGenerated ? 'text-indigo-600' : 'text-gray-400'}`}>
                          {isGenerated ? 'View Hint' : isNextToGenerate ? `Get ${subText}` : 'Locked'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {hintError && <p className="text-red-500 text-xs mb-4 p-3 bg-red-50 rounded border border-red-100">{hintError}</p>}

                {loadingHint && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center shadow-sm">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500 animate-pulse">Generating educational hint...</p>
                  </div>
                )}

                {!loadingHint && hintsMap[activeHintLevel] && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
                      <span className="text-white font-medium flex items-center text-sm">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Hint Level {activeHintLevel} of 3
                      </span>
                      <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded uppercase font-semibold tracking-wide">
                        {hintsMap[activeHintLevel].errorType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">What might be happening</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{hintsMap[activeHintLevel].explanation}</p>
                      </div>
                      
                      <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-md border border-amber-100 dark:border-amber-900/40">
                        <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1">Hint Direction</h4>
                        <p className="text-sm text-amber-900 dark:text-amber-200 font-medium leading-relaxed">{hintsMap[activeHintLevel].hint}</p>
                      </div>

                      {hintsMap[activeHintLevel].concepts.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Concepts to review</h4>
                          <ul className="space-y-1">
                            {hintsMap[activeHintLevel].concepts.map((concept, i) => (
                              <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                                <span className="text-indigo-500 mr-2">•</span>
                                {concept}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {hintsMap[activeHintLevel].nextSteps.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Try this next</h4>
                          <ol className="space-y-2">
                            {hintsMap[activeHintLevel].nextSteps.map((step, i) => (
                              <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-mono px-1.5 py-0.5 rounded mr-2 mt-0.5">{i + 1}</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Source Code Viewer */}
        <div className={`flex-1 flex flex-col ${resolvedTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center shrink-0 border-b border-gray-200 dark:border-gray-700">
            <FileCode2 className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="text-gray-800 dark:text-gray-200 font-medium text-sm">Submitted Source Code</span>
            <Link 
              to={`/student/submissions/${submission.id}/compare`}
              className="ml-auto text-xs flex items-center bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 transition-colors"
            >
              <GitCompare className="w-4 h-4 mr-1.5" />
              Compare with Starter Code
            </Link>
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
