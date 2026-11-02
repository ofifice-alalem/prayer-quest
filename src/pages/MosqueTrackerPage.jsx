import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  ArrowUpRight, 
  Home
} from 'lucide-react';
import { getMonthRecords } from '../services/db';
import { PRAYERS_CONFIG, SUNNAH_CONFIG } from '../services/scoring';
import { ARABIC_MONTHS, formatArabicDate } from '../utils/dateUtils';
import DayDrawer from '../components/DayDrawer';

export default function MosqueTrackerPage({ refreshTrigger }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [monthRecords, setMonthRecords] = useState({});
  const [loading, setLoading] = useState(true);

  // Drawer
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  useEffect(() => {
    loadData();
  }, [currentYear, currentMonth, refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      const records = await getMonthRecords(monthStr);
      setMonthRecords(records);
    } catch (err) {
      console.error('Failed to load records for mosque tracker:', err);
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

  // Compute stats
  let totalPrayersRecorded = 0;
  let totalPrayedInMosque = 0;
  let totalNotPrayedInMosque = 0;

  let totalSunnahPossible = 0;
  let totalSunnahCompleted = 0;
  let totalSunnahMissed = 0;

  const daysWithNonMosquePrayers = [];
  const daysWithMissedSunnah = [];

  const recordKeys = Object.keys(monthRecords).sort();

  recordKeys.forEach((dateKey) => {
    const rec = monthRecords[dateKey];
    if (!rec) return;

    let dayHasNonMosque = false;
    const nonMosquePrayers = [];

    // Fard check
    if (rec.prayers) {
      Object.keys(PRAYERS_CONFIG).forEach((prayerId) => {
        const p = rec.prayers[prayerId];
        if (p && p.prayed) {
          totalPrayersRecorded += 1;
          if (p.inMosque) {
            totalPrayedInMosque += 1;
          } else {
            totalNotPrayedInMosque += 1;
            dayHasNonMosque = true;
            nonMosquePrayers.push(PRAYERS_CONFIG[prayerId].name);
          }
        } else if (p && !p.prayed) {
          // completely missed
          totalNotPrayedInMosque += 1;
          dayHasNonMosque = true;
          nonMosquePrayers.push(`${PRAYERS_CONFIG[prayerId].name} (فائتة)`);
        }
      });
    }

    if (dayHasNonMosque) {
      daysWithNonMosquePrayers.push({
        dateKey,
        formattedDate: formatArabicDate(dateKey),
        prayersList: nonMosquePrayers,
      });
    }

    // Sunnah check
    const missedSunnahList = [];
    SUNNAH_CONFIG.forEach((s) => {
      totalSunnahPossible += 1;
      if (rec.sunnah && rec.sunnah[s.id]) {
        totalSunnahCompleted += 1;
      } else {
        totalSunnahMissed += 1;
        missedSunnahList.push(s.name);
      }
    });

    if (missedSunnahList.length > 0) {
      daysWithMissedSunnah.push({
        dateKey,
        formattedDate: formatArabicDate(dateKey),
        missedSunnahList,
        count: missedSunnahList.length,
      });
    }
  });

  const mosqueRate = totalPrayersRecorded > 0 ? Math.round((totalPrayedInMosque / totalPrayersRecorded) * 100) : 100;
  const sunnahRate = totalSunnahPossible > 0 ? Math.round((totalSunnahCompleted / totalSunnahPossible) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="steam-glass rounded-2xl p-5 sm:p-6 shadow-steam-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              تقرير صلوات المسجد والنوافل لشهر {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              متابعة الصلوات التي صُلّيت خارج المسجد وصلوات النوافل المتروكة
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-game-surface/90 p-1.5 rounded-xl border border-slate-200 dark:border-game-border">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-white dark:bg-game-card hover:bg-slate-50 dark:hover:bg-game-cardHover border border-slate-200 dark:border-game-border text-slate-700 dark:text-slate-200 hover:text-game-orange transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="px-4 text-sm font-black text-slate-800 dark:text-slate-200 min-w-32 text-center">
            {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-white dark:bg-game-card hover:bg-slate-50 dark:hover:bg-game-cardHover border border-slate-200 dark:border-game-border text-slate-700 dark:text-slate-200 hover:text-game-orange transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Not in Mosque count */}
        <div className="steam-glass rounded-2xl p-5 border border-slate-200 dark:border-game-border">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">صلوات لم تُصلَّ في المسجد</span>
          <div className={`text-2xl sm:text-3xl font-black mt-1 ${
            totalNotPrayedInMosque > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-game-green'
          }`}>
            {totalNotPrayedInMosque} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">صلاة</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            نسبة صلاة المسجد: {mosqueRate}%
          </div>
        </div>

        {/* In Mosque count */}
        <div className="steam-glass rounded-2xl p-5 border border-slate-200 dark:border-game-border">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">صلوات أُدركت في المسجد</span>
          <div className="text-2xl sm:text-3xl font-black text-game-green mt-1">
            {totalPrayedInMosque} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">صلاة</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            من إجمالي {totalPrayersRecorded} صلاة مسجلة
          </div>
        </div>

        {/* Missed Sunnah count */}
        <div className="steam-glass rounded-2xl p-5 border border-slate-200 dark:border-game-border">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">صلوات نوافل لم تُصلَّ</span>
          <div className="text-2xl sm:text-3xl font-black text-game-orange mt-1">
            {totalSunnahMissed} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">نافلة</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            أُنجزت {totalSunnahCompleted} نافلة
          </div>
        </div>

        {/* Sunnah Performance Rate */}
        <div className="steam-glass rounded-2xl p-5 border border-slate-200 dark:border-game-border">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">معدل إحياء النوافل</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 mt-1">
            {sunnahRate}%
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
            6 نوافل وسنن معتمدة يومياً
          </div>
        </div>

      </div>

      {/* Two Columns: Non-Mosque Days & Missed Sunnah Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table 1: Days with Prayers outside Mosque */}
        <div className="steam-glass rounded-2xl p-5 sm:p-6 shadow-steam-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-amber-500" />
              <span>الأيام التي صُلّيت فيها فرائض خارج المسجد</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300">
              {daysWithNonMosquePrayers.length} أيام
            </span>
          </div>

          {daysWithNonMosquePrayers.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold">
              جميع الصلوات المسجلة لهذا الشهر صُلّيت في المسجد بحمد الله!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {daysWithNonMosquePrayers.map((d) => (
                <div 
                  key={d.dateKey}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-game-surface border border-slate-200 dark:border-game-border hover:border-game-orange/40 transition-colors flex items-center justify-between"
                >
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{d.formattedDate}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {d.prayersList.map((p, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDateKey(d.dateKey);
                      setIsDrawerOpen(true);
                    }}
                    className="p-2 rounded-lg bg-white dark:bg-game-card hover:bg-slate-100 dark:hover:bg-game-cardHover border border-slate-200 dark:border-game-border text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <span>عرض</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table 2: Days with Missed Sunnah */}
        <div className="steam-glass rounded-2xl p-5 sm:p-6 shadow-steam-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-game-orange" />
              <span>الأيام ذات النوافل المتروكة</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-game-orange/15 text-game-orange">
              {daysWithMissedSunnah.length} أيام
            </span>
          </div>

          {daysWithMissedSunnah.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold">
              ما شاء الله! قمت بأداء جميع النوافل والسنن في الأيام المسجلة!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {daysWithMissedSunnah.map((d) => (
                <div 
                  key={d.dateKey}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-game-surface border border-slate-200 dark:border-game-border hover:border-game-orange/40 transition-colors flex items-center justify-between"
                >
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{d.formattedDate}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      تُرِكت {d.count} نوافل: {d.missedSunnahList.slice(0, 3).join('، ')}
                      {d.missedSunnahList.length > 3 ? '...' : ''}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDateKey(d.dateKey);
                      setIsDrawerOpen(true);
                    }}
                    className="p-2 rounded-lg bg-white dark:bg-game-card hover:bg-slate-100 dark:hover:bg-game-cardHover border border-slate-200 dark:border-game-border text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <span>عرض</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Drawer */}
      <DayDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        dateKey={selectedDateKey}
        onRecordUpdated={() => loadData()}
      />

    </div>
  );
}
