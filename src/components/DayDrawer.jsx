import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Edit3, 
  Save, 
  RotateCcw, 
  Calendar, 
  Trophy, 
  Sparkles, 
  Moon, 
  Sun, 
  Sunset, 
  Sunrise, 
  SunMedium, 
  Check, 
  Star, 
  Users,
  Home
} from 'lucide-react';
import { PRAYERS_CONFIG, SUNNAH_CONFIG, calculatePrayerScore, calculateDayScore } from '../services/scoring';
import { getDayRecord, saveDayRecord } from '../services/db';
import { formatArabicDate } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

const PRAYER_ICONS = {
  fajr: Sunrise,
  dhuhr: Sun,
  asr: SunMedium,
  maghrib: Sunset,
  isha: Moon,
};

export default function DayDrawer({ isOpen, onClose, dateKey, onRecordUpdated }) {
  const [record, setRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimateIn(true), 20);
      if (dateKey) {
        loadDay();
        setIsEditing(false);
      }
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen, dateKey]);

  const handleSmoothClose = () => {
    setAnimateIn(false);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  const loadDay = async () => {
    try {
      setLoading(true);
      const data = await getDayRecord(dateKey);
      setRecord(data);
    } catch (err) {
      console.error('Error loading day record:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !animateIn) return null;

  const dayScore = record ? calculateDayScore(record) : null;

  // Check if all 5 prayers have caught Takbirat Al-Ihram
  const isAllTakbirah = Boolean(
    record?.prayers &&
    Object.keys(PRAYERS_CONFIG).length > 0 &&
    Object.keys(PRAYERS_CONFIG).every((pId) => {
      const p = record.prayers[pId];
      return p && p.prayed && p.inMosque && p.caughtTakbirah;
    })
  );

  // Quick Action: Mark ALL 5 Fard Prayers with Takbirat Al-Ihram (500 pts / Gold Tier)
  const handleSetAllTakbirah = async () => {
    if (!record) return;
    const prayers = { ...record.prayers };

    Object.keys(PRAYERS_CONFIG).forEach((pId) => {
      if (isAllTakbirah) {
        // Toggle OFF all
        prayers[pId] = {
          prayed: false,
          inMosque: false,
          caughtTakbirah: false,
          missedRakats: 0,
        };
      } else {
        // Set all to 100% Takbirat Al-Ihram
        prayers[pId] = {
          prayed: true,
          inMosque: true,
          caughtTakbirah: true,
          missedRakats: 0,
        };
      }
    });

    const updatedRecord = { ...record, prayers };
    setRecord(updatedRecord);

    try {
      await saveDayRecord(updatedRecord);
      if (onRecordUpdated) onRecordUpdated(updatedRecord);

      if (!isAllTakbirah) {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#FFD700', '#FCD34D'],
        });
      }
    } catch (err) {
      console.error('Failed to save all takbirah:', err);
    }
  };

  // 1. One-click Takbirat Al-Ihram (100% Points)
  const handleToggleTakbirah = (prayerId) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
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
      return { ...prev, prayers };
    });
  };

  // 2. One-click Mosque All Rak'ahs without Takbirah (80% Points)
  const handleSetMosqueAllRakats = (prayerId) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
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
      return { ...prev, prayers };
    });
  };

  // 3. Home Prayer (STRICTLY 0 POINTS)
  const handleSetHomePrayer = (prayerId) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
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
      return { ...prev, prayers };
    });
  };

  // 4. Missed Rak'ahs Setter in mosque
  const handleSetMissedRakats = (prayerId, missedCount) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
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
      return { ...prev, prayers };
    });
  };

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
      if (onRecordUpdated) onRecordUpdated(record);
      setIsEditing(false);

      if (dayScore && dayScore.totalFardScore >= 400) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#F59E0B', '#10B981', '#0EA5E9'],
        });
      }
    } catch (err) {
      alert('حدث خطأ أثناء حفظ التعديلات: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const drawerContent = (
    <div className="fixed inset-0 z-[999999] overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop with Smooth Fade */}
      <div 
        onClick={handleSmoothClose}
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-out z-[999999] ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* DRAWER PANEL: Rendered via Portal on the RIGHT side */}
      <div 
        className="fixed inset-y-0 right-0 max-w-full flex z-[1000000]"
        dir="rtl"
      >
        <div 
          style={{
            transform: animateIn ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="w-screen max-w-full sm:max-w-md md:max-w-lg bg-white dark:bg-[#0F1526] text-slate-900 dark:text-white border-l border-slate-200 dark:border-[#222E4D] shadow-2xl flex flex-col text-right h-full"
        >
          {/* Header with High-Contrast Clear Close Button */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1E2842] bg-slate-50 dark:bg-[#141B30] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">سجل صلوات اليوم</h2>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  {formatArabicDate(dateKey)}
                </p>
              </div>
            </div>

            {/* Clear Close Button */}
            <button
              onClick={handleSmoothClose}
              aria-label="إغلاق"
              className="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-[#1C2542] dark:hover:bg-[#27345C] border border-slate-300 dark:border-[#2B3966] text-slate-800 dark:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 pb-28">
            {loading || !record ? (
              <div className="py-24 text-center text-slate-500 font-bold">جاري تحميل البيانات...</div>
            ) : (
              <>
                {/* Certificate Banner (Gold or Silver) */}
                {dayScore.certificate && (
                  <div className={`p-3.5 rounded-2xl border flex items-center gap-3 shadow-sm ${
                    dayScore.certificate.type === 'gold'
                      ? 'bg-amber-100/90 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500/50'
                      : 'bg-slate-200/90 text-slate-800 border-slate-300 dark:bg-cyan-950/40 dark:text-cyan-200 dark:border-cyan-500/50'
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-black/30 flex items-center justify-center text-xl shrink-0 shadow-sm">
                      {dayScore.certificate.type === 'gold' ? '🏆' : '🥈'}
                    </div>
                    <div>
                      <div className="text-xs font-black">{dayScore.certificate.title}</div>
                      <div className="text-[10px] opacity-85 mt-0.5">{dayScore.certificate.subtitle}</div>
                    </div>
                  </div>
                )}

                {/* Score Summary HUD Card */}
                <div className="gaming-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#222E4D] shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نقاط الفرائض بالمسجد</span>
                    
                    {/* Fixed Number Display */}
                    <div className="flex items-center gap-1.5 text-amber-500 font-black text-lg">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <div dir="ltr" className="font-mono">
                        <span className="text-xl text-amber-500 font-black">{dayScore.totalFardScore}</span>
                        <span className="text-xs text-slate-400 font-normal"> / 500</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#0A0E1A] overflow-hidden p-0.5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                      style={{ width: `${dayScore.fardPercentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-[#1E2842] text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B0F1C] border border-slate-200 dark:border-[#1E2842]">
                      <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold">الركعات الفائتة بالمسجد</div>
                      <div className={`font-black text-sm mt-0.5 ${dayScore.totalFardMissedRakats > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {dayScore.totalFardMissedRakats} ركعة
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B0F1C] border border-slate-200 dark:border-[#1E2842]">
                      <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold">في المسجد</div>
                      <div className="font-black text-sm text-emerald-500 mt-0.5">
                        {dayScore.totalFardPrayedInMosque} / 5 صلوات
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fard Prayers Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      الصلوات المفروضة
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                      {isEditing ? 'انقر لتعديل أي صلاة' : 'وضع القراءة'}
                    </span>
                  </div>

                  {/* QUICK HERO BUTTON: SELECT ALL WITH TAKBIRAT AL-IHRAM */}
                  <button
                    type="button"
                    onClick={handleSetAllTakbirah}
                    className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-black flex items-center justify-between border transition-all active:scale-95 shadow-sm ${
                      isAllTakbirah
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-emerald-950/20'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isAllTakbirah ? 'bg-white/20 text-white' : 'bg-amber-500 text-black'}`}>
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                      <div className="text-right">
                        <div className="font-black">
                          {isAllTakbirah ? 'جميع الصلوات محددة بتكبيرة الإحرام ✓' : 'تحديد كل الصلوات بتكبيرة الإحرام'}
                        </div>
                        <div className="text-[10px] opacity-80 font-normal">
                          {isAllTakbirah ? 'انقر لإلغاء التحديد' : 'حصد الدرجة الكاملة والشهادة الذهبية بنقرة واحدة (500 XP)'}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black ${
                      isAllTakbirah 
                        ? 'bg-white/20 text-white' 
                        : 'bg-amber-500 text-black shadow-sm'
                    }`}>
                      500 XP 🏆
                    </span>
                  </button>

                  {/* READ-ONLY VIEW */}
                  {!isEditing ? (
                    <div className="space-y-2">
                      {Object.keys(PRAYERS_CONFIG).map((pId) => {
                        const cfg = PRAYERS_CONFIG[pId];
                        const Icon = PRAYER_ICONS[pId] || Sun;
                        const pData = record.prayers[pId] || {};
                        const pScore = calculatePrayerScore(pId, pData);

                        let statusBadge = (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0B0F1C] border border-slate-200 dark:border-[#1E2842] text-slate-500 text-[11px] font-bold">
                            لم تُسجّل
                          </span>
                        );

                        if (pData.prayed) {
                          if (pData.inMosque) {
                            if (pData.caughtTakbirah) {
                              statusBadge = (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-black flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                                  تكبيرة الإحرام
                                </span>
                              );
                            } else if ((pData.missedRakats || 0) === 0) {
                              statusBadge = (
                                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[11px] font-black flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  جماعة كاملة
                                </span>
                              );
                            } else {
                              statusBadge = (
                                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[11px] font-black">
                                  ضاعت {pData.missedRakats} ركعة
                                </span>
                              );
                            }
                          } else {
                            statusBadge = (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center gap-1">
                                <Home className="w-3 h-3" />
                                بالبيت (0 نقطة)
                              </span>
                            );
                          }
                        }

                        return (
                          <div 
                            key={pId}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-[#121829] border border-slate-200 dark:border-[#1E2842] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-white dark:bg-[#0B0F1C] text-amber-500 border border-slate-200 dark:border-[#1E2842]">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-black text-slate-900 dark:text-white">{cfg.name}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">{cfg.rakats} ركعات</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {statusBadge}
                              <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 min-w-14 text-left">
                                {pScore.score} / 100
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* EDITING MODE */
                    <div className="space-y-3">
                      {Object.keys(PRAYERS_CONFIG).map((pId) => {
                        const cfg = PRAYERS_CONFIG[pId];
                        const Icon = PRAYER_ICONS[pId] || Sun;
                        const pData = record.prayers[pId] || {};
                        const pScore = calculatePrayerScore(pId, pData);

                        const isTakbirah = Boolean(pData.caughtTakbirah && pData.inMosque && pData.prayed);
                        const isFullMosque = Boolean(pData.inMosque && pData.prayed && !pData.caughtTakbirah && (pData.missedRakats || 0) === 0);
                        const isHome = Boolean(pData.prayed && !pData.inMosque);
                        const hasMissed = Boolean(pData.prayed && pData.inMosque && (pData.missedRakats || 0) > 0);

                        return (
                          <div 
                            key={pId}
                            className={`p-3.5 rounded-2xl border space-y-3 transition-all ${
                              isTakbirah 
                                ? 'bg-emerald-500/10 border-emerald-500/80 shadow-sm' 
                                : 'bg-slate-50 dark:bg-[#131A2E] border-slate-200 dark:border-[#222E4D]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-white dark:bg-[#0B0F1C] text-amber-500 border border-slate-200 dark:border-[#1E2842]">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-black text-sm text-slate-900 dark:text-white">{cfg.name}</span>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{cfg.rakats} ركعات</div>
                                </div>
                              </div>

                              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-white dark:bg-[#0B0F1C] border border-slate-200 dark:border-[#1E2842] text-amber-600 dark:text-amber-400 font-mono">
                                {pScore.score} / 100
                              </span>
                            </div>

                            {/* Takbirah Button: Flat neutral when unselected, Emerald when selected */}
                            <button
                              type="button"
                              onClick={() => handleToggleTakbirah(pId)}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                                isTakbirah
                                  ? 'bg-emerald-600 text-white border-emerald-500 font-black shadow-sm'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-[#0B0F1C] dark:hover:bg-[#1A2644] dark:text-slate-200 dark:border-[#1E2842]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Star className={`w-3.5 h-3.5 ${isTakbirah ? 'fill-white text-white' : 'text-slate-400'}`} />
                                <span>تكبيرة الإحرام بالمسجد</span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                                isTakbirah ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                100 نقطة
                              </span>
                            </button>

                            {/* Secondary Options (Using Vector Lucide Icons) */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => handleSetMosqueAllRakats(pId)}
                                className={`py-2 px-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                                  isFullMosque
                                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm font-black'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-[#0B0F1C] dark:border-[#1E2842] dark:text-slate-300 dark:hover:text-white'
                                }`}
                              >
                                <Users className={`w-3.5 h-3.5 ${isFullMosque ? 'text-white' : 'text-cyan-500'}`} />
                                <span>جماعة (80)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetHomePrayer(pId)}
                                className={`py-2 px-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                                  isHome
                                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm font-black'
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300 dark:bg-[#0B0F1C] dark:border-[#1E2842] dark:text-slate-400'
                                }`}
                                title="صلاة بالبيت = 0 نقطة"
                              >
                                <Home className={`w-3.5 h-3.5 ${isHome ? 'text-white' : 'text-slate-400'}`} />
                                <span>بالبيت (0)</span>
                              </button>
                            </div>

                            {/* Missed Rak'ahs */}
                            <div className="pt-2 border-t border-slate-200 dark:border-[#1E2842]">
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-bold">فوات ركعات بالمسجد:</div>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: cfg.rakats }, (_, i) => i + 1).map((n) => {
                                  const isMissedSelected = pData.prayed && pData.missedRakats === n && pData.inMosque && !pData.caughtTakbirah;
                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => handleSetMissedRakats(pId, n)}
                                      className={`flex-1 py-1 rounded-lg text-xs font-black border transition-all ${
                                        isMissedSelected
                                          ? 'bg-rose-600 text-white border-rose-500'
                                          : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-600 dark:bg-[#0B0F1C] dark:border-[#1E2842] dark:text-slate-400'
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
                  )}
                </div>

                {/* Sunnah Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>السنن والنوافل</span>
                    </div>
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 font-mono">
                      {dayScore.completedSunnahCount} / 6
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {SUNNAH_CONFIG.map((s) => {
                      const isDone = Boolean(record.sunnah && record.sunnah[s.id]);

                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleSunnahToggle(s.id)}
                          className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                            !isEditing ? 'opacity-80 cursor-default' : 'active:scale-95'
                          } ${
                            isDone
                              ? 'bg-amber-50 dark:bg-[#18233D] border-amber-500 text-slate-900 dark:text-white'
                              : 'bg-slate-50 dark:bg-[#0B0F1C] border-slate-200 dark:border-[#1E2842] text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="text-xs font-bold truncate">{s.name}</span>
                          <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center text-[10px] ${
                            isDone ? 'bg-amber-500 text-black font-black' : 'border border-slate-300 dark:border-slate-700'
                          }`}>
                            {isDone ? '✓' : ''}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-[#1E2842] bg-slate-50 dark:bg-[#121829] flex items-center gap-3 shrink-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 py-3 px-4 rounded-xl gaming-pill-gold text-black font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>تعديل صلوات هذا اليوم</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    loadDay(); // revert
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-[#1C2542] dark:hover:bg-[#27345C] text-slate-700 dark:text-slate-300 font-bold text-xs active:scale-95 transition-all"
                >
                  إلغاء
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
