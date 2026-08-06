import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { labAPI, submissionAPI } from '../services/api';
import Navbar from '../components/Navbar';
import MonacoEditorWindow from '../components/MonacoEditorWindow';
import AITutorPanel from '../components/AITutorPanel';
import { Play, Send, CheckCircle2, XCircle, AlertTriangle, Clock, HardDrive, Terminal, Bot, BookOpen, Layers } from 'lucide-react';

export default function CodeWorkspace() {
  const { questionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('PYTHON');

  // Execution states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'ai'

  useEffect(() => {
    const qId = questionId || '1';
    labAPI.getQuestion(qId)
      .then((res) => {
        setQuestion(res.data);
        // Default code template
        setCode(`# Write your ${language} solution here\nn = int(input())\nif n % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")\n`);
      })
      .catch((err) => {
        console.error("Error fetching question:", err);
        // Fallback default mock question for local demo workspace
        setQuestion({
          id: 1,
          title: "Even or Odd Integer Check",
          problemStatement: "Write a program that takes an integer input from standard input and prints 'Even' if the number is even, or 'Odd' if the number is odd.",
          sampleInput: "4",
          sampleOutput: "Even",
          allowedLanguages: "C,CPP,JAVA,PYTHON",
          timeLimitMs: 2000,
          memoryLimitMb: 256
        });
      })
      .finally(() => setLoading(false));
  }, [questionId]);

  const handleRunCode = async () => {
    setRunning(true);
    setRunResult(null);
    setActiveTab('console');

    try {
      const res = await submissionAPI.run({
        questionId: question?.id || 1,
        code,
        language
      });
      setRunResult(res.data);
    } catch (err) {
      alert("Failed to run code execution service.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await submissionAPI.submit({
        questionId: question?.id || 1,
        code,
        language
      });
      setSubmissionResult(res.data);
      if (res.data.status !== 'ACCEPTED') {
        setActiveTab('ai'); // Auto-switch to AI Tutor Panel on failure
      } else {
        setActiveTab('console');
      }
    } catch (err) {
      alert("Failed to submit solution for evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Code Laboratory...
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <Navbar />

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Pane: Problem Description & Test Cases (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-slate-100">{question?.title || 'Problem Statement'}</h2>
            </div>
            <span className="px-2 py-0.5 text-[11px] font-mono bg-sky-950 text-sky-300 border border-sky-800 rounded">
              Task #{question?.id}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
            {/* Problem Text */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{question?.problemStatement}</p>
            </div>

            {/* Constraints */}
            <div className="flex gap-4 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Time Limit: {question?.timeLimitMs || 2000} ms
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                Memory: {question?.memoryLimitMb || 256} MB
              </div>
            </div>

            {/* Sample Inputs / Outputs */}
            {question?.sampleInput && (
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Sample Input</div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-sky-300">
                    {question.sampleInput}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Sample Output</div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300">
                    {question.sampleOutput}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center/Right Pane: Editor + Output & AI Tutor (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full gap-3 overflow-hidden">
          {/* Top: Monaco Editor */}
          <div className="flex-1 min-h-[360px]">
            <MonacoEditorWindow
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
            />
          </div>

          {/* Action Button Controls */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Sandbox: Docker / Isolation Active</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunCode}
                disabled={running || submitting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-sky-400" />
                {running ? 'Running...' : 'Run Code'}
              </button>

              <button
                onClick={handleSubmitCode}
                disabled={running || submitting}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-md shadow-lg shadow-sky-950 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Evaluating...' : 'Submit Solution'}
              </button>
            </div>
          </div>

          {/* Bottom Pane: Console & AI Tutor Drawer Tabs */}
          <div className="h-56 bg-slate-900 border border-slate-800 rounded-lg flex flex-col overflow-hidden shadow-lg">
            {/* Output Tabs Header */}
            <div className="bg-slate-950 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('console')}
                  className={`py-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
                    activeTab === 'console'
                      ? 'border-sky-500 text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Execution Console
                </button>

                <button
                  onClick={() => setActiveTab('ai')}
                  className={`py-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
                    activeTab === 'ai'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  AI Educational Tutor
                  {submissionResult && submissionResult.status !== 'ACCEPTED' && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  )}
                </button>
              </div>

              {/* Status Badge */}
              {(submissionResult || runResult) && (
                <div className="py-1">
                  <span
                    className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                      (submissionResult?.status || runResult?.status) === 'ACCEPTED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {submissionResult?.status || runResult?.status}
                  </span>
                </div>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
              {activeTab === 'console' ? (
                <div className="space-y-3">
                  {!runResult && !submissionResult && (
                    <div className="text-slate-500 italic text-center py-6">
                      Click 'Run Code' to test sample cases or 'Submit Solution' to evaluate against hidden test cases.
                    </div>
                  )}

                  {runResult && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-slate-400 border-b border-slate-800 pb-2">
                        <span>Test Cases Passed: <strong className="text-slate-100">{runResult.passCount}/{runResult.totalTestCases}</strong></span>
                        <span>Time: <strong className="text-slate-100">{runResult.executionTimeMs} ms</strong></span>
                        <span>Memory: <strong className="text-slate-100">{runResult.memoryUsedKb} KB</strong></span>
                      </div>

                      {runResult.stdout && (
                        <div>
                          <div className="text-slate-400 font-semibold mb-1">Standard Output (stdout):</div>
                          <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-200">{runResult.stdout}</pre>
                        </div>
                      )}

                      {runResult.stderr && (
                        <div>
                          <div className="text-rose-400 font-semibold mb-1">Error Diagnostics (stderr):</div>
                          <pre className="p-2.5 bg-rose-950/40 border border-rose-900 text-rose-300">{runResult.stderr}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {submissionResult && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-slate-400 border-b border-slate-800 pb-2">
                        <span>Passed: <strong className="text-slate-100">{submissionResult.passCount}/{submissionResult.totalTestCases}</strong></span>
                        <span>Exec Time: <strong className="text-slate-100">{submissionResult.executionTimeMs} ms</strong></span>
                        <span>Memory: <strong className="text-slate-100">{submissionResult.memoryUsedKb} KB</strong></span>
                      </div>

                      {submissionResult.stdout && (
                        <div>
                          <div className="text-slate-400 font-semibold mb-1">Output Log:</div>
                          <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-200">{submissionResult.stdout}</pre>
                        </div>
                      )}

                      {submissionResult.stderr && (
                        <div>
                          <div className="text-rose-400 font-semibold mb-1">Compiler / Execution Error:</div>
                          <pre className="p-2.5 bg-rose-950/40 border border-rose-900 text-rose-300">{submissionResult.stderr}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <AITutorPanel submission={submissionResult} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
