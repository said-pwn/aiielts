
import { IELTSEvaluation, CriterionFeedback } from '../types';
import { getAudioFeedback, chatWithExaminer } from '../services/geminiService';
import React, { useEffect, useState, useRef } from 'react';

interface ResultViewProps {
  evaluation: IELTSEvaluation;
  onReset: () => void;
}

// Helper functions for audio processing
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
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
    if (isPlaying || isAudioLoading) return;
    setIsAudioLoading(true);
    try {
      const base64Audio = await getAudioFeedback(evaluation.detailedAnalysis);
      if (!base64Audio) throw new Error("No audio data received");

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      const audioBuffer = await decodeAudioData(
        decodeBase64(base64Audio),
        ctx,
        24000,
        1
      );

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Audio Playback Error:", err);
      alert("Voice Feedback is temporarily unavailable. Please try again in a moment.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim() || isChatLoading) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    try {
      const botResponse = await chatWithExaminer([], userMsg);
      setChatHistory(prev => [...prev, { role: 'bot', text: botResponse || '...' }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: 'bot', text: 'Examiner is currently busy. Please try again shortly.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const copyPrototype = () => {
    navigator.clipboard.writeText(evaluation.improvedVersion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12 md:space-y-24 pb-40 max-w-7xl mx-auto px-6 animate-fadeIn">
      {/* MASTER SCORE SECTION */}
      <div className="bg-brand-dark dark:bg-[#031d17] rounded-[4rem] p-12 md:p-24 text-white relative overflow-hidden shadow-3xl border border-white/5">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[150px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="text-center md:text-left">
            <h2 className="text-6xl md:text-9xl font-black mb-8 leading-none tracking-tighter uppercase">TOTAL <br/> SCORE</h2>
            <p className="text-emerald-100/60 text-lg md:text-xl font-medium max-w-sm mb-12">
                Advanced neural evaluation based on official 2025 academic criteria.
            </p>
            <button 
              onClick={handlePlayAudio}
              disabled={isAudioLoading}
              className={`px-10 py-6 bg-brand-primary text-brand-dark rounded-3xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl font-black text-[11px] uppercase tracking-widest group ${isPlaying ? 'ring-4 ring-emerald-400/30' : ''}`}
            >
              <i className={`fas ${isPlaying ? 'fa-waveform' : isAudioLoading ? 'fa-spinner fa-spin' : 'fa-volume-high'} group-hover:rotate-12 transition-transform`}></i>
              {isPlaying ? 'Analysis Playing' : isAudioLoading ? 'Generating Voice...' : 'Voice Feedback'}
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
        <ScoreBadge title="Coherence & Cohesion" data={evaluation.coherenceCohesion} />
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
          <section className="relative group">
            <div className="bg-white dark:bg-[#04211a] rounded-[3rem] md:rounded-[4rem] p-10 md:p-20 shadow-2xl border border-slate-100 dark:border-emerald-800/30 transition-all">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12 border-b border-slate-100 dark:border-emerald-800/20 pb-10">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-emerald-50/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-brand-primary text-xl">
                      <i className="fas fa-pen-nib"></i>
                   </div>
                   <div>
                      <h3 className="text-2xl md:text-4xl font-black text-brand-dark dark:text-white tracking-tighter uppercase leading-none">
                        ACADEMIC PROTOTYPE
                      </h3>
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.4em] mt-3 block">High Precision Improvement</span>
                   </div>
                </div>
                <button 
                  onClick={copyPrototype}
                  className={`relative overflow-hidden group/btn px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-4 ${
                    copied 
                    ? 'bg-emerald-500 text-white scale-105' 
                    : 'bg-brand-dark dark:bg-brand-primary text-white dark:text-brand-dark hover:brightness-110 active:scale-95'
                  }`}
                >
                  <i className={`fas ${copied ? 'fa-check-double' : 'fa-copy'} transition-transform duration-300`}></i>
                  <span>{copied ? 'Copied to Clipboard' : 'Clone Sample'}</span>
                </button>
              </div>

              <div className="font-serif text-lg md:text-2xl leading-[2] text-slate-800 dark:text-emerald-50/90 tracking-wide selection:bg-brand-primary/20 p-4">
                {evaluation.improvedVersion.split('\n').map((l, i) => l.trim() && (
                  <p key={i} className="mb-10 last:mb-0 first-letter:text-4xl first-letter:font-black first-letter:text-brand-primary">
                    {l}
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* SIDEBAR: CHAT INTERFACE - Adjusted top to 20 for better spacing */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900/60 p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-2xl sticky top-20">
             <div className="flex items-center gap-5 mb-10">
                <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center text-xl">
                  <i className="fas fa-comments"></i>
                </div>
                <div>
                   <h4 className="text-base font-black text-brand-dark dark:text-white leading-none uppercase tracking-tight">Examiner Chat</h4>
                   <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-2 block">AI Consultation active</span>
                </div>
             </div>
             
             <div className="h-[450px] overflow-y-auto mb-8 p-6 bg-slate-50 dark:bg-brand-black/30 rounded-[3rem] border border-slate-100 dark:border-white/5 space-y-6 custom-scrollbar scroll-smooth">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 opacity-40">
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                       <i className="fas fa-robot text-2xl"></i>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[180px]">Ask specific questions about your score or ways to improve.</p>
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}>
                    <div className={`max-w-[90%] p-5 rounded-[2rem] text-[13px] font-semibold leading-relaxed shadow-sm ${
                      m.role === 'user' 
                      ? 'bg-brand-dark dark:bg-brand-primary text-white dark:text-brand-dark rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-brand-dark dark:text-slate-100 rounded-tl-none border border-black/5 dark:border-white/5'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl flex gap-2 border border-black/5 dark:border-white/5">
                       <span className="w-2 h-2 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-2 h-2 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-2 h-2 bg-brand-primary rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
             </div>
             
             <div className="relative group">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask for clarification..."
                  className="w-full bg-slate-100 dark:bg-slate-800/80 border-2 border-transparent focus:border-brand-primary/50 rounded-full pl-8 pr-16 py-6 text-sm font-bold outline-none transition-all dark:text-white"
                />
                <button 
                  onClick={handleSendChat}
                  disabled={isChatLoading || !chatMessage.trim()}
                  className={`absolute right-2.5 top-2.5 bottom-2.5 w-12 rounded-full flex items-center justify-center transition-all ${
                    chatMessage.trim() && !isChatLoading
                    ? 'bg-brand-primary text-brand-dark shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-90'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
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
