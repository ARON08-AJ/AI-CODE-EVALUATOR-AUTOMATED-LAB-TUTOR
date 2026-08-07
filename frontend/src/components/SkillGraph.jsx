import React from 'react';
import { BarChart2, TrendingUp, Zap } from 'lucide-react';

export default function SkillGraph({ analytics }) {
  if (!analytics || !analytics.topicSkillScores) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" /> Module 10: AI Skill Graph & Learning Velocity
        </h3>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold font-mono">
          <TrendingUp className="w-4 h-4" /> +{analytics.monthlyImprovementRate}% Monthly Growth
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(analytics.topicSkillScores).map(([topic, score]) => (
          <div key={topic} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-center">
            <div className="text-xs font-medium text-slate-300 truncate">{topic}</div>
            <div className="text-lg font-bold text-indigo-400">{score}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${score}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
