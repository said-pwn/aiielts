
import React, { useEffect, useState, useRef } from 'react';
import { IELTSEvaluation, CriterionFeedback } from '../types';
import { getAudioFeedback, chatWithExaminer } from '../services/geminiService';

// Define the missing props interface for the ResultView component
interface ResultViewProps {
  evaluation: IELTSEvaluation;
  onReset: () => void;
}

const ScoreBadge: React.FC<{ title: string; data: CriterionFeedback }> = ({ title, data }) => (
  <div className="bg-white dark:bg-slate-900/60 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-soft transition-all hover:border-brand-primary/20 hover:shadow-xl-soft">
    <div className="flex justify-between items-start mb-8">
      <h3 className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-[0.3em]">{title}</h3>
      <div className="bg-emerald-500/10 text-brand-primary px-5 py-2 rounded-2xl font-black text-2xl border border-emerald-500/10">
        {data.score.toFixed(1)}
      </div>
    </div>
    <p className="text-slate-600 dark:text-slate-300 text-[13px] leading-relaxed mb-10 font-medium italic opacity-80">"{data.feedback}"</p>
    <div className="space-y-4">
      <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10">
        <h4 className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-2">Key Strength</h4>
        <p className="text-[11px] text-brand-dark dark:text-emerald-50 font-bold leading-snug">{data.strengths[0]}</p>
      </div>
      <div className="bg-amber-500/5 p-5 rounded-2xl border border-amber-500/10">
        <h4 className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-2">Refinement Node</h4>
        <p className="text-[11px] text-brand-dark dark:text-emerald-50 font-bold leading-snug">{data.weaknesses[0]}</p>
      </div>
    </div>
  </div>
);

const ResultView: React.FC<ResultViewProps> = ({ evaluation, onReset }) => {
  const [animatedBand, setAnimatedBand] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let start = 0;
    const end = evaluation.overallBand;
    const duration = 1200;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setAnimatedBand(progress * end);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [evaluation.overallBand]);

  const handlePlayAudio = async () => {
    if (isPlaying) return;
    setIsAudioLoading(true);
    try {
      const base64 = await getAudioFeedback(evaluation.detailedAnalysis);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    try {
      const botResponse = await chatWithExaminer([], userMsg);
      setChatHistory(prev => [...prev, { role: 'bot', text: botResponse || '...' }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', text: 'Service busy.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-12 md:space-y-24 pb-40 max-w-7xl mx-auto px-6">
      {/* MASTER SCORE SECTION */}
      <div className="bg-brand-dark dark:bg-[#031d17] rounded-[4rem] p-12 md:p-24 text-white relative overflow-hidden shadow-3xl border border-white/5">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[150px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="text-center md:text-left">
            <h2 className="text-6xl md:text-9xl font-black mb-8 leading-none tracking-tighter">TOTAL <br/> SCORE</h2>
            <p className="text-emerald-100/60 text-lg md:text-xl font-medium max-w-sm mb-12">
                Neural assessment conducted across all academic parameters.
            </p>
            <button 
              onClick={handlePlayAudio}
              disabled={isAudioLoading}
              className="px-10 py-6 bg-brand-primary text-brand-dark rounded-3xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl font-black text-[11px] uppercase tracking-widest"
            >
              <i className={`fas ${isPlaying ? 'fa-waveform' : isAudioLoading ? 'fa-spinner fa-spin' : 'fa-volume-high'}`}></i>
              {isPlaying ? 'Analysis Playing' : 'Voice Feedback'}
            </button>
          </div>
          <div className="relative">
            <div className="relative w-64 h-64 md:w-[450px] md:h-[450px] bg-white/5 backdrop-blur-3xl rounded-full flex flex-col items-center justify-center border border-white/10 shadow-3xl">
               <span className="text-[10px] md:text-xs font-black uppercase text-brand-primary tracking-[0.6em] mb-4">Overall Band</span>
               <span className="text-[120px] md:text-[240px] font-black tracking-tighter text-white leading-none">
                 {animatedBand.toFixed(1)}
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* CRITERIA GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <ScoreBadge title="Task Response" data={evaluation.taskResponse} />
        <ScoreBadge title="Cohesion & Cohesion" data={evaluation.coherenceCohesion} />
        <ScoreBadge title="Lexical Resource" data={evaluation.lexicalResource} />
        <ScoreBadge title="Grammar Accuracy" data={evaluation.grammaticalRange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-20">
          {/* DETAILED FEEDBACK */}
          <section className="bg-white dark:bg-slate-900/40 p-12 md:p-20 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-soft">
            <h3 className="text-3xl md:text-4xl font-black text-brand-dark dark:text-white mb-12 flex items-center gap-5 uppercase tracking-tighter leading-none">
              <i className="fas fa-microchip text-brand-primary"></i> Analytical Report
            </h3>
            <div className="text-slate-600 dark:text-slate-200 text-lg md:text-xl leading-[1.8] font-medium space-y-8">
              {evaluation.detailedAnalysis.split('\n').map((p, i) => p.trim() && <p key={i}>{p}</p>)}
            </div>
          </section>

          {/* ACADEMIC PROTOTYPE */}
          <section className="relative">
            <div className="bg-[#fefcf8] dark:bg-[#04211a] rounded-[3rem] md:rounded-[4rem] p-12 md:p-24 shadow-2xl border border-amber-100 dark:border-emerald-800/30">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 border-b border-amber-100 dark:border-emerald-800/20 pb-12">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-amber-500/10 dark:bg-brand-primary/10 rounded-3xl flex items-center justify-center text-amber-600 dark:text-brand-primary text-2xl">
                      <i className="fas fa-feather-pointed"></i>
                   </div>
                   <div>
                      <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                        PROTOTYPE
                      </h3>
                      <span className="text-[10px] font-black text-amber-600 dark:text-emerald-400 uppercase tracking-[0.4em] mt-3 block">Official Band 9.0 Benchmark</span>
                   </div>
                </div>
                <button 
                  onClick={() => { navigator.clipboard.writeText(evaluation.improvedVersion); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className={`px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-brand-dark dark:bg-brand-primary text-white active:scale-95'}`}
                >
                  {copied ? 'Copied to Clipboard' : 'Clone Script'}
                </button>
              </div>

              <div className="font-serif text-xl md:text-2xl italic leading-[1.9] text-slate-800 dark:text-emerald-50/80">
                {evaluation.improvedVersion.split('\n').map((l, i) => l.trim() && (
                  <p key={i} className="mb-10 last:mb-0 first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:leading-none first-letter:text-amber-600 dark:first-letter:text-brand-primary">
                    {l}
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900/60 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl sticky top-36">
             <div className="flex items-center gap-5 mb-12">
                <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center text-2xl">
                  <i className="fas fa-comments"></i>
                </div>
                <div>
                   <h4 className="text-lg font-black text-brand-dark dark:text-white leading-none">EXAMINER AI</h4>
                   <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2 block">Post-Session Chat</span>
                </div>
             </div>
             
             <div className="h-[450px] overflow-y-auto mb-10 p-6 bg-slate-50 dark:bg-brand-black/30 rounded-[2rem] border border-slate-100 dark:border-white/5 space-y-6">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
                    <i className="fas fa-robot text-4xl mb-2"></i>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">Ask about sentence structures or lexical choices used in this essay.</p>
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-6 rounded-3xl text-[14px] font-semibold leading-relaxed ${m.role === 'user' ? 'bg-brand-dark dark:bg-brand-primary text-white' : 'bg-white dark:bg-slate-800 text-brand-dark dark:text-slate-100 shadow-sm'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && <div className="text-[9px] text-brand-primary font-black animate-pulse uppercase tracking-[0.3em] text-center">Architecting Response...</div>}
             </div>
             
             <div className="flex gap-3">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Inquiry..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
                <button 
                  onClick={handleSendChat}
                  className="w-14 h-14 bg-brand-primary text-brand-dark rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-90"
                >
                  <i className="fas fa-paper-plane text-sm"></i>
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
