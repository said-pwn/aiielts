
import React, { useState } from 'react';

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`group bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-8 transition-all duration-500 cursor-pointer overflow-hidden ${isOpen ? 'shadow-2xl border-brand-primary/20' : 'hover:border-brand-primary/20 shadow-sm'}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="flex justify-between items-center gap-6">
        <h3 className="text-lg md:text-xl font-black text-brand-dark dark:text-white tracking-tight uppercase leading-tight">{q}</h3>
        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-brand-primary text-brand-dark' : 'bg-emerald-50 dark:bg-emerald-900/30 text-brand-primary'}`}>
          <i className={`fas ${isOpen ? 'fa-minus' : 'fa-plus'} text-xs`}></i>
        </div>
      </div>
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-500 dark:text-slate-300 font-medium text-base md:text-lg leading-relaxed">
          {a}
        </p>
      </div>
    </div>
  );
};

const FAQPage: React.FC = () => {
  const faqs = [
    {
      q: "How accurate is the AI Band Score?",
      a: "Our model is specifically calibrated using thousands of previously marked IELTS essays. While no AI is a 100% substitute for a certified human examiner, our system follows the exact 4 criteria (TR, CC, LR, GRA) used by the British Council and IDP, typically resulting in an accuracy range of ±0.5 band."
    },
    {
      q: "Does it work for both Academic and General Training?",
      a: "Yes. The system is primary optimized for the IELTS Academic Writing Task 1 and Task 2, but our marking logic adapts to General Training prompts as well. Simply paste your prompt and essay accordingly."
    },
    {
      q: "Is my writing saved or shared?",
      a: "Absolutely not. We prioritize academic integrity and data privacy. Your essays are processed in real-time by the Gemini 1.5 Pro engine and are not stored on our servers once the session is closed."
    },
    {
      q: "How many times can I practice?",
      a: "We currently offer unlimited evaluations for our Uzbekistan community. Our goal is to democratize high-end IELTS education by providing instant feedback to every student who needs it."
    },
    {
      q: "Why is task 1 marking different?",
      a: "Task 1 focuses heavily on data selection and objective reporting. Our AI is tuned to look for accurate comparisons and an effective overview, whereas Task 2 focuses more on the development of an argument and logical progression."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 animate-fadeIn pb-32">
      <div className="text-center mb-16 md:mb-24">
         <div className="inline-block px-5 py-2 bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-brand-primary/20 mb-8">
            Knowledge Base
         </div>
         <h1 className="text-4xl md:text-7xl font-black text-brand-dark dark:text-white tracking-tighter uppercase leading-[0.9] mb-8">
            Common <br/> Questions
         </h1>
         <p className="text-slate-500 dark:text-slate-200 text-lg md:text-2xl font-medium max-w-xl mx-auto">
            Everything you need to know about our AI marking logic and platform standards.
         </p>
      </div>

      <div className="space-y-6">
        {faqs.map((f, i) => <FAQItem key={i} {...f} />)}
      </div>

      <div className="mt-24 p-12 bg-brand-black rounded-[3.5rem] text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-brand-primary/5 blur-3xl rounded-full"></div>
         <div className="relative z-10">
            <h4 className="text-white text-2xl font-black mb-4 uppercase tracking-tight">Still have questions?</h4>
            <p className="text-slate-400 font-medium mb-10 max-w-sm mx-auto">Our human tutors are available on Telegram for direct consultation.</p>
            <a href="https://t.me/sddffhf1" className="inline-flex items-center gap-4 bg-brand-primary text-brand-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/20">
               <i className="fab fa-telegram-plane"></i> Message @sddffhf1
            </a>
         </div>
      </div>
    </div>
  );
};

export default FAQPage;
