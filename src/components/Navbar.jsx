import React from 'react';
import { Moon, Sun, Flame, Trophy } from 'lucide-react';

export default function Navbar({
  isDark,
  setIsDark,
  totalPoints = 0,
  streakDays = 0,
  level = 1,
}) {
  return (
    <header className="sticky top-0 z-30 w-full steam-glass border-b border-slate-200 dark:border-game-border/60 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand / Logo (Steam HUD Islamic Style) */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-game-orange via-amber-500 to-amber-600 dark:to-game-surface border-2 border-game-orange/60 flex items-center justify-center shadow-glow-orange transition-transform duration-300 group-hover:scale-105">
              <span className="text-2xl select-none">🕌</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-game-bg"></div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                مَـتـتـبّـع <span className="text-game-orange">الـصَّـلَـوَات</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-game-orange/15 text-game-orange border border-game-orange/30">
                Quest HUD
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold hidden sm:block">
              حَصّن صلواتك في المسجد وأدرك تكبيرة الإحرام
            </p>
          </div>
        </div>

        {/* Gamer Status Badges & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Level Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-game-card/80 border border-slate-200 dark:border-game-border shadow-sm hover:border-game-orange/60 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-game-orange flex items-center justify-center font-black text-xs text-white shadow-sm">
              {level}
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">المستوى</div>
              <div className="text-xs font-black text-amber-600 dark:text-amber-400">فارس المساجد</div>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-game-card/80 border border-slate-200 dark:border-game-border text-game-orange font-bold text-sm shadow-sm">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span className="text-slate-900 dark:text-slate-100 font-black">{streakDays}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">يوم متتالي</span>
          </div>

          {/* Total Points Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-game-orange/15 to-amber-500/10 border border-game-orange/40 shadow-glow-orange">
            <Trophy className="w-4 h-4 text-game-orange fill-game-orange/30" />
            <div className="text-right">
              <span className="text-sm sm:text-base font-black text-game-orange tracking-wide">
                {totalPoints.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline font-bold">نقطة</span>
            </div>
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="تبديل المظهر"
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-game-card/80 dark:hover:bg-game-cardHover border border-slate-200 dark:border-game-border hover:border-game-orange/60 text-slate-700 dark:text-slate-300 hover:text-game-orange transition-all duration-200 active:scale-95 shadow-sm"
            title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>

        </div>

      </div>
    </header>
  );
}
