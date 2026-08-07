import React from 'react';
import { Sparkles, Briefcase, Award, AlertTriangle } from 'lucide-react';

export default function PlacementCard({ placement }) {
  if (!placement) return null;

  return (
    <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Module 7: AI Placement Readiness Scorecard
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{placement.readinessVerdict}</h1>
          <p className="text-xs text-slate-400 mt-1">Calculated from Coding Accuracy, Problem Solving Speed, Communication, and Viva performance.</p>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">Coding</div>
            <div className="text-xl font-bold text-sky-400">{placement.codingScore}%</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">Interview</div>
            <div className="text-xl font-bold text-emerald-400">{placement.interviewReadiness}%</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">Problem Solving</div>
            <div className="text-xl font-bold text-purple-400">{placement.problemSolvingSpeedScore}%</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">Viva</div>
            <div className="text-xl font-bold text-amber-400">{placement.averageVivaScore}%</div>
          </div>
        </div>
      </div>

      {/* Target Companies */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-300 uppercase mr-2">Target Recommended Companies:</span>
        {placement.recommendedCompanies?.map((company, idx) => (
          <span key={idx} className="px-3 py-1 bg-sky-950 text-sky-300 border border-sky-800 rounded-full text-xs font-bold font-mono">
            🏢 {company}
          </span>
        ))}
      </div>
    </div>
  );
}
