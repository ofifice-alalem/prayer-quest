/**
 * Prayer Scoring Engine
 * Rules:
 * - Points are strictly awarded for MOSQUE prayers only!
 * - Praying at home = 0 points (as requested: points are an incentive strictly for the mosque).
 * - Not prayed = 0 points.
 * - In Mosque + Takbirat Al-Ihram = 100 points (all rak'ahs caught).
 * - In Mosque + All Rak'ahs (missed Takbirah) = 80 points.
 * - In Mosque + Missed Rak'ahs: 80 points divided by prayer rak'ahs:
 *     Fajr (2 rak'ahs): 40 pts per caught rakat in mosque.
 *     Dhuhr, Asr, Isha (4 rak'ahs): 20 pts per caught rakat in mosque.
 *     Maghrib (3 rak'ahs): 26.67 pts per caught rakat in mosque.
 * - Sunnah prayers: separate 100 points track each.
 */

export const PRAYERS_CONFIG = {
  fajr: {
    id: 'fajr',
    name: 'الفجر',
    englishName: 'Fajr',
    rakats: 2,
    icon: 'Sunrise',
  },
  dhuhr: {
    id: 'dhuhr',
    name: 'الظهر',
    englishName: 'Dhuhr',
    rakats: 4,
    icon: 'Sun',
  },
  asr: {
    id: 'asr',
    name: 'العصر',
    englishName: 'Asr',
    rakats: 4,
    icon: 'SunMedium',
  },
  maghrib: {
    id: 'maghrib',
    name: 'المغرب',
    englishName: 'Maghrib',
    rakats: 3,
    icon: 'Sunset',
  },
  isha: {
    id: 'isha',
    name: 'العشاء',
    englishName: 'Isha',
    rakats: 4,
    icon: 'Moon',
  },
};

export const SUNNAH_CONFIG = [
  { id: 'sunnah_fajr', name: 'سنة الفجر القبلية', rakats: 2, desc: 'ركعتان قبل الفجر' },
  { id: 'duha', name: 'صلاة الضحى', rakats: 2, desc: 'من بعد الشروق بربع ساعة' },
  { id: 'sunnah_dhuhr', name: 'سنة الظهر الراتبة', rakats: 4, desc: 'أربع ركعات راتبة' },
  { id: 'sunnah_maghrib', name: 'سنة المغرب البعدية', rakats: 2, desc: 'ركعتان بعد المغرب' },
  { id: 'sunnah_isha', name: 'سنة العشاء البعدية', rakats: 2, desc: 'ركعتان بعد العشاء' },
  { id: 'witr', name: 'صلاة الوتر والقيام', rakats: 3, desc: 'ختام صلاة الليل' },
];

/**
 * Calculates score for a single Fard prayer
 * @param {string} prayerId - fajr | dhuhr | asr | maghrib | isha
 * @param {Object} data - { prayed: boolean, inMosque: boolean, caughtTakbirah: boolean, missedRakats: number }
 */
export function calculatePrayerScore(prayerId, data = {}) {
  const config = PRAYERS_CONFIG[prayerId];
  if (!config) return { score: 0, caughtRakats: 0, missedRakats: 0, percentage: 0 };

  const totalRakats = config.rakats;
  const isPrayed = Boolean(data.prayed);
  const inMosque = Boolean(data.inMosque);
  const caughtTakbirah = Boolean(data.caughtTakbirah);

  // If not prayed at all
  if (!isPrayed) {
    return {
      score: 0,
      caughtRakats: 0,
      missedRakats: totalRakats,
      percentage: 0,
      inMosque: false,
      caughtTakbirah: false,
      statusLabel: 'لم تُصلَّ',
    };
  }

  // Home prayer: ALWAYS 0 points as explicitly instructed!
  if (!inMosque) {
    return {
      score: 0,
      caughtRakats: totalRakats,
      missedRakats: 0,
      percentage: 0,
      inMosque: false,
      caughtTakbirah: false,
      statusLabel: 'صلاة بالبيت (0 نقطة)',
    };
  }

  // MOSQUE PRAYER CALCULATIONS:
  // 1. Takbirat Al-Ihram caught in mosque -> 100 points auto
  if (caughtTakbirah) {
    return {
      score: 100,
      caughtRakats: totalRakats,
      missedRakats: 0,
      percentage: 100,
      inMosque: true,
      caughtTakbirah: true,
      statusLabel: 'تكبيرة الإحرام بالمسجد (100%)',
    };
  }

  // 2. Missed Takbirah in mosque
  const missed = Math.max(0, Math.min(totalRakats, Number(data.missedRakats) || 0));
  const caught = totalRakats - missed;
  const pointsPerRakat = 80 / totalRakats;

  let score = 0;
  if (missed === 0) {
    score = 80; // All rak'ahs in mosque without Takbirah
  } else {
    score = Math.round(caught * pointsPerRakat * 10) / 10;
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    caughtRakats: caught,
    missedRakats: missed,
    percentage: Math.min(100, Math.round(score)),
    inMosque: true,
    caughtTakbirah: false,
    statusLabel: missed === 0 ? 'جماعة بالمسجد (80 نقطة)' : `فاتت ${missed} ركعة`,
  };
}

/**
 * Calculates day totals for Fard and Sunnah
 */
export function calculateDayScore(dayRecord = {}) {
  const prayers = dayRecord.prayers || {};
  const sunnah = dayRecord.sunnah || {};

  let totalFardScore = 0;
  let totalFardMissedRakats = 0;
  let totalFardPrayedInMosque = 0;
  let totalFardCompleted = 0;
  const prayerResults = {};

  Object.keys(PRAYERS_CONFIG).forEach((prayerId) => {
    const prayerData = prayers[prayerId] || {};
    const res = calculatePrayerScore(prayerId, prayerData);
    prayerResults[prayerId] = res;

    totalFardScore += res.score;
    totalFardMissedRakats += res.missedRakats;
    if (res.inMosque) totalFardPrayedInMosque += 1;
    if (prayerData.prayed) totalFardCompleted += 1;
  });

  // Sunnah calculations (100 pts per completed Sunnah)
  let totalSunnahScore = 0;
  let completedSunnahCount = 0;
  SUNNAH_CONFIG.forEach((s) => {
    if (sunnah[s.id]) {
      totalSunnahScore += 100;
      completedSunnahCount += 1;
    }
  });

  const maxFardScore = 500;
  const fardPercentage = Math.round((totalFardScore / maxFardScore) * 100);
  const maxSunnahScore = SUNNAH_CONFIG.length * 100;
  const sunnahPercentage = Math.round((totalSunnahScore / maxSunnahScore) * 100);

  return {
    totalFardScore,
    maxFardScore,
    fardPercentage,
    totalFardMissedRakats,
    totalFardPrayedInMosque,
    totalFardCompleted,
    prayerResults,
    totalSunnahScore,
    maxSunnahScore,
    completedSunnahCount,
    totalSunnahCount: SUNNAH_CONFIG.length,
    sunnahPercentage,
  };
}
