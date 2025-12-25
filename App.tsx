
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Welcome from './components/Welcome';
import ExamMode from './pages/ExamMode';
import CheckMode from './pages/CheckMode';
import ResultsPage from './pages/ResultsPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import { LanguageProvider } from './context/LanguageContext';
import { Analytics } from "@vercel/analytics/next"

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/practice/exam" element={<ExamMode />} />
            <Route path="/practice/check" element={<CheckMode />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Analytics/>
        </Layout>
      </HashRouter>
    </LanguageProvider>
    
  );
};

export default App;
