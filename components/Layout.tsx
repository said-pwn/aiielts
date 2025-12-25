
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';
import React, { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
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
  const [tgVisible, setTgVisible] = useState(true);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

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
      <nav className={`desktop-nav fixed top-0 left-0 right-0 z-[100000] transition-all duration-500 hidden md:block ${
        scrolled 
          ? 'py-3 bg-white/90 dark:bg-brand-black/90 backdrop-blur-3xl shadow-2xl border-b border-brand-primary/10' 
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
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                  location.pathname === item.path ? 'text-brand-primary' : 'text-slate-500 dark:text-slate-300 hover:text-brand-dark dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
                <button 
                  onClick={() => setLanguage(Language.RU)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${language === Language.RU ? 'bg-brand-primary text-brand-dark shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >RU</button>
                <button 
                  onClick={() => setLanguage(Language.EN)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${language === Language.EN ? 'bg-brand-primary text-brand-dark shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >EN</button>
              </div>

              <button 
                onClick={() => setIsDark(!isDark)} 
                className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 transition-all hover:scale-110"
              >
                <i className={`fas ${isDark ? 'fa-sun text-brand-gold' : 'fa-moon text-brand-secondary'}`}></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="mobile-header md:hidden fixed top-0 left-0 right-0 z-[100000] h-20 px-4 flex justify-between items-center bg-white/80 dark:bg-brand-black/80 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 transition-all">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo className="w-8 h-8" />
          <span className="text-sm font-black tracking-tighter uppercase text-brand-dark dark:text-white">IELTSWRITING<span className="text-brand-primary">.UZ</span></span>
        </Link>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200 dark:border-white/5">
             <button 
              onClick={() => setLanguage(Language.RU)}
              className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${language === Language.RU ? 'bg-brand-primary text-brand-dark' : 'text-slate-400'}`}
             >RU</button>
             <button 
              onClick={() => setLanguage(Language.EN)}
              className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${language === Language.EN ? 'bg-brand-primary text-brand-dark' : 'text-slate-400'}`}
             >EN</button>
          </div>

          <button onClick={() => setIsDark(!isDark)} className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-emerald-400 border border-black/5 dark:border-white/10 rounded-xl">
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </div>

      <div className="mobile-bottom-nav md:hidden fixed bottom-6 inset-x-0 flex justify-center z-[100000] pointer-events-none px-4 transition-all">
        <div className="bg-white/95 dark:bg-brand-black/95 backdrop-blur-3xl border border-black/10 dark:border-white/20 rounded-[2.5rem] shadow-[0_15px_50px_rgba(0,0,0,0.2)] p-2 flex justify-around items-center w-full max-w-[320px] pointer-events-auto">
           {navItems.map(item => {
             const isActive = location.pathname === item.path;
             return (
               <Link 
                key={item.path} 
                to={item.path} 
                className={`relative flex-1 py-1.5 flex flex-col items-center gap-0.5 transition-all duration-300 ${isActive ? 'text-brand-primary scale-105' : 'text-slate-400 dark:text-slate-500'}`}
               >
                  <i className={`fas ${item.icon} ${isActive ? 'text-lg' : 'text-base'} transition-all`}></i>
                  <span className={`text-[7px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
               </Link>
             );
           })}
        </div>
      </div>

      <main className="flex-grow pt-24 md:pt-32 pb-28 md:pb-12">
        {children}
      </main>

      {/* Floating Telegram */}
      {tgVisible && (
        <div className="tg-floating-btn fixed bottom-28 md:bottom-8 right-6 z-[9000] flex flex-col items-center gap-3 animate-slideUp transition-all">
           <button 
            onClick={() => setTgVisible(false)}
            className="w-8 h-8 bg-black/10 dark:bg-white/10 text-brand-dark dark:text-white rounded-full flex items-center justify-center backdrop-blur-md border border-black/10 dark:border-white/20 transition-all hover:bg-rose-500 hover:text-white"
           >
            <i className="fas fa-times text-[10px]"></i>
           </button>
           <a 
            href="https://t.me/sddffhf1" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-12 h-12 md:w-14 md:h-14 bg-[#26A5E4] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all shadow-[#26A5E4]/30"
           >
            <i className="fab fa-telegram-plane text-xl md:text-2xl"></i>
           </a>
        </div>
      )}

      <footer className="bg-brand-black text-white relative border-t border-white/5 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-30"></div>
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start mb-16">
              <div className="space-y-6">
                <Link to="/" className="flex items-center gap-3">
                  <BrandLogo className="w-8 h-8" />
                  <span className="text-lg font-black tracking-tighter uppercase">IELTSWRITING<span className="text-brand-primary">.UZ</span></span>
                </Link>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs">
                  Профессиональная платформа для подготовки к IELTS Writing с использованием передовых нейросетевых технологий.
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Contact Us</h4>
                <div className="space-y-4">
                  <a href="mailto:support@ieltswriting.uz" className="flex items-center gap-4 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                    <i className="fas fa-envelope text-brand-primary w-4"></i>
                    support@ieltswriting.uz
                  </a>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
                    <i className="fas fa-location-dot text-brand-primary w-4"></i>
                    Tashkent, Uzbekistan
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Telegram Support</h4>
                <a 
                  href="https://t.me/sddffhf1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                >
                  <i className="fab fa-telegram-plane text-xl text-[#26A5E4] group-hover:scale-110 transition-transform"></i>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Telegram</span>
                    <span className="text-[9px] font-bold text-slate-400">@sddffhf1</span>
                  </div>
                </a>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-600">© {new Date().getFullYear()} IELTSWRITING.UZ — GLOBAL ACADEMIC EXCELLENCE</p>
            </div>
        </div>
        <div className="h-28 md:hidden"></div>
      </footer>
    </div>
  );
};

export default Layout;
