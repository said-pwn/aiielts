
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.classList.add('modal-active');
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.documentElement.classList.remove('modal-active');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.documentElement.classList.remove('modal-active');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm animate-fadeIn transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-t-[2.5rem] sm:rounded-[3rem] shadow-3xl border border-white/20 dark:border-white/5 flex flex-col max-h-[92dvh] sm:max-h-[85dvh] animate-modalIn transition-transform duration-500">
        
        {/* Header */}
        <div className="flex-none px-6 py-5 sm:px-8 sm:py-6 flex justify-between items-center border-b border-black/5 dark:border-white/5">
          <div className="flex flex-col">
            <h3 className="text-[8px] sm:text-[10px] font-black text-brand-dark dark:text-white uppercase tracking-[0.3em] sm:tracking-[0.4em] truncate max-w-[200px] sm:max-w-none">
              {title}
            </h3>
            <div className="w-6 sm:w-8 h-1 bg-brand-primary rounded-full mt-1.5"></div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all active:scale-90"
          >
            <i className="fas fa-times text-xs sm:text-sm"></i>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 sm:py-10 custom-scrollbar overscroll-contain">
          <div className="text-slate-600 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
            {children}
          </div>
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="flex-none px-6 py-6 sm:px-12 sm:py-8 bg-slate-50/50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 pb-10 sm:pb-8">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 640px) {
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.9) translateY(40px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default Modal;
