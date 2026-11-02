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
  Award,
  Zap,
  Flame
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
  const [saveStatus, setSaveStatus] = useState('saved');

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
          particleCount: 85,
          spread: 75,
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
      current.prayed = false;
      current.inMosque = false;
      current.caughtTakbirah = false;
      current.missedRakats = 0;
    } else {
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
      
      {/* TOURNAMENT-STYLE HERO BANNER (Fortnite Arena Style) */}
      <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-8 overflow-hidden bg-gradient-to-r from-[#100D2B] via-[#1B1240] to-[#0A1026] border border-[#271E54] shadow-2xl text-white">
        {/* Ambient Top Glows */}
        <div 
          className="absolute -top-28 right-1/4 w-96 h-96 rounded-full blur-[110px] pointer-events-none opacity-35"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-28 left-10 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>TOURNAMENT ACTIVE • {formatArabicDate(todayKey)}</span>
              </span>

              {/* Instant Auto-Save Indicator */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>حفظ تلقائي فوري</span>
              </span>

              {/* Certificate Live Badge */}
              {dayScore.certificate && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border font-mono ${
                  dayScore.certificate.type === 'gold'
                    ? 'bg-amber-400/25 text-yellow-300 border-yellow-400/50 shadow-sm'
                    : 'bg-cyan-400/25 text-cyan-200 border-cyan-400/50 shadow-sm'
                }`}>
                  <Award className="w-3.5 h-3.5" />
                  <span>{dayScore.certificate.title}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              تَحَدّي فُـرْسَـان الـمَـسَـاجِـد • DAILY QUEST
            </h1>

            <p className="text-xs sm:text-sm text-purple-100/90 font-medium leading-relaxed">
              حصّن صلواتك الخمس في المسجد مع الجماعة وأدرك تكبيرة الإحرام لحصد نقاط الخبرة (XP) والتتويج بالشهادة الذهبية.
            </p>

            {/* Gaming HUD Stats Bar */}
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3.5 pt-2 sm:pt-3 text-xs font-bold text-white">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-black/40 p-2 sm:px-3.5 sm:py-2 rounded-xl backdrop-blur-md border border-white/10 text-center sm:text-right">
                <Target className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-mono text-amber-400 font-black text-xs sm:text-sm">{dayScore.totalFardScore}</span>
                <span className="text-purple-200 text-[10px] font-mono">/ 500 XP</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-black/40 p-2 sm:px-3.5 sm:py-2 rounded-xl backdrop-blur-md border border-white/10 text-center sm:text-right">
                <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="font-mono text-pink-400 font-black text-xs sm:text-sm">{dayScore.completedSunnahCount}</span>
                <span className="text-purple-200 text-[10px]">من 6 نوافل</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-black/40 p-2 sm:px-3.5 sm:py-2 rounded-xl backdrop-blur-md border border-white/10 text-center sm:text-right">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-black text-xs sm:text-sm">{dayScore.totalFardPrayedInMosque}</span>
                <span className="text-purple-200 text-[10px]">بالمسجد</span>
              </div>
            </div>
          </div>

          {/* Certificate Trophy HUD Card */}
          <div className="hidden lg:flex flex-col items-center justify-center p-5 rounded-2xl bg-black/45 border border-white/20 backdrop-blur-md text-center min-w-[180px] shadow-lg">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-2 transition-transform hover:scale-105 ${
              dayScore.isGoldTier 
                ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-black glow-gold' 
                : dayScore.isSilverTier 
                ? 'bg-gradient-to-tr from-slate-200 via-slate-100 to-slate-400 text-slate-900 glow-cyan' 
                : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-black'
            }`}>
              <Trophy className="w-8 h-8" />
            </div>
            <div className="text-[10px] text-purple-200 uppercase tracking-widest font-black font-mono">
              {dayScore.certificate ? dayScore.certificate.title : 'RANK OF THE DAY'}
            </div>
            <div className="text-lg font-black text-amber-300 font-mono">{dayScore.fardPercentage}% CLEAR</div>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-white/15">
          <div className="flex items-center justify-between text-[11px] font-black text-purple-200 mb-1.5 font-mono">
            <span>QUEST PROGRESSION</span>
            <span>{dayScore.fardPercentage}% COMPLETED</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden p-0.5 border border-white/10">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-emerald-400 transition-all duration-500"
              style={{ width: `${dayScore.fardPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* FEATURED PRAYER CARDS (Fortnite / AAA Tournament Grid) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>مهام الفرائض الخمس • MAIN QUESTS</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تكبيرة الإحرام (100 XP) | جماعة كاملة (80 XP) | بالبيت (0 XP) — يتم الحفظ تلقائياً
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
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
                className={`gaming-card rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 border-2 ${
                  isTakbirah 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-950/20' 
                    : isFullMosque 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : isHome 
                    ? 'border-amber-500/50 bg-amber-500/5' 
                    : hasMissed 
                    ? 'border-rose-500/50 bg-rose-500/5' 
                    : 'border-slate-200 dark:border-[#1A243D]'
                }`}
              >
                <div>
                  {/* Quest Meta Strip */}
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-2.5 font-mono">
                    <span className="text-slate-400 dark:text-slate-500">{config.rakats} RAKATS</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      100 XP
                    </span>
                  </div>

                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#070A13] text-amber-500 border border-slate-200 dark:border-white/5 shadow-inner">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white">{config.name}</h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{config.rakats} ركعات مفروضة</span>
                      </div>
                    </div>

                    {/* Current Score Pill */}
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#070A13] border border-slate-200 dark:border-[#1A243D] text-amber-600 dark:text-amber-400 font-mono font-black text-xs shadow-sm">
                      {pScore.score} XP
                    </span>
                  </div>

                  {/* 1. HERO ACTION BUTTON: TAKBIRAT AL-IHRAM (PERFECT CLEAR) */}
                  <button
                    type="button"
                    onClick={() => handleToggleTakbirah(prayerId)}
                    className={`w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-between border active:scale-95 mb-2.5 ${
                      isTakbirah
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-md shadow-emerald-600/30 font-black'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-[#080C17] dark:hover:bg-[#141C33] dark:text-slate-300 dark:border-[#1A243D]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className={`w-4 h-4 ${isTakbirah ? 'fill-white text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>تكبيرة الإحرام بالمسجد</span>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded font-black font-mono ${
                      isTakbirah 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                    }`}>
                      +100 XP
                    </span>
                  </button>

                  {/* 2. SECONDARY ACTIONS (Congregation vs Home) */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => handleSetMosqueAllRakats(prayerId)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isFullMosque
                          ? 'bg-cyan-600 text-white border-cyan-400 font-black shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-[#080C17] dark:hover:bg-[#141C33] dark:border-[#1A243D] dark:text-slate-300'
                      }`}
                      title="صلاة الجماعة كاملة بالمسجد دون إدراك تكبيرة الإحرام"
                    >
                      <Users className={`w-3.5 h-3.5 ${isFullMosque ? 'text-white' : 'text-cyan-500'}`} />
                      <span>جماعة (80)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetHomePrayer(prayerId)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isHome
                          ? 'bg-amber-600 text-white border-amber-400 font-black shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300 dark:bg-[#080C17] dark:hover:bg-[#141C33] dark:border-[#1A243D] dark:text-slate-400'
                      }`}
                      title="صلاة بالبيت = 0 نقطة"
                    >
                      <Home className={`w-3.5 h-3.5 ${isHome ? 'text-white' : 'text-slate-400'}`} />
                      <span>بالبيت (0)</span>
                    </button>
                  </div>
                </div>

                {/* 3. MISSED RAK'AHS SELECTOR (ARCADE STYLE) */}
                <div className="pt-2.5 border-t border-slate-200 dark:border-[#1A243D]">
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
                          className={`flex-1 py-1.5 rounded-lg text-xs font-black font-mono border transition-all ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 dark:bg-[#080C17] dark:border-[#1A243D] dark:text-slate-400 dark:hover:text-white'
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

      {/* SUNNAH QUEST SECTION (SIDE BOUNTIES) */}
      <div className="gaming-card rounded-2xl p-5 border border-slate-200 dark:border-[#1A243D]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              مهام السنن والنوافل • DAILY SIDE QUESTS
            </h3>
          </div>

          <span className="text-xs font-black text-amber-600 dark:text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 font-mono">
            {dayScore.completedSunnahCount} / {dayScore.totalSunnahCount} COMPLETED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {SUNNAH_CONFIG.map((s) => {
            const isDone = Boolean(record.sunnah && record.sunnah[s.id]);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSunnahToggle(s.id)}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between group active:scale-95 ${
                  isDone
                    ? 'bg-amber-50 border-amber-500 text-slate-900 dark:bg-[#18233D] dark:text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-[#080C17] dark:border-[#1A243D] dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-black leading-snug">{s.name}</div>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200 dark:border-[#1A243D]">
                  <span className="text-[10px] text-slate-500 font-mono font-bold">+100 XP</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
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
