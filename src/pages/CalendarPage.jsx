import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Lock, 
  Trophy, 
  Sparkles, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { generateMonthGrid, ARABIC_MONTHS, ARABIC_DAYS, getTodayKey } from '../utils/dateUtils';
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
    <div className="space-y-6">
      
      {/* Calendar Header Card */}
      <div className="steam-glass rounded-2xl p-5 sm:p-6 border border-game-border shadow-steam-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-game-orange/20 border border-game-orange/40 flex items-center justify-center text-game-orange shadow-glow-orange">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              تقويم شهر {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-xs text-slate-400">
              اضغط على أي يوم لعرض تفاصيل الصلوات والنقاط، والتعديل عبر القائمة الجانبية
            </p>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2 bg-game-surface/90 p-1.5 rounded-xl border border-game-border">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-game-card hover:bg-game-cardHover border border-game-border text-slate-200 hover:text-game-orange transition-colors"
            title="الشهر السابق"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="px-4 text-sm font-black text-slate-200 min-w-32 text-center">
            {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-game-card hover:bg-game-cardHover border border-game-border text-slate-200 hover:text-game-orange transition-colors"
            title="الشهر القادم"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {ARABIC_DAYS.map((dayName, idx) => (
          <div 
            key={idx}
            className="py-2 rounded-xl bg-game-surface/80 border border-game-border text-xs font-black text-slate-300"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, idx) => {
          if (day.empty) {
            return (
              <div 
                key={day.id || idx}
                className="min-h-24 sm:min-h-28 rounded-2xl bg-game-card/20 border border-game-border/30 opacity-40"
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
                className="min-h-24 sm:min-h-28 rounded-2xl bg-game-surface/30 border border-game-border/40 p-2.5 sm:p-3 flex flex-col justify-between opacity-45 cursor-not-allowed select-none"
                title="يوم مستقبلي - مقفل"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{day.dayNumber}</span>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="text-[10px] text-center text-slate-600 font-semibold">
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
              className={`min-h-24 sm:min-h-28 rounded-2xl p-2.5 sm:p-3 text-right flex flex-col justify-between transition-all duration-200 border group relative overflow-hidden active:scale-95 ${
                day.isToday 
                  ? 'bg-gradient-to-br from-game-card to-game-surface border-game-orange ring-2 ring-game-orange/30 shadow-glow-orange' 
                  : 'steam-glass border-game-border hover:border-game-orange/70 hover:shadow-steam-card'
              }`}
            >
              {/* Day Number and Today Tag */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-sm sm:text-base font-black ${
                  day.isToday ? 'text-game-orange' : 'text-white'
                }`}>
                  {day.dayNumber}
                </span>

                {day.isToday && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-game-orange text-white">
                    اليوم
                  </span>
                )}
              </div>

              {/* Day Prayer Performance Badges */}
              <div className="w-full space-y-1">
                {hasData ? (
                  <>
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <span className="text-game-orange">{score.totalFardScore}</span>
                      <span className="text-[10px] text-slate-400">/500</span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-game-bg overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          score.fardPercentage >= 80 
                            ? 'bg-game-green' 
                            : score.fardPercentage >= 50 
                            ? 'bg-game-orange' 
                            : 'bg-game-red'
                        }`}
                        style={{ width: `${score.fardPercentage}%` }}
                      />
                    </div>

                    {score.totalFardMissedRakats > 0 && (
                      <div className="text-[9px] font-bold text-game-red truncate">
                        ضاعت {score.totalFardMissedRakats} ركعة
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-[10px] text-slate-500 font-semibold group-hover:text-game-orange transition-colors">
                    لم يُسجل بعد
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Side Drawer Component for Inspection & Editing */}
      <DayDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        dateKey={selectedDateKey}
        onRecordUpdated={handleRecordUpdated}
      />

    </div>
  );
}

