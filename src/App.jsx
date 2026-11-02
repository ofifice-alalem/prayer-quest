import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import IslamicPattern from './components/IslamicPattern';
import TodayPage from './pages/TodayPage';
import CalendarPage from './pages/CalendarPage';
import MissedRakatsPage from './pages/MissedRakatsPage';
import MosqueTrackerPage from './pages/MosqueTrackerPage';
import ExportPage from './pages/ExportPage';
import { getAllRecords, importDatabaseBackup } from './services/db';
import { calculateDayScore } from './services/scoring';
import { getTodayKey } from './utils/dateUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('pq_theme');
    return saved ? saved === 'dark' : true;
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [level, setLevel] = useState(1);

  const fileInputRef = useRef(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('pq_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('pq_theme', 'light');
    }
  }, [isDark]);

  // Load global player stats (Total Points, Streak, Level)
  useEffect(() => {
    calculateGlobalStats();
  }, [refreshTrigger]);

  const calculateGlobalStats = async () => {
    try {
      const records = await getAllRecords();
      let points = 0;
      records.forEach((r) => {
        const score = calculateDayScore(r);
        points += score.totalFardScore + score.totalSunnahScore;
      });
      setTotalPoints(points);

      // Level: 1 level per 1000 points
      const computedLevel = Math.max(1, Math.floor(points / 1000) + 1);
      setLevel(computedLevel);

      // Streak calculation
      const dateSet = new Set(
        records
          .filter((r) => {
            const sc = calculateDayScore(r);
            return sc.totalFardCompleted > 0;
          })
          .map((r) => r.date)
      );

      let streak = 0;
      const today = new Date();
      let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const todayKey = getTodayKey();
      if (!dateSet.has(todayKey)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const y = checkDate.getFullYear();
        const m = String(checkDate.getMonth() + 1).padStart(2, '0');
        const d = String(checkDate.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;

        if (dateSet.has(key)) {
          streak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      setStreakDays(streak);
    } catch (err) {
      console.error('Failed to calculate player stats:', err);
    }
  };

  const handleRecordUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Handle backup import
  const handleImportFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target.result);
          const count = await importDatabaseBackup(json);
          alert(`تم استيراد ${count} سجل بنجاح!`);
          setRefreshTrigger((prev) => prev + 1);
        } catch (parseErr) {
          alert('فشل قراءة الملف: تأكد من أنه ملف JSON صالح للنسخ الاحتياطي.');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      alert('حدث خطأ أثناء رفع الملف: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className={`min-h-screen relative flex flex-col font-tajawal transition-colors duration-300 ${
      isDark ? 'bg-[#0A0E17] text-slate-100' : 'bg-[#F4F6FA] text-slate-900'
    }`}>
      {/* Ambient Gaming Lighting (No wallpapers) */}
      <IslamicPattern isDark={isDark} />

      {/* Hidden File Input for Backup Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Sleek Gaming Top Navigation Bar */}
      <Navbar
        isDark={isDark}
        setIsDark={setIsDark}
        totalPoints={totalPoints}
        streakDays={streakDays}
        level={level}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 py-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          
          {/* Gaming Client Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onImportClick={() => fileInputRef.current?.click()}
            level={level}
            totalPoints={totalPoints}
          />

          {/* Active View */}
          <div className="flex-1 w-full min-w-0">
            {activeTab === 'today' && (
              <TodayPage onRecordUpdated={handleRecordUpdated} />
            )}
            {activeTab === 'calendar' && (
              <CalendarPage refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 'missed' && (
              <MissedRakatsPage refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 'mosque' && (
              <MosqueTrackerPage refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 'export' && (
              <ExportPage refreshTrigger={refreshTrigger} />
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-[#1E2842] py-5 text-center text-xs text-slate-500 relative z-10">
        <p>
          مَـتـتـبّـع الـصَّـلَـوَات • DAILY PRAYER QUEST © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
