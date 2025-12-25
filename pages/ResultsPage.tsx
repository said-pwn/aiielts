
import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import ResultView from '../components/ResultView';

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const evaluation = location.state?.evaluation;

  if (!evaluation) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <i className="fas fa-arrow-left"></i> Back to Editor
        </button>
        <ResultView 
          evaluation={evaluation} 
          onReset={() => navigate('/')} 
        />
      </div>
    </div>
  );
};

export default ResultsPage;
