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
  AlertCircle, 
  Sparkles, 
  ShieldAlert, 
  Save, 
  RotateCcw,
  Clock
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

  const handlePrayerToggle = (prayerId, field, value) => {
    setRecord((prev) => {
      const prayers = { ...prev.prayers };
      const current = { ...(prayers[prayerId] || {}) };

      if (field === 'caughtTakbirah') {
        if (value === true) {
          // Automatic 100% logic: inMosque must be true, prayed must be true, missedRakats = 0
          current.prayed = true;
          current.inMosque = true;
          current.caughtTakbirah = true;
          current.missedRakats = 0;
        } else {
          current.caughtTakbirah = false;
        }
      } else if (field === 'prayed' && value === false) {
        current.prayed = false;
        current.inMosque = false;
        current.caughtTakbirah = false;
        current.missedRakats = PRAYERS_CONFIG[prayerId].rakats;
      } else if (field === 'inMosque' && value === false) {
        current.inMosque = false;
        current.caughtTakbirah = false;
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
      <div className="py-24 text-center text-slate-400">
        جاري تحميل صلوات اليوم...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Hero / Daily Quest HUD Banner */}
      <div className="steam-glass rounded-2xl p-5 sm:p-7 border border-game-border shadow-steam-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-game-orange/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-game-orange">
              <span className="w-2.5 h-2.5 rounded-full bg-game-orange animate-pulse"></span>
              <span>المهمة اليومية النشطة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              صلوات {formatArabicDate(todayKey)}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              سجّل صلواتك الخمس ونوافلك اليومية لحصد النقاط ورفع تصنيفك الإيماني
            </p>
          </div>

          {/* Quick Score Meter */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 bg-game-surface/90 px-4 py-3 rounded-xl border border-game-border">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-bold">نقاط الفرائض</div>
              <div className="text-xl sm:text-2xl font-black text-game-orange">
                {dayScore.totalFardScore} <span className="text-xs text-slate-400 font-normal">/ 500</span>
              </div>
            </div>

            <div className="h-8 w-px bg-game-border"></div>

            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-bold">نقاط النوافل</div>
              <div className="text-xl sm:text-2xl font-black text-amber-400">
                {dayScore.totalSunnahScore} <span className="text-xs text-slate-400 font-normal">نقطة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-4 border-t border-game-border/60">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-slate-300">مستوى إتمام صلوات اليوم</span>
            <span className="text-game-orange font-black">{dayScore.fardPercentage}%</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-game-bg border border-game-border/80 overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-game-orange via-amber-500 to-emerald-400 transition-all duration-500 shadow-glow-orange"
              style={{ width: `${dayScore.fardPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Five Fard Prayers Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-white">الصلوات الخمس المفروضة</h3>
            <p className="text-xs text-slate-400">
              تكبيرة الإحرام بالمسجد تمنح 100 نقطة تلقائياً | الصلاة كاملة بدون تكبيرة الإحرام تمنح 80 نقطة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(PRAYERS_CONFIG).map((prayerId) => {
            const config = PRAYERS_CONFIG[prayerId];
            const Icon = PRAYER_ICONS[prayerId] || Sun;
            const pData = record.prayers[prayerId] || {};
            const pScore = calculatePrayerScore(prayerId, pData);

            return (
              <div 
                key={prayerId}
                className={`steam-glass rounded-2xl p-5 border transition-all duration-300 relative group ${
                  pData.caughtTakbirah 
                    ? 'border-emerald-500/70 shadow-glow-green bg-gradient-to-b from-game-card to-emerald-950/20' 
                    : pData.prayed 
                    ? 'border-game-border hover:border-game-orange/60' 
                    : 'border-game-border/60 opacity-90'
                }`}
              >
                {/* Top Prayer Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      pData.caughtTakbirah 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-game-surface text-game-orange'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">{config.name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">{config.rakats} ركعات مفروضة</span>
                    </div>
                  </div>

                  {/* Score Pill */}
                  <div className="text-left px-3 py-1 rounded-lg bg-game-surface/90 border border-game-border">
                    <span className="text-base font-black text-game-orange">{pScore.score}</span>
                    <span className="text-[10px] text-slate-400 mr-0.5">/100</span>
                  </div>
                </div>

                {/* Primary Action Switches */}
                <div className="space-y-3">
                  
                  {/* Prayed Toggle Button */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrayerToggle(prayerId, 'prayed', !pData.prayed)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        pData.prayed 
                          ? 'bg-emerald-500/20 border-emerald-500/80 text-emerald-300' 
                          : 'bg-game-surface border-game-border text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{pData.prayed ? 'تمت الصلاة' : 'لم تُصلَّ'}</span>
                    </button>

                    {/* Mosque Toggle */}
                    <button
                      type="button"
                      disabled={!pData.prayed}
                      onClick={() => handlePrayerToggle(prayerId, 'inMosque', !pData.inMosque)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        !pData.prayed 
                          ? 'opacity-40 cursor-not-allowed border-game-border' 
                          : pData.inMosque 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                          : 'bg-game-surface border-game-border text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🕌</span>
                      <span>{pData.inMosque ? 'في المسجد' : 'في البيت'}</span>
                    </button>
                  </div>

                  {/* Takbirat Al-Ihram Toggle (Auto 100%) */}
                  {pData.prayed && pData.inMosque && (
                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      pData.caughtTakbirah 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' 
                        : 'bg-game-surface/80 border-game-border hover:border-game-orange/60'
                    }`}>
                      <div className="text-right">
                        <div className="text-xs font-black">أدركت تكبيرة الإحرام</div>
                        <div className="text-[10px] text-slate-400">تحتسب 100 نقطة تلقائياً وكامل الركعات</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(pData.caughtTakbirah)}
                        onChange={(e) => handlePrayerToggle(prayerId, 'caughtTakbirah', e.target.checked)}
                        className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                      />
                    </label>
                  )}

                  {/* Missed Rakats Counter (If Takbirah was missed) */}
                  {pData.prayed && !pData.caughtTakbirah && (
                    <div className="p-3 rounded-xl bg-game-surface/80 border border-game-border flex items-center justify-between">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-300">الركعات الفائتة:</span>
                        <div className="text-[10px] text-slate-400">
                          {pData.missedRakats > 0 ? `ضاعت ${pData.missedRakats} ركعة` : 'أدركت جميع الركعات (80 نقطة)'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePrayerToggle(prayerId, 'missedRakats', Math.max(0, (pData.missedRakats || 0) - 1))}
                          className="w-7 h-7 rounded-lg bg-game-card hover:bg-game-cardHover border border-game-border text-white font-black flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span className={`w-6 text-center text-sm font-black ${
                          pData.missedRakats > 0 ? 'text-game-red' : 'text-game-green'
                        }`}>
                          {pData.missedRakats || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePrayerToggle(prayerId, 'missedRakats', Math.min(config.rakats, (pData.missedRakats || 0) + 1))}
                          className="w-7 h-7 rounded-lg bg-game-card hover:bg-game-cardHover border border-game-border text-white font-black flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sunnah Prayers Track */}
      <div className="steam-glass rounded-2xl p-5 sm:p-6 border border-game-border shadow-steam-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">صلوات النوافل والسنن الرواتب</h3>
              <p className="text-xs text-slate-400">
                100 نقطة لكل نافلة | مسار نقاط منفصل لا يؤثر على نسبة الفرائض
              </p>
            </div>
          </div>

          <span className="text-xs font-black text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
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
                className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between group ${
                  isCompleted
                    ? 'bg-amber-500/20 border-amber-500/80 shadow-sm text-amber-200'
                    : 'bg-game-surface/80 border-game-border hover:border-amber-500/40 text-slate-400 hover:text-white'
                }`}
              >
                <div>
                  <div className="text-sm font-black leading-snug">{s.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{s.desc}</div>
                </div>

                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-amber-500 text-white font-black'
                    : 'border border-game-border group-hover:border-amber-400'
                }`}>
                  {isCompleted ? '✓' : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button Floating Bar */}
      <div className="sticky bottom-6 z-20 flex items-center justify-between p-4 rounded-2xl bg-game-surface/95 backdrop-blur-md border border-game-border shadow-2xl">
        <div className="flex items-center gap-2">
          {saveSuccess ? (
            <span className="text-xs font-bold text-game-green flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              تم حفظ صلوات اليوم بنجاح في IndexedDB!
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              اضغط على زر الحفظ لتحديث نقاط اليوم والمستوى العام
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

