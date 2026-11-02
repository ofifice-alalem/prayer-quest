import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Trophy, 
  Sparkles, 
  Moon, 
  Sun, 
  Sunset, 
  Sunrise, 
  SunMedium,
  Check
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

  // Toggle handlers for edit mode
  const handlePrayerChange = (prayerId, field, value) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
      const current = { ...(prayers[prayerId] || {}) };

      if (field === 'caughtTakbirah' && value === true) {
        // Automatic 100%: inMosque must be true, prayed must be true, missedRakats = 0
        current.prayed = true;
        current.inMosque = true;
        current.caughtTakbirah = true;
        current.missedRakats = 0;
      } else if (field === 'prayed' && value === false) {
        current.prayed = false;
        current.inMosque = false;
        current.caughtTakbirah = false;
        current.missedRakats = PRAYERS_CONFIG[prayerId].rakats;
      } else {
        current[field] = value;
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
        <div className="w-screen max-w-md bg-game-surface border-r border-game-border shadow-2xl flex flex-col text-right">
          
          {/* Header */}
          <div className="p-5 border-b border-game-border bg-game-card/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-game-orange/20 border border-game-orange/40 flex items-center justify-center text-game-orange">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">تفاصيل اليوم</h2>
                <p className="text-xs text-game-orange font-bold">
                  {formatArabicDate(dateKey)}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-game-surface hover:bg-game-card border border-game-border text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {loading || !record ? (
              <div className="py-20 text-center text-slate-400">جاري تحميل البيانات...</div>
            ) : (
              <>
                {/* Score Summary HUD */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-game-card to-game-cardHover border border-game-border shadow-steam-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400">نقاط الفرائض</span>
                    <div className="flex items-center gap-1.5 text-game-orange font-black">
                      <Trophy className="w-4 h-4" />
                      <span>{dayScore.totalFardScore} / {dayScore.maxFardScore}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-game-bg overflow-hidden border border-game-border/80 p-0.5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-game-orange to-amber-500 transition-all duration-500 shadow-glow-orange"
                      style={{ width: `${dayScore.fardPercentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-game-border/60 text-center text-xs">
                    <div className="p-2 rounded-lg bg-game-bg/60">
                      <div className="text-slate-400 text-[10px]">الركعات الفائتة</div>
                      <div className={`font-black text-sm mt-0.5 ${dayScore.totalFardMissedRakats > 0 ? 'text-game-red' : 'text-game-green'}`}>
                        {dayScore.totalFardMissedRakats} ركعة
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-game-bg/60">
                      <div className="text-slate-400 text-[10px]">في المسجد</div>
                      <div className="font-black text-sm text-game-green mt-0.5">
                        {dayScore.totalFardPrayedInMosque} / 5 صلوات
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fard Prayers Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                      الصلوات الخمس المفروضة
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold">100 نقطة لكل صلاة</span>
                  </div>

                  <div className="space-y-2.5">
                    {Object.keys(PRAYERS_CONFIG).map((pId) => {
                      const cfg = PRAYERS_CONFIG[pId];
                      const Icon = PRAYER_ICONS[pId] || Sun;
                      const pData = record.prayers[pId] || {};
                      const pScore = calculatePrayerScore(pId, pData);

                      if (isEditing) {
                        return (
                          <div 
                            key={pId}
                            className="p-3.5 rounded-xl bg-game-card/90 border border-game-border space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-game-surface text-game-orange">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-sm text-white">{cfg.name}</span>
                              </div>
                              <span className="text-xs font-black text-game-orange">
                                {pScore.score} / 100 نقطة
                              </span>
                            </div>

                            {/* Edit Controls */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {/* Played Toggle */}
                              <button
                                type="button"
                                onClick={() => handlePrayerChange(pId, 'prayed', !pData.prayed)}
                                className={`py-1.5 px-2 rounded-lg border font-bold text-center transition-all ${
                                  pData.prayed 
                                    ? 'bg-game-green/20 border-game-green text-game-green' 
                                    : 'bg-game-surface border-game-border text-slate-400'
                                }`}
                              >
                                {pData.prayed ? '✓ صُلّيت' : '✕ لم تُصلَّ'}
                              </button>

                              {/* Mosque Toggle */}
                              <button
                                type="button"
                                disabled={!pData.prayed}
                                onClick={() => handlePrayerChange(pId, 'inMosque', !pData.inMosque)}
                                className={`py-1.5 px-2 rounded-lg border font-bold text-center transition-all ${
                                  !pData.prayed 
                                    ? 'opacity-40 cursor-not-allowed border-game-border' 
                                    : pData.inMosque 
                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                                    : 'bg-game-surface border-game-border text-slate-400'
                                }`}
                              >
                                {pData.inMosque ? '🕌 بالمسجد' : 'منفرد/بالبيت'}
                              </button>
                            </div>

                            {/* Takbirah Toggle */}
                            {pData.prayed && pData.inMosque && (
                              <label className="flex items-center justify-between p-2 rounded-lg bg-game-surface/80 border border-game-border cursor-pointer hover:border-game-orange/60">
                                <span className="text-xs font-semibold text-slate-200">
                                  أدركت تكبيرة الإحرام (100 نقطة)
                                </span>
                                <input
                                  type="checkbox"
                                  checked={Boolean(pData.caughtTakbirah)}
                                  onChange={(e) => handlePrayerChange(pId, 'caughtTakbirah', e.target.checked)}
                                  className="w-4 h-4 accent-game-orange rounded"
                                />
                              </label>
                            )}

                            {/* Missed Rakats Stepper */}
                            {pData.prayed && !pData.caughtTakbirah && (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-game-surface/60 border border-game-border">
                                <span className="text-xs text-slate-400">الركعات الفائتة:</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handlePrayerChange(pId, 'missedRakats', Math.max(0, (pData.missedRakats || 0) - 1))}
                                    className="w-6 h-6 rounded bg-game-card hover:bg-game-cardHover border border-game-border text-white font-bold flex items-center justify-center"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-black text-game-red px-1.5">
                                    {pData.missedRakats || 0} من {cfg.rakats}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handlePrayerChange(pId, 'missedRakats', Math.min(cfg.rakats, (pData.missedRakats || 0) + 1))}
                                    className="w-6 h-6 rounded bg-game-card hover:bg-game-cardHover border border-game-border text-white font-bold flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // View Mode
                      return (
                        <div
                          key={pId}
                          className="p-3 rounded-xl bg-game-card/70 border border-game-border hover:border-game-orange/40 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-game-surface text-game-orange">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{cfg.name}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                {pData.caughtTakbirah ? (
                                  <span className="text-game-green font-semibold">✓ تكبيرة الإحرام</span>
                                ) : pData.inMosque ? (
                                  <span className="text-cyan-400">مسجد (فاتت التكبيرة)</span>
                                ) : pData.prayed ? (
                                  <span className="text-slate-400">صُلّيت في البيت</span>
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
                            <span className="text-[10px] text-slate-400 mr-0.5">/100</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sunnah Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>صلوات النوافل</span>
                    </h3>
                    <span className="text-[10px] text-amber-400 font-bold">
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
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                                : 'bg-game-surface border-game-border text-slate-400'
                            }`}
                          >
                            <span className="text-xs leading-tight">{s.name}</span>
                            <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isDone ? 'bg-amber-500 text-white font-black' : 'border border-game-border'}`}>
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
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                              : 'bg-game-surface/50 border-game-border/60 text-slate-500 line-through'
                          }`}
                        >
                          <span className="leading-tight">{s.name}</span>
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <span className="text-[10px] text-slate-600">-</span>
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
          <div className="p-4 border-t border-game-border bg-game-card/50">
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
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-game-surface hover:bg-game-card border border-game-border text-slate-300 font-bold text-xs transition-all"
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

