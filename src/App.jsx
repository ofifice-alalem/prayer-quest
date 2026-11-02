import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar, { NAVIGATION_TABS } from './components/Sidebar';
import IslamicPattern from './components/IslamicPattern';
import TodayPage from './pages/TodayPage';
import CalendarPage from './pages/CalendarPage';
import MissedRakatsPage from './pages/MissedRakatsPage';
import MosqueTrackerPage from './pages/MosqueTrackerPage';
import ExportPage from './pages/ExportPage';
import { getAllRecords, importDatabaseBackup, exportDatabaseBackup } from './services/db';
import { calculateDayScore } from './services/scoring';
import { getTodayKey } from './utils/dateUtils';
import { User, Download, Upload, Award } from 'lucide-react';

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

      // Streak calculation: Consecutive days with 100% Gold Tier
      // (All 5 prayers in mosque + Takbirat Al-Ihram + 0 missed rakats = 500 pts)
      const dateSet = new Set(
        records
          .filter((r) => {
            const sc = calculateDayScore(r);
            return sc.isGoldTier;
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

  const handleExportBackup = async () => {
    try {
      await exportDatabaseBackup();
    } catch (err) {
      alert('حدث خطأ أثناء تنزيل النسخة الاحتياطية: ' + err.message);
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
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-8 relative z-10">
        
        {/* Mobile Player & Backup Bar (visible on < lg screens) */}
        <div className="lg:hidden mb-4 gaming-card rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm border border-slate-200 dark:border-[#1E2842]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-[10px] bg-slate-100 dark:bg-[#0E1424] flex items-center justify-center text-amber-500 font-black">
                <User className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>فارس المساجد</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono">
                  مستوى {level}
                </span>
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>تصنيف الفئة الذهبية</span>
              </div>
            </div>
          </div>

          {/* Quick Backup Action Icons for Mobile */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportBackup}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161F36] dark:hover:bg-[#1E2B4B] border border-slate-200 dark:border-[#243358] text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
              title="تصدير نسخة احتياطية"
            >
              <Download className="w-4 h-4 text-amber-500" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161F36] dark:hover:bg-[#1E2B4B] border border-slate-200 dark:border-[#243358] text-slate-700 dark:text-slate-200 hover:text-cyan-500 transition-colors shadow-sm"
              title="استيراد نسخة احتياطية"
            >
              <Upload className="w-4 h-4 text-cyan-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-6">
          
          {/* Gaming Client Sidebar (Desktop Only) */}
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
      <footer className="w-full border-t border-slate-200 dark:border-[#1E2842] py-5 text-center text-xs text-slate-500 relative z-10 mb-16 lg:mb-0">
        <p>
          مَـتـتـبّـع الـصَّـلَـوَات • DAILY PRAYER QUEST © {new Date().getFullYear()}
        </p>
      </footer>

      {/* Fixed Mobile Gaming Bottom Navigation Bar */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0D121F]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#1E2842] py-1.5 px-2 flex items-center justify-around shadow-2xl safe-area-bottom"
        aria-label="التنقل السريع للجوال"
      >
        {NAVIGATION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-amber-500 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${
                isActive ? 'bg-amber-500/15 text-amber-500 scale-110' : ''
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 font-bold tracking-tight">
                {tab.shortTitle || tab.title}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </nav>

    </div>
  );
}
