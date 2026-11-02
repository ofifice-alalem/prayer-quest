import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Lock
} from 'lucide-react';
import { generateMonthGrid, ARABIC_MONTHS, ARABIC_DAYS } from '../utils/dateUtils';
import { getMonthRecords } from '../services/db';
import { calculateDayScore } from '../services/scoring';
import DayDrawer from '../components/DayDrawer';

export default function CalendarPage({ refreshTrigger }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [monthRecords, setMonthRecords] = useState({});
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  useEffect(() => {
    loadMonth();
  }, [currentYear, currentMonth, refreshTrigger]);

  const loadMonth = async () => {
    try {
      setLoading(true);
      const records = await getMonthRecords(monthStr);
      setMonthRecords(records);
    } catch (err) {
      console.error('Failed to load month records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (day) => {
    if (day.empty || day.isFuture) return;
    setSelectedDateKey(day.dateKey);
    setIsDrawerOpen(true);
  };

  const handleRecordUpdated = (updatedRecord) => {
    setMonthRecords((prev) => ({
      ...prev,
      [updatedRecord.date]: updatedRecord,
    }));
  };

  const calendarDays = generateMonthGrid(currentYear, currentMonth);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Calendar Header Card */}
      <div className="gaming-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-[#1E2842] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-right flex-1 min-w-0">
            <h2 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white truncate">
              تقويم شهر {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              اضغط على أي يوم لعرض وتعديل صلواته عبر القائمة الجانبية
            </p>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 bg-slate-100 dark:bg-[#0E1424] p-1 sm:p-1.5 rounded-xl border border-slate-200 dark:border-[#1E2842] w-full sm:w-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-[#141B30] hover:bg-slate-200 dark:hover:bg-[#1E2842] text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
            title="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <span className="px-2 sm:px-4 text-xs font-black text-slate-900 dark:text-white min-w-24 sm:min-w-32 text-center font-mono">
            {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-[#141B30] hover:bg-slate-200 dark:hover:bg-[#1E2842] text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
            title="الشهر القادم"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
        {ARABIC_DAYS.map((dayName, idx) => (
          <div 
            key={idx}
            className="py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-[#121829] border border-slate-200 dark:border-[#1E2842] text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-300 truncate"
          >
            <span className="sm:hidden">{dayName.slice(0, 3)}</span>
            <span className="hidden sm:inline">{dayName}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day, idx) => {
          if (day.empty) {
            return (
              <div 
                key={day.id || idx}
                className="min-h-[64px] sm:min-h-24 md:min-h-28 rounded-xl sm:rounded-2xl bg-slate-100/40 dark:bg-[#0E1424]/40 border border-slate-200/40 dark:border-[#1E2842]/20 opacity-30"
              />
            );
          }

          const record = monthRecords[day.dateKey];
          const score = record ? calculateDayScore(record) : null;
          const hasData = Boolean(record && score && score.totalFardCompleted > 0);

          if (day.isFuture) {
            // Future Day (Locked & Disabled)
            return (
              <div
                key={day.dateKey}
                className="min-h-[64px] sm:min-h-24 md:min-h-28 rounded-xl sm:rounded-2xl bg-slate-100/60 dark:bg-[#0A0E1A]/60 border border-slate-200 dark:border-[#1E2842]/30 p-1 sm:p-2.5 flex flex-col justify-between opacity-50 cursor-not-allowed select-none"
                title="يوم مستقبلي - مقفل"
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-600">
                  <span>{day.dayNumber}</span>
                  <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-600" />
                </div>
                <div className="text-[9px] sm:text-[10px] text-center text-slate-400 dark:text-slate-600 font-semibold">
                  قادم
                </div>
              </div>
            );
          }

          // Active / Past Day (Clickable)
          return (
            <button
              key={day.dateKey}
              onClick={() => handleDayClick(day)}
              className={`min-h-[64px] sm:min-h-24 md:min-h-28 rounded-xl sm:rounded-2xl p-1 sm:p-2.5 text-right flex flex-col justify-between transition-all duration-200 border group relative overflow-hidden active:scale-95 ${
                day.isToday 
                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-md' 
                  : 'gaming-card hover:border-amber-500/80'
              }`}
            >
              {/* Day Number and Badges */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs sm:text-base font-black font-mono ${
                  day.isToday 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {day.dayNumber}
                </span>

                <div className="flex items-center gap-1">
                  {/* Certificate Badge: Gold or Silver */}
                  {hasData && score.certificate && (
                    <span 
                      className={`px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-black border flex items-center gap-0.5 ${
                        score.certificate.type === 'gold'
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                          : 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40'
                      }`}
                      title={`${score.certificate.title}: ${score.certificate.subtitle}`}
                    >
                      <span>{score.certificate.type === 'gold' ? '🏆' : '🥈'}</span>
                      <span className="hidden md:inline">{score.certificate.type === 'gold' ? 'ذهبية' : 'فضية'}</span>
                    </span>
                  )}

                  {day.isToday && (
                    <span className="px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded text-[8px] sm:text-[9px] font-black bg-amber-500 text-black leading-tight">
                      اليوم
                    </span>
                  )}
                </div>
              </div>

              {/* Day Prayer Performance Badges */}
              <div className="w-full space-y-0.5 sm:space-y-1">
                {hasData ? (
                  <>
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black font-mono">
                      <span className="text-amber-600 dark:text-amber-400">{score.totalFardScore}</span>
                      <span className="hidden sm:inline text-[10px] text-slate-400">/500</span>
                    </div>

                    <div className="w-full h-1 sm:h-1.5 rounded-full bg-slate-200 dark:bg-[#0A0E1A] overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          score.fardPercentage >= 80 
                            ? 'bg-emerald-500' 
                            : score.fardPercentage >= 50 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${score.fardPercentage}%` }}
                      />
                    </div>

                    {score.totalFardMissedRakats > 0 && (
                      <div className="text-[8px] sm:text-[9px] font-bold text-rose-500 truncate">
                        <span className="hidden sm:inline">ضاعت </span>{score.totalFardMissedRakats}<span className="hidden sm:inline"> ركعة</span><span className="sm:hidden"> ف</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="hidden sm:block text-[10px] text-slate-400 dark:text-slate-500 font-semibold group-hover:text-amber-500 transition-colors">
                      سجّل الصلوات
                    </div>
                    <div className="sm:hidden text-center text-[10px] text-slate-400 font-mono">
                      +
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Side Drawer Component (Rendered via Portal to document.body on the RIGHT) */}
      <DayDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        dateKey={selectedDateKey}
        onRecordUpdated={handleRecordUpdated}
      />

    </div>
  );
}
