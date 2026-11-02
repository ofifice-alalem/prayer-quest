import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Sunrise, 
  Sun, 
  SunMedium, 
  Sunset, 
  Moon, 
  CheckCircle2, 
  Sparkles, 
  Save, 
  Check, 
  X,
  Home,
  Star
} from 'lucide-react';
import { PRAYERS_CONFIG, SUNNAH_CONFIG, calculatePrayerScore, calculateDayScore } from '../services/scoring';
import { getDayRecord, saveDayRecord } from '../services/db';
import { getTodayKey, formatArabicDate } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

const PRAYER_ICONS = {
  fajr: Sunrise,
  dhuhr: Sun,
  asr: SunMedium,
  maghrib: Sunset,
  isha: Moon,
};

export default function TodayPage({ onRecordUpdated }) {
  const todayKey = getTodayKey();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadToday();
  }, []);

  const loadToday = async () => {
    try {
      setLoading(true);
      const data = await getDayRecord(todayKey);
      setRecord(data);
    } catch (err) {
      console.error('Failed to load today record:', err);
    } finally {
      setLoading(false);
    }
  };

  const dayScore = record ? calculateDayScore(record) : null;

  // DIRECT ONE-CLICK ACTION HANDLERS
  
  // 1. One-click Takbirat Al-Ihram (100% Points)
  const handleToggleTakbirah = (prayerId) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
      const current = { ...(prayers[prayerId] || {}) };

      if (current.caughtTakbirah && current.inMosque && current.prayed) {
        // Deselect -> reset to unprayed
        current.prayed = false;
        current.inMosque = false;
        current.caughtTakbirah = false;
        current.missedRakats = 0;
      } else {
        // Select -> 100% full mosque prayer
        current.prayed = true;
        current.inMosque = true;
        current.caughtTakbirah = true;
        current.missedRakats = 0;
      }

      prayers[prayerId] = current;
      return { ...prev, prayers };
    });
  };

  // 2. One-click Mosque All Rak'ahs without Takbirah (80% Points)
  const handleSetMosqueAllRakats = (prayerId) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
      const current = { ...(prayers[prayerId] || {}) };

      if (current.prayed && current.inMosque && !current.caughtTakbirah && (current.missedRakats || 0) === 0) {
        // Deselect
        current.prayed = false;
        current.inMosque = false;
      } else {
        // 80% Full Rak'ahs in mosque
        current.prayed = true;
        current.inMosque = true;
        current.caughtTakbirah = false;
        current.missedRakats = 0;
      }

      prayers[prayerId] = current;
      return { ...prev, prayers };
    });
  };

  // 3. One-click Home Prayer (80% / Base)
  const handleSetHomePrayer = (prayerId) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
      const current = { ...(prayers[prayerId] || {}) };

      if (current.prayed && !current.inMosque) {
        // Deselect
        current.prayed = false;
      } else {
        current.prayed = true;
        current.inMosque = false;
        current.caughtTakbirah = false;
        current.missedRakats = 0;
      }

      prayers[prayerId] = current;
      return { ...prev, prayers };
    });
  };

  // 4. Direct Missed Rak'ahs Setter (e.g. lost 1 or 2 rak'ahs)
  const handleSetMissedRakats = (prayerId, missedCount) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
      const current = { ...(prayers[prayerId] || {}) };

      if (current.missedRakats === missedCount && current.prayed) {
        // Reset to 0 missed
        current.missedRakats = 0;
      } else {
        current.prayed = true;
        current.inMosque = true; // usually happened in mosque congregation
        current.caughtTakbirah = false; // missing rak'ah means takbirah was missed
        current.missedRakats = missedCount;
      }

      prayers[prayerId] = current;
      return { ...prev, prayers };
    });
  };

  // Sunnah Toggle
  const handleSunnahToggle = (sunnahId) => {
    setRecord((prev) => {
      const sunnah = { ...prev.sunnah };
      sunnah[sunnahId] = !sunnah[sunnahId];
      return { ...prev, sunnah };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveDayRecord(record);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (onRecordUpdated) onRecordUpdated(record);

      if (dayScore && dayScore.totalFardScore >= 400) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF7A00', '#10B981', '#38BDF8', '#F59E0B'],
        });
      }
    } catch (err) {
      alert('حدث خطأ أثناء حفظ صلوات اليوم: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !record) {
    return (
      <div className="py-24 text-center text-slate-500 dark:text-slate-400">
        جاري تحميل صلوات اليوم...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Hero / Daily Quest HUD Banner */}
      <div className="steam-glass rounded-2xl p-5 sm:p-7 shadow-steam-card relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-game-orange/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-game-orange">
              <span className="w-2.5 h-2.5 rounded-full bg-game-orange animate-pulse"></span>
              <span>المهمة اليومية النشطة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              صلوات {formatArabicDate(todayKey)}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              سجّل صلواتك بنقرة واحدة سريعة لحصد النقاط ورفع تصنيفك الإيماني
            </p>
          </div>

          {/* Quick Score Meter */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 bg-slate-100 dark:bg-game-surface/90 px-4 py-3 rounded-xl border border-slate-200 dark:border-game-border">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">نقاط الفرائض</div>
              <div className="text-xl sm:text-2xl font-black text-game-orange">
                {dayScore.totalFardScore} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ 500</span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-300 dark:bg-game-border"></div>

            <div className="text-right">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">نقاط النوافل</div>
              <div className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400">
                {dayScore.totalSunnahScore} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">نقطة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-game-border/60">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-slate-700 dark:text-slate-300">مستوى إنجاز صلوات اليوم</span>
            <span className="text-game-orange font-black">{dayScore.fardPercentage}%</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-game-bg border border-slate-300 dark:border-game-border/80 overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-game-orange via-amber-500 to-emerald-500 transition-all duration-500 shadow-glow-orange"
              style={{ width: `${dayScore.fardPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Five Fard Prayers Grid with SIMPLIFIED ONE-CLICK UX */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">الصلوات الخمس المفروضة</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              اضغط مباشرة على «تكبيرة الإحرام» لتسجيل 100% فوراً، أو اختر الركعات الفائتة بنقرة واحدة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(PRAYERS_CONFIG).map((prayerId) => {
            const config = PRAYERS_CONFIG[prayerId];
            const Icon = PRAYER_ICONS[prayerId] || Sun;
            const pData = record.prayers[prayerId] || {};
            const pScore = calculatePrayerScore(prayerId, pData);

            const isTakbirah = Boolean(pData.caughtTakbirah && pData.inMosque && pData.prayed);
            const isFullMosque = Boolean(pData.inMosque && pData.prayed && !pData.caughtTakbirah && (pData.missedRakats || 0) === 0);
            const isHome = Boolean(pData.prayed && !pData.inMosque);
            const hasMissed = Boolean(pData.prayed && (pData.missedRakats || 0) > 0);

            return (
              <div 
                key={prayerId}
                className={`steam-glass rounded-2xl p-5 border transition-all duration-300 relative flex flex-col justify-between ${
                  isTakbirah 
                    ? 'border-emerald-500 dark:border-emerald-500/80 shadow-glow-green bg-emerald-50/60 dark:bg-emerald-950/20' 
                    : isFullMosque 
                    ? 'border-cyan-500 dark:border-cyan-500/70 bg-cyan-50/50 dark:bg-cyan-950/20' 
                    : hasMissed 
                    ? 'border-amber-400 dark:border-amber-500/60' 
                    : 'border-slate-200 dark:border-game-border hover:border-game-orange/50'
                }`}
              >
                {/* Top Header */}
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-colors ${
                        isTakbirah 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'bg-slate-100 dark:bg-game-surface text-game-orange border border-slate-200 dark:border-game-border'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                          {config.name}
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          {config.rakats} ركعات مفروضة
                        </span>
                      </div>
                    </div>

                    {/* Score Tag */}
                    <div className={`px-2.5 py-1 rounded-lg border font-black text-sm flex items-center gap-1 ${
                      isTakbirah 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                        : pScore.score > 0 
                        ? 'bg-game-orange/15 border-game-orange/40 text-game-orange' 
                        : 'bg-slate-100 dark:bg-game-surface border-slate-200 dark:border-game-border text-slate-400'
                    }`}>
                      <span>{pScore.score}</span>
                      <span className="text-[10px] text-slate-400">/100</span>
                    </div>
                  </div>

                  {/* 1. PRIMARY HERO BUTTON: TAKBIRAT AL-IHRAM (100% AUTO) */}
                  <button
                    type="button"
                    onClick={() => handleToggleTakbirah(prayerId)}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-between border shadow-sm active:scale-95 ${
                      isTakbirah
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-glow-green'
                        : 'bg-slate-100 hover:bg-emerald-50 dark:bg-game-surface dark:hover:bg-game-card text-slate-800 dark:text-slate-200 border-slate-200 dark:border-game-border hover:border-emerald-500/80 hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Star className={`w-4 h-4 ${isTakbirah ? 'fill-white text-white' : 'text-amber-500'}`} />
                      <span>تكبيرة الإحرام بالمسجد</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-black ${
                        isTakbirah ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        100 نقطة
                      </span>
                      {isTakbirah && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>

                  {/* 2. SECONDARY QUICK ACTIONS (One-Click) */}
                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    {/* Mosque Full without Takbirah */}
                    <button
                      type="button"
                      onClick={() => handleSetMosqueAllRakats(prayerId)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                        isFullMosque
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-game-surface dark:hover:bg-game-card border-slate-200 dark:border-game-border text-slate-700 dark:text-slate-300'
                      }`}
                      title="صليت جميع الركعات في المسجد ولكن فاتت تكبيرة الإحرام"
                    >
                      <span>🕌</span>
                      <span>جماعة (80 نقطة)</span>
                    </button>

                    {/* Home Prayer */}
                    <button
                      type="button"
                      onClick={() => handleSetHomePrayer(prayerId)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                        isHome
                          ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-game-surface dark:hover:bg-game-card border-slate-200 dark:border-game-border text-slate-700 dark:text-slate-300'
                      }`}
                      title="صُليت منفرداً أو في البيت"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>صلاة بالبيت</span>
                    </button>
                  </div>
                </div>

                {/* 3. DIRECT MISSED RAK'AHS SELECTOR (Immediate click) */}
                <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-game-border/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      هل ضاعت عليك ركعات؟
                    </span>
                    {hasMissed && (
                      <span className="text-[10px] font-black text-game-red">
                        ضاعت {pData.missedRakats} ركعة
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: config.rakats }, (_, i) => i + 1).map((num) => {
                      const isSelected = pData.prayed && pData.missedRakats === num && !pData.caughtTakbirah;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleSetMissedRakats(prayerId, num)}
                          className={`flex-1 py-1.5 rounded-lg border text-[11px] font-black transition-all ${
                            isSelected
                              ? 'bg-game-red text-white border-game-red shadow-sm'
                              : 'bg-slate-100 hover:bg-rose-50 dark:bg-game-surface dark:hover:bg-game-card border-slate-200 dark:border-game-border text-slate-700 dark:text-slate-300'
                          }`}
                          title={`ضاعت ${num} ركعة`}
                        >
                          فاتت {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Sunnah Prayers Track */}
      <div className="steam-glass rounded-2xl p-5 sm:p-6 shadow-steam-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">صلوات النوافل والسنن الرواتب</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                100 نقطة لكل نافلة | مسار نقاط منفصل تماماً لا يؤثر على نسبة الفرائض
              </p>
            </div>
          </div>

          <span className="text-xs font-black text-amber-600 dark:text-amber-400 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30">
            {dayScore.completedSunnahCount} من {dayScore.totalSunnahCount} صلوات
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {SUNNAH_CONFIG.map((s) => {
            const isCompleted = Boolean(record.sunnah && record.sunnah[s.id]);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSunnahToggle(s.id)}
                className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between group active:scale-95 ${
                  isCompleted
                    ? 'bg-amber-500/20 border-amber-500 shadow-sm text-amber-900 dark:text-amber-200'
                    : 'bg-slate-100 hover:bg-amber-50/60 dark:bg-game-surface/80 dark:hover:bg-game-card border-slate-200 dark:border-game-border hover:border-amber-400 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="text-sm font-black leading-snug">{s.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</div>
                </div>

                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-amber-500 text-white font-black'
                    : 'border border-slate-300 dark:border-game-border group-hover:border-amber-400'
                }`}>
                  {isCompleted ? '✓' : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Save Bar */}
      <div className="sticky bottom-6 z-20 flex items-center justify-between p-4 rounded-2xl bg-white/95 dark:bg-game-surface/95 backdrop-blur-md border border-slate-200 dark:border-game-border shadow-2xl">
        <div className="flex items-center gap-2">
          {saveSuccess ? (
            <span className="text-xs font-bold text-game-green flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              تم حفظ صلوات اليوم بنجاح في IndexedDB!
            </span>
          ) : (
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              اضغط على زر الحفظ لتثبيت نقاط اليوم وتحديث المستويات
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-game-orange to-amber-600 hover:from-game-orangeHover hover:to-amber-500 text-white font-black text-sm shadow-glow-orange transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ صلوات اليوم'}</span>
        </button>
      </div>

    </div>
  );
}
