import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import {
  codeReviewAPI, plagiarismAPI, resumeAPI, interviewAPI, aptitudeAPI, contestAPI, vivaAPI,
  debuggerReplayAPI, pairTutorAPI, revisionAPI, facultyAssistantAPI
} from '../services/api';
import { Sparkles, Code2, ShieldAlert, FileText, MessageSquare, BookOpen, CheckCircle, AlertTriangle, ArrowRight, Bot, Search, Upload, Trophy, HelpCircle, Play, Mic, Volume2, FileSpreadsheet, Cpu, Terminal } from 'lucide-react';

export default function PlacementEcosystem() {
  const [activeTab, setActiveTab] = useState('code-review');

  // Code Review State
  const [reviewCode, setReviewCode] = useState("def calculate_sum(arr):\n    total = 0\n    for x in arr:\n        if x > 0:\n            total += x\n    return total\n");
  const [reviewLanguage, setReviewLanguage] = useState("PYTHON");
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  // Plagiarism State
  const [plagResult, setPlagResult] = useState(null);
  const [scanningPlag, setScanningPlag] = useState(false);

  // Resume State
  const [resumeText, setResumeText] = useState("Jane Doe\nFull Stack Developer\nSkills: Java, Python, Spring Boot, React, SQL, Git\nProjects: Built AI Code Evaluator application.");
  const [targetRole, setTargetRole] = useState("Backend Engineer");
  const [githubUser, setGithubUser] = useState("Aadhikesav07");
  const [pdfFile, setPdfFile] = useState(null);
  const [resumeResult, setResumeResult] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);

  // Debugger Replay State (Module 4)
  const [replayResult, setReplayResult] = useState(null);
  const [loadingReplay, setLoadingReplay] = useState(false);

  // Pair Programmer State (Module 8)
  const [pairQuery, setPairQuery] = useState("I don't understand recursion base cases.");
  const [pairReply, setPairReply] = useState(null);
  const [loadingPair, setLoadingPair] = useState(false);

  // Voice Mentor State (Module 11)
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("Explain Binary Search algorithm in simple terms.");
  const [voiceReply, setVoiceReply] = useState("");

  // Revision Notes State (Module 12)
  const [revisionTopic, setRevisionTopic] = useState("Arrays & Two-Pointer Techniques");
  const [notesResult, setNotesResult] = useState(null);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Faculty Assistant State (Module 13 & 14)
  const [facultyIdea, setFacultyIdea] = useState("Subarray Max Product");
  const [facultyLabResult, setFacultyLabResult] = useState(null);
  const [facultyEdgeResult, setFacultyEdgeResult] = useState(null);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  // Handlers
  const handleRunCodeReview = async () => {
    setReviewing(true);
    try {
      const res = await codeReviewAPI.analyze({ code: reviewCode, language: reviewLanguage });
      setReviewResult(res.data);
    } catch (err) {
      alert("Failed to analyze code quality.");
    } finally {
      setReviewing(false);
    }
  };

  const handleScanPlagiarism = async () => {
    setScanningPlag(true);
    try {
      const res = await plagiarismAPI.scanCohort(1);
      setPlagResult(res.data);
    } catch (err) {
      alert("Failed to run cohort plagiarism scan.");
    } finally {
      setScanningPlag(false);
    }
  };

  const handleAnalyzeResume = async () => {
    setAnalyzingResume(true);
    try {
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        formData.append('targetRole', targetRole);
        formData.append('githubUsername', githubUser);
        const res = await resumeAPI.uploadPdf(formData);
        setResumeResult(res.data);
      } else {
        const res = await resumeAPI.analyze({ resumeText, targetRole, githubUsername: githubUser });
        setResumeResult(res.data);
      }
    } catch (err) {
      alert("Failed to analyze resume.");
    } finally {
      setAnalyzingResume(false);
    }
  };

  const handleLoadReplay = async () => {
    setLoadingReplay(true);
    try {
      const res = await debuggerReplayAPI.getReplay("SUB-882");
      setReplayResult(res.data);
    } catch (err) {
      alert("Failed to load debugger replay.");
    } finally {
      setLoadingReplay(false);
    }
  };

  const handlePairChat = async () => {
    setLoadingPair(true);
    try {
      const res = await pairTutorAPI.chat({ studentQuery: pairQuery, codeContext: reviewCode, language: reviewLanguage });
      setPairReply(res.data);
    } catch (err) {
      alert("Failed to get response from AI Pair Programmer.");
    } finally {
      setLoadingPair(false);
    }
  };

  const handleVoiceSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(voiceReply || "Binary search finds elements in a sorted array by repeatedly dividing the search interval in half.");
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-Speech API not supported in this browser.");
    }
  };

  const handleLoadNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await revisionAPI.getNotes(revisionTopic);
      setNotesResult(res.data);
    } catch (err) {
      alert("Failed to generate revision notes.");
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleGenerateFacultyLab = async () => {
    setLoadingFaculty(true);
    try {
      const res = await facultyAssistantAPI.generateLab(facultyIdea);
      setFacultyLabResult(res.data);
      const edgeRes = await facultyAssistantAPI.generateEdgeCases(res.data.problemStatement);
      setFacultyEdgeResult(edgeRes.data);
    } catch (err) {
      alert("Failed to generate automated faculty lab.");
    } finally {
      setLoadingFaculty(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> AI Placement & Education Ecosystem (16 Modules)
            </div>
            <h1 className="text-2xl font-bold text-slate-100">AI Programming & Placement Platform</h1>
            <p className="text-sm text-slate-400 mt-1">AI Code Reviewer, Plagiarism Engine, Debugger Replay, Pair Programmer, Voice Mentor, & Faculty Tools.</p>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/60 p-1.5 rounded-xl gap-1">
          <button onClick={() => setActiveTab('code-review')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'code-review' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}><Code2 className="w-3.5 h-3.5" /> Code Reviewer</button>
          <button onClick={() => setActiveTab('debugger')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'debugger' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}><Terminal className="w-3.5 h-3.5" /> Debugger Replay</button>
          <button onClick={() => setActiveTab('pair')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'pair' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Bot className="w-3.5 h-3.5" /> Pair Programmer</button>
          <button onClick={() => setActiveTab('voice')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'voice' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}><Mic className="w-3.5 h-3.5" /> Voice Mentor</button>
          <button onClick={() => setActiveTab('revision')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'revision' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}><FileSpreadsheet className="w-3.5 h-3.5" /> Revision Notes</button>
          <button onClick={() => setActiveTab('faculty')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'faculty' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}><Cpu className="w-3.5 h-3.5" /> Faculty Assistant</button>
          <button onClick={() => setActiveTab('plagiarism')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'plagiarism' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}><ShieldAlert className="w-3.5 h-3.5" /> Plagiarism</button>
          <button onClick={() => setActiveTab('resume')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'resume' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}><FileText className="w-3.5 h-3.5" /> PDF Resume ATS</button>
        </div>

        {/* Module 4: Debugger Replay Timeline */}
        {activeTab === 'debugger' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
                  <Terminal className="w-5 h-5 text-purple-400" /> Module 4: AI Debugger Replay Execution Timeline
                </h3>
                <p className="text-xs text-slate-400 mt-1">Step-by-step visual execution timeline for failed program runs.</p>
              </div>
              <button onClick={handleLoadReplay} disabled={loadingReplay} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow">
                {loadingReplay ? 'Generating Timeline...' : 'Load Execution Replay'}
              </button>
            </div>

            {replayResult && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="font-bold text-rose-400 mb-1">{replayResult.failureType} at Line #{replayResult.errorLineNumber}</div>
                  <p className="text-slate-300">{replayResult.aiDiagnosis}</p>
                </div>

                <div className="space-y-3">
                  {replayResult.executionTimeline?.map((step) => (
                    <div key={step.stepNumber} className={`p-4 rounded-xl border ${step.status === 'CRASH' ? 'bg-rose-950/40 border-rose-800' : 'bg-slate-950 border-slate-800'}`}>
                      <div className="flex justify-between items-center font-bold text-slate-200 mb-2">
                        <span>{step.iterationLabel}</span>
                        <span className={`px-2 py-0.5 text-[10px] rounded ${step.status === 'CRASH' ? 'bg-rose-900 text-rose-200' : 'bg-slate-800 text-slate-300'}`}>{step.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-slate-300">
                        <div>Variable State: {JSON.stringify(step.variableState)}</div>
                        <div>Condition: {step.conditionalEvaluation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Module 8: AI Pair Programmer */}
        {activeTab === 'pair' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" /> Module 8: Conversational Socratic AI Pair Programmer
              </h3>
              <textarea rows="4" value={pairQuery} onChange={(e) => setPairQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100" placeholder="Ask a conceptual or debugging question..."></textarea>
              <button onClick={handlePairChat} disabled={loadingPair} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow">
                {loadingPair ? 'AI Thinking...' : 'Ask AI Pair Programmer'}
              </button>
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Pedagogical AI Response
              </h3>
              {pairReply ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 leading-relaxed">{pairReply.aiReply}</div>
                  <div className="p-3 bg-indigo-950/60 border border-indigo-800 rounded-lg">
                    <div className="font-bold text-indigo-300">Leading Question:</div>
                    <p className="text-slate-300 mt-1">{pairReply.leadingQuestion}</p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs text-center py-12">Ask any question to receive non-spoiler conceptual guidance.</div>
              )}
            </div>
          </div>
        )}

        {/* Module 11: Web Speech AI Voice Mentor */}
        {activeTab === 'voice' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
              <Mic className="w-5 h-5 text-teal-400" /> Module 11: AI Voice Mentor (Speech Recognition & Audio Synthesis)
            </h3>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Voice Question Transcript:</label>
                <input type="text" value={voiceTranscript} onChange={(e) => setVoiceTranscript(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setVoiceReply("Binary search finds elements in a sorted array in O(log N) time by repeatedly dividing the search interval in half.")} className="px-4 py-2 bg-teal-600 text-white rounded font-semibold flex items-center gap-1.5">
                  <Mic className="w-4 h-4" /> Speak Question
                </button>
                <button onClick={handleVoiceSpeak} className="px-4 py-2 bg-slate-800 text-slate-200 rounded font-semibold flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-teal-400" /> Listen to AI Voice Response
                </button>
              </div>
              {voiceReply && <div className="p-3 bg-slate-900 border border-teal-800/80 rounded text-teal-300">{voiceReply}</div>}
            </div>
          </div>
        )}

        {/* Module 12: Revision Notes */}
        {activeTab === 'revision' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Module 12: AI Revision Notes Generator & PDF Exporter
              </h3>
              <button onClick={handleLoadNotes} disabled={loadingNotes} className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded shadow">
                {loadingNotes ? 'Generating...' : 'Generate Revision Notes'}
              </button>
            </div>

            {notesResult && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <h4 className="font-bold text-emerald-400 text-sm mb-2">{notesResult.topic}</h4>
                  <div className="font-semibold text-slate-200 mb-1">Key Formulas & Complexities:</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">{notesResult.importantFormulasAndComplexities?.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Module 13 & 14: Faculty Assistant */}
        {activeTab === 'faculty' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
                <Cpu className="w-5 h-5 text-amber-400" /> Module 13 & 14: AI Faculty Assistant & Edge Case Suite Generator
              </h3>
              <button onClick={handleGenerateFacultyLab} disabled={loadingFaculty} className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded shadow">
                {loadingFaculty ? 'Generating...' : 'Generate Lab & Edge Cases'}
              </button>
            </div>

            {facultyLabResult && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="flex justify-between items-center font-bold text-amber-400 mb-1">
                    <span>{facultyLabResult.title}</span>
                    <span className="text-slate-400 font-mono">{facultyLabResult.bloomsTaxonomyLevel}</span>
                  </div>
                  <p className="text-slate-300">{facultyLabResult.problemStatement}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'code-review' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><Code2 className="w-5 h-5 text-sky-400" /> Source Code Input</h3>
              <textarea rows="10" value={reviewCode} onChange={(e) => setReviewCode(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200"></textarea>
              <button onClick={handleRunCodeReview} disabled={reviewing} className="w-full py-2.5 bg-sky-600 text-white text-xs font-semibold rounded-lg shadow">{reviewing ? 'Analyzing...' : 'Run Review'}</button>
            </div>
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><Sparkles className="w-5 h-5 text-sky-400" /> Quality & Complexity Diagnostics</h3>
              {reviewResult ? <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2"><div className="font-bold text-sky-400">Quality Score: {reviewResult.qualityScore}/100</div><p className="text-slate-300">{reviewResult.architecturalSummary}</p></div> : <div className="text-slate-400 text-xs text-center py-12">Click 'Run Review' to view metrics.</div>}
            </div>
          </div>
        )}

        {/* PDF Resume ATS Tab */}
        {activeTab === 'resume' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" /> PDF Resume File Upload</h3>
              <input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} className="text-xs text-slate-300" />
              <button onClick={handleAnalyzeResume} disabled={analyzingResume} className="w-full py-2.5 bg-cyan-600 text-white text-xs font-semibold rounded-lg shadow">{analyzingResume ? 'Analyzing...' : 'Audit PDF Resume'}</button>
            </div>
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-400" /> ATS Compatibility Results</h3>
              {resumeResult ? <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs"><div className="text-2xl font-bold text-cyan-400">{resumeResult.atsScore}/100</div><p className="text-slate-300 mt-2">{resumeResult.summary}</p></div> : <div className="text-slate-400 text-xs text-center py-12">Upload a PDF resume to view ATS score.</div>}
            </div>
          </div>
        )}

        {/* Plagiarism Tab */}
        {activeTab === 'plagiarism' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-slate-100 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-400" /> Plagiarism Detector</h3><button onClick={handleScanPlagiarism} disabled={scanningPlag} className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded shadow">{scanningPlag ? 'Scanning...' : 'Scan Lab 1 Submissions'}</button></div>
            {plagResult ? <div className="p-4 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono">Analyzed {plagResult.totalSubmissionsAnalyzed} submissions. Suspicious pairs: {plagResult.suspiciousPairCount}</div> : <div className="text-slate-400 text-xs text-center py-12">Click 'Scan Lab 1 Submissions' to scan cohort.</div>}
          </div>
        )}
      </main>
    </div>
  );
}
