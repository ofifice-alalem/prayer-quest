import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Moon, 
  Sun, 
  Sunset, 
  Sunrise, 
  SunMedium, 
  Target, 
  Shield, 
  Star,
  Users,
  Home,
  Award
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
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'

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

  // Instant Auto-Save on every single click
  const updateAndAutoSave = async (newRecord) => {
    setRecord(newRecord);
    setSaveStatus('saving');
    try {
      await saveDayRecord(newRecord);
      if (onRecordUpdated) onRecordUpdated(newRecord);
      setSaveStatus('saved');

      const score = calculateDayScore(newRecord);
      if (score.isGoldTier) {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#FFD700', '#FCD34D'],
        });
      }
    } catch (err) {
      console.error('Failed to auto-save record:', err);
      setSaveStatus('error');
    }
  };

  // 1. One-click Takbirat Al-Ihram (100% Points)
  const handleToggleTakbirah = (prayerId) => {
    if (!record) return;
    const prayers = { ...record.prayers };
    const current = { ...(prayers[prayerId] || {}) };

    if (current.caughtTakbirah && current.inMosque && current.prayed) {
      // Toggle OFF
      current.prayed = false;
      current.inMosque = false;
      current.caughtTakbirah = false;
      current.missedRakats = 0;
    } else {
      // Toggle ON (Full 100% Points)
      current.prayed = true;
      current.inMosque = true;
      current.caughtTakbirah = true;
      current.missedRakats = 0;
    }

    prayers[prayerId] = current;
    const updated = { ...record, prayers };
    updateAndAutoSave(updated);
  };

  // 2. One-click Mosque All Rak'ahs without Takbirah (80% Points)
  const handleSetMosqueAllRakats = (prayerId) => {
    if (!record) return;
    const prayers = { ...record.prayers };
    const current = { ...(prayers[prayerId] || {}) };

    if (current.inMosque && current.prayed && !current.caughtTakbirah && current.missedRakats === 0) {
      // Toggle off
      current.prayed = false;
      current.inMosque = false;
    } else {
      current.prayed = true;
      current.inMosque = true;
      current.caughtTakbirah = false;
      current.missedRakats = 0;
    }

    prayers[prayerId] = current;
    const updated = { ...record, prayers };
    updateAndAutoSave(updated);
  };

  // 3. Home Prayer (STRICTLY 0 POINTS - INCENTIVE FOR MOSQUE)
  const handleSetHomePrayer = (prayerId) => {
    if (!record) return;
    const prayers = { ...record.prayers };
    const current = { ...(prayers[prayerId] || {}) };

    if (current.prayed && !current.inMosque) {
      // Toggle off
      current.prayed = false;
    } else {
      current.prayed = true;
      current.inMosque = false; // HOME PRAYER = 0 POINTS
      current.caughtTakbirah = false;
      current.missedRakats = 0;
    }

    prayers[prayerId] = current;
    const updated = { ...record, prayers };
    updateAndAutoSave(updated);
  };

  // 4. Direct Missed Rak'ahs Setter in mosque
  const handleSetMissedRakats = (prayerId, missedCount) => {
    if (!record) return;
    const prayers = { ...record.prayers };
    const current = { ...(prayers[prayerId] || {}) };

    if (current.missedRakats === missedCount && current.prayed && current.inMosque) {
      current.missedRakats = 0;
    } else {
      current.prayed = true;
      current.inMosque = true;
      current.caughtTakbirah = false;
      current.missedRakats = missedCount;
    }

    prayers[prayerId] = current;
    const updated = { ...record, prayers };
    updateAndAutoSave(updated);
  };

  const handleSunnahToggle = (sunnahId) => {
    if (!record) return;
    const sunnah = { ...record.sunnah };
    sunnah[sunnahId] = !sunnah[sunnahId];
    const updated = { ...record, sunnah };
    updateAndAutoSave(updated);
  };

  if (loading || !record) {
    return (
      <div className="py-24 text-center text-slate-500 font-bold">
        جاري تحميل صلوات اليوم...
      </div>
    );
  }

  const dayScore = calculateDayScore(record);

  return (
    <div className="space-y-6">
      
      {/* TOURNAMENT-STYLE HERO BANNER */}
      <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-8 overflow-hidden bg-gradient-to-r from-[#171330] via-[#1F1742] to-[#111933] border border-[#2B2353] shadow-xl text-white">
        {/* Ambient Top Glow */}
        <div 
          className="absolute -top-24 right-1/4 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                QUEST ACTIVE • {formatArabicDate(todayKey)}
              </span>

              {/* Instant Auto-Save Indicator */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>حفظ تلقائي فوري</span>
              </span>

              {/* Certificate Live Badge if earned */}
              {dayScore.certificate && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                  dayScore.certificate.type === 'gold'
                    ? 'bg-amber-400/20 text-yellow-300 border-yellow-400/40'
                    : 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40'
                }`}>
                  <Award className="w-3 h-3" />
                  <span>{dayScore.certificate.title}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              تَحَدّي فُـرْسَـان الـمَـسَـاجِـد
            </h1>

            <p className="text-[11px] sm:text-sm text-purple-100/90 font-medium leading-relaxed">
              أدرك تكبيرة الإحرام في المسجد لتسجيل 100% كاملة. نقاط الفرائض مخصصة حصراً لصلوات المسجد.
            </p>

            {/* Gaming Stats Row */}
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 pt-2 sm:pt-3 text-xs font-bold text-white">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-black/30 p-2 sm:px-3.5 sm:py-2 rounded-xl backdrop-blur-sm border border-white/10 text-center sm:text-right">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="font-mono text-amber-400 font-black text-xs sm:text-sm">{dayScore.totalFardScore}</span>
                <span className="text-purple-200 text-[9px] sm:text-[11px]">/ 500 فريضة</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-black/30 p-2 sm:px-3.5 sm:py-2 rounded-xl backdrop-blur-sm border border-white/10 text-center sm:text-right">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                <span className="font-mono text-pink-400 font-black text-xs sm:text-sm">{dayScore.completedSunnahCount}</span>
                <span className="text-purple-200 text-[9px] sm:text-[11px]">من 6 نوافل</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-black/30 p-2 sm:px-3.5 sm:py-2 rounded-xl backdrop-blur-sm border border-white/10 text-center sm:text-right">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-emerald-400 font-black text-xs sm:text-sm">{dayScore.totalFardPrayedInMosque}</span>
                <span className="text-purple-200 text-[9px] sm:text-[11px]">بالمسجد</span>
              </div>
            </div>
          </div>

          {/* Certificate / Level Box */}
          <div className="hidden lg:flex flex-col items-center justify-center p-5 rounded-2xl bg-black/40 border border-white/20 backdrop-blur-md text-center min-w-[170px]">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-2 ${
              dayScore.isGoldTier 
                ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500' 
                : dayScore.isSilverTier 
                ? 'bg-gradient-to-tr from-slate-200 via-slate-100 to-slate-400' 
                : 'bg-gradient-to-tr from-amber-500 to-yellow-400'
            }`}>
              <Trophy className="w-8 h-8 text-black" />
            </div>
            <div className="text-[10px] text-purple-200 uppercase tracking-widest font-black">
              {dayScore.certificate ? dayScore.certificate.title : 'تصنيف اليوم'}
            </div>
            <div className="text-lg font-black text-amber-300 font-mono">{dayScore.fardPercentage}% إنجاز</div>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/15">
          <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all duration-500"
              style={{ width: `${dayScore.fardPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* FEATURED PRAYER CARDS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              الصلوات المفروضة • FEATURED PRAYERS
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تكبيرة الإحرام (100 نقطة) | جماعة كاملة (80 نقطة) | بالبيت (0 نقطة) — التعديل يُحفظ تلقائياً
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {Object.keys(PRAYERS_CONFIG).map((prayerId) => {
            const config = PRAYERS_CONFIG[prayerId];
            const Icon = PRAYER_ICONS[prayerId] || Sun;
            const pData = record.prayers[prayerId] || {};
            const pScore = calculatePrayerScore(prayerId, pData);

            const isTakbirah = Boolean(pData.caughtTakbirah && pData.inMosque && pData.prayed);
            const isFullMosque = Boolean(pData.inMosque && pData.prayed && !pData.caughtTakbirah && (pData.missedRakats || 0) === 0);
            const isHome = Boolean(pData.prayed && !pData.inMosque);
            const hasMissed = Boolean(pData.prayed && pData.inMosque && (pData.missedRakats || 0) > 0);

            return (
              <div 
                key={prayerId}
                className={`gaming-card rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 relative ${
                  isTakbirah 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-950/20' 
                    : isFullMosque 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : isHome 
                    ? 'border-amber-500/50 bg-amber-500/5' 
                    : hasMissed 
                    ? 'border-rose-500/50 bg-rose-500/5' 
                    : ''
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#0E1424] text-amber-500 border border-slate-200 dark:border-[#1E2842]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{config.name}</h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{config.rakats} ركعات</span>
                      </div>
                    </div>

                    {/* Points Pill */}
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#0E1424] border border-slate-200 dark:border-[#1E2842] text-amber-600 dark:text-amber-400 font-mono font-black text-xs">
                      {pScore.score} / 100
                    </span>
                  </div>

                  {/* 1. HERO ACTION BUTTON: TAKBIRAT AL-IHRAM */}
                  <button
                    type="button"
                    onClick={() => handleToggleTakbirah(prayerId)}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-between border active:scale-95 mb-2.5 ${
                      isTakbirah
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30 font-black'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-[#131B2E] dark:hover:bg-[#1A2644] dark:text-slate-300 dark:border-[#222E4D]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className={`w-3.5 h-3.5 ${isTakbirah ? 'fill-white text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>تكبيرة الإحرام بالمسجد</span>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                      isTakbirah 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                    }`}>
                      100 نقطة
                    </span>
                  </button>

                  {/* 2. SECONDARY ACTIONS (Vector Lucide Icons) */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => handleSetMosqueAllRakats(prayerId)}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isFullMosque
                          ? 'bg-cyan-600 text-white border-cyan-500 font-black shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-[#0E1424] dark:hover:bg-[#1A2542] dark:border-[#1E2842] dark:text-slate-300'
                      }`}
                      title="صلاة الجماعة كاملة بالمسجد دون إدراك تكبيرة الإحرام"
                    >
                      <Users className={`w-3.5 h-3.5 ${isFullMosque ? 'text-white' : 'text-cyan-500'}`} />
                      <span>جماعة (80)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetHomePrayer(prayerId)}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isHome
                          ? 'bg-amber-600 text-white border-amber-500 font-black shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300 dark:bg-[#0E1424] dark:hover:bg-[#1A2542] dark:border-[#1E2842] dark:text-slate-400'
                      }`}
                      title="صلاة بالبيت = 0 نقطة"
                    >
                      <Home className={`w-3.5 h-3.5 ${isHome ? 'text-white' : 'text-slate-400'}`} />
                      <span>بالبيت (0)</span>
                    </button>
                  </div>
                </div>

                {/* 3. MISSED RAK'AHS SELECTOR IN MOSQUE */}
                <div className="pt-2.5 border-t border-slate-200 dark:border-[#1E2842]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">فوات ركعات بالمسجد:</span>
                    {hasMissed && (
                      <span className="text-[10px] font-black text-rose-500">ضاعت {pData.missedRakats}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: config.rakats }, (_, i) => i + 1).map((n) => {
                      const isSelected = pData.prayed && pData.missedRakats === n && pData.inMosque && !pData.caughtTakbirah;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleSetMissedRakats(prayerId, n)}
                          className={`flex-1 py-1 rounded-md text-[10px] font-black border transition-all ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 dark:bg-[#0E1424] dark:border-[#1E2842] dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          {n}
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

      {/* SUNNAH QUEST SECTION */}
      <div className="gaming-card rounded-2xl p-5 border border-slate-200 dark:border-[#1E2842]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              مهام النوافل والسنن الرواتب
            </h3>
          </div>

          <span className="text-xs font-black text-amber-600 dark:text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 font-mono">
            {dayScore.completedSunnahCount} / {dayScore.totalSunnahCount} صلوات مؤداة
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {SUNNAH_CONFIG.map((s) => {
            const isDone = Boolean(record.sunnah && record.sunnah[s.id]);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSunnahToggle(s.id)}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between group active:scale-95 ${
                  isDone
                    ? 'bg-amber-50 border-amber-500 text-slate-900 dark:bg-[#18233D] dark:text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-[#0E1424] dark:border-[#1E2842] dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-black leading-snug">{s.name}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-[#1E2842]">
                  <span className="text-[10px] text-slate-500 font-mono">100 pts</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                    isDone 
                      ? 'bg-amber-500 text-black font-black' 
                      : 'border border-slate-300 dark:border-slate-700'
                  }`}>
                    {isDone ? '✓' : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
