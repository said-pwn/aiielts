
import React from 'react';

const ContactPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 pb-32 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 items-start">
        
        {/* LEFT COLUMN: INFO */}
        <div className="lg:col-span-5 space-y-12 md:space-y-16">
          <div>
            <div className="inline-block px-5 py-2 bg-emerald-500/10 text-brand-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-brand-primary/20 mb-8">
               Contact Academic Dept
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-brand-dark dark:text-white tracking-tighter uppercase leading-[0.9] mb-10">
               Get In <br/> Touch
            </h1>
            <p className="text-slate-500 dark:text-slate-200 text-lg md:text-2xl font-medium leading-relaxed max-w-sm">
               Whether you have technical issues or need personalized tutoring, our team in Tashkent is here to help.
            </p>
          </div>

          <div className="space-y-8">
             <a href="https://t.me/sddffhf1" target="_blank" className="group flex items-center gap-8 p-8 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-brand-primary/20 transition-all">
                <div className="w-14 h-14 bg-[#26A5E4]/10 text-[#26A5E4] rounded-2xl flex items-center justify-center text-2xl group-hover:bg-[#26A5E4] group-hover:text-white transition-all">
                  <i className="fab fa-telegram-plane"></i>
                </div>
                <div>
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Telegram Handle</h4>
                   <p className="text-xl font-black text-brand-dark dark:text-white">@sddffhf1</p>
                </div>
             </a>
             
             <div className="flex items-center gap-8 p-8 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/10 rounded-[2.5rem] shadow-sm">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-brand-primary rounded-2xl flex items-center justify-center text-2xl">
                  <i className="fas fa-envelope"></i>
                </div>
                <div>
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email Support</h4>
                   <p className="text-xl font-black text-brand-dark dark:text-white">support@ieltswriting.uz</p>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FORM */}
        <div className="lg:col-span-7">
           <div className="bg-brand-black dark:bg-[#031d17] p-10 md:p-16 rounded-[4rem] text-white relative overflow-hidden border border-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-3xl -mr-32 -mt-32"></div>
              
              <h3 className="text-3xl font-black mb-12 uppercase tracking-tight relative z-10">Send Feedback</h3>
              
              <form className="space-y-8 relative z-10">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                       <input type="text" placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email</label>
                       <input type="email" placeholder="john@example.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold" />
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Topic of Interest</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold appearance-none">
                       <option>Marking Inquiry</option>
                       <option>Tutoring Request</option>
                       <option>Technical Issue</option>
                       <option>Partnership</option>
                    </select>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Detailed Message</label>
                    <textarea rows={5} placeholder="Describe your inquiry..." className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold resize-none"></textarea>
                 </div>

                 <button className="w-full bg-brand-primary text-brand-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    Initiate Connection
                 </button>
              </form>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;
