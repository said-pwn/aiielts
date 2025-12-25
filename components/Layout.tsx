
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

// Fix: Define AIStudio interface and apply it to window.aistudio to resolve type conflicts
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

const BrandLogo = ({ className = "w-10 h-10" }) => (
  <div className={`relative ${className} flex items-center justify-center group shrink-0`}>
    <div className="absolute inset-0 bg-brand-dark dark:bg-emerald-600 rounded-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform"></div>
    <div className="absolute inset-0 bg-white dark:bg-brand-black border-2 border-brand-dark dark:border-brand-primary rounded-lg -rotate-3 group-hover:rotate-0 transition-transform flex items-center justify-center">
      <div className="relative">
        <i className="fas fa-pen-nib text-brand-secondary text-sm"></i>
        <div className="absolute -bottom-1 -right-2 bg-brand-primary w-3.5 h-3.5 rounded-full border border-white dark:border-brand-black flex items-center justify-center">
          <i className="fas fa-check text-[7px] text-white"></i>
        </div>
      </div>
    </div>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected || (!!process.env.API_KEY && process.env.API_KEY !== 'undefined'));
      } else {
        setHasKey(!!process.env.API_KEY && process.env.API_KEY !== 'undefined');
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    } else {
      alert("Neural Link can only be managed via AI Studio or Environment Variables (Vercel).");
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: t('nav_home'), icon: 'fa-house' },
    { path: '/practice/exam', label: t('nav_exam'), icon: 'fa-stopwatch' },
    { path: '/practice/check', label: t('nav_marker'), icon: 'fa-bolt-lightning' },
  ];

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500 bg-white dark:bg-brand-black">
      {/* Desktop Navbar */}
      <nav className={`desktop-nav fixed top-0 left-0 right-0 z-[10000] transition-all duration-500 hidden md:block ${
        scrolled 
          ? 'py-3 bg-white/80 dark:bg-brand-black/80 backdrop-blur-2xl shadow-2xl border-b border-brand-primary/10' 
          : 'py-6 bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase text-brand-dark dark:text-white">
                IELTSWRITING<span className="text-brand-primary">.UZ</span>
              </span>
              <span className="text-[8px] font-bold text-brand-secondary dark:text-emerald-400 uppercase tracking-widest mt-0.5">Academic Expert</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
               <div className={`w-2 h-2 rounded-full animate-pulse ${hasKey === true ? 'bg-emerald-500' : hasKey === false ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Neural Link: {hasKey === true ? 'Active' : hasKey === false ? 'Offline' : 'Connecting'}
               </span>
               {hasKey === false && (
                 <button onClick={handleOpenKey} className="ml-2 text-[8px] font-black text-brand-primary underline uppercase tracking-widest">Connect</button>
               )}
            </div>

            {navItems.map(item => (
              <Link key={item.path} to={item.path} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${location.pathname === item.path ? 'text-brand-primary' : 'text-slate-500 dark:text-slate-300 hover:text-brand-dark dark:hover:text-white'}`}>
                {item.label}
              </Link>
            ))}

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
               <button onClick={() => setLanguage(Language.RU)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${language === Language.RU ? 'bg-brand-primary text-brand-dark shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>RU</button>
               <button onClick={() => setLanguage(Language.EN)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${language === Language.EN ? 'bg-brand-primary text-brand-dark shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>EN</button>
            </div>

            <button onClick={() => setIsDark(!isDark)} className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 transition-all hover:scale-110">
              <i className={`fas ${isDark ? 'fa-sun text-brand-gold' : 'fa-moon text-brand-secondary'}`}></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="mobile-header md:hidden fixed top-0 left-0 right-0 z-[10000] p-4 flex justify-between items-center bg-white/60 dark:bg-brand-black/60 backdrop-blur-xl border-b border-black/5 dark:border-white/5 transition-all">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo className="w-8 h-8" />
          <span className="text-sm font-black tracking-tighter uppercase text-brand-dark dark:text-white">IELTSWRITING<span className="text-brand-primary">.UZ</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasKey === true ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'}`}></div>
          <button onClick={() => setIsDark(!isDark)} className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-emerald-400">
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </div>

      <main className="flex-grow pt-20 md:pt-40 pb-28 md:pb-12">
        {children}
      </main>
      
      {/* Footers and other elements removed for brevity in this XML part */}
    </div>
  );
};

export default Layout;
