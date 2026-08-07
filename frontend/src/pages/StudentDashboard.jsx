import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { labAPI, submissionAPI, placementAPI, analyticsAPI, learningPathAPI, labReportAPI } from '../services/api';
import Navbar from '../components/Navbar';
import PlacementCard from '../components/PlacementCard';
import SkillGraph from '../components/SkillGraph';
import LearningPathCard from '../components/LearningPathCard';
import { BookOpen, CheckCircle, Code2, ArrowRight, Zap, Download } from 'lucide-react';

export default function StudentDashboard() {
  const [labs, setLabs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [placement, setPlacement] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      labAPI.getAll(),
      submissionAPI.getMySubmissions(),
      placementAPI.getReadiness(),
      analyticsAPI.getStudent(),
      learningPathAPI.getRoadmap()
    ])
      .then(([labsRes, subsRes, placeRes, analyticsRes, roadmapRes]) => {
        setLabs(labsRes.data);
        setSubmissions(subsRes.data);
        setPlacement(placeRes.data);
        setAnalytics(analyticsRes.data);
        setRoadmap(roadmapRes.data);
      })
      .catch((err) => console.error("Dashboard error:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalAttempted = submissions.length;
  const acceptedCount = submissions.filter(s => s.status === 'ACCEPTED').length;
  const accuracy = totalAttempted > 0 ? Math.round((acceptedCount / totalAttempted) * 100) : 0;

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Student Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Module 7 Placement Card */}
        <PlacementCard placement={placement} />

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-md">
            <div><div className="text-xs font-medium text-slate-400">Labs Assigned</div><div className="text-2xl font-bold text-slate-100 mt-1">{labs.length}</div></div>
            <div className="p-3 bg-sky-950 text-sky-400 rounded-lg border border-sky-800"><BookOpen className="w-5 h-5" /></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-md">
            <div><div className="text-xs font-medium text-slate-400">Submissions</div><div className="text-2xl font-bold text-slate-100 mt-1">{totalAttempted}</div></div>
            <div className="p-3 bg-indigo-950 text-indigo-400 rounded-lg border border-indigo-800"><Code2 className="w-5 h-5" /></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-md">
            <div><div className="text-xs font-medium text-slate-400">Accepted Solved</div><div className="text-2xl font-bold text-emerald-400 mt-1">{acceptedCount}</div></div>
            <div className="p-3 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800"><CheckCircle className="w-5 h-5" /></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-md">
            <div><div className="text-xs font-medium text-slate-400">Accuracy</div><div className="text-2xl font-bold text-amber-400 mt-1">{accuracy}%</div></div>
            <div className="p-3 bg-amber-950 text-amber-400 rounded-lg border border-amber-800"><Zap className="w-5 h-5" /></div>
          </div>
        </div>

        {/* Module 10 Skill Graph */}
        <SkillGraph analytics={analytics} />

        {/* Module 1 Learning Path Roadmap */}
        <LearningPathCard roadmap={roadmap} />

        {/* Assigned Labs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-100">Assigned Programming Laboratories</h3>
          <div className="space-y-3">
            {labs.map((lab) => (
              <div key={lab.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-base">{lab.title}</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded">{lab.courseCode}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{lab.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href={labReportAPI.downloadPdfUrl(lab.id)} target="_blank" rel="noreferrer" className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-amber-400" /><span>Report PDF</span>
                  </a>
                  <Link to={`/workspace/${lab.questions?.[0]?.id || 1}`} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-md transition flex items-center gap-1">
                    <span>Solve Lab</span><ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
