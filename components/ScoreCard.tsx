
import React from 'react';

interface ScoreCardProps {
  label: string;
  score: number;
  description: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ label, score, description }) => {
  const percentage = (score / 9) * 100;

  // Dynamic color based on band score
  const getScoreColor = (s: number) => {
    if (s >= 7.5) return 'bg-emerald-500'; // Expert
    if (s >= 6.5) return 'bg-green-500';   // Competent
    if (s >= 5.0) return 'bg-amber-500';   // Modest
    return 'bg-rose-500';                 // Limited
  };

  const getTextColor = (s: number) => {
    if (s >= 7.5) return 'text-emerald-600';
    if (s >= 6.5) return 'text-green-600';
    if (s >= 5.0) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col transition-all hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 overflow-hidden">
      <div className="flex justify-between items-end mb-4">
        <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">{label}</h3>
        <div className={`text-2xl font-black ${getTextColor(score)}`}>
          {score}
        </div>
      </div>

      {/* Linear Progress Bar */}
      <div className="relative h-4 w-full bg-slate-100 rounded-full mb-6 overflow-hidden flex items-center">
        {/* Band Segment Ticks */}
        <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-10 opacity-20">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-full w-px bg-slate-900" />
          ))}
        </div>
        
        {/* The Fill */}
        <div 
          className={`h-full ${getScoreColor(score)} transition-all duration-1000 ease-out shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex-1">
        <p className="text-slate-500 text-[11px] leading-relaxed font-medium line-clamp-4 italic">
          "{description}"
        </p>
      </div>
      
      {/* Band Scale Indicator */}
      <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
        <span>Band 0</span>
        <span>Band 9</span>
      </div>
    </div>
  );
};
