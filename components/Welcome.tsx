
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { transmuteVocabulary, transformSentence } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';

// Импортируем данные из TS файла для стабильности
import { updatesData } from '../data/updates';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  
  const [vocabInput, setVocabInput] = useState('');
  const [vocabResult, setVocabResult] = useState<{ band7: string; band8: string; band9: string } | null>(null);
  const [isTransmuting, setIsTransmuting] = useState(false);

  const [sentenceInput, setSentenceInput] = useState('');
  const [sentenceResult, setSentenceResult] = useState<{ band7: string; band8: string; band9: string } | null>(null);
  const [isArchitecting, setIsArchitecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransmute = async () => {
    if (!vocabInput.trim()) return;
    setIsTransmuting(true);
    setVocabResult(null);
    setError(null);
    try {
      const result = await transmuteVocabulary(vocabInput);
      setVocabResult(result);
    } catch (err: any) {
      setError("Service Error: Please verify your connection or API key.");
    } finally {
      setIsTransmuting(false);
    }
  };

  const handleArchitect = async () => {
    if (!sentenceInput.trim()) return;
    setIsArchitecting(true);
    setSentenceResult(null);
    setError(null);
    try {
      const result = await transformSentence(sentenceInput);
      setSentenceResult(result);
    } catch (err: any) {
      setError("Service Error: Please verify your connection or API key.");
    } finally {
      setIsArchitecting(false);
    }
  };

  const latestUpdate = updatesData.find(u => u.isLatest) || updatesData[0];

  return (
    <div className="relative pb-32 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* HERO SECTION */}
        <section className="pt-12 md:pt-24 pb-20 text-center relative">
          <button 
            onClick={() => setIsUpdateModalOpen(true)}
            className="inline-flex items-center gap-3 px-4 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 rounded-full border border-brand-primary/20 mb-8 animate-fadeIn transition-all group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-secondary dark:text-emerald-400">
              {latestUpdate.version} <span className="mx-2 opacity-30">|</span> <span className="group-hover:underline underline-offset-4">{t('whats_new')}</span>
            </span>
          </button>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-brand-dark dark:text-white leading-[1.1] tracking-tighter mb-8 uppercase">
            {t('hero_title_1')} <br className="hidden md:block" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-emerald-500 to-brand-secondary">
                {t('hero_title_2')}
            </span> <br className="hidden md:block" /> {t('hero_title_3')}
          </h1>

          <p className="max-w-xl mx-auto text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-12 px-4">
            {t('hero_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
             <button 
              onClick={() => setIsModalOpen(true)} 
              className="w-full sm:w-auto px-10 py-4 bg-brand-dark dark:bg-brand-primary text-white dark:text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl"
             >
                {t('launch_exam')}
             </button>
             <button 
              onClick={() => navigate('/practice/check')} 
              className="w-full sm:w-auto px-10 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-brand-dark dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-md"
             >
                {t('instant_grading')}
             </button>
          </div>
        </section>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-32">
           {[
             { 
               id: 'exam', 
               title: t('exam_sim_title'), 
               desc: t('exam_sim_desc'), 
               icon: "fa-stopwatch-20", 
               color: "bg-emerald-600 text-white", 
               action: () => setIsModalOpen(true) 
             },
             { 
               id: 'check', 
               title: t('marker_title'), 
               desc: t('marker_desc'), 
               icon: "fa-bolt-lightning", 
               color: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-brand-dark dark:text-white", 
               action: () => navigate('/practice/check') 
             }
           ].map((cat) => (
             <div 
               key={cat.id}
               onClick={cat.action}
               className={`group p-8 md:p-12 rounded-[2.5rem] cursor-pointer transition-all duration-500 hover:-translate-y-2 shadow-xl relative overflow-hidden ${cat.color}`}
             >
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-black/10 dark:bg-white/5 flex items-center justify-center text-xl mb-8 transition-transform group-hover:scale-110">
                    <i className={`fas ${cat.icon}`}></i>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black mb-4 uppercase tracking-tighter leading-none">{cat.title}</h3>
                  <p className="text-sm md:text-base font-medium opacity-80 mb-8 leading-relaxed max-w-sm">{cat.desc}</p>
                  <div className="inline-flex items-center gap-3 font-black text-[9px] uppercase tracking-[0.2em] border-b border-current pb-1 group-hover:gap-6 transition-all">
                    {t('explore_protocol')} <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
             </div>
           ))}
        </div>

        {/* SENTENCE ARCHITECT */}
        <section className="mb-24">
           <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] p-8 md:p-16 border border-slate-100 dark:border-white/5 shadow-xl">
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                 <div className="w-full lg:w-5/12">
                    <div className="w-10 h-1 bg-brand-primary rounded-full mb-6"></div>
                    <h2 className="text-2xl md:text-3xl font-black mb-6 leading-[1.1] uppercase text-brand-dark dark:text-white tracking-tighter">{t('architect_title')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium mb-10 leading-relaxed">
                       {t('architect_desc')}
                    </p>
                    <div className="space-y-4">
                       <textarea 
                        value={sentenceInput}
                        onChange={(e) => setSentenceInput(e.target.value)}
                        placeholder="e.g., Change is coming..."
                        className="w-full p-6 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 outline-none text-base font-bold h-32 resize-none dark:text-white transition-all focus:ring-2 ring-brand-primary/20"
                       />
                       <button 
                        onClick={handleArchitect} 
                        disabled={isArchitecting} 
                        className="w-full py-5 bg-brand-dark dark:bg-brand-primary text-white dark:text-brand-dark rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all"
                       >
                          {isArchitecting ? <i className="fas fa-circle-notch fa-spin mr-3"></i> : <i className="fas fa-wand-sparkles mr-3"></i>}
                          {isArchitecting ? 'Architecting...' : 'Upgrade Sentence'}
                       </button>
                    </div>
                 </div>
                 <div className="w-full lg:w-7/12">
                    {sentenceResult ? (
                      <div className="space-y-4 animate-fadeIn">
                         {[
                           { b: '7.0', v: sentenceResult.band7, bg: 'bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5' },
                           { b: '8.0', v: sentenceResult.band8, bg: 'bg-slate-100/50 dark:bg-white/10 border border-slate-200 dark:border-white/10' },
                           { b: '9.0', v: sentenceResult.band9, bg: 'bg-brand-black dark:bg-brand-primary text-white dark:text-brand-dark' }
                         ].map((item, i) => (
                           <div key={i} className={`p-6 md:p-8 rounded-[2rem] shadow-sm transition-all ${item.bg}`}>
                              <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 block mb-3">Band {item.b} Logic</span>
                              <p className="text-lg md:text-xl font-serif italic leading-relaxed tracking-tight">"{item.v}"</p>
                           </div>
                         ))}
                      </div>
                    ) : (
                       <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem] text-slate-300 dark:text-white/10 text-center">
                          <i className="fas fa-compass-drafting text-4xl mb-6"></i>
                          <p className="text-[9px] font-black uppercase tracking-[0.3em]">Neural Interface Waitin</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </section>

        {/* VOCAB LAB */}
        <section className="mb-32">
           <div className="bg-emerald-50/40 dark:bg-[#022c22] rounded-[2.5rem] p-8 md:p-16 border border-emerald-100/50 dark:border-white/5 shadow-xl">
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                 <div className="w-full lg:w-5/12">
                    <div className="w-10 h-1 bg-brand-primary rounded-full mb-6"></div>
                    <h2 className="text-2xl md:text-3xl font-black mb-6 leading-[1.1] uppercase text-brand-dark dark:text-white tracking-tighter">{t('vocab_lab_title')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium mb-10 leading-relaxed">
                       {t('vocab_lab_desc')}
                    </p>
                    <div className="space-y-4">
                       <input 
                        type="text"
                        value={vocabInput}
                        onChange={(e) => setVocabInput(e.target.value)}
                        placeholder="e.g., Simple"
                        className="w-full p-6 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-base font-bold dark:text-white shadow-sm transition-all focus:ring-2 ring-brand-primary/20"
                       />
                       <button 
                        onClick={handleTransmute} 
                        disabled={isTransmuting} 
                        className="w-full py-5 bg-brand-dark dark:bg-brand-primary text-white dark:text-brand-dark rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all"
                       >
                          {isTransmuting ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-flask mr-3"></i>}
                          {isTransmuting ? 'Transmuting...' : 'Get Academic Synonyms'}
                       </button>
                    </div>
                 </div>
                 <div className="w-full lg:w-7/12">
                    {vocabResult ? (
                      <div className="space-y-4 animate-fadeIn">
                         {[
                           { b: '7.0', v: vocabResult.band7, bg: 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-white/5' },
                           { b: '8.0', v: vocabResult.band8, bg: 'bg-white dark:bg-slate-900/60 border-emerald-200/50 dark:border-white/10 shadow-sm' },
                           { b: '9.0', v: vocabResult.band9, bg: 'bg-brand-primary text-brand-dark border-brand-primary shadow-lg shadow-brand-primary/20' }
                         ].map((item, i) => (
                           <div key={i} className={`p-6 md:p-8 rounded-[2rem] border transition-all ${item.bg}`}>
                              <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 block mb-3">Target Band {item.b}</span>
                              <p className="text-xl md:text-3xl font-serif font-black tracking-tight leading-none uppercase">{item.v}</p>
                           </div>
                         ))}
                      </div>
                    ) : (
                       <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-100 dark:border-emerald-900/30 rounded-[2.5rem] text-emerald-200 dark:text-emerald-900/50 text-center">
                          <i className="fas fa-microscope text-4xl mb-6 opacity-20"></i>
                          <p className="text-[9px] font-black uppercase tracking-[0.3em]">Laboratory Active</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </section>
      </div>

      {/* UPDATE MODAL */}
      <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="System Release Notes">
        <div className="space-y-8">
          {updatesData.map((update, idx) => (
            <div key={idx} className="relative pl-6 border-l-2 border-slate-100 dark:border-white/10">
               <div className="absolute left-[-7px] top-0 w-3 h-3 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-base font-black dark:text-white">{update.version}</h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{update.date}</span>
                  {update.isLatest && <span className="px-2 py-0.5 bg-emerald-500/10 text-brand-primary text-[7px] font-black uppercase rounded">Latest</span>}
               </div>
               <ul className="space-y-2">
                  {(update.changes[language as 'en' | 'ru'] || update.changes.en).map((change: string, i: number) => (
                    <li key={i} className="text-xs font-medium text-slate-500 dark:text-slate-300 flex items-start gap-3">
                       <i className="fas fa-chevron-right text-[8px] text-brand-primary mt-1"></i>
                       {change}
                    </li>
                  ))}
               </ul>
            </div>
          ))}
        </div>
      </Modal>

      {/* PARAMETERS MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Simulation Parameters" footer={<button onClick={() => navigate('/practice/exam')} className="w-full py-4 bg-brand-primary text-brand-dark rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02]">Initiate Neural Session</button>}>
        <div className="space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] border border-slate-100 dark:border-white/10">
             <div className="flex items-center gap-3 mb-4">
                <i className="fas fa-circle-check text-brand-primary"></i>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-brand-dark dark:text-white">Academic Protocol</h4>
             </div>
             <p className="text-xs font-medium text-slate-500 dark:text-slate-300 leading-relaxed">{t('exam_sim_desc')}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Welcome;
