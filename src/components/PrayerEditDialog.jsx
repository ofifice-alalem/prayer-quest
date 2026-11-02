import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Check, 
  Star, 
  Users, 
  Home, 
  RotateCcw, 
  Sunrise, 
  Sun, 
  SunMedium, 
  Sunset, 
  Moon,
  Sparkles,
  Award
} from 'lucide-react';
import { PRAYERS_CONFIG, calculatePrayerScore } from '../services/scoring';
import { saveDayRecord, getDefaultDayRecord } from '../services/db';
import confetti from 'canvas-confetti';

const PRAYER_ICONS = {
  fajr: Sunrise,
  dhuhr: Sun,
  asr: SunMedium,
  maghrib: Sunset,
  isha: Moon,
};

export default function PrayerEditDialog({ isOpen, onClose, cellData, onSaveSuccess }) {
  const [saving, setSaving] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimateIn(true), 15);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  if (!isOpen || !cellData) return null;

  const { row, prayerId } = cellData;
  const prayerConfig = PRAYERS_CONFIG[prayerId];
  if (!prayerConfig) return null;

  const Icon = PRAYER_ICONS[prayerId] || Sun;
  const currentRecord = row.record || getDefaultDayRecord(row.dateKey);
  const currentPrayer = currentRecord.prayers?.[prayerId] || {
    prayed: false,
    inMosque: false,
    caughtTakbirah: false,
    missedRakats: 0,
  };

  const handleApplyState = async (newPrayerState) => {
    try {
      setSaving(true);
      const updatedRecord = {
        ...currentRecord,
        updatedAt: new Date().toISOString(),
        prayers: {
          ...currentRecord.prayers,
          [prayerId]: newPrayerState,
        },
      };

      await saveDayRecord(updatedRecord);

      if (newPrayerState.caughtTakbirah) {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#38BDF8'],
        });
      }

      if (onSaveSuccess) {
        onSaveSuccess(updatedRecord);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update prayer state:', err);
      alert('حدث خطأ أثناء حفظ الصلاة: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Determine current status
  let currentStatusTitle = 'لم تُسجل بعد';
  let currentBadgeColor = 'bg-slate-700/50 text-slate-400 border-slate-600';
  if (currentPrayer.prayed) {
    if (currentPrayer.inMosque) {
      if (currentPrayer.caughtTakbirah) {
        currentStatusTitle = 'تكبيرة الإحرام بالمسجد (100 نقطة)';
        currentBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      } else if ((currentPrayer.missedRakats || 0) === 0) {
        currentStatusTitle = 'جماعة كاملة بالمسجد (80 نقطة)';
        currentBadgeColor = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      } else {
        currentStatusTitle = `جماعة بالمسجد (ضاعت ${currentPrayer.missedRakats} ركعة)`;
        currentBadgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      }
    } else {
      currentStatusTitle = 'صُلّيت في البيت (0 نقطة)';
      currentBadgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    }
  }

  // Generate missed rakat options for this prayer
  const missedOptions = [];
  for (let m = 1; m < prayerConfig.rakats; m++) {
    const sc = calculatePrayerScore(prayerId, {
      prayed: true,
      inMosque: true,
      caughtTakbirah: false,
      missedRakats: m,
    });
    missedOptions.push({ missed: m, score: sc.score });
  }

  return createPortal(
    <div 
      className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 transition-all duration-300 ${
        animateIn ? 'bg-black/75 backdrop-blur-md opacity-100' : 'bg-transparent opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div 
        className={`w-full max-w-md bg-white dark:bg-[#0B0F1C] border border-slate-200 dark:border-[#1E2842] rounded-3xl p-5 sm:p-6 shadow-2xl transform transition-all duration-300 text-slate-800 dark:text-white ${
          animateIn ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1E2842]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  صلاة {prayerConfig.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#151D33] text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800">
                  {prayerConfig.rakats} ركعات مفروضة
                </span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                {row.dayName}، {row.dayNumber} {row.dateKey}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#1A2542] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all active:scale-95 border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status display */}
        <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#10172B] border border-slate-200 dark:border-[#1A243F] flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold">الحالة الحالية:</span>
          <span className={`px-2.5 py-1 rounded-lg font-black border text-[11px] ${currentBadgeColor}`}>
            {currentStatusTitle}
          </span>
        </div>

        {/* Choice actions */}
        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
          {/* Option 1: Takbirat Al-Ihram (100 Points) */}
          <button
            onClick={() => handleApplyState({ prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 })}
            disabled={saving}
            className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between group active:scale-[0.98] ${
              currentPrayer.caughtTakbirah && currentPrayer.inMosque
                ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span>تكبيرة الإحرام بالمسجد</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  أدرك الصلاة من البداية مع الإمام في المسجد
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-mono font-black text-xs shrink-0 shadow-sm">
              100 XP
            </span>
          </button>

          {/* Option 2: Full Mosque without Takbirah (80 Points) */}
          <button
            onClick={() => handleApplyState({ prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 0 })}
            disabled={saving}
            className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between group active:scale-[0.98] ${
              currentPrayer.inMosque && !currentPrayer.caughtTakbirah && (currentPrayer.missedRakats || 0) === 0
                ? 'bg-cyan-500/20 border-cyan-500 ring-2 ring-cyan-500/20'
                : 'bg-cyan-500/5 hover:bg-cyan-500/15 border-cyan-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-cyan-600 dark:text-cyan-300">
                  جماعة بالمسجد كاملة
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  أدرك جميع الركعات بالمسجد دون فوات ركعة
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500 text-white font-mono font-black text-xs shrink-0 shadow-sm">
              80 XP
            </span>
          </button>

          {/* Option 3: Missed Rakats in Mosque */}
          {missedOptions.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <div className="text-xs font-black text-rose-500 dark:text-rose-400 mb-2 flex items-center justify-between">
                <span>جماعة بالمسجد مع فوات ركعات:</span>
                <span className="text-[10px] text-slate-400 font-normal">اختر عدد الركعات الفائتة</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {missedOptions.map((opt) => (
                  <button
                    key={opt.missed}
                    onClick={() => handleApplyState({ prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: opt.missed })}
                    disabled={saving}
                    className={`p-2.5 rounded-xl border text-center transition-all active:scale-95 ${
                      currentPrayer.inMosque && currentPrayer.missedRakats === opt.missed
                        ? 'bg-rose-500 text-white border-rose-600 font-black shadow-sm'
                        : 'bg-white dark:bg-[#12192F] hover:bg-rose-500/10 border-slate-200 dark:border-[#1E2842] text-slate-700 dark:text-slate-300 font-bold'
                    }`}
                  >
                    <div className="text-xs">فاتت {opt.missed} ركعة</div>
                    <div className="text-[10px] font-mono mt-0.5 opacity-80">{opt.score} XP</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Option 4: Prayed at Home (0 Points) */}
          <button
            onClick={() => handleApplyState({ prayed: true, inMosque: false, caughtTakbirah: false, missedRakats: 0 })}
            disabled={saving}
            className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between group active:scale-[0.98] ${
              currentPrayer.prayed && !currentPrayer.inMosque
                ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-slate-50 dark:bg-[#10172B] hover:bg-amber-500/10 border-slate-200 dark:border-[#1E2842]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-800 dark:text-slate-200">
                  صلاة في البيت
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  صُلّيت في البيت، وتُحتسب 0 نقطة لاشتراط المسجد
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs shrink-0">
              0 XP
            </span>
          </button>

          {/* Option 5: Not Prayed / Reset */}
          <button
            onClick={() => handleApplyState({ prayed: false, inMosque: false, caughtTakbirah: false, missedRakats: 0 })}
            disabled={saving}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#1E2842] hover:border-slate-400 dark:hover:border-slate-600 bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط الصلاة (لم تُصلَّ بعد)</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

