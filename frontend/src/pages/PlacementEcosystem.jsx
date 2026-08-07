import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { codeReviewAPI, plagiarismAPI, resumeAPI, interviewAPI, aptitudeAPI, contestAPI, vivaAPI } from '../services/api';
import { Sparkles, Code2, ShieldAlert, FileText, MessageSquare, BookOpen, CheckCircle, AlertTriangle, ArrowRight, Bot, Search, Upload, Trophy, HelpCircle } from 'lucide-react';

export default function PlacementEcosystem() {
  const [activeTab, setActiveTab] = useState('code-review'); // 'code-review' | 'plagiarism' | 'resume' | 'interview' | 'aptitude' | 'viva' | 'contest'

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

  // Interview State
  const [interviewTopic, setInterviewTopic] = useState("Data Structures");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [interviewResult, setInterviewResult] = useState(null);
  const [generatingQ, setGeneratingQ] = useState(false);
  const [evaluatingAns, setEvaluatingAns] = useState(false);

  // Aptitude & Soft Skills State
  const [emailDraft, setEmailDraft] = useState("dear professor, i need extra time for lab 1 because of fever. thanks");
  const [emailContext, setEmailContext] = useState("Assignment Deadline Extension Request");
  const [emailResult, setEmailResult] = useState(null);
  const [evaluatingEmail, setEvaluatingEmail] = useState(false);

  // Viva State
  const [vivaResult, setVivaResult] = useState(null);
  const [vivaAnsResult, setVivaAnsResult] = useState(null);
  const [generatingViva, setGeneratingViva] = useState(false);
  const [vivaAnswerText, setVivaAnswerText] = useState("");

  // Contest State
  const [contestData, setContestData] = useState(null);
  const [loadingContest, setLoadingContest] = useState(false);

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

  const handleGenerateQuestion = async () => {
    setGeneratingQ(true);
    setInterviewResult(null);
    try {
      const res = await interviewAPI.generate({ topic: interviewTopic, difficulty: "INTERMEDIATE" });
      setCurrentQuestion(res.data);
    } catch (err) {
      alert("Failed to generate interview question.");
    } finally {
      setGeneratingQ(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!currentQuestion) return;
    setEvaluatingAns(true);
    try {
      const res = await interviewAPI.evaluate({
        questionText: currentQuestion.questionText,
        studentAnswer,
        topic: currentQuestion.topic
      });
      setInterviewResult(res.data);
    } catch (err) {
      alert("Failed to evaluate interview response.");
    } finally {
      setEvaluatingAns(false);
    }
  };

  const handleReviewEmail = async () => {
    setEvaluatingEmail(true);
    try {
      const res = await aptitudeAPI.reviewEmail({ emailDraft, context: emailContext });
      setEmailResult(res.data);
    } catch (err) {
      alert("Failed to analyze email draft.");
    } finally {
      setEvaluatingEmail(false);
    }
  };

  const handleGenerateViva = async () => {
    setGeneratingViva(true);
    try {
      const res = await vivaAPI.generate({ code: reviewCode, problemTitle: "Even or Odd Integer Check" });
      setVivaResult(res.data);
    } catch (err) {
      alert("Failed to generate viva questions.");
    } finally {
      setGeneratingViva(false);
    }
  };

  const handleEvaluateViva = async () => {
    try {
      const res = await vivaAPI.evaluate({
        code: reviewCode,
        vivaQuestion: vivaResult?.vivaQuestions?.[0],
        studentAnswer: vivaAnswerText
      });
      setVivaAnsResult(res.data);
    } catch (err) {
      alert("Failed to evaluate viva response.");
    }
  };

  const handleLoadContest = async () => {
    setLoadingContest(true);
    try {
      const res = await contestAPI.getActive();
      setContestData(res.data);
    } catch (err) {
      alert("Failed to load active contest data.");
    } finally {
      setLoadingContest(false);
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
              <Sparkles className="w-4 h-4" /> AI Placement & Education Ecosystem
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Career Readiness & AI Placement Hub</h1>
            <p className="text-sm text-slate-400 mt-1">Code Quality Review, Plagiarism Detection, PDF ATS Resume Analyzer, Mock Interviewer, Viva Voce, & Contests.</p>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/60 p-1.5 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('code-review')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'code-review' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" /> AI Code Reviewer
          </button>

          <button
            onClick={() => setActiveTab('plagiarism')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'plagiarism' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Plagiarism Detector
          </button>

          <button
            onClick={() => setActiveTab('resume')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'resume' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> PDF Resume ATS
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'interview' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> AI Mock Interviewer
          </button>

          <button
            onClick={() => setActiveTab('viva')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'viva' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> AI Viva Assistant
          </button>

          <button
            onClick={() => { setActiveTab('contest'); handleLoadContest(); }}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'contest' ? 'bg-yellow-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> Coding Contests
          </button>

          <button
            onClick={() => setActiveTab('aptitude')}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'aptitude' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Soft Skills Coach
          </button>
        </div>

        {/* Tab 1: AI Code Quality Review */}
        {activeTab === 'code-review' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-sky-400" /> Source Code Quality & Complexity Input
              </h3>
              <textarea
                rows="10"
                value={reviewCode}
                onChange={(e) => setReviewCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              ></textarea>
              <button
                onClick={handleRunCodeReview}
                disabled={reviewing}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-md transition disabled:opacity-50"
              >
                {reviewing ? 'Analyzing Code Quality...' : 'Run AI Quality & Complexity Review'}
              </button>
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" /> Quality & Complexity Diagnostics
              </h3>
              {!reviewResult ? (
                <div className="text-slate-400 text-xs text-center py-12">
                  Click 'Run AI Quality & Complexity Review' to view metrics.
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Quality Score</div>
                      <div className="text-2xl font-bold text-sky-400">{reviewResult.qualityScore}/100</div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Cyclomatic Comp.</div>
                      <div className="text-2xl font-bold text-amber-400">{reviewResult.cyclomaticComplexity}</div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Time Complexity</div>
                      <div className="text-2xl font-bold text-emerald-400">{reviewResult.timeComplexity}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-slate-200 mb-1">Architectural Summary</div>
                    <p className="text-slate-300">{reviewResult.architecturalSummary}</p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-sky-400 mb-1">Best Practice Recommendations</div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {reviewResult.bestPracticeSuggestions?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: AI Plagiarism Detector */}
        {activeTab === 'plagiarism' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
                  <ShieldAlert className="w-5 h-5 text-indigo-400" /> AST & Tokenized Cohort Plagiarism Scanner
                </h3>
                <p className="text-xs text-slate-400 mt-1">Scan student lab submissions for structural matching invariant to variable renaming.</p>
              </div>
              <button
                onClick={handleScanPlagiarism}
                disabled={scanningPlag}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition disabled:opacity-50"
              >
                {scanningPlag ? 'Scanning Cohort...' : 'Scan Lab 1 Submissions'}
              </button>
            </div>

            {!plagResult ? (
              <div className="text-slate-400 text-xs text-center py-12 border border-dashed border-slate-800 rounded-xl">
                Click 'Scan Lab 1 Submissions' to execute tokenized similarity comparison across student cohorts.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-400">Total Submissions</div>
                    <div className="text-2xl font-bold text-slate-100">{plagResult.totalSubmissionsAnalyzed}</div>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-400">Suspicious Pairs Detected</div>
                    <div className="text-2xl font-bold text-amber-400">{plagResult.suspiciousPairCount}</div>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-400">Scan Status</div>
                    <div className="text-2xl font-bold text-emerald-400">Complete</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">Student A</th>
                        <th className="p-3">Student B</th>
                        <th className="p-3">Similarity Score</th>
                        <th className="p-3">Verdict</th>
                        <th className="p-3">Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {plagResult.topMatches?.map((match, idx) => (
                        <tr key={idx} className="hover:bg-slate-850">
                          <td className="p-3 font-semibold text-slate-100">{match.studentA}</td>
                          <td className="p-3 font-semibold text-slate-100">{match.studentB}</td>
                          <td className="p-3 font-mono font-bold text-amber-400">{match.similarityScore}%</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 rounded">
                              {match.verdict}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{match.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: PDF Resume ATS Analyzer */}
        {activeTab === 'resume' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" /> PDF Resume File & GitHub Portfolio Input
              </h3>

              {/* PDF File Upload */}
              <div className="p-4 bg-slate-950 border border-dashed border-emerald-800/80 rounded-xl text-center">
                <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-200">Upload Resume (.PDF File)</div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="mt-2 text-xs text-slate-400 cursor-pointer"
                />
                {pdfFile && (
                  <div className="mt-2 text-xs text-emerald-400 font-mono">
                    Selected: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Job Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">GitHub Username</label>
                <input
                  type="text"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100"
                />
              </div>
              {!pdfFile && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Or Paste Resume Text</label>
                  <textarea
                    rows="4"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100"
                  ></textarea>
                </div>
              )}
              <button
                onClick={handleAnalyzeResume}
                disabled={analyzingResume}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition disabled:opacity-50"
              >
                {analyzingResume ? 'Analyzing ATS Score...' : 'Run ATS Resume Audit'}
              </button>
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> ATS Compatibility Results
              </h3>
              {!resumeResult ? (
                <div className="text-slate-400 text-xs text-center py-12">
                  Upload a PDF resume or paste text to audit ATS score.
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-center">
                      <div className="text-slate-400">ATS Score</div>
                      <div className="text-3xl font-bold text-emerald-400">{resumeResult.atsScore}/100</div>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-center">
                      <div className="text-slate-400">GitHub Audit Score</div>
                      <div className="text-3xl font-bold text-sky-400">{resumeResult.portfolioScore}/100</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-emerald-400 mb-2">Matched Tech Keywords ({resumeResult.matchedSkills?.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeResult.matchedSkills?.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[11px] font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-amber-400 mb-2">Recommended Missing Keywords</div>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeResult.missingSkills?.slice(0, 5).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded text-[11px] font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: AI Mock Interview Simulator */}
        {activeTab === 'interview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" /> AI Mock Interview Question Generator
              </h3>
              <div className="flex gap-2">
                <select
                  value={interviewTopic}
                  onChange={(e) => setInterviewTopic(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100"
                >
                  <option value="Data Structures">Data Structures & Algorithms</option>
                  <option value="Spring Boot">Spring Boot Architecture</option>
                  <option value="Behavioral">HR & Behavioral (STAR Method)</option>
                </select>
                <button
                  onClick={handleGenerateQuestion}
                  disabled={generatingQ}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded shadow transition"
                >
                  {generatingQ ? 'Generating...' : 'Get Question'}
                </button>
              </div>

              {currentQuestion && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-purple-400">{currentQuestion.topic}</span>
                    <span className="font-mono text-slate-400">{currentQuestion.difficulty}</span>
                  </div>
                  <p className="text-sm text-slate-100 font-semibold">{currentQuestion.questionText}</p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Your Answer:</label>
                    <textarea
                      rows="4"
                      value={studentAnswer}
                      onChange={(e) => setStudentAnswer(e.target.value)}
                      placeholder="Type your interview answer here..."
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-100"
                    ></textarea>
                  </div>
                  <button
                    onClick={handleEvaluateAnswer}
                    disabled={evaluatingAns}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded shadow transition disabled:opacity-50"
                  >
                    {evaluatingAns ? 'Evaluating Answer...' : 'Submit Answer for AI Scoring'}
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> AI Interview Feedback
              </h3>
              {!interviewResult ? (
                <div className="text-slate-400 text-xs text-center py-12">
                  Generate a question and submit your answer to receive AI technical scoring.
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-center">
                      <div className="text-slate-400">Technical Score</div>
                      <div className="text-3xl font-bold text-purple-400">{interviewResult.technicalScore}/100</div>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-center">
                      <div className="text-slate-400">Clarity & Tone Score</div>
                      <div className="text-3xl font-bold text-sky-400">{interviewResult.clarityScore}/100</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-purple-400 mb-1">Feedback</div>
                    <p className="text-slate-300">{interviewResult.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: AI Viva Voce Assistant */}
        {activeTab === 'viva' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-rose-400" /> AI Viva Voce Oral Code Defense
              </h3>
              <p className="text-xs text-slate-400">Generates targeted oral defense viva questions tailored to your submitted code.</p>

              <button
                onClick={handleGenerateViva}
                disabled={generatingViva}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-md transition disabled:opacity-50"
              >
                {generatingViva ? 'Generating Viva Questions...' : 'Generate Code Viva Defense Questions'}
              </button>

              {vivaResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 text-xs">
                  <div className="font-bold text-rose-400">{vivaResult.focusArea}</div>
                  <div className="space-y-2">
                    {vivaResult.vivaQuestions?.map((q, i) => (
                      <div key={i} className="p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-200">
                        <strong>Q{i+1}:</strong> {q}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Your Oral Defense Answer (Q1):</label>
                    <textarea
                      rows="3"
                      value={vivaAnswerText}
                      onChange={(e) => setVivaAnswerText(e.target.value)}
                      placeholder="Explain your algorithm choice..."
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleEvaluateViva}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded shadow"
                  >
                    Evaluate Viva Defense Response
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-400" /> Viva Voce Scorecard
              </h3>
              {!vivaAnsResult ? (
                <div className="text-slate-400 text-xs text-center py-12">
                  Generate viva questions and submit an oral defense answer to receive AI feedback.
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-center">
                    <div className="text-slate-400">Viva Defense Score</div>
                    <div className="text-3xl font-bold text-rose-400">{vivaAnsResult.vivaScore}/100</div>
                    <div className="text-xs font-semibold text-emerald-400 mt-1">{vivaAnsResult.verdict}</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-rose-400 mb-1">Defense Feedback</div>
                    <p className="text-slate-300">{vivaAnsResult.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: AI Coding Contests */}
        {activeTab === 'contest' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
                  <Trophy className="w-5 h-5 text-yellow-400" /> Live AI Competitive Coding Contests
                </h3>
                <p className="text-xs text-slate-400 mt-1">Weekly challenges, live leaderboards, and performance ranking.</p>
              </div>
            </div>

            {!contestData ? (
              <div className="text-slate-400 text-xs text-center py-12">Loading Active Contest...</div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-yellow-900/50 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-yellow-950 text-yellow-400 border border-yellow-800 rounded">
                      {contestData.difficulty}
                    </span>
                    <h4 className="text-lg font-bold text-slate-100 mt-1">{contestData.title}</h4>
                    <p className="text-xs text-slate-400">{contestData.description}</p>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-slate-400">Participants: <strong className="text-slate-100">{contestData.totalParticipants}</strong></div>
                    <div className="text-emerald-400 font-semibold mt-1">Status: LIVE</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Participant</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Problems Solved</th>
                        <th className="p-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {contestData.leaderboard?.map((entry) => (
                        <tr key={entry.rank} className="hover:bg-slate-850">
                          <td className="p-3 font-bold text-yellow-400">#{entry.rank}</td>
                          <td className="p-3 font-semibold text-slate-100">{entry.studentName}</td>
                          <td className="p-3 font-mono font-bold text-sky-400">{entry.score} pts</td>
                          <td className="p-3 font-mono">{entry.problemsSolved} / 3</td>
                          <td className="p-3 font-mono text-slate-400">{entry.totalTimeMs} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Soft Skills Coach */}
        {activeTab === 'aptitude' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" /> Professional Email Communication Coach
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Context</label>
                <input
                  type="text"
                  value={emailContext}
                  onChange={(e) => setEmailContext(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Draft Text</label>
                <textarea
                  rows="5"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100"
                ></textarea>
              </div>
              <button
                onClick={handleReviewEmail}
                disabled={evaluatingEmail}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-md transition disabled:opacity-50"
              >
                {evaluatingEmail ? 'Evaluating Email...' : 'Run Professional Email Audit'}
              </button>
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Email Audit Results
              </h3>
              {!emailResult ? (
                <div className="text-slate-400 text-xs text-center py-12">
                  Click 'Run Professional Email Audit' to evaluate formality and tone.
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-center">
                    <div className="text-slate-400">Professionalism Score</div>
                    <div className="text-3xl font-bold text-amber-400">{emailResult.professionalismScore}/100</div>
                    <div className="text-[11px] font-semibold text-slate-300 mt-1">{emailResult.toneVerdict}</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="font-semibold text-amber-400 mb-1">Improved Professional Draft</div>
                    <pre className="text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">{emailResult.improvedDraft}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
