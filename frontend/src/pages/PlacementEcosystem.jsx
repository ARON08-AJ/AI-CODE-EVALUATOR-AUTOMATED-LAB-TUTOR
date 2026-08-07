import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import {
  codeReviewAPI, plagiarismAPI, resumeAPI, interviewAPI, aptitudeAPI, contestAPI, vivaAPI,
  debuggerReplayAPI, pairTutorAPI, revisionAPI, facultyAssistantAPI, interviewSimAPI, projectReviewAPI
} from '../services/api';
import { Sparkles, Code2, ShieldAlert, FileText, MessageSquare, BookOpen, CheckCircle, AlertTriangle, ArrowRight, Bot, Search, Upload, Trophy, HelpCircle, Play, Mic, Volume2, FileSpreadsheet, Cpu, Terminal, Target, FolderGit2 } from 'lucide-react';

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

  // Interview Simulator State (Module 17)
  const [simRound, setSimRound] = useState("TECHNICAL");
  const [simRole, setSimRole] = useState("Full Stack Developer");
  const [simUserAns, setSimUserAns] = useState("I optimized the inner loop using a HashMap lookup to achieve O(1) average access time.");
  const [simResult, setSimResult] = useState(null);
  const [loadingSim, setLoadingSim] = useState(false);

  // Project Reviewer State (Module 18)
  const [repoUrl, setRepoUrl] = useState("https://github.com/Aadhikesav07/AI-CODE-EVALUATOR-AUTOMATED-LAB-TUTOR");
  const [projectTitle, setProjectTitle] = useState("AI-Powered Programming Learning and Placement Platform");
  const [projResult, setProjResult] = useState(null);
  const [loadingProj, setLoadingProj] = useState(false);

  // Handlers
  const handleRunCodeReview = async () => {
    setReviewing(true);
    try {
      const res = await codeReviewAPI.analyze({ code: reviewCode, language: reviewLanguage });
      setReviewResult(res.data);
    } catch (err) { alert("Failed to analyze code quality."); }
    finally { setReviewing(false); }
  };

  const handleScanPlagiarism = async () => {
    setScanningPlag(true);
    try {
      const res = await plagiarismAPI.scanCohort(1);
      setPlagResult(res.data);
    } catch (err) { alert("Failed to run cohort plagiarism scan."); }
    finally { setScanningPlag(false); }
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
    } catch (err) { alert("Failed to analyze resume."); }
    finally { setAnalyzingResume(false); }
  };

  const handleSimulateInterview = async () => {
    setLoadingSim(true);
    try {
      const res = await interviewSimAPI.simulate({ roundType: simRound, targetRole: simRole, userResponseText: simUserAns });
      setSimResult(res.data);
    } catch (err) { alert("Failed to simulate interview."); }
    finally { setLoadingSim(false); }
  };

  const handleAnalyzeProject = async () => {
    setLoadingProj(true);
    try {
      const res = await projectReviewAPI.analyze({ repoUrl, projectTitle, techStack: "Spring Boot, React, SQLite, Groq AI" });
      setProjResult(res.data);
    } catch (err) { alert("Failed to analyze GitHub project."); }
    finally { setLoadingProj(false); }
  };

  const handleLoadReplay = async () => {
    setLoadingReplay(true);
    try {
      const res = await debuggerReplayAPI.getReplay("SUB-882");
      setReplayResult(res.data);
    } catch (err) { alert("Failed to load debugger replay."); }
    finally { setLoadingReplay(false); }
  };

  const handlePairChat = async () => {
    setLoadingPair(true);
    try {
      const res = await pairTutorAPI.chat({ studentQuery: pairQuery, codeContext: reviewCode, language: reviewLanguage });
      setPairReply(res.data);
    } catch (err) { alert("Failed to get AI Pair Programmer response."); }
    finally { setLoadingPair(false); }
  };

  const handleLoadNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await revisionAPI.getNotes(revisionTopic);
      setNotesResult(res.data);
    } catch (err) { alert("Failed to generate revision notes."); }
    finally { setLoadingNotes(false); }
  };

  const handleGenerateFacultyLab = async () => {
    setLoadingFaculty(true);
    try {
      const res = await facultyAssistantAPI.generateLab(facultyIdea);
      setFacultyLabResult(res.data);
      const edgeRes = await facultyAssistantAPI.generateEdgeCases(res.data.problemStatement);
      setFacultyEdgeResult(edgeRes.data);
    } catch (err) { alert("Failed to generate automated faculty lab."); }
    finally { setLoadingFaculty(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> AI Placement & Education Ecosystem (18 Modules)
            </div>
            <h1 className="text-2xl font-bold text-slate-100">AI Programming & Career Ecosystem</h1>
            <p className="text-sm text-slate-400 mt-1">Multi-Round Interview Simulator, GitHub Project Reviewer, Debugger Replay, Pair Programmer, & Faculty Automation.</p>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/60 p-1.5 rounded-xl gap-1">
          <button onClick={() => setActiveTab('interview-sim')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'interview-sim' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}><Target className="w-3.5 h-3.5" /> Module 17: Interview Simulator</button>
          <button onClick={() => setActiveTab('project-review')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'project-review' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}><FolderGit2 className="w-3.5 h-3.5" /> Module 18: Project Reviewer</button>
          <button onClick={() => setActiveTab('code-review')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'code-review' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}><Code2 className="w-3.5 h-3.5" /> Code Reviewer</button>
          <button onClick={() => setActiveTab('debugger')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'debugger' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Terminal className="w-3.5 h-3.5" /> Debugger Replay</button>
          <button onClick={() => setActiveTab('pair')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'pair' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}><Bot className="w-3.5 h-3.5" /> Pair Programmer</button>
          <button onClick={() => setActiveTab('revision')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'revision' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}><FileSpreadsheet className="w-3.5 h-3.5" /> Revision Notes</button>
          <button onClick={() => setActiveTab('faculty')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'faculty' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}><Cpu className="w-3.5 h-3.5" /> Faculty Assistant</button>
          <button onClick={() => setActiveTab('plagiarism')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'plagiarism' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}><ShieldAlert className="w-3.5 h-3.5" /> Plagiarism</button>
          <button onClick={() => setActiveTab('resume')} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'resume' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}><FileText className="w-3.5 h-3.5" /> PDF Resume ATS</button>
        </div>

        {/* Module 17: AI Interview Simulator */}
        {activeTab === 'interview-sim' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" /> Module 17: Multi-Round AI Interview Simulator ⭐⭐⭐⭐⭐
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Interview Round</label>
                  <select value={simRound} onChange={(e) => setSimRound(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100">
                    <option value="TECHNICAL">Technical Round</option>
                    <option value="HR">HR Behavioral Round</option>
                    <option value="CODING">Coding System Design</option>
                    <option value="RESUME">Resume Deep-Dive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Job Role</label>
                  <input type="text" value={simRole} onChange={(e) => setSimRole(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Candidate Answer / Response</label>
                <textarea rows="5" value={simUserAns} onChange={(e) => setSimUserAns(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100"></textarea>
              </div>

              <button onClick={handleSimulateInterview} disabled={loadingSim} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow transition">
                {loadingSim ? 'Simulating Round...' : 'Run AI Interview Simulation'}
              </button>
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Interview Scorecard & Feedback Report
              </h3>
              {!simResult ? (
                <div className="text-slate-400 text-xs text-center py-12">Run interview simulation to view candidate scorecard.</div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">Confidence</div><div className="text-xl font-bold text-purple-400">{simResult.confidenceScore}%</div></div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">Communication</div><div className="text-xl font-bold text-sky-400">{simResult.communicationScore}%</div></div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">Technical</div><div className="text-xl font-bold text-emerald-400">{simResult.technicalScore}%</div></div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">Overall</div><div className="text-xl font-bold text-amber-400">{simResult.overallScore}%</div></div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-purple-400 mb-1">Final Verdict Report</div>
                    <p className="text-slate-200">{simResult.finalInterviewReport}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Module 18: AI Project Reviewer */}
        {activeTab === 'project-review' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-emerald-400" /> Module 18: GitHub Repository & Architecture Reviewer
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">GitHub Repository URL</label>
                <input type="text" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Project Title</label>
                <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100" />
              </div>
              <button onClick={handleAnalyzeProject} disabled={loadingProj} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition">
                {loadingProj ? 'Auditing Repository Architecture...' : 'Run AI Project Architecture Review'}
              </button>
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> Repository Audit Results
              </h3>
              {!projResult ? (
                <div className="text-slate-400 text-xs text-center py-12">Click 'Run AI Project Architecture Review' to audit GitHub repository.</div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">Architecture</div><div className="text-xl font-bold text-emerald-400">{projResult.architectureScore}%</div></div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">Quality</div><div className="text-xl font-bold text-sky-400">{projResult.codeQualityScore}%</div></div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">Docs</div><div className="text-xl font-bold text-purple-400">{projResult.documentationScore}%</div></div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg"><div className="text-[10px] text-slate-400">Overall</div><div className="text-xl font-bold text-amber-400">{projResult.overallProjectScore}%</div></div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-emerald-400 mb-1">Detected Design Patterns</div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">{projResult.detectedDesignPatterns?.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-slate-200 mb-1">Architecture Summary</div>
                    <p className="text-slate-300">{projResult.projectSummaryVerdict}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Existing Modules */}
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

        {activeTab === 'debugger' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-slate-100 flex items-center gap-2"><Terminal className="w-5 h-5 text-indigo-400" /> Debugger Replay Timeline</h3><button onClick={handleLoadReplay} disabled={loadingReplay} className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded shadow">{loadingReplay ? 'Loading...' : 'Load Replay'}</button></div>
            {replayResult ? <div className="p-4 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono">{replayResult.aiDiagnosis}</div> : <div className="text-slate-400 text-xs text-center py-12">Click 'Load Replay' to view execution timeline.</div>}
          </div>
        )}

        {activeTab === 'pair' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><Bot className="w-5 h-5 text-teal-400" /> Pair Programmer Chat</h3>
              <textarea rows="4" value={pairQuery} onChange={(e) => setPairQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100"></textarea>
              <button onClick={handlePairChat} disabled={loadingPair} className="w-full py-2.5 bg-teal-600 text-white text-xs font-semibold rounded-lg shadow">{loadingPair ? 'Thinking...' : 'Ask Pair Tutor'}</button>
            </div>
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><Sparkles className="w-5 h-5 text-teal-400" /> Pedagogical AI Response</h3>
              {pairReply ? <div className="p-4 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200">{pairReply.aiReply}</div> : <div className="text-slate-400 text-xs text-center py-12">Ask a question to receive guidance.</div>}
            </div>
          </div>
        )}

        {activeTab === 'revision' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-slate-100 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-cyan-400" /> Revision Notes</h3><button onClick={handleLoadNotes} disabled={loadingNotes} className="px-4 py-2 bg-cyan-600 text-white text-xs font-semibold rounded shadow">{loadingNotes ? 'Generating...' : 'Generate Notes'}</button></div>
            {notesResult ? <div className="p-4 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200">{notesResult.topic}</div> : <div className="text-slate-400 text-xs text-center py-12">Click 'Generate Notes' to generate topic summary.</div>}
          </div>
        )}

        {activeTab === 'faculty' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-slate-100 flex items-center gap-2"><Cpu className="w-5 h-5 text-amber-400" /> Faculty Assistant</h3><button onClick={handleGenerateFacultyLab} disabled={loadingFaculty} className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded shadow">{loadingFaculty ? 'Generating...' : 'Generate Lab'}</button></div>
            {facultyLabResult ? <div className="p-4 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200">{facultyLabResult.title}</div> : <div className="text-slate-400 text-xs text-center py-12">Click 'Generate Lab' to generate automated problem.</div>}
          </div>
        )}

        {activeTab === 'plagiarism' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-slate-100 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-400" /> Plagiarism Detector</h3><button onClick={handleScanPlagiarism} disabled={scanningPlag} className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded shadow">{scanningPlag ? 'Scanning...' : 'Scan Lab 1 Submissions'}</button></div>
            {plagResult ? <div className="p-4 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono">Analyzed {plagResult.totalSubmissionsAnalyzed} submissions. Suspicious pairs: {plagResult.suspiciousPairCount}</div> : <div className="text-slate-400 text-xs text-center py-12">Click 'Scan Lab 1 Submissions' to scan cohort.</div>}
          </div>
        )}

        {activeTab === 'resume' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><FileText className="w-5 h-5 text-sky-400" /> PDF Resume File Upload</h3>
              <input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} className="text-xs text-slate-300" />
              <button onClick={handleAnalyzeResume} disabled={analyzingResume} className="w-full py-2.5 bg-sky-600 text-white text-xs font-semibold rounded-lg shadow">{analyzingResume ? 'Analyzing...' : 'Audit PDF Resume'}</button>
            </div>
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><Sparkles className="w-5 h-5 text-sky-400" /> ATS Compatibility Results</h3>
              {resumeResult ? <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs"><div className="text-2xl font-bold text-sky-400">{resumeResult.atsScore}/100</div><p className="text-slate-300 mt-2">{resumeResult.summary}</p></div> : <div className="text-slate-400 text-xs text-center py-12">Upload a PDF resume to view ATS score.</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
