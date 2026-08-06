import React, { useState } from 'react';
import { Bot, Lightbulb, BookOpen, AlertTriangle, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';

export default function AITutorPanel({ submission }) {
  const [activeTab, setActiveTab] = useState('hints');
  const [askQuestion, setAskQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  if (!submission || submission.status === 'ACCEPTED') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-800">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">Solution Accepted!</h3>
        <p className="text-sm text-slate-400 mt-1">
          Great job! All test cases passed successfully. No AI debugging hints needed.
        </p>
      </div>
    );
  }

  const handleAskTutor = (e) => {
    e.preventDefault();
    if (!askQuestion.trim()) return;

    const userQ = askQuestion;
    setAskQuestion('');

    const newChat = [...chatHistory, { role: 'user', text: userQ }];
    setChatHistory(newChat);

    // Simulated pedagogical response adhering strictly to non-solution rules
    setTimeout(() => {
      setChatHistory([
        ...newChat,
        {
          role: 'assistant',
          text: `Focus on the variables modified right before your loop condition. Ask yourself: is the terminating condition reachable for all valid input ranges?`
        }
      ]);
    }, 600);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-full shadow-lg">
      {/* AI Tutor Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-sky-950 text-sky-400 rounded-lg border border-sky-800">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              AI Automated Lab Tutor
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-950 text-amber-300 border border-amber-800 rounded">
                Non-Spoiler Mode
              </span>
            </h3>
            <p className="text-xs text-slate-400">Conceptual debugging & error explanation</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/50 px-4">
        <button
          onClick={() => setActiveTab('hints')}
          className={`py-2 px-3 text-xs font-medium border-b-2 transition ${
            activeTab === 'hints'
              ? 'border-sky-500 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Structured Hints
        </button>
        <button
          onClick={() => setActiveTab('ask')}
          className={`py-2 px-3 text-xs font-medium border-b-2 transition ${
            activeTab === 'ask'
              ? 'border-sky-500 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Ask Tutor Question
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'hints' ? (
          <>
            {/* Error Analysis Card */}
            <div className="bg-slate-950 border border-amber-900/50 rounded-lg p-3.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <AlertTriangle className="w-4 h-4" />
                Root Cause Analysis
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {submission.analysis || "The program failed evaluation. Inspect error diagnostics below."}
              </p>
            </div>

            {/* Hint 1 */}
            {submission.hint1 && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  <Lightbulb className="w-4 h-4 text-sky-400" />
                  Hint 1: Conceptual Direction
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{submission.hint1}</p>
              </div>
            )}

            {/* Hint 2 */}
            {submission.hint2 && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-4 h-4" />
                  Hint 2: Debugging Strategy
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{submission.hint2}</p>
              </div>
            )}

            {/* Hint 3 */}
            {submission.hint3 && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  <ChevronRight className="w-4 h-4" />
                  Hint 3: Logic Check
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{submission.hint3}</p>
              </div>
            )}

            {/* Recommended Topics */}
            {submission.recommendedTopics && submission.recommendedTopics.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <BookOpen className="w-4 h-4" />
                  Recommended Topics to Revise
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {submission.recommendedTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium bg-purple-950/70 text-purple-300 border border-purple-800/60 rounded-md"
                    >
                      {topic.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Guardrail Disclaimer */}
            <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded text-[11px] text-slate-400 flex items-center gap-2">
              <Bot className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                AI Tutor is restricted from revealing full solution code or hidden test cases to encourage independent problem-solving.
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                Hi! Ask me any conceptual question about your mistake or logic. I will guide your thinking step-by-step without giving away code!
              </div>

              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-sky-900 text-sky-100 ml-auto border border-sky-700'
                      : 'bg-slate-950 text-slate-200 mr-auto border border-slate-800'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleAskTutor} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Ask for a debugging hint..."
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                className="flex-1 bg-slate-950 text-xs px-3 py-2 rounded border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded transition"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
