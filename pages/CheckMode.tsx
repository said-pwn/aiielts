
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskType } from '../types';
import { evaluateEssay, quickScanEssay, generateWritingTopic, brainstormIdeas } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/Modal';

const CHECK_STORAGE_KEY = 'ielts_check_draft';

const CheckMode: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const [taskType, setTaskType] = useState<TaskType>(() => {
    const saved = localStorage.getItem(CHECK_STORAGE_KEY);
    return saved ? JSON.parse(saved).taskType : TaskType.TASK2;
  });
  const [prompt, setPrompt] = useState(() => {
    const saved = localStorage.getItem(CHECK_STORAGE_KEY);
    return saved ? JSON.parse(saved).prompt : '';
  });
  const [essay, setEssay] = useState(() => {
    const saved = localStorage.getItem(CHECK_STORAGE_KEY);
    return saved ? JSON.parse(saved).essay : '';
  });

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [generatedTopic, setGeneratedTopic] = useState<string | null>(null);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [brainstormResult, setBrainstormResult] = useState<{ ideas: string[], vocab: string[], structure: string[] } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);
  const [showLengthWarning, setShowLengthWarning] = useState(false);

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const minWords = taskType === TaskType.TASK1 ? 150 : 250;
  const isUnderLength = wordCount < minWords && wordCount > 0;

  useEffect(() => {
    const stateToSave = { taskType, prompt, essay };
    localStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [taskType, prompt, essay]);

  const scrollToError = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleEvaluateAttempt = () => {
    setError(null);
    if (!prompt.trim() || !essay.trim()) {
      setError(t('error_incomplete') || "Пожалуйста, заполните и задание, и текст эссе.");
      scrollToError();
      return;
    }
    if (isUnderLength) {
      setShowLengthWarning(true);
    } else {
      executeEvaluate();
    }
  };

  const executeEvaluate = async () => {
    setShowLengthWarning(false);
    setError(null);
    setIsEvaluating(true);
    try {
      const result = await evaluateEssay({ taskType, prompt, essay });
      localStorage.removeItem(CHECK_STORAGE_KEY);
      navigate('/results', { state: { evaluation: result } });
    } catch (err: any) {
      console.error("Evaluation error:", err);
      const errMsg = err.message || "";
      if (errMsg.includes('429') || errMsg.includes('quota')) {
        setError("ЛИМИТ ИСЧЕРПАН: Пожалуйста, подождите 60 секунд и нажмите кнопку снова.");
      } else {
        setError(t('error_eval') || "Служба ИИ сейчас занята. Пожалуйста, попробуйте еще раз через несколько секунд.");
      }
      scrollToError();
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleBrainstorm = async () => {
    if (!prompt.trim()) {
      setError(t('error_no_prompt'));
      scrollToError();
      return;
    }
    setIsBrainstorming(true);
    setError(null);
    try {
      const result = await brainstormIdeas(prompt, taskType);
      setBrainstormResult(result);
    } catch (err: any) {
      setError(t('error_ai'));
      scrollToError();
    } finally {
      setIsBrainstorming(false);
    }
  };

  const handleGenerateTopicRequest = async () => {
    setIsGeneratingTopic(true);
    setError(null);
    try {
      const newPrompt = await generateWritingTopic(taskType);
      setGeneratedTopic(newPrompt);
    } catch (err: any) {
      setError(t('error_generic'));
      scrollToError();
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const useGeneratedTopic = () => {
    if (generatedTopic) {
      setPrompt(generatedTopic);
      setGeneratedTopic(null);
      setTimeout(() => promptRef.current?.focus(), 100);
    }
  };

  const handleQuickCheck = async () => {
    if (!essay.trim()) return;
    setIsEvaluating(true);
    setError(null);
    try {
      const feedback = await quickScanEssay(essay);
      setQuickFeedback(feedback);
    } catch (err: any) {
      setError(t('error_ai'));
      scrollToError();
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    if (confirm(t('reset_confirm') || "Сбросить текущий черновик?")) {
      localStorage.removeItem(CHECK_STORAGE_KEY);
      setPrompt('');
      setEssay('');
      setQuickFeedback(null);
      setError(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fadeIn pb-24 md:pb-32">
      <div className="text-center mb-10 md:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-brand-dark dark:text-white mb-4 md:mb-6 tracking-tight uppercase leading-tight">{t('nav_marker')}</h1>
        <p className="text-slate-500 dark:text-slate-200 font-medium text-xs md:text-lg uppercase tracking-widest leading-relaxed">Professional assessment for your drafts.</p>
      </div>

      {error && (
        <div ref={errorRef} className="mb-6 md:mb-8 p-4 md:p-6 bg-rose-50 dark:bg-rose-900/40 border-2 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-200 rounded-2xl md:rounded-[2rem] text-xs md:text-sm font-black uppercase tracking-widest flex items-center gap-4 animate-shake shadow-lg">
          <i className="fas fa-exclamation-triangle text-xl text-rose-500"></i>
          <span className="flex-1">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="bg-white dark:bg-slate-900/40 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-2xl">
             <div className="mb-8 md:mb-10 flex flex-wrap justify-between items-center gap-4">
                <div className="flex gap-2">
                  {[TaskType.TASK1, TaskType.TASK2].map(t_type => (
                    <button key={t_type} onClick={() => setTaskType(t_type)} className={`px-4 sm:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${taskType === t_type ? 'bg-brand-primary text-brand-dark shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300'}`}>{t_type.toUpperCase()}</button>
                  ))}
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[7px] md:text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Count</span>
                   <span className={`text-base md:text-xl font-black tabular-nums ${isUnderLength ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{wordCount}</span>
                </div>
             </div>
             
             <div className="space-y-6 md:space-y-8">
                <div>
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 px-1 gap-2">
                     <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">{t('official_prompt')}</label>
                     <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={handleBrainstorm} disabled={isBrainstorming} className="flex-1 sm:flex-none text-[8px] md:text-[9px] font-black uppercase text-slate-400 hover:text-brand-primary tracking-widest flex items-center justify-center gap-2 transition-all">
                          {isBrainstorming ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-lightbulb"></i>}
                          {t('neural_brainstorm')}
                        </button>
                        <button onClick={handleGenerateTopicRequest} disabled={isGeneratingTopic} className="flex-1 sm:flex-none text-[8px] md:text-[9px] font-black uppercase text-brand-primary tracking-widest flex items-center justify-center gap-2 hover:opacity-70 transition-all">
                          {isGeneratingTopic ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                          {t('neural_prompt')}
                        </button>
                     </div>
                   </div>
                   <textarea ref={promptRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Paste task instruction here..." className="w-full p-6 md:p-8 glass-input rounded-2xl md:rounded-3xl outline-none font-medium h-32 md:h-36 resize-none dark:text-white transition-all text-base md:text-lg" />
                </div>
                <div>
                   <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 md:mb-4 block ml-1">{t('draft_response')}</label>
                   <textarea value={essay} onChange={(e) => setEssay(e.target.value)} placeholder="Enter your essay here..." className="w-full p-6 md:p-12 glass-input rounded-2xl md:rounded-3xl outline-none font-serif text-lg md:text-xl leading-relaxed h-[400px] md:h-[500px] dark:text-white shadow-inner transition-all" />
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <div className="bg-brand-dark dark:bg-[#031d17] rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl border dark:border-white/5 lg:sticky lg:top-32">
             <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 uppercase tracking-tighter">AI Analysis</h3>
             <button 
              onClick={handleEvaluateAttempt} 
              disabled={isEvaluating} 
              className={`w-full py-5 md:py-6 rounded-xl md:rounded-[2rem] font-black text-[10px] md:text-[11px] uppercase tracking-widest mb-4 md:mb-5 transition-all shadow-xl flex items-center justify-center gap-3 ${
                isEvaluating 
                ? 'bg-slate-700 text-slate-300 cursor-not-allowed' 
                : 'bg-brand-primary text-brand-dark shadow-brand-primary/20 hover:scale-[1.02] active:scale-95'
              }`}
             >
                {isEvaluating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-double"></i>}
                {isEvaluating ? 'Checking...' : t('finish_protocol')}
             </button>
             <button onClick={handleQuickCheck} disabled={isEvaluating} className="w-full py-4 md:py-5 bg-white/10 rounded-xl md:rounded-[2rem] font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all mb-4">Quick Grammar Check</button>
             <button onClick={handleReset} className="w-full py-2 text-slate-500 hover:text-rose-500 transition-colors text-[8px] md:text-[9px] font-black uppercase tracking-widest">{t('reset_protocol')}</button>
             {quickFeedback && <div className="mt-4 md:mt-6 p-4 md:p-6 bg-emerald-500/10 rounded-xl md:rounded-2xl border border-emerald-500/20 text-emerald-400 text-[10px] font-medium leading-relaxed italic animate-fadeIn">"{quickFeedback}"</div>}
          </div>
        </div>
      </div>

      {/* BRAINSTORM MODAL */}
      <Modal isOpen={!!brainstormResult} onClose={() => setBrainstormResult(null)} title={t('brainstorm_title')} footer={<button onClick={() => setBrainstormResult(null)} className="w-full py-4 bg-brand-primary text-brand-dark rounded-xl font-black text-[10px] uppercase">Got it</button>}>
        <div className="space-y-6">
           <section>
              <h5 className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-brand-primary mb-3">{t('lexical_focus')}</h5>
              <div className="flex flex-wrap gap-2">
                 {brainstormResult?.vocab.map((v, i) => <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-[9px] md:text-[10px] font-bold dark:text-white">{v}</span>)}
              </div>
           </section>
           <section>
              <h5 className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-brand-primary mb-3">{t('structural_roadmap')}</h5>
              <div className="space-y-2">
                 {brainstormResult?.structure.map((s, i) => <div key={i} className="text-[10px] md:text-xs font-bold p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 dark:text-emerald-50">{s}</div>)}
              </div>
           </section>
        </div>
      </Modal>

      <Modal isOpen={!!generatedTopic} onClose={() => setGeneratedTopic(null)} title={t('protocol_discovery')} footer={<div className="grid grid-cols-2 gap-3"><button onClick={() => setGeneratedTopic(null)} className="py-4 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Discard</button><button onClick={useGeneratedTopic} className="py-4 bg-brand-primary text-brand-dark rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-xl">Accept</button></div>}>
        <div className="p-5 md:p-10 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl md:rounded-[2rem] border border-emerald-100 dark:border-emerald-800/20 shadow-inner">
           <p className="text-xs md:text-lg font-bold text-brand-dark dark:text-white leading-relaxed italic">{generatedTopic}</p>
        </div>
      </Modal>

      {/* Length Warning */}
      <Modal 
        isOpen={showLengthWarning} 
        onClose={() => setShowLengthWarning(false)} 
        title={t('warning_length')} 
        footer={<button onClick={executeEvaluate} className="w-full py-4 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase">Proceed Anyway</button>}
      >
        <p className="font-bold text-slate-500 dark:text-slate-300 leading-relaxed text-sm">{t('warning_length_desc')}</p>
      </Modal>
    </div>
  );
};

export default CheckMode;
