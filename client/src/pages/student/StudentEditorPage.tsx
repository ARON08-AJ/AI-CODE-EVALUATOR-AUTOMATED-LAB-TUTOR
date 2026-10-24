import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import Editor from '@monaco-editor/react';
import { Play, Send, Loader2, Terminal, CheckCircle, XCircle, Lightbulb, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import { starterCode, mapLanguageToMonaco } from '../../utils/starterCode';
import { useTheme } from '../../components/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { AppBackButton } from '../../components/AppBackButton';
import { ThemeToggle } from '../../components/ThemeToggle';

interface Lab {
  id: string;
  title: string;
  description: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  supportedLanguages: string;
  dueDate?: string | null;
  deadlineStatus?: 'NO_DEADLINE' | 'ACTIVE' | 'OVERDUE';
}

interface ExecutionResult {
  status: string;
  stdout: string;
  stderr: string;
  executionTime: number | null;
}

interface TestEvaluationResult {
  testNumber: number;
  visibility: 'PUBLIC' | 'HIDDEN';
  status: string;
  executionTime?: number | null;
  expectedOutput?: string;
  actualOutput?: string;
  error?: string;
}

interface EvaluationResult {
  status: string;
  passedTests: number;
  totalTests: number;
  failedTests: number;
  executionTime: number;
  tests: TestEvaluationResult[];
  compilerOutput?: string;
}

export const StudentEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  const getDraftKey = (labId: string, lang: string) => `coding_lab_${userId}_${labId}_${lang}`;
  const getInputKey = (labId: string) => `coding_lab_${userId}_${labId}_input`;

  const [lab, setLab] = useState<Lab | null>(null);
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

  const [language, setLanguage] = useState<string>('C');
  const languageRef = useRef(language);
  const [code, setCode] = useState<string>('');
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);

  const [customInput, setCustomInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'run' | 'submit'>('run');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [resultError, setResultError] = useState('');
  const [hint, setHint] = useState<any>(null);
  const [hintsByLevel, setHintsByLevel] = useState<Record<number, any>>({});
  const [activeHintLevel, setActiveHintLevel] = useState<number>(1);
  const [loadingHint, setLoadingHint] = useState(false);

  // Initialize and fetch lab
  useEffect(() => {
    const fetchLab = async () => {
      try {
        const res = await api.get(`/student/labs/${id}`);
        const fetchedLab = res.data.lab;
        setLab(fetchedLab);

        // Parse supported languages
        const langs = fetchedLab.supportedLanguages.split(',').map((l: string) => l.trim());
        const defaultLang = langs.includes('C++') ? 'C++' : langs.includes('C') ? 'C' : langs[0];
        
        setLanguage(defaultLang);
        languageRef.current = defaultLang;
        loadCodeFromDraft(fetchedLab.id, defaultLang);
        
        const savedInput = localStorage.getItem(getInputKey(fetchedLab.id));
        if (savedInput) setCustomInput(savedInput);

      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load lab. It may not exist, is unpublished, or you are not assigned.');
      } finally {
        setLoading(false);
      }
    };
    fetchLab();
  }, [id, userId]);

  const loadCodeFromDraft = (labId: string, lang: string) => {
    const draftKey = getDraftKey(labId, lang);
    const savedCode = localStorage.getItem(draftKey);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(starterCode[lang] || '');
    }
  };

  const handleLanguageChangeRequest = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    const currentStarter = starterCode[language] || '';
    const isDefaultCode = code.trim() === currentStarter.trim();
    
    if (isDefaultCode) {
      switchLanguage(newLang);
    } else {
      setPendingLanguage(newLang);
      setShowConfirm(true);
    }
  };

  const switchLanguage = (newLang: string) => {
    setLanguage(newLang);
    languageRef.current = newLang;
    loadCodeFromDraft(lab!.id, newLang);
    setPendingLanguage(null);
    setShowConfirm(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    if (lab) {
      localStorage.setItem(getDraftKey(lab.id, languageRef.current), newCode);
    }
  };

  const handleResetCode = () => {
    if (window.confirm('Are you sure you want to reset to the starter code? Your current changes will be lost.')) {
      const defaultCode = starterCode[languageRef.current] || '';
      setCode(defaultCode);
      if (lab) {
        localStorage.setItem(getDraftKey(lab.id, languageRef.current), defaultCode);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomInput(e.target.value);
    if (lab) {
      localStorage.setItem(getInputKey(lab.id), e.target.value);
    }
  };

  const handleRun = async () => {
    if (!lab || isRunning || isSubmitting) return;
    setIsRunning(true);
    setActiveTab('run');
    setResultError('');
    setExecutionResult(null);
    setHint(null);

    try {
      const res = await api.post(`/student/labs/${lab.id}/run`, {
        language,
        sourceCode: code,
        input: customInput
      });
      if (res.data.result) {
        setExecutionResult(res.data.result);
      } else if (res.data.evaluation) {
        const ev = res.data.evaluation;
        const firstTest = ev.tests?.[0];
        setExecutionResult({
          status: ev.status === 'ACCEPTED' ? 'SUCCESS' : ev.status,
          stdout: firstTest?.actualOutput || '',
          stderr: ev.compilerOutput || firstTest?.error || '',
          executionTime: ev.executionTime
        });
      }
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!lab || isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setActiveTab('submit');
    setResultError('');
    setEvaluationResult(null);
    setHint(null);

    try {
      const res = await api.post(`/student/labs/${lab.id}/submit`, {
        language,
        sourceCode: code
      });
      setEvaluationResult(res.data.evaluation);
    } catch (err: any) {
      handleApiError(err);
      if (err.response?.data?.evaluation) {
        setEvaluationResult(err.response.data.evaluation);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFetchProgressiveHint = async (level: number) => {
    if (!evaluationResult || !(evaluationResult as any).submissionId || loadingHint) return;

    if (hintsByLevel[level]) {
      setActiveHintLevel(level);
      setHint(hintsByLevel[level]);
      return;
    }

    setLoadingHint(true);
    setResultError('');
    try {
      const res = await api.post(`/student/submissions/${(evaluationResult as any).submissionId}/hint`, {
        hintLevel: level
      });
      const feedback = res.data.feedback;
      const returnedLevel = feedback.hintLevel || level;
      setHintsByLevel(prev => ({ ...prev, [returnedLevel]: feedback }));
      setActiveHintLevel(returnedLevel);
      setHint(feedback);
    } catch (err: any) {
      setResultError(err.response?.data?.error || 'Failed to generate AI hint.');
    } finally {
      setLoadingHint(false);
    }
  };

  const handleGetRunHint = async () => {
    if (!lab || !executionResult || loadingHint) return;
    setLoadingHint(true);
    setResultError('');
    try {
      const res = await api.post(`/student/labs/${lab.id}/run/hint`, {
        labId: lab.id,
        language,
        sourceCode: code,
        status: executionResult.status,
        stdout: executionResult.stdout,
        stderr: executionResult.stderr
      });
      setHint(res.data.feedback);
    } catch (err: any) {
      setResultError(err.response?.data?.error || 'Failed to generate AI hint.');
    } finally {
      setLoadingHint(false);
    }
  };

  const handleApiError = (err: any) => {
    if (err.response?.status === 429) {
      setResultError('Server is currently busy. Please try again shortly.');
    } else if (err.response?.status === 400) {
      setResultError(err.response.data.error || 'Invalid request.');
    } else if (err.response?.status === 404) {
      setResultError('Lab is no longer available or not assigned.');
    } else {
      setResultError('Unable to process due to an unexpected server error.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading lab environment...</div>;
  if (error || !lab) return <div className="p-8 text-center text-red-500">{error}</div>;

  const supportedLangs = lab.supportedLanguages.split(',').map(l => l.trim());

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      
      {/* Header */}
      <div className="h-14 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 transition-colors">
        <div className="flex items-center space-x-4">
          <AppBackButton fallbackPath={`/student/labs/${lab.id}`} label="Back to Lab" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-sm" title={lab.title}>
            {lab.title}
          </h1>
          {lab.deadlineStatus === 'OVERDUE' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
              <AlertTriangle className="w-3 h-3 mr-1" /> Deadline Passed
            </span>
          ) : lab.dueDate ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300">
              <Clock className="w-3 h-3 mr-1" /> Due {new Date(lab.dueDate).toLocaleDateString()}
            </span>
          ) : null}
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Language:</span>
            <select
              value={language}
              onChange={handleLanguageChangeRequest}
              disabled={isRunning || isSubmitting}
              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1.5 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              {supportedLangs.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleResetCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 disabled:opacity-50 rounded-md text-sm font-medium transition-colors"
            title="Reset to starter code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleRun} 
            disabled={isRunning || isSubmitting}
            className="flex items-center px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 disabled:dark:bg-gray-800 text-gray-800 dark:text-white text-sm font-medium rounded-md transition-colors"
          >
            {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? 'Running...' : 'Run'}
          </button>
          
          <button 
            onClick={handleSubmit} 
            disabled={isRunning || isSubmitting || lab.deadlineStatus === 'OVERDUE'}
            title={lab.deadlineStatus === 'OVERDUE' ? 'Submission deadline has passed' : 'Submit solution'}
            className="flex items-center px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:text-gray-200 text-white text-sm font-medium rounded-md transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} 
            {isSubmitting ? 'Submitting...' : lab.deadlineStatus === 'OVERDUE' ? 'Submission Closed' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Problem Information */}
        <div className="w-1/3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-y-auto border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-6 space-y-8 flex-1">
            {lab.deadlineStatus === 'OVERDUE' && (
              <div className="bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 p-3.5 text-xs text-red-800 dark:text-red-300 rounded-r-md">
                <strong className="font-bold">Deadline Passed:</strong> Submissions are closed ({new Date(lab.dueDate!).toLocaleString()}). You may still run code for practice and debugging.
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Problem Statement</h2>
              <div className="prose max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                {lab.description}
              </div>
            </div>

            <div>
              <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 mb-3">Constraints</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-xs text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                {lab.constraints}
              </div>
            </div>

            <div>
              <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 mb-3">Sample Input</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-xs text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                {lab.sampleInput}
              </div>
            </div>

            <div>
              <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 mb-3">Sample Output</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-xs text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                {lab.sampleOutput}
              </div>
            </div>

            {/* AI Debugging Panel */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" /> AI Debugging Assistant
              </h3>
              
              {/* Submission AI Progressive Hints Selector */}
              {evaluationResult && evaluationResult.status !== 'ACCEPTED' && evaluationResult.status !== 'PASSED' && (evaluationResult as any).submissionId && (
                <div className="space-y-3 mb-4">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Progressive Hints (Max 3 / Submission)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map(lvl => {
                      const isFetched = Boolean(hintsByLevel[lvl]);
                      const isActive = activeHintLevel === lvl && Boolean(hint);
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleFetchProgressiveHint(lvl)}
                          disabled={loadingHint}
                          className={`py-1.5 px-2 text-xs font-medium rounded-md border transition-colors ${
                            isActive
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isFetched
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          Hint {lvl} {isFetched ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!hint && !loadingHint && executionResult && executionResult.status !== 'SUCCESS' && (!evaluationResult || evaluationResult.status === 'ACCEPTED') && (
                <button
                  onClick={handleGetRunHint}
                  className="w-full flex items-center justify-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 rounded-md text-sm font-medium transition"
                >
                  <Lightbulb className="w-4 h-4 mr-2" /> Get Practice Run Hint
                </button>
              )}

              {loadingHint && (
                <div className="flex items-center justify-center py-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/40">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mr-2" />
                  <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Analyzing code with Groq AI...</span>
                </div>
              )}

              {hint && !loadingHint && (
                <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/60 pb-2">
                    <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide">
                      {hint.hintLevel ? `Hint Level ${hint.hintLevel} of 3` : 'Debugging Feedback'}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      hint.hintLevel === 1 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
                      hint.hintLevel === 2 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' :
                      'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'
                    }`}>
                      {hint.hintLevel === 1 ? 'Conceptual' : hint.hintLevel === 2 ? 'Specific Direction' : 'Deep Guidance'}
                    </span>
                  </div>

                  <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {hint.hint}
                  </div>

                  {hint.explanation && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2.5 rounded border border-indigo-100 dark:border-gray-800">
                      <strong className="font-semibold text-gray-700 dark:text-gray-300">Explanation: </strong>
                      {hint.explanation}
                    </div>
                  )}

                  {hint.conceptsToReview && (
                    <div className="text-xs">
                      <span className="font-semibold text-indigo-900 dark:text-indigo-300">Concepts to Review: </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {Array.isArray(hint.conceptsToReview) ? hint.conceptsToReview.join(', ') : typeof hint.conceptsToReview === 'string' ? JSON.parse(hint.conceptsToReview || '[]').join(', ') : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Monaco Editor & Terminal */}
        <div className={`flex-1 flex flex-col ${resolvedTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#fffffe]'}`}>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={mapLanguageToMonaco(language)}
              theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
              value={code}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: true },
                fontSize: 16,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16 }
              }}
            />
          </div>
          
          {/* Bottom Panel: Input & Output */}
          <div className="h-64 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex transition-colors">
            {/* Custom Input */}
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center border-b border-gray-200 dark:border-gray-700">
                <Terminal className="w-4 h-4 mr-2" /> Custom Input
              </div>
              <textarea
                value={customInput}
                onChange={handleInputChange}
                className="flex-1 w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 p-4 font-mono text-sm resize-none focus:outline-none"
                placeholder="Enter custom input here for 'Run'..."
                spellCheck={false}
              />
            </div>
            
            {/* Result Panel */}
            <div className="w-1/2 flex flex-col">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 flex items-center border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('run')}
                  className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider ${
                    activeTab === 'run' ? 'text-indigo-600 dark:text-white border-b-2 border-indigo-600 dark:border-indigo-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Run Result
                </button>
                <button
                  onClick={() => setActiveTab('submit')}
                  className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider ${
                    activeTab === 'submit' ? 'text-indigo-600 dark:text-white border-b-2 border-indigo-600 dark:border-indigo-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Evaluation
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 whitespace-pre-wrap">
                {resultError && (
                  <div className="text-red-400 mb-4">{resultError}</div>
                )}
                
                {/* RUN TAB */}
                {activeTab === 'run' && (
                  <>
                    {isRunning && <div className="text-gray-400 italic">Running code...</div>}
                    {!isRunning && executionResult && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">Status:</span>
                          <span className={`font-bold ${
                            executionResult.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {executionResult.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {executionResult.status === 'SUCCESS' && (
                          <div>
                            <div className="text-gray-600 dark:text-gray-500 mb-1">Output:</div>
                            <div className="bg-gray-100 dark:bg-black p-3 rounded-md text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                              {executionResult.stdout || <span className="text-gray-400 dark:text-gray-600 italic">No output</span>}
                            </div>
                          </div>
                        )}

                        {executionResult.status === 'COMPILATION_ERROR' && (
                          <div>
                            <div className="text-red-600 dark:text-red-500 mb-1">Compiler Output:</div>
                            <div className="bg-red-50 dark:bg-black p-3 rounded-md text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                              {executionResult.stderr}
                            </div>
                          </div>
                        )}

                        {(executionResult.status === 'RUNTIME_ERROR' || executionResult.status === 'OUTPUT_LIMIT_EXCEEDED' || executionResult.status === 'TIME_LIMIT_EXCEEDED') && (
                          <div>
                            {executionResult.stdout && (
                              <div className="mb-4">
                                <div className="text-gray-600 dark:text-gray-500 mb-1">Standard Output:</div>
                                <div className="bg-gray-100 dark:bg-black p-3 rounded-md text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                                  {executionResult.stdout}
                                </div>
                              </div>
                            )}
                            <div>
                              <div className="text-red-600 dark:text-red-500 mb-1">Standard Error:</div>
                              <div className="bg-red-50 dark:bg-black p-3 rounded-md text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                                {executionResult.stderr || <span className="text-gray-400 dark:text-gray-600 italic">Execution timed out or aborted.</span>}
                              </div>
                            </div>
                          </div>
                        )}

                        {executionResult.executionTime !== null && (
                          <div className="text-gray-500 text-xs mt-4">
                            Execution Time: {executionResult.executionTime} ms
                          </div>
                        )}
                        
                      </div>
                    )}
                    {!isRunning && !executionResult && !resultError && (
                      <div className="text-gray-600 italic mt-2">
                        Click 'Run' to test your code against custom input.
                      </div>
                    )}
                  </>
                )}

                {/* SUBMIT TAB */}
                {activeTab === 'submit' && (
                  <>
                    {isSubmitting && <div className="text-gray-400 italic">Evaluating test cases...</div>}
                    {!isSubmitting && evaluationResult && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-lg">
                          {evaluationResult.status === 'ACCEPTED' ? (
                            <><CheckCircle className="w-5 h-5 text-green-500" /> <span className="font-bold text-green-500">Accepted</span></>
                          ) : (
                            <><XCircle className="w-5 h-5 text-red-500" /> <span className="font-bold text-red-500">{evaluationResult.status.replace(/_/g, ' ')}</span></>
                          )}
                        </div>
                        
                        <div className="text-gray-400">
                          Passed: <span className="text-white">{evaluationResult.passedTests} / {evaluationResult.totalTests}</span>
                          <span className="ml-4">Time: <span className="text-white">{evaluationResult.executionTime} ms</span></span>
                        </div>

                        {evaluationResult.status === 'COMPILATION_ERROR' && evaluationResult.compilerOutput && (
                          <div>
                            <div className="text-red-500 mb-1 mt-4">Compiler Output:</div>
                            <div className="bg-black p-3 rounded-md text-red-400 text-xs">
                              {evaluationResult.compilerOutput}
                            </div>
                          </div>
                        )}

                        {evaluationResult.tests && evaluationResult.tests.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {evaluationResult.tests.map((test, idx) => (
                              <div key={idx} className="bg-gray-100 dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-gray-800 dark:text-gray-300">
                                    {test.visibility === 'HIDDEN' ? `Hidden Test ${test.testNumber}` : `Test ${test.testNumber}`}
                                  </span>
                                  <span className={test.status === 'ACCEPTED' || test.status === 'PASSED' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {test.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                
                                {test.visibility === 'PUBLIC' && test.status === 'WRONG_ANSWER' && (
                                  <div className="mt-2 text-xs space-y-2">
                                    <div>
                                      <div className="text-gray-500">Expected:</div>
                                      <div className="bg-white dark:bg-black p-2 rounded text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{test.expectedOutput}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Actual:</div>
                                      <div className="bg-white dark:bg-black p-2 rounded text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{test.actualOutput || 'No output'}</div>
                                    </div>
                                  </div>
                                )}
                                
                                {test.visibility === 'PUBLIC' && test.status === 'RUNTIME_ERROR' && test.error && (
                                  <div className="mt-2 text-xs">
                                    <div className="text-red-500">Error:</div>
                                    <div className="bg-white dark:bg-black p-2 rounded text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">{test.error}</div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                      </div>
                    )}
                    {!isSubmitting && !evaluationResult && !resultError && (
                      <div className="text-gray-600 italic mt-2">
                        Click 'Submit' to evaluate your code against the lab's test cases.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Switch language?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Changing language will replace the current code in your editor. Are you sure you want to discard your changes?
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => { setShowConfirm(false); setPendingLanguage(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={() => pendingLanguage && switchLanguage(pendingLanguage)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

