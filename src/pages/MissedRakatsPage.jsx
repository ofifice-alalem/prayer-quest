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
import { PRAYERS_CONFIG, calculatePrayerScore } from '../services/scoring';
import { ARABIC_MONTHS, formatArabicDate } from '../utils/dateUtils';
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
    const rec = monthRecords[dateKey];
    if (!rec || !rec.prayers) return;

    let dayHasMissed = false;
    const dayBreakdown = [];

    Object.keys(PRAYERS_CONFIG).forEach((prayerId) => {
      const pData = rec.prayers[prayerId];
      if (pData && pData.prayed) {
        totalPrayersRecorded += 1;
        const res = calculatePrayerScore(prayerId, pData);
        if (res.missedRakats > 0) {
          prayerMissedTotals[prayerId] += res.missedRakats;
          totalMissedRakatsMonth += res.missedRakats;
          dayHasMissed = true;
          dayBreakdown.push({
            prayerId,
            name: PRAYERS_CONFIG[prayerId].name,
            missedCount: res.missedRakats,
          });
        }
      }
    });

    if (dayHasMissed) {
      daysWithMissedRakats.push({
        dateKey,
        formattedDate: formatArabicDate(dateKey),
        breakdown: dayBreakdown,
        totalDayMissed: dayBreakdown.reduce((sum, b) => sum + b.missedCount, 0),
      });
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="steam-glass rounded-2xl p-5 sm:p-6 border border-game-border shadow-steam-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-game-red/20 border border-game-red/40 flex items-center justify-center text-game-red shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              تقرير الركعات الفائتة لشهر {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-xs text-slate-400">
              إحصائيات الركعات الضائعة وجدول حصري للأيام المتأثرة فقط
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-game-surface/90 p-1.5 rounded-xl border border-game-border">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-game-card hover:bg-game-cardHover border border-game-border text-slate-200 hover:text-game-orange transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="px-4 text-sm font-black text-slate-200 min-w-32 text-center">
            {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-game-card hover:bg-game-cardHover border border-game-border text-slate-200 hover:text-game-orange transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Total Missed Rak'ahs */}
        <div className="steam-glass rounded-2xl p-5 border border-game-border flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400">إجمالي الركعات الفائتة هذا الشهر</span>
            <div className={`text-2xl sm:text-3xl font-black mt-1 ${
              totalMissedRakatsMonth > 0 ? 'text-game-red' : 'text-game-green'
            }`}>
              {totalMissedRakatsMonth} <span className="text-xs text-slate-400 font-normal">ركعة</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-game-surface border border-game-border flex items-center justify-center text-game-red">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Total Prayers Recorded */}
        <div className="steam-glass rounded-2xl p-5 border border-game-border flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400">الصلوات المسجلة في الشهر</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {totalPrayersRecorded} <span className="text-xs text-slate-400 font-normal">صلاة</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-game-surface border border-game-border flex items-center justify-center text-game-orange">
            <CalendarIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Days with missed rak'ahs count */}
        <div className="steam-glass rounded-2xl p-5 border border-game-border flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400">عدد الأيام ذات الركعات الفائتة</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {daysWithMissedRakats.length} <span className="text-xs text-slate-400 font-normal">يوم</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-game-surface border border-game-border flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Missed Rak'ahs per Prayer Breakdown (5 Fard Prayers) */}
      <div className="steam-glass rounded-2xl p-5 border border-game-border">
        <h3 className="text-sm font-black text-slate-200 mb-3 text-right">
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
                className="p-3.5 rounded-xl bg-game-surface border border-game-border text-center hover:border-game-orange/40 transition-colors"
              >
                <div className="w-8 h-8 mx-auto rounded-lg bg-game-card flex items-center justify-center text-game-orange mb-2">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-300">{cfg.name}</div>
                <div className={`text-base font-black mt-1 ${
                  missedCount > 0 ? 'text-game-red' : 'text-game-green'
                }`}>
                  {missedCount} <span className="text-[10px] text-slate-400">ركعة</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTERED TABLE: Days with Missed Rak'ahs ONLY */}
      <div className="steam-glass rounded-2xl p-5 sm:p-6 border border-game-border shadow-steam-card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-right">
            <h3 className="text-base sm:text-lg font-black text-white">
              جدول الأيام التي ضاعت فيها ركعات (حصراً)
            </h3>
            <p className="text-xs text-slate-400">
              يُعرض في هذا الجدول فقط الأيام التي فاتت فيها ركعات مع التفصيل الكامل
            </p>
          </div>

          <span className="text-xs font-black px-3 py-1 rounded-lg bg-game-red/10 text-game-red border border-game-red/30">
            {daysWithMissedRakats.length} أيام متأثرة
          </span>
        </div>

        {daysWithMissedRakats.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-glow-green">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-white">ما شاء الله، إنجاز عظيم!</h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              لم تسجل أي ركعة فائتة في الصلوات المسجلة لهذا الشهر. حافظ على هذا التتابع المبارك!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-game-border text-xs text-slate-400 font-bold">
                  <th className="pb-3 px-3">التاريخ واليوم</th>
                  <th className="pb-3 px-3">تفصيل الصلوات والركعات الفائتة</th>
                  <th className="pb-3 px-3 text-center">إجمالي ركعات اليوم الفائتة</th>
                  <th className="pb-3 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-game-border/60">
                {daysWithMissedRakats.map((dayItem) => (
                  <tr 
                    key={dayItem.dateKey}
                    className="hover:bg-game-card/50 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-3 font-bold text-white whitespace-nowrap">
                      {dayItem.formattedDate}
                    </td>

                    {/* Breakdown */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-2">
                        {dayItem.breakdown.map((b, i) => (
                          <span 
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-game-red/10 border border-game-red/30 text-game-red text-xs font-bold"
                          >
                            <span>صلاة {b.name}:</span>
                            <span className="font-black">ضاعت {b.missedCount} {b.missedCount === 1 ? 'ركعة' : b.missedCount === 2 ? 'ركعتان' : 'ركعات'}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Total Day Missed */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-game-card border border-game-border text-game-red font-black text-xs">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-game-surface hover:bg-game-card border border-game-border hover:border-game-orange text-xs font-bold text-slate-200 transition-colors"
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

