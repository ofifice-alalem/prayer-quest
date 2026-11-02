import React from 'react';
import { Moon, Sun, Flame, Trophy } from 'lucide-react';

export default function Navbar({
  isDark,
  setIsDark,
  totalPoints = 0,
  streakDays = 0,
  level = 1,
  activeTab,
  setActiveTab,
}) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#0D121F]/90 backdrop-blur-xl border-b border-slate-200 dark:border-[#1E2842] transition-colors duration-300">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 h-16 sm:h-18 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Right: Brand with Gray Taqniya Logo */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          <div className="relative group flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-[#131A2D] border border-slate-200 dark:border-[#222E4D] flex items-center justify-center p-1 sm:p-1.5 shadow-sm">
              <img
                src="./assets/taqniya_logo.png"
                alt="تقنية"
                className="w-full h-full object-contain filter grayscale opacity-70 group-hover:opacity-100 transition-opacity"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-xs sm:text-sm font-black text-amber-500">ت</span>';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  مَـتـتـبّـع <span className="text-amber-500">الـصَّـلَـوَات</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono">
                  ELITE QUEST
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                حَصّن صلواتك في المسجد وأدرك تكبيرة الإحرام
              </p>
            </div>
          </div>
        </div>

        {/* Center: Desktop Gaming Sub-Nav Links */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-[#121829] p-1 rounded-xl border border-slate-200 dark:border-[#1E2842]">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'today'
                ? 'bg-amber-500 text-black font-black shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#182138]'
            }`}
          >
            نظرة عامة
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-amber-500 text-black font-black shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#182138]'
            }`}
          >
            التقويم
          </button>
          <button
            onClick={() => setActiveTab('missed')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'missed'
                ? 'bg-amber-500 text-black font-black shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#182138]'
            }`}
          >
            الركعات الفائتة
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'export'
                ? 'bg-amber-500 text-black font-black shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#182138]'
            }`}
          >
            السجل والتصدير
          </button>
        </div>

        {/* Left: Gamer HUD Status & Points Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Points Pill */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-md">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
            <span className="font-mono text-xs sm:text-sm tracking-wide">{totalPoints.toLocaleString()}</span>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase hidden xs:inline">نقطة</span>
          </div>

          {/* Daily Streak */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-[#121829] border border-slate-200 dark:border-[#1E2842] text-amber-600 dark:text-amber-500 font-bold text-xs">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="text-slate-900 dark:text-white font-mono text-xs sm:text-sm">{streakDays}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">أيام</span>
          </div>

          {/* Level Badge (Hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-[#121829] border border-slate-200 dark:border-[#1E2842]">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-black text-[10px] sm:text-[11px] text-white">
              {level}
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">مستوى {level}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="تبديل المظهر"
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#121829] dark:hover:bg-[#1A223B] border border-slate-200 dark:border-[#1E2842] text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-all active:scale-95 shadow-sm"
            title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
            )}
          </button>

        </div>

      </div>
    </header>
  );
}
