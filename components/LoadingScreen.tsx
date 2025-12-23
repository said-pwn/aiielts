
import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Scale, Search } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: <Search className="text-blue-500" />, text: "Сканируем текст и изображения..." },
    { icon: <Brain className="text-purple-500" />, text: "Анализируем лексику и грамматику..." },
    { icon: <Scale className="text-amber-500" />, text: "Сверяем с критериями IELTS 2025..." },
    { icon: <Sparkles className="text-emerald-500" />, text: "Формируем отчет наставника..." }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500 text-center">
      <div className="relative w-32 h-32 mb-10">
        <div className="absolute inset-0 border-8 border-slate-900 rounded-[2.5rem]"></div>
        <div className="absolute inset-0 border-8 border-indigo-600 rounded-[2.5rem] border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          {steps[step].icon}
        </div>
      </div>
      
      <div className="space-y-4 max-w-sm mx-auto">
        <h2 className="text-3xl font-black text-white tracking-tighter">
          Идет аудит...
        </h2>
        <div className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-3 text-sm font-bold transition-all duration-500 ${i === step ? 'text-white translate-x-2' : 'text-slate-700 opacity-40 scale-95'}`}
            >
              <div className={`w-2 h-2 rounded-full ${i === step ? 'bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,1)]' : 'bg-slate-800'}`} />
              {s.text}
            </div>
          ))}
        </div>
        <p className="pt-6 text-slate-600 text-[10px] font-black uppercase tracking-widest">
          Это может занять до минуты.
        </p>
        <p className="pt-6 text-slate-600 text-[10px] font-black uppercase tracking-widest">
          Tg: t.me/sddffhf1
        </p>
      </div>
    </div>
  );
};
