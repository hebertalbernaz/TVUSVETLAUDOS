import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import './App.css';
import { db } from './services/database';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import ExamPage from './pages/ExamPage';
import { Toaster } from './components/ui/sonner';

function App() {
  useEffect(() => {
    db.init();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="App">
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/exam/:examId" element={<ExamPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </HashRouter>
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;
