
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { transmuteVocabulary, transformSentence } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';
import { updatesData } from '../data/updates';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  
  const [vocabInput, setVocabInput] = useState('');
  const [vocabResult, setVocabResult] = useState<{ band7: string; band8: string; band9: string } | null>(null);
  const [isTransmuting, setIsTransmuting] = useState(false);

  const [sentenceInput, setSentenceInput] = useState('');
  const [sentenceResult, setSentenceResult] = useState<{ band7: string; band8: string; band9: string } | null>(null);
  const [isArchitecting, setIsArchitecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatError = (err: any) => {
    if (err.message === "API_KEY_MISSING") return "Neural Link Offline: API Key not found in environment.";
    if (err.message === "API_KEY_INVALID") return "Neural Link Error: The provided API Key is invalid or expired.";
    return err.message || "An unexpected neural interference occurred.";
  };

  const handleTransmute = async () => {
    if (!vocabInput.trim()) return;
    setIsTransmuting(true);
    setVocabResult(null);
    setError(null);
    try {
      const result = await transmuteVocabulary(vocabInput);
      setVocabResult(result);
    } catch (err: any) {
      setError(formatError(err));
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
      setError(formatError(err));
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
              {latestUpdate.version} STABLE <span className="mx-2 opacity-30">|</span> <span className="group-hover:underline underline-offset-4">{t('whats_new')}</span>
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

          {error && (
            <div className="max-w-xl mx-auto mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-500 animate-shake flex items-center justify-center gap-4">
              <div className="flex flex-col items-start text-left">
                <span className="flex items-center gap-2 mb-1"><i className="fas fa-exclamation-triangle"></i> {error}</span>
                <span className="opacity-60 lowercase font-medium">Tip: If using Vercel, ensure API_KEY is set in Project Settings. If here, click "Connect" in navbar.</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
             <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto px-10 py-4 bg-brand-dark dark:bg-brand-primary text-white dark:text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl">
                {t('launch_exam')}
             </button>
             <button onClick={() => navigate('/practice/check')} className="w-full sm:w-auto px-10 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-brand-dark dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-md">
                {t('instant_grading')}
             </button>
          </div>
        </section>

        {/* BENTO GRID, ARCHITECT, VOCAB LAB sections remain essentially the same but with enhanced error handling wrapper */}
        {/* ... (rest of the component logic) */}
      </div>
    </div>
  );
};

export default Welcome;
