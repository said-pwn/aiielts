
import React, { useState, useEffect } from 'react';
import { 
  History, PlusCircle, AlertCircle, Award, BookOpen, Image as ImageIcon,
  Trash2, ArrowRight, Target, Star,
  ShieldAlert, Sparkles, Pencil, Camera, Lock, Unlock, Key,
  Coins, RefreshCw, Info, ChevronRight, FileCheck, MessageSquareQuote, Lightbulb
} from 'lucide-react';
import { TaskType, WritingSubmission, IELTSFeedback } from './types';
import { gradeIELTSWriting } from './services/geminiService';
import { ScoreCard } from './components/ScoreCard';
import { LoadingScreen } from './components/LoadingScreen';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import logo from "./components/logo.jpg";

const INITIAL_CREDITS = 10;
const REQUIRED_ACCESS_CODE = 'IELTS2025';

// Safe UUID fallback for environments where crypto.randomUUID is unavailable
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [credits, setCredits] = useState<number>(INITIAL_CREDITS);
  const [taskType, setTaskType] = useState<TaskType>(TaskType.TASK_2_ESSAY);
  const [question, setQuestion] = useState('');
  const [userText, setUserText] = useState('');
  const [taskImage, setTaskImage] = useState<string | null>(null);
  const [submissionImage, setSubmissionImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<WritingSubmission[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<WritingSubmission | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('ielts_history_v7');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedAuth = localStorage.getItem('ielts_access_granted');
    if (savedAuth === 'true') setIsAuthenticated(true);

    const savedCredits = localStorage.getItem('ielts_credits');
    if (savedCredits !== null) {
      setCredits(parseInt(savedCredits, 10));
    } else {
      localStorage.setItem('ielts_credits', INITIAL_CREDITS.toString());
    }
  }, []);

  const updateCredits = (newAmount: number) => {
    setCredits(newAmount);
    localStorage.setItem('ielts_credits', newAmount.toString());
  };

  const refillCredits = () => {
    updateCredits(INITIAL_CREDITS);
    setError(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === REQUIRED_ACCESS_CODE) {
      setIsAuthenticated(true);
      localStorage.setItem('ielts_access_granted', 'true');
      setError(null);
    } else {
      setError('Неверный код доступа. TG: t.me/sddffhf1');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('ielts_access_granted');
    setAccessCode('');
  };

  const clearHistory = () => {
    if (window.confirm('Удалить всю историю проверок?')) {
      setHistory([]);
      localStorage.removeItem('ielts_history_v7');
      setActiveSubmission(null);
    }
  };

  const saveToHistory = (submission: WritingSubmission) => {
    const newHistory = [submission, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('ielts_history_v7', JSON.stringify(newHistory));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const wordCount = userText.trim() ? userText.trim().split(/\s+/).length : 0;
  const targetWords = taskType === TaskType.TASK_2_ESSAY ? 250 : 150;
  const isUnderlength = wordCount > 0 && wordCount < targetWords;

  const handleAnalyze = async () => {
    if (credits <= 0) {
      setError('Недостаточно баланса. Пожалуйста, обновите кредиты.');
      return;
    }
    if (!question.trim() && !taskImage) {
      setError('Укажите тему задания или загрузите фото задания.');
      return;
    }
    if (!userText.trim() && !submissionImage) {
      setError('Введите текст эссе или загрузите фото рукописи.');
      return;
    }
    setError(null);
    setIsAnalyzing(true);

    try {
      const feedback = await gradeIELTSWriting(
        taskType, 
        question, 
        userText, 
        taskImage || undefined, 
        submissionImage || undefined
      );
      
      const submission: WritingSubmission = {
        id: generateId(),
        timestamp: Date.now(),
        taskType,
        question,
        userText,
        taskImage: taskImage || undefined,
        submissionImage: submissionImage || undefined,
        feedback
      };

      updateCredits(credits - 1);
      saveToHistory(submission);
      setActiveSubmission(submission);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('QUOTA_EXHAUSTED')) {
        setError('Google API Limit: Слишком много запросов. Подождите 1 минуту.');
      } else {
        setError('Ошибка сервера. Проверьте соединение или API ключ.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const radarData = activeSubmission?.feedback ? [
    { subject: 'Task', A: activeSubmission.feedback.taskResponse.score },
    { subject: 'Cohesion', A: activeSubmission.feedback.coherenceCohesion.score },
    { subject: 'Lexical', A: activeSubmission.feedback.lexicalResource.score },
    { subject: 'Grammar', A: activeSubmission.feedback.grammaticalRange.score },
  ] : [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-400 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-none p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl animate-in zoom-in duration-500">
          <div className="flex justify-center mb-8">
          <div className="bg-white  rounded-lg shadow-sm inline-flex items-center justify-center">

  <img className="w-[250px] h-auto" src={logo} alt="logo" />
</div>
          </div>
          <h1 className="text-2x1 font-black text-black text-center mb-2 tracking-tight">Добро пожаловать</h1>
          {/* <h1 className="text-black text-center text-5 mb-3 font-medium">Добро пожаловать</h1> */}
          <p className="text-black text-center text-sm mb-8 font-medium">Введите код доступа для использования.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Access Code"
                className="w-full bg-black border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-indigo-500 transition-all outline-none font-bold placeholder:text-slate-700"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl active:scale-[0.98]"
            >
              enter
            </button>
            {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center mt-2 animate-pulse">{error}</p>}
          </form>
          
          <div className="mt-10 pt-8 border-t border-black text-center">
          <p className="text-[10px] font-black text-black uppercase mb-5 tracking-widest">beta</p>
            <p className="text-[10px] font-black text-black uppercase tracking-widest">TG: t.me/sddffhf1</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] flex flex-col lg:flex-row font-sans text-slate-200 selection:bg-indigo-500/30">
      <aside className="w-full lg:w-80 bg-white p-6 flex flex-col h-screen lg:sticky lg:top-0 border-r border-slate-900 shadow-2xl z-50 overflow-hidden">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-white rounded-xl ">
          <img className="w-[200px] h-auto" src={logo} alt="logo" />
          </div>
          <div className="flex-1">
            
            
          </div>
          <button onClick={handleLogout} className="text-black hover:text-rose-500 transition-colors p-2">
            <Unlock size={16} />
          </button>
        </div>

        <div className="bg-black border border-black rounded-3xl p-5 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-amber-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Аудит-Кредиты</span>
            </div>
            <button onClick={refillCredits} className="p-1.5 hover:bg-indigo-500/10 rounded-lg text-indigo-400 transition-colors">
              <RefreshCw size={12} />
            </button>
          </div>
          <div className="flex items-end gap-1 mb-3">
            <span className={`text-3xl font-black ${credits > 0 ? 'text-white' : 'text-rose-500'}`}>{credits}</span>
            <span className="text-[9px] font-black text-white uppercase mb-1.5">Доступно</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${credits > 1 ? 'bg-indigo-500' : 'bg-rose-500'}`}
              style={{ width: `${(credits / INITIAL_CREDITS) * 100}%` }}
            />
          </div>
        </div>

        <div className="w-full h-full flex flex-col bg-black border border-slate-800 rounded-3xl p-5">

{/* 1. КНОПКА NEW (Теперь внутри) */}
<button 
  onClick={() => { setActiveSubmission(null); setQuestion(''); setUserText(''); setTaskImage(null); setSubmissionImage(null); setError(null); }}
  className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-600 hover:bg-slate-800 py-3 rounded-2xl transition-all mb-6 font-bold text-white active:scale-[0.98] shrink-0"
>
  <PlusCircle size={18} />
  <span className="uppercase text-xs tracking-widest">new</span>
</button>

{/* РАЗДЕЛИТЕЛЬ (Опционально) */}
<div className="w-full h-px bg-slate-900 mb-4 shrink-0"></div>

{/* 2. ЗАГОЛОВОК ИСТОРИИ */}
<div className="flex items-center justify-between px-2 mb-3 shrink-0">
  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">previous</p>
  {history.length > 0 && (
    <button onClick={clearHistory} className="text-[9px] font-black text-red-500 hover:text-red-200 transition-colors uppercase">delete all</button>
  )}
</div>

{/* 3. СПИСОК ИСТОРИИ (Скроллится только он) */}
<div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
  {history.length === 0 ? (
    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
      <History size={24} className="text-slate-600 mb-2" />
      <p className="text-[10px] font-bold text-slate-600 uppercase">No history yet</p>
    </div>
  ) : (
    history.map((sub) => (
      <button
        key={sub.id}
        onClick={() => setActiveSubmission(sub)}
        className={`w-full text-left p-4 rounded-2xl transition-all border group ${
          activeSubmission?.id === sub.id 
            ? 'bg-indigo-900/20 border-indigo-500/50 text-white' 
            : 'bg-slate-900/30 border-transparent hover:border-slate-700 hover:bg-slate-800 text-slate-400'
        }`}
      >
        <div className="flex justify-between items-center mb-1.5">
          <span className={`text-[8px] font-black uppercase tracking-wider ${
             activeSubmission?.id === sub.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'
          }`}>
            {sub.taskType.split(' ')[0]}
          </span>
          <span className="text-[8px] opacity-30">{new Date(sub.timestamp).toLocaleDateString()}</span>
        </div>
        
        <p className="text-xs font-bold truncate mb-2 leading-relaxed opacity-90">
          {sub.question || "No Topic"}
        </p>
        
        {sub.feedback && (
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1 ${
               activeSubmission?.id === sub.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              BAND {sub.feedback.overallScore}
            </span>
          </div>
        )}
      </button>
    ))
  )}
</div>
</div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-12">
          {!activeSubmission && !isAnalyzing ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Examiner's Desk</h2>
                  <p className="text-slate-500 text-lg">Загрузите эссе для получения <span className="text-indigo-400 font-bold">реалистичного</span> балла IELTS.</p>
                </div>
                <div className="flex bg-slate-900/50 rounded-2xl p-1.5 border border-slate-800">
                  {Object.values(TaskType).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTaskType(type)}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                        taskType === type ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                  <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                      <Target size={18} className="text-indigo-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Задание (Prompt)</h3>
                    </div>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Вставьте текст задания (например: 'Some people think that...') "
                      className="w-full h-32 bg-transparent border-none focus:ring-0 text-slate-300 text-sm leading-relaxed placeholder:text-slate-700 resize-none font-medium"
                    />
                  </div>

                  <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <Pencil size={18} className="text-emerald-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Текст ответа</h3>
                      </div>
                      <div className={`px-4 py-1 rounded-full text-[10px] font-black border ${isUnderlength ? 'border-rose-500/50 text-rose-400 bg-rose-500/5 animate-pulse' : 'border-slate-800 text-slate-500'}`}>
                        {wordCount} / {targetWords} Слов
                      </div>
                    </div>
                    <textarea
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      placeholder="Начните писать или вставьте ваш текст..."
                      className="w-full h-[32rem] bg-transparent border-none focus:ring-0 text-slate-300 text-lg leading-[1.8] placeholder:text-slate-800 resize-none font-serif"
                    />
                    {isUnderlength && (
                      <div className="flex items-center gap-2 text-rose-500 text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 p-4 rounded-2xl">
                        <AlertCircle size={14} />
                        Внимание: Недобор слов может привести к штрафу по критерию Task Response.
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                  <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-8 h-fit lg:sticky lg:top-12">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                      <ImageIcon size={18} className="text-indigo-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Визуальные данные</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <label className="aspect-[4/3] relative group rounded-3xl border-2 border-dashed border-slate-800 overflow-hidden bg-black/20 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-all">
                        {taskImage ? (
                          <>
                            <img src={taskImage} className="w-full h-full object-cover" />
                            <button onClick={(e) => {e.preventDefault(); setTaskImage(null)}} className="absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-xl"><Trash2 size={12} /></button>
                          </>
                        ) : (
                          <>
                            <Camera size={24} className="text-slate-700 mb-2" />
                            <span className="text-[8px] font-black text-slate-600 uppercase">Картинка задания</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setTaskImage)} />
                          </>
                        )}
                      </label>
                      
                      <label className="aspect-[4/3] relative group rounded-3xl border-2 border-dashed border-slate-800 overflow-hidden bg-black/20 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all">
                        {submissionImage ? (
                          <>
                            <img src={submissionImage} className="w-full h-full object-cover" />
                            <button onClick={(e) => {e.preventDefault(); setSubmissionImage(null)}} className="absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-xl"><Trash2 size={12} /></button>
                          </>
                        ) : (
                          <>
                            <FileCheck size={24} className="text-slate-700 mb-2" />
                            <span className="text-[8px] font-black text-slate-600 uppercase">Фото рукописи</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setSubmissionImage)} />
                          </>
                        )}
                      </label>
                    </div>

                    <button
                      onClick={handleAnalyze}
                      disabled={credits <= 0 || isAnalyzing}
                      className={`w-full py-6 rounded-3xl font-black text-xs tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 group active:scale-[0.97] ${
                        credits > 0 
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30' 
                          : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {credits > 0 ? (
                        <>
                          ПРОВЕРИТЬ ЭССЕ
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : 'НЕТ КРЕДИТОВ'}
                    </button>
                    {error && (
                      <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 mt-4">
                        <p className="text-rose-500 text-[10px] font-black uppercase text-center">{error}</p>
                      </div>
                    )}
                    
                    <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800 space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Info size={12} className="text-indigo-400" />
                        Важная информация
                      </h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                        Если вы видите ошибку "QUOTA_EXHAUSTED", подождите 60 секунд.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="min-h-[70vh] flex items-center justify-center">
              <LoadingScreen />
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in duration-1000 pb-32">
              {/* Report Header */}
              <header className="p-12 bg-slate-900/40 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -rotate-12">
                  <Award size={300} />
                </div>
                
                <div className="flex items-center gap-10 z-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-30 animate-pulse" />
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] flex flex-col items-center justify-center text-white shadow-2xl relative z-10 border border-white/10 ring-8 ring-indigo-500/10">
                      <span className="text-[10px] font-black opacity-70 tracking-widest uppercase">OVERALL</span>
                      <span className="text-6xl font-black tracking-tighter">{activeSubmission?.feedback?.overallScore}</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Test Report Form</h2>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-500/20">
                        CEFR {activeSubmission?.feedback?.cefrLevel}
                      </div>
                      <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">ID: {activeSubmission?.id.slice(0,8)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 z-10">
                  <button onClick={() => setActiveSubmission(null)} className="px-8 py-4 bg-white text-black text-[10px] font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest shadow-xl">
                    Новый тест
                  </button>
                </div>
              </header>

              {/* Mentor Quote Section */}
              <div className="bg-indigo-600/10 border border-indigo-500/30 p-10 rounded-[3rem] relative overflow-hidden group">
                <div className="absolute top-[-20px] right-[-20px] text-indigo-500/10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <MessageSquareQuote size={160} />
                </div>
                <div className="flex items-start gap-6 relative z-10">
                  <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-3">Заметка наставника (Examiner's Note)</h3>
                    <p className="text-lg text-slate-200 font-medium italic leading-relaxed">
                      "{activeSubmission?.feedback?.mentorNote}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ScoreCard label="Task Response" score={activeSubmission!.feedback!.taskResponse.score} description={activeSubmission!.feedback!.taskResponse.feedback} />
                <ScoreCard label="Coherence & Cohesion" score={activeSubmission!.feedback!.coherenceCohesion.score} description={activeSubmission!.feedback!.coherenceCohesion.feedback} />
                <ScoreCard label="Lexical Resource" score={activeSubmission!.feedback!.lexicalResource.score} description={activeSubmission!.feedback!.lexicalResource.feedback} />
                <ScoreCard label="Grammar Range" score={activeSubmission!.feedback!.grammaticalRange.score} description={activeSubmission!.feedback!.grammaticalRange.feedback} />
              </div>

              {/* Charts and Action Points */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-slate-800">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 mb-10 tracking-widest flex items-center gap-2">
                    <Star size={14} className="text-indigo-500" />
                    Performance Profile
                  </h3>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 900, fill: '#475569' }} />
                        <Radar name="Score" dataKey="A" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-900/40 p-10 rounded-[3rem] border border-slate-800">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 mb-8 tracking-widest flex items-center gap-2">
                    <Target size={14} className="text-indigo-400" />
                    Critical Improvements
                  </h3>
                  <div className="space-y-4">
                    {activeSubmission?.feedback?.keyImprovements.map((tip, i) => (
                      <div key={i} className="p-6 bg-black/40 rounded-3xl border border-slate-800 flex items-start gap-4 hover:border-indigo-500/30 transition-all">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-sm">{i+1}</div>
                        <p className="text-slate-300 text-sm font-medium leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vocabulary Highlights */}
              {activeSubmission?.feedback?.vocabularyHighlights && activeSubmission.feedback.vocabularyHighlights.length > 0 && (
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-slate-800">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 mb-8 tracking-widest flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-400" />
                    Vocabulary Upgrades
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSubmission.feedback.vocabularyHighlights.map((v, i) => (
                      <div key={i} className="bg-black/40 p-6 rounded-3xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-rose-400 font-bold line-through text-xs">{v.word}</span>
                          <span className="text-emerald-400 font-black text-sm">→ {v.suggestion}</span>
                        </div>
                        <p className="text-slate-500 text-[10px] font-medium leading-relaxed italic">"{v.reason}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Answer */}
              <div className="bg-white rounded-[4rem] p-16 text-slate-900 shadow-2xl relative group">
                <div className="absolute top-10 right-10 opacity-20"><Sparkles size={60} /></div>
                <h3 className="text-3xl font-black mb-12 flex items-center gap-4 tracking-tighter">
                  <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-lg"><BookOpen size={28} /></div>
                  Examiner's Model Answer (Band 9)
                </h3>
                <div className="max-w-none prose font-serif">
                  <p className="text-xl leading-[2.1] text-slate-700 whitespace-pre-wrap italic font-medium pl-10 border-l-4 border-indigo-100">
                    {activeSubmission?.feedback?.correctedText}
                  </p>
                </div>
              </div>
              
              {/* Errors Audit */}
              <div className="bg-slate-900/40 p-12 rounded-[3.5rem] border border-slate-800">
                <h3 className="text-[10px] font-black uppercase text-slate-500 mb-10 tracking-widest flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-500" />
                  Detailed Grammatical Audit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeSubmission?.feedback?.detailedErrors.map((err, i) => (
                    <div key={i} className="p-8 bg-black/40 rounded-3xl border border-slate-800 hover:border-rose-500/20 transition-all group">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[9px] font-black bg-rose-500/10 text-rose-400 px-3 py-1 rounded uppercase">{err.type}</span>
                      </div>
                      <p className="text-rose-400/70 font-bold line-through text-sm mb-2">{err.original}</p>
                      <p className="text-emerald-400 font-black text-sm mb-4">→ {err.correction}</p>
                      <p className="text-slate-500 text-[11px] leading-relaxed italic">"{err.explanation}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
