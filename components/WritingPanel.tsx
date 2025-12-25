
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { TaskType, WritingSubmission, IELTSEvaluation } from '../types';
import { evaluateEssay, quickScanEssay } from '../services/geminiService';
import ResultView from './ResultView';

const WritingPanel: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') || 'exam';

  const [taskType, setTaskType] = useState<TaskType>(TaskType.TASK2);
  const [prompt, setPrompt] = useState<string>('');
  const [essay, setEssay] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isQuickScanning, setIsQuickScanning] = useState<boolean>(false);
  const [result, setResult] = useState<IELTSEvaluation | null>(null);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [timeLeft, setTimeLeft] = useState<number>(taskType === TaskType.TASK1 ? 1200 : 2400);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset timer when task type changes if in exam mode
    if (initialMode === 'exam') {
      setTimeLeft(taskType === TaskType.TASK1 ? 1200 : 2400);
      setIsTimerRunning(false);
    }
  }, [taskType, initialMode]);

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, timeLeft]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEssay(e.target.value);
    if (initialMode === 'exam' && !isTimerRunning && e.target.value.length > 0) {
      setIsTimerRunning(true);
    }
  };

  const handleEvaluate = async () => {
    if (!prompt.trim() || !essay.trim()) {
      setError('Both question prompt and your essay are required for a full mark.');
      return;
    }
    setIsEvaluating(true);
    setIsTimerRunning(false);
    setQuickFeedback(null);
    setError(null);
    try {
      const evaluation = await evaluateEssay({ taskType, prompt, essay });
      setResult(evaluation);
    } catch (err) {
      setError('Evaluation failed. This could be due to safety filters or network issues. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleQuickScan = async () => {
    if (!essay.trim()) { setError('Enter your essay text first.'); return; }
    setIsQuickScanning(true);
    setQuickFeedback(null);
    try {
      const feedback = await quickScanEssay(essay);
      setQuickFeedback(feedback);
    } catch (err) {
      setError('Quick scan failed.');
    } finally {
      setIsQuickScanning(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset everything? Your current draft will be lost.")) {
      setEssay('');
      setPrompt('');
      setTimeLeft(taskType === TaskType.TASK1 ? 1200 : 2400);
      setIsTimerRunning(false);
      setResult(null);
      setQuickFeedback(null);
      setError(null);
    }
  };

  const wordCount = essay.trim() === '' ? 0 : essay.trim().split(/\s+/).length;
  const minWords = taskType === TaskType.TASK1 ? 150 : 250;
  const progress = Math.min(100, (wordCount / minWords) * 100);

  if (result) return <ResultView evaluation={result} onReset={handleReset} />;

  return (
    <div className={`min-h-screen transition-all duration-700 ${isFocusMode ? 'bg-slate-950 dark:bg-black' : ''}`}>
      <div className={`max-w-7xl mx-auto px-4 pb-24 pt-4 md:pt-10 transition-all ${isFocusMode ? 'max-w-4xl' : ''}`}>
        
        {/* Controls Bar */}
        <div className={`sticky top-20 md:top-24 z-50 mb-10 flex flex-wrap justify-between items-center gap-4 p-5 rounded-[2.5rem] backdrop-blur-xl border transition-all ${
          isFocusMode 
            ? 'bg-white/5 border-white/10 text-white' 
            : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-xl'
        }`}>
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Word Count</span>
              <span className={`text-xl font-black ${wordCount >= minWords ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>{wordCount}</span>
            </div>
            
            {initialMode === 'exam' && (
              <>
                <div className="w-px h-8 bg-current opacity-10"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Exam Timer</span>
                  <span className={`text-xl font-black ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isFocusMode ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                title="Toggle Focus Mode"
             >
                <i className={`fas ${isFocusMode ? 'fa-expand-alt' : 'fa-compress-alt'}`}></i>
             </button>
             <button
                onClick={handleQuickScan}
                disabled={isQuickScanning || isEvaluating}
                className="hidden sm:block px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
             >
               {isQuickScanning ? <i className="fas fa-spinner fa-spin"></i> : 'Quick Check'}
             </button>
             <button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
             >
               {isEvaluating ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-check-double mr-2"></i>}
               {isEvaluating ? 'Marking...' : 'Get Band Score'}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className={`${isFocusMode ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-8`}>
            
            {!isFocusMode && (
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-3xl flex border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <button 
                  onClick={() => setTaskType(TaskType.TASK1)}
                  className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all ${taskType === TaskType.TASK1 ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  ACADEMIC TASK 1
                </button>
                <button 
                  onClick={() => setTaskType(TaskType.TASK2)}
                  className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all ${taskType === TaskType.TASK2 ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  ACADEMIC TASK 2
                </button>
              </div>
            )}

            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold animate-shake">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {error}
                </div>
              )}

              <div className="group">
                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-4 ml-4 ${isFocusMode ? 'text-white/40' : 'text-slate-400'}`}>Question Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Paste the official IELTS question text here..."
                  className={`w-full p-6 rounded-[2.5rem] border transition-all outline-none font-medium resize-none ${
                    isFocusMode 
                      ? 'bg-white/5 border-white/10 text-white h-24' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white h-32'
                  }`}
                />
              </div>

              <div className="relative">
                <textarea
                  value={essay}
                  onChange={handleTextChange}
                  placeholder={initialMode === 'exam' ? "Start writing your response..." : "Paste your finished essay here..."}
                  className={`w-full min-h-[600px] p-10 md:p-16 rounded-[3rem] border transition-all outline-none text-xl leading-relaxed font-serif ${
                    isFocusMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white shadow-2xl shadow-slate-200/50'
                  }`}
                />
                <div className={`absolute bottom-0 left-0 w-full h-1.5 rounded-b-[3rem] overflow-hidden ${isFocusMode ? 'opacity-20' : ''}`}>
                  <div 
                    className={`h-full transition-all duration-700 ${progress >= 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>

              {quickFeedback && (
                <div className="p-8 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-500/20 animate-in slide-in-from-top-4">
                  <h4 className="font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fas fa-magic"></i> Instant Scan Insight
                  </h4>
                  <p className="text-sm font-medium leading-relaxed italic">"{quickFeedback}"</p>
                </div>
              )}
            </div>
          </div>

          {!isFocusMode && (
            <div className="lg:col-span-4 space-y-8 sticky top-32 h-fit">
              {/* Mode indicator */}
              <div className="bg-indigo-600 rounded-[3rem] p-8 text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
                 <h3 className="text-lg font-black mb-2 flex items-center gap-3">
                   <i className={`fas ${initialMode === 'exam' ? 'fa-stopwatch' : 'fa-spell-check'}`}></i>
                   {initialMode === 'exam' ? 'Exam Simulation' : 'Direct Grading'}
                 </h3>
                 <p className="text-indigo-100/70 text-xs font-medium leading-relaxed">
                   {initialMode === 'exam' 
                     ? 'Standard 40/20 min time pressure with real-time word counter.' 
                     : 'Paste your existing draft to get a comprehensive marking report immediately.'}
                 </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Expert Advice</h3>
                <div className="space-y-6">
                  {[
                    { f: 'Vocabulary', t: 'Aim for less common lexical items but ensure precision.' },
                    { f: 'Cohesion', t: 'Use a range of cohesive devices without overusing them.' },
                    { f: 'Task Response', t: 'Fully address all parts of the prompt in your intro.' }
                  ].map((word, i) => (
                    <div key={i} className="group">
                       <div className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">{word.f}</div>
                       <div className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{word.t}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleReset}
                className="w-full py-4 text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-trash-alt"></i> Clear All Content
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingPanel;
