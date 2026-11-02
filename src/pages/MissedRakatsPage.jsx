import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  ArrowUpRight,
  TrendingDown,
  Sunrise, 
  Sun, 
  SunMedium, 
  Sunset, 
  Moon
} from 'lucide-react';
import { getMonthRecords } from '../services/db';
import { PRAYERS_CONFIG } from '../services/scoring';
import { ARABIC_MONTHS, formatArabicDate, getTodayKey } from '../utils/dateUtils';
import DayDrawer from '../components/DayDrawer';

const PRAYER_ICONS = {
  fajr: Sunrise,
  dhuhr: Sun,
  asr: SunMedium,
  maghrib: Sunset,
  isha: Moon,
};

export default function MissedRakatsPage({ refreshTrigger }) {
  const today = new Date();
  const todayKey = getTodayKey();
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
      console.error('Failed to load records for missed rakats:', err);
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

  // Compute month analytics
  const prayerMissedTotals = {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  };

  let totalPrayersRecorded = 0;
  let totalMissedRakatsMonth = 0;

  // Filtered array of days that have at least one missed rakat
  const daysWithMissedRakats = [];

  const recordKeys = Object.keys(monthRecords).sort();

  recordKeys.forEach((dateKey) => {
    // CRITICAL USER RULE: Exclude the current day (and future days) from missed calculations!
    // Today's prayers are still ongoing and have not all entered their time.
    if (dateKey >= todayKey) return;

    const rec = monthRecords[dateKey];
    if (!rec || !rec.prayers) return;

    let dayHasMissed = false;
    const dayBreakdown = [];
    let dayTotalMissed = 0;

    Object.keys(PRAYERS_CONFIG).forEach((prayerId) => {
      const p = rec.prayers[prayerId];
      if (p && p.prayed) {
        totalPrayersRecorded += 1;
        if (p.inMosque && (p.missedRakats || 0) > 0 && !p.caughtTakbirah) {
          dayHasMissed = true;
          const count = p.missedRakats;
          prayerMissedTotals[prayerId] += count;
          totalMissedRakatsMonth += count;
          dayTotalMissed += count;
          dayBreakdown.push({
            prayerId,
            name: PRAYERS_CONFIG[prayerId].name,
            missedCount: count,
          });
        }
      }
    });

    if (dayHasMissed) {
      daysWithMissedRakats.push({
        dateKey,
        formattedDate: formatArabicDate(dateKey),
        totalDayMissed: dayTotalMissed,
        breakdown: dayBreakdown,
      });
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="gaming-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-[#1E2842] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              تقرير الركعات الفائتة لشهر {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              إحصائيات الأيام السابقة فقط (اليوم الحالي مستثنى لأن وقته لم ينتهِ بعد)
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#0E1424] p-1.5 rounded-xl border border-slate-200 dark:border-[#1E2842]">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-white dark:bg-[#141B30] hover:bg-slate-200 dark:hover:bg-[#1E2842] text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="px-4 text-xs font-black text-slate-900 dark:text-white min-w-32 text-center font-mono">
            {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-white dark:bg-[#141B30] hover:bg-slate-200 dark:hover:bg-[#1E2842] text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Total Missed Rak'ahs */}
        <div className="gaming-card rounded-2xl p-5 border border-slate-200 dark:border-[#1E2842] flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الركعات الفائتة بالمسجد</span>
            <div className={`text-2xl sm:text-3xl font-black mt-1 font-mono ${
              totalMissedRakatsMonth > 0 ? 'text-rose-500' : 'text-emerald-500'
            }`}>
              {totalMissedRakatsMonth} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">ركعة</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#0E1424] border border-slate-200 dark:border-[#1E2842] flex items-center justify-center text-rose-500">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Total Prayers Recorded */}
        <div className="gaming-card rounded-2xl p-5 border border-slate-200 dark:border-[#1E2842] flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الصلوات المسجلة في الشهر</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {totalPrayersRecorded} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">صلاة</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#0E1424] border border-slate-200 dark:border-[#1E2842] flex items-center justify-center text-amber-500">
            <CalendarIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Days with missed rak'ahs count */}
        <div className="gaming-card rounded-2xl p-5 border border-slate-200 dark:border-[#1E2842] flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">عدد الأيام ذات الركعات الفائتة</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {daysWithMissedRakats.length} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">يوم</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#0E1424] border border-slate-200 dark:border-[#1E2842] flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Missed Rak'ahs per Prayer Breakdown (5 Fard Prayers) */}
      <div className="gaming-card rounded-2xl p-5 border border-slate-200 dark:border-[#1E2842]">
        <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 text-right">
          توزيع الركعات الفائتة حسب كل صلاة:
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.keys(PRAYERS_CONFIG).map((prayerId) => {
            const cfg = PRAYERS_CONFIG[prayerId];
            const Icon = PRAYER_ICONS[prayerId] || Sun;
            const missedCount = prayerMissedTotals[prayerId] || 0;

            return (
              <div 
                key={prayerId}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1424] border border-slate-200 dark:border-[#1E2842] text-center hover:border-amber-500/40 transition-colors"
              >
                <div className="w-8 h-8 mx-auto rounded-lg bg-white dark:bg-[#141B30] flex items-center justify-center text-amber-500 mb-2 shadow-sm border border-slate-200 dark:border-transparent">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{cfg.name}</div>
                <div className={`text-base font-black mt-1 font-mono ${
                  missedCount > 0 ? 'text-rose-500' : 'text-emerald-500'
                }`}>
                  {missedCount} <span className="text-[10px] text-slate-400 font-normal">ركعة</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTERED TABLE: Days with Missed Rak'ahs ONLY */}
      <div className="gaming-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-[#1E2842]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-right">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              جدول الأيام التي ضاعت فيها ركعات (حصراً)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يُعرض في هذا الجدول فقط الأيام التي فاتت فيها ركعات في المسجد
            </p>
          </div>

          <span className="text-xs font-black px-3 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/30 font-mono">
            {daysWithMissedRakats.length} أيام متأثرة
          </span>
        </div>

        {daysWithMissedRakats.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">ما شاء الله، إنجاز عظيم!</h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              لم تسجل أي ركعة فائتة في الصلوات المسجلة لهذا الشهر. حافظ على هذا التتابع المبارك!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1E2842] text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <th className="pb-3 px-3">التاريخ واليوم</th>
                  <th className="pb-3 px-3">تفصيل الصلوات والركعات الفائتة</th>
                  <th className="pb-3 px-3 text-center">إجمالي ركعات اليوم الفائتة</th>
                  <th className="pb-3 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1E2842]/60">
                {daysWithMissedRakats.map((dayItem) => (
                  <tr 
                    key={dayItem.dateKey}
                    className="hover:bg-slate-50 dark:hover:bg-[#141B30] transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {dayItem.formattedDate}
                    </td>

                    {/* Breakdown */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-2">
                        {dayItem.breakdown.map((b, i) => (
                          <span 
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold"
                          >
                            <span>صلاة {b.name}:</span>
                            <span className="font-black">ضاعت {b.missedCount} {b.missedCount === 1 ? 'ركعة' : b.missedCount === 2 ? 'ركعتان' : 'ركعات'}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Total Day Missed */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#0E1424] border border-slate-200 dark:border-[#1E2842] text-rose-500 font-black text-xs font-mono">
                        {dayItem.totalDayMissed} ركعة
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedDateKey(dayItem.dateKey);
                          setIsDrawerOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#0E1424] dark:hover:bg-[#1A2542] border border-slate-200 dark:border-[#1E2842] hover:border-amber-500 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
                      >
                        <span>عرض وتعديل</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side Drawer Integration */}
      <DayDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        dateKey={selectedDateKey}
        onRecordUpdated={() => loadData()}
      />

    </div>
  );
}
