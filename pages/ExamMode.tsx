
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskType } from '../types';
import { evaluateEssay, generateWritingTopic, brainstormIdeas } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/Modal';

const EXAM_STORAGE_KEY = 'ielts_exam_draft';

const ExamMode: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [savedState] = useState(() => {
    const saved = localStorage.getItem(EXAM_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [taskType, setTaskType] = useState<TaskType>(
    savedState ? savedState.taskType : TaskType.TASK2
  );
  const [prompt, setPrompt] = useState(savedState ? savedState.prompt : '');
  const [essay, setEssay] = useState(savedState ? savedState.essay : '');
  const [timeLeft, setTimeLeft] = useState(
    savedState ? savedState.timeLeft : (taskType === TaskType.TASK1 ? 1200 : 2400)
  );
  const [isTimerRunning, setIsTimerRunning] = useState(
    savedState ? savedState.isTimerRunning : false
  );

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [tempGeneratedTopic, setTempGeneratedTopic] = useState<string | null>(null);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [brainstormResult, setBrainstormResult] = useState<{ ideas: string[], vocab: string[], structure: string[] } | null>(null);
  const [showLengthWarning, setShowLengthWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const minWords = taskType === TaskType.TASK1 ? 150 : 250;
  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const isUnderLength = wordCount < minWords && wordCount > 0;

  useEffect(() => {
    const stateToSave = { taskType, prompt, essay, timeLeft, isTimerRunning };
    localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [taskType, prompt, essay, timeLeft, isTimerRunning]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, timeLeft]);

  const handleEssayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEssay(e.target.value);
    if (!isTimerRunning && e.target.value.length > 0) setIsTimerRunning(true);
  };

  const handleGenerateTopicRequest = async () => {
    setIsGeneratingTopic(true);
    setError(null);
    try {
      const newPrompt = await generateWritingTopic(taskType);
      setTempGeneratedTopic(newPrompt);
    } catch (err: any) {
      setError(t('error_generic'));
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const confirmNewTopic = () => {
    if (tempGeneratedTopic) {
      setPrompt(tempGeneratedTopic);
      setTempGeneratedTopic(null);
    }
  };

  const handleBrainstorm = async () => {
    if (!prompt.trim()) {
      setError(t('error_no_prompt'));
      return;
    }
    setIsBrainstorming(true);
    setError(null);
    try {
      const result = await brainstormIdeas(prompt, taskType);
      setBrainstormResult(result);
    } catch (err: any) {
      setError(t('error_ai'));
    } finally {
      setIsBrainstorming(false);
    }
  };

  const handleFinishAttempt = () => {
    if (!prompt.trim() || !essay.trim()) {
      setError(t('error_incomplete'));
      return;
    }
    if (isUnderLength) setShowLengthWarning(true);
    else executeSubmit();
  };

  const executeSubmit = async () => {
    setShowLengthWarning(false);
    setError(null);
    setIsEvaluating(true);
    
    const wasTimerRunning = isTimerRunning;
    setIsTimerRunning(false);

    try {
      const result = await evaluateEssay({ taskType, prompt, essay });
      localStorage.removeItem(EXAM_STORAGE_KEY);
      navigate('/results', { state: { evaluation: result } });
    } catch (err: any) {
      console.error("Submit Error:", err);
      setIsTimerRunning(wasTimerRunning);
      setError("AI Analysis is currently busy. Please try again in 15 seconds.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleManualReset = () => {
    if (confirm(t('reset_confirm') || "Reset current draft?")) {
      localStorage.removeItem(EXAM_STORAGE_KEY);
      setEssay('');
      setPrompt('');
      setTimeLeft(taskType === TaskType.TASK1 ? 1200 : 2400);
      setIsTimerRunning(false);
      setError(null);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-12 animate-fadeIn pb-40 relative">
      
      <div className="mb-8 md:mb-16">
        <h1 className="text-4xl md:text-8xl font-black text-brand-dark dark:text-white mb-2 tracking-tighter uppercase leading-tight">{t('nav_exam')}</h1>
        <div className="flex items-center gap-3">
           <div className="w-8 h-px bg-brand-primary"></div>
           <span className="text-[8px] md:text-[10px] font-bold uppercase text-slate-400 tracking-widest">Active Simulation Node</span>
        </div>
      </div>

      {/* MOBILE ACTION BAR - Changed to sticky to avoid covering the title initially */}
      <div className={`lg:hidden sticky top-20 z-[50] mb-6 transition-all duration-500 transform ${ (isTimerRunning || essay.length > 0) ? 'translate-y-0 opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        <div className="bg-white/95 dark:bg-brand-black/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <span className="text-[6px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Time</span>
                <span className={`text-sm font-black tabular-nums ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-brand-primary'}`}>{formatTime(timeLeft)}</span>
             </div>
             <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>
             <div className="flex flex-col">
                <span className="text-[6px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Words</span>
                <span className={`text-sm font-black tabular-nums ${isUnderLength ? 'text-rose-500' : 'text-brand-dark dark:text-white'}`}>{wordCount}</span>
             </div>
          </div>
          <button onClick={handleFinishAttempt} disabled={isEvaluating} className="px-4 py-2 bg-brand-primary text-brand-dark rounded-xl font-black text-[8px] uppercase tracking-widest active:scale-95 disabled:opacity-50 shadow-md">
            {isEvaluating ? <i className="fas fa-spinner fa-spin"></i> : t('finish_protocol')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/40 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-200 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-slideUp">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-10 items-start relative">
        <div className="flex-1 space-y-8 w-full">
          <div className="bg-slate-100 dark:bg-slate-900/40 p-1 rounded-2xl md:rounded-[3rem] border border-slate-200 dark:border-white/5 flex items-center w-fit overflow-hidden shadow-inner">
             <div className="relative flex">
                <div className={`absolute top-0 bottom-0 w-1/2 bg-brand-primary rounded-xl transition-all duration-300 ${taskType === TaskType.TASK1 ? 'translate-x-0' : 'translate-x-full'}`} />
                <button onClick={() => { setTaskType(TaskType.TASK1); setTimeLeft(1200); }} className={`relative w-28 md:w-32 py-3 text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${taskType === TaskType.TASK1 ? 'text-brand-dark' : 'text-slate-500'}`}>{t('Task 1')}</button>
                <button onClick={() => { setTaskType(TaskType.TASK2); setTimeLeft(2400); }} className={`relative w-28 md:w-32 py-3 text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${taskType === TaskType.TASK2 ? 'text-brand-dark' : 'text-slate-500'}`}>{t('Task 2')}</button>
             </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t('official_prompt')}</label>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={handleBrainstorm} disabled={isBrainstorming} className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 dark:border-white/5 active:scale-95 transition-all">
                   {isBrainstorming ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-brain text-brand-primary"></i>}
                   {t('neural_brainstorm')}
                </button>
                <button onClick={handleGenerateTopicRequest} disabled={isGeneratingTopic} className="flex-1 sm:flex-none px-4 py-2.5 bg-brand-primary/10 text-brand-primary rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-brand-primary/20 active:scale-95 transition-all">
                   {isGeneratingTopic ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sparkles"></i>}
                   {t('neural_prompt')}
                </button>
              </div>
            </div>
            <textarea 
               value={prompt} 
               onChange={(e) => setPrompt(e.target.value)} 
               placeholder="Enter task text here or use Neural Prompt..." 
               className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-brand-black/40 border border-slate-100 dark:border-white/5 text-slate-800 dark:text-white outline-none min-h-[140px] font-medium text-base leading-relaxed focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-sm" 
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">{t('draft_response')}</label>
            <textarea 
               value={essay} 
               onChange={handleEssayChange} 
               placeholder="Type your response..." 
               className="w-full min-h-[450px] md:min-h-[600px] p-6 md:p-12 rounded-[2rem] bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 text-slate-800 dark:text-white outline-none font-serif text-lg md:text-xl leading-relaxed shadow-xl focus:ring-2 focus:ring-brand-primary/20 transition-all" 
            />
          </div>
        </div>

        <aside className="hidden lg:block w-80 sticky top-36 h-fit space-y-6">
           <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 shadow-2xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Session</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isTimerRunning ? 'text-brand-primary' : 'text-slate-300'}`}>{isTimerRunning ? 'ACTIVE' : 'READY'}</span>
                 </div>
                 <div className="flex flex-col text-right">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">{t('word_count')}</span>
                    <span className={`text-xl font-black ${isUnderLength ? 'text-rose-500' : 'text-brand-dark dark:text-white'}`}>{wordCount}</span>
                 </div>
              </div>
              <div className="py-6 border-y border-black/5 dark:border-white/5 mb-8 text-center">
                 <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">{t('metrics_remaining')}</span>
                 <span className={`text-4xl font-black tabular-nums ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-brand-dark dark:text-white'}`}>{formatTime(timeLeft)}</span>
              </div>
              <button onClick={handleFinishAttempt} disabled={isEvaluating} className="w-full py-5 bg-brand-primary text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                {isEvaluating ? <i className="fas fa-spinner fa-spin mr-2"></i> : t('finish_protocol')}
              </button>
              <button onClick={handleManualReset} className="w-full py-4 text-slate-400 hover:text-rose-500 font-black text-[9px] uppercase tracking-widest transition-colors mt-2">
                {t('reset_protocol')}
              </button>
           </div>
        </aside>
      </div>

      {/* BRAINSTORM MODAL */}
      <Modal isOpen={!!brainstormResult} onClose={() => setBrainstormResult(null)} title={t('brainstorm_title')}>
        {brainstormResult && (
          <div className="space-y-8 animate-fadeIn">
            <section>
               <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-[0.2em] mb-4 flex items-center gap-2">
                  <i className="fas fa-sitemap"></i> {t('structural_roadmap')}
               </h4>
               <div className="space-y-3">
                  {brainstormResult.structure.map((step, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-xs font-bold leading-relaxed dark:text-white shadow-sm">{step}</div>
                  ))}
               </div>
            </section>
            <section>
               <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-[0.2em] mb-4 flex items-center gap-2">
                  <i className="fas fa-key"></i> {t('key_arguments')}
               </h4>
               <div className="grid grid-cols-1 gap-3">
                  {brainstormResult.ideas.map((idea, i) => (
                    <div key={i} className="text-[11px] font-medium leading-relaxed p-4 border border-brand-primary/10 rounded-xl bg-brand-primary/5 dark:text-emerald-100 italic">{idea}</div>
                  ))}
               </div>
            </section>
            <section>
               <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-[0.2em] mb-4 flex items-center gap-2">
                  <i className="fas fa-language"></i> {t('lexical_focus')}
               </h4>
               <div className="flex flex-wrap gap-2">
                  {brainstormResult.vocab.map((v, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-brand-dark dark:text-white rounded-lg text-[10px] font-bold border border-black/5 dark:border-white/5">{v}</span>
                  ))}
               </div>
            </section>
          </div>
        )}
      </Modal>

      {/* NEURAL PROMPT MODAL */}
      <Modal 
        isOpen={!!tempGeneratedTopic} 
        onClose={() => setTempGeneratedTopic(null)} 
        title={t('protocol_discovery') || "Neural Topic Discovery"}
        footer={
          <div className="grid grid-cols-2 gap-3">
             <button onClick={handleGenerateTopicRequest} disabled={isGeneratingTopic} className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary">
                {isGeneratingTopic ? <i className="fas fa-spinner fa-spin"></i> : "Regenerate"}
             </button>
             <button onClick={confirmNewTopic} className="py-4 bg-brand-primary text-brand-dark rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl">
                {t('accept_node') || "Accept Topic"}
             </button>
          </div>
        }
      >
        <div className="p-6 md:p-10 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100/50 dark:border-emerald-800/20">
           <p className="text-base md:text-xl font-bold text-brand-dark dark:text-white leading-relaxed italic">
             {tempGeneratedTopic}
           </p>
        </div>
      </Modal>

      {/* LENGTH WARNING MODAL */}
      <Modal isOpen={showLengthWarning} onClose={() => setShowLengthWarning(false)} title={t('warning_length')} footer={<button onClick={executeSubmit} className="w-full py-4 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase">Proceed Anyway</button>}>
        <p className="font-bold text-slate-500 dark:text-slate-300 leading-relaxed text-sm">{t('warning_length_desc')}</p>
      </Modal>
    </div>
  );
};

export default ExamMode;
