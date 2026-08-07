import React from 'react';
import { Compass, Clock, CheckCircle } from 'lucide-react';

export default function LearningPathCard({ roadmap }) {
  if (!roadmap) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Compass className="w-5 h-5 text-sky-400" /> Module 1: AI Personalized Learning Roadmap
        </h3>
        <span className="px-3 py-1 bg-sky-950 text-sky-300 border border-sky-800 rounded-full text-xs font-mono font-bold">
          {roadmap.estimatedTotalHours} Hours Est.
        </span>
      </div>
      <p className="text-xs text-slate-400">{roadmap.aiStrategySummary}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {roadmap.recommendedLearningOrder?.map((step) => (
          <div key={step.stepNumber} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-sky-400">Step #{step.stepNumber}</span>
              <span className="text-slate-400 font-mono">{step.estimatedMinutes} mins</span>
            </div>
            <h4 className="font-bold text-slate-100 text-sm">{step.topic}</h4>
            <p className="text-xs text-slate-400">{step.rationale}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
