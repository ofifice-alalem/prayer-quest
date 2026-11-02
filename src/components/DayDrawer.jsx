import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen && dateKey) {
      loadDay();
      setIsEditing(false);
    }
  }, [isOpen, dateKey]);

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

  if (!isOpen || !dateKey) return null;

  const dayScore = record ? calculateDayScore(record) : null;

  // DIRECT ACTIONS IN EDIT MODE
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

  const handleSetMosqueAllRakats = (prayerId) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
      const current = { ...(prayers[prayerId] || {}) };

      if (current.prayed && current.inMosque && !current.caughtTakbirah && (current.missedRakats || 0) === 0) {
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

  const handleSetHomePrayer = (prayerId) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
      const current = { ...(prayers[prayerId] || {}) };

      if (current.prayed && !current.inMosque) {
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

  const handleSetMissedRakats = (prayerId, count) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
      const current = { ...(prayers[prayerId] || {}) };

      if (current.missedRakats === count && current.prayed) {
        current.missedRakats = 0;
      } else {
        current.prayed = true;
        current.inMosque = true;
        current.caughtTakbirah = false;
        current.missedRakats = count;
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
      setIsEditing(false);
      if (onRecordUpdated) onRecordUpdated(record);

      if (dayScore && dayScore.fardPercentage >= 80) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#FF7A00', '#10B981', '#F59E0B'],
        });
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-game-surface border-r border-slate-200 dark:border-game-border shadow-2xl flex flex-col text-right transition-colors duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-game-border bg-slate-50 dark:bg-game-card/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-game-orange/15 border border-game-orange/40 flex items-center justify-center text-game-orange">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">تفاصيل اليوم</h2>
                <p className="text-xs text-game-orange font-bold">
                  {formatArabicDate(dateKey)}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white dark:bg-game-surface hover:bg-slate-100 dark:hover:bg-game-card border border-slate-200 dark:border-game-border text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {loading || !record ? (
              <div className="py-20 text-center text-slate-500 dark:text-slate-400">جاري تحميل البيانات...</div>
            ) : (
              <>
                {/* Score Summary HUD */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-gradient-to-br dark:from-game-card dark:to-game-cardHover border border-slate-200 dark:border-game-border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">نقاط الفرائض</span>
                    <div className="flex items-center gap-1.5 text-game-orange font-black">
                      <Trophy className="w-4 h-4" />
                      <span>{dayScore.totalFardScore} / {dayScore.maxFardScore}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-game-bg overflow-hidden border border-slate-300 dark:border-game-border/80 p-0.5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-game-orange to-amber-500 transition-all duration-500 shadow-glow-orange"
                      style={{ width: `${dayScore.fardPercentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-game-border/60 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white dark:bg-game-bg/60 border border-slate-200 dark:border-transparent">
                      <div className="text-slate-500 dark:text-slate-400 text-[10px]">الركعات الفائتة</div>
                      <div className={`font-black text-sm mt-0.5 ${dayScore.totalFardMissedRakats > 0 ? 'text-game-red' : 'text-game-green'}`}>
                        {dayScore.totalFardMissedRakats} ركعة
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-game-bg/60 border border-slate-200 dark:border-transparent">
                      <div className="text-slate-500 dark:text-slate-400 text-[10px]">في المسجد</div>
                      <div className="font-black text-sm text-game-green mt-0.5">
                        {dayScore.totalFardPrayedInMosque} / 5 صلوات
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fard Prayers Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                      الصلوات الخمس المفروضة
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {isEditing ? 'اضغط لتعديل فوري' : '100 نقطة لكل صلاة'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {Object.keys(PRAYERS_CONFIG).map((pId) => {
                      const cfg = PRAYERS_CONFIG[pId];
                      const Icon = PRAYER_ICONS[pId] || Sun;
                      const pData = record.prayers[pId] || {};
                      const pScore = calculatePrayerScore(pId, pData);

                      const isTakbirah = Boolean(pData.caughtTakbirah && pData.inMosque && pData.prayed);
                      const isFullMosque = Boolean(pData.inMosque && pData.prayed && !pData.caughtTakbirah && (pData.missedRakats || 0) === 0);
                      const isHome = Boolean(pData.prayed && !pData.inMosque);
                      const hasMissed = Boolean(pData.prayed && (pData.missedRakats || 0) > 0);

                      if (isEditing) {
                        return (
                          <div 
                            key={pId}
                            className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                              isTakbirah 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500' 
                                : 'bg-slate-50 dark:bg-game-card/90 border-slate-200 dark:border-game-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-white dark:bg-game-surface text-game-orange border border-slate-200 dark:border-transparent">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-sm text-slate-900 dark:text-white">{cfg.name}</span>
                              </div>
                              <span className="text-xs font-black text-game-orange">
                                {pScore.score} / 100
                              </span>
                            </div>

                            {/* One-click Takbirah Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleTakbirah(pId)}
                              className={`w-full py-2 px-3 rounded-lg text-xs font-black flex items-center justify-between border transition-all ${
                                isTakbirah
                                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                  : 'bg-white dark:bg-game-surface hover:bg-emerald-50 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-game-border'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Star className={`w-3.5 h-3.5 ${isTakbirah ? 'fill-white' : 'text-amber-500'}`} />
                                <span>تكبيرة الإحرام (100 نقطة)</span>
                              </div>
                              {isTakbirah && <Check className="w-3.5 h-3.5" />}
                            </button>

                            {/* Secondary Options */}
                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                              <button
                                type="button"
                                onClick={() => handleSetMosqueAllRakats(pId)}
                                className={`py-1.5 px-2 rounded-lg border font-bold text-center transition-all ${
                                  isFullMosque
                                    ? 'bg-cyan-600 text-white border-cyan-500'
                                    : 'bg-white dark:bg-game-surface border-slate-200 dark:border-game-border text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                جماعة (80)
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetHomePrayer(pId)}
                                className={`py-1.5 px-2 rounded-lg border font-bold text-center transition-all ${
                                  isHome
                                    ? 'bg-amber-600 text-white border-amber-500'
                                    : 'bg-white dark:bg-game-surface border-slate-200 dark:border-game-border text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                صلاة بالبيت
                              </button>
                            </div>

                            {/* Missed Rak'ahs Chips */}
                            <div className="pt-2 border-t border-slate-200 dark:border-game-border/60">
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-bold">
                                الركعات الفائتة:
                              </div>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: cfg.rakats }, (_, i) => i + 1).map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => handleSetMissedRakats(pId, n)}
                                    className={`flex-1 py-1 rounded text-[10px] font-black border transition-all ${
                                      pData.missedRakats === n && !pData.caughtTakbirah
                                        ? 'bg-game-red text-white border-game-red'
                                        : 'bg-white dark:bg-game-surface border-slate-200 dark:border-game-border text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    فاتت {n}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // View Mode
                      return (
                        <div
                          key={pId}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-game-card/70 border border-slate-200 dark:border-game-border hover:border-game-orange/40 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-game-surface text-game-orange border border-slate-200 dark:border-transparent">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{cfg.name}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                {pData.caughtTakbirah ? (
                                  <span className="text-game-green font-semibold">✓ تكبيرة الإحرام</span>
                                ) : pData.inMosque ? (
                                  <span className="text-cyan-600 dark:text-cyan-400">جماعة بالمسجد</span>
                                ) : pData.prayed ? (
                                  <span className="text-slate-600 dark:text-slate-400">صلاة بالبيت</span>
                                ) : (
                                  <span className="text-game-red">لم تُصلَّ</span>
                                )}

                                {pScore.missedRakats > 0 && (
                                  <span className="text-game-red font-bold">
                                    • ضاعت {pScore.missedRakats} ركعة
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-left">
                            <span className="text-xs font-black text-game-orange">
                              {pScore.score}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-0.5">/100</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sunnah Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>صلوات النوافل</span>
                    </h3>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      {dayScore.completedSunnahCount} / {dayScore.totalSunnahCount} مؤداة
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {SUNNAH_CONFIG.map((s) => {
                      const isDone = Boolean(record.sunnah && record.sunnah[s.id]);

                      if (isEditing) {
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSunnahToggle(s.id)}
                            className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                              isDone
                                ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-300 font-bold shadow-sm'
                                : 'bg-white dark:bg-game-surface border-slate-200 dark:border-game-border text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span className="text-xs leading-tight">{s.name}</span>
                            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isDone ? 'bg-amber-500 text-white font-black' : 'border border-slate-300 dark:border-game-border'}`}>
                              {isDone && '✓'}
                            </div>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={s.id}
                          className={`p-2.5 rounded-xl border text-right flex items-center justify-between text-xs ${
                            isDone
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold'
                              : 'bg-slate-50 dark:bg-game-surface/50 border-slate-200 dark:border-game-border/60 text-slate-400 line-through'
                          }`}
                        >
                          <span className="leading-tight">{s.name}</span>
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-slate-200 dark:border-game-border bg-slate-50 dark:bg-game-card/50">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-game-orange to-amber-600 hover:from-game-orangeHover hover:to-amber-500 text-white font-black text-xs shadow-glow-orange transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>

                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white dark:bg-game-surface hover:bg-slate-100 dark:hover:bg-game-card border border-slate-200 dark:border-game-border text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إلغاء</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-game-orange hover:bg-game-orangeHover text-white font-black text-sm shadow-glow-orange transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>تعديل صلوات هذا اليوم</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
