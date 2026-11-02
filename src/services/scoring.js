/**
 * Prayer Scoring Engine
 * Rules:
 * - 100 points maximum per Fard prayer.
 * - Takbirat Al-Ihram = 20 points.
 * - If caughtTakbirah is true -> Automatically 100 points, 0 missed rakats.
 * - If caughtTakbirah is false, but missedRakats == 0 -> 80 points (80%).
 * - If missedRakats > 0 -> 80 points distributed among prayer rakats:
 *     Fajr (2 rakats): 40 pts per caught rakat
 *     Dhuhr, Asr, Isha (4 rakats): 20 pts per caught rakat
 *     Maghrib (3 rakats): (80 / 3) pts per caught rakat (~26.67 pts)
 * - Sunnah prayers: separate 100 points track each.
 */

export const PRAYERS_CONFIG = {
  fajr: {
    id: 'fajr',
    name: 'الفجر',
    englishName: 'Fajr',
    rakats: 2,
    icon: 'Sunrise',
    timeHint: 'الفجر الصادق حتى شروق الشمس',
  },
  dhuhr: {
    id: 'dhuhr',
    name: 'الظهر',
    englishName: 'Dhuhr',
    rakats: 4,
    icon: 'Sun',
    timeHint: 'زوال الشمس حتى وقت العصر',
  },
  asr: {
    id: 'asr',
    name: 'العصر',
    englishName: 'Asr',
    rakats: 4,
    icon: 'SunMedium',
    timeHint: 'مصير ظل الشيء مثله حتى الغروب',
  },
  maghrib: {
    id: 'maghrib',
    name: 'المغرب',
    englishName: 'Maghrib',
    rakats: 3,
    icon: 'Sunset',
    timeHint: 'غروب قرص الشمس حتى مغيب الشفق الأحمر',
  },
  isha: {
    id: 'isha',
    name: 'العشاء',
    englishName: 'Isha',
    rakats: 4,
    icon: 'Moon',
    timeHint: 'مغيب الشفق الأحمر حتى ثلث/نصف الليل',
  },
};

export const SUNNAH_CONFIG = [
  { id: 'sunnah_fajr', name: 'سنة الفجر القبلية', rakats: 2, icon: 'Sparkles', desc: 'ركعتان قبل الفجر' },
  { id: 'duha', name: 'صلاة الضحى', rakats: 2, icon: 'Sun', desc: 'من بعد شروق الشمس بربع ساعة' },
  { id: 'sunnah_dhuhr', name: 'سنة الظهر الراتبة', rakats: 4, icon: 'Clock', desc: 'أربع ركعات (أو 2 قبل و2 بعد)' },
  { id: 'sunnah_maghrib', name: 'سنة المغرب البعدية', rakats: 2, icon: 'Sunset', desc: 'ركعتان بعد المغرب' },
  { id: 'sunnah_isha', name: 'سنة العشاء البعدية', rakats: 2, icon: 'Moon', desc: 'ركعتان بعد العشاء' },
  { id: 'witr', name: 'صلاة الوتر والقيام', rakats: 3, icon: 'Star', desc: 'ركعة أو ثلاث ركعات ختام الليل' },
];

/**
 * Calculates score for a single Fard prayer
 * @param {string} prayerId - fajr | dhuhr | asr | maghrib | isha
 * @param {Object} data - { prayed: boolean, inMosque: boolean, caughtTakbirah: boolean, missedRakats: number }
 * @returns {Object} { score: number, caughtRakats: number, missedRakats: number, percentage: number }
 */
export function calculatePrayerScore(prayerId, data = {}) {
  const config = PRAYERS_CONFIG[prayerId];
  if (!config) return { score: 0, caughtRakats: 0, missedRakats: 0, percentage: 0 };

  const totalRakats = config.rakats;
  const isPrayed = Boolean(data.prayed);
  const inMosque = Boolean(data.inMosque);
  const caughtTakbirah = Boolean(data.caughtTakbirah);

  if (!isPrayed) {
    return {
      score: 0,
      caughtRakats: 0,
      missedRakats: totalRakats,
      percentage: 0,
      inMosque: false,
      caughtTakbirah: false,
    };
  }

  // If Takbirat Al-Ihram caught in mosque -> 100 points auto, 0 missed rakats
  if (caughtTakbirah && inMosque) {
    return {
      score: 100,
      caughtRakats: totalRakats,
      missedRakats: 0,
      percentage: 100,
      inMosque: true,
      caughtTakbirah: true,
    };
  }

  // Parse missed rakats
  let missed = Math.max(0, Math.min(totalRakats, Number(data.missedRakats) || 0));
  let caught = totalRakats - missed;

  // 80 points allocated to rakats
  let pointsPerRakat = 80 / totalRakats;
  let score = 0;

  if (missed === 0) {
    // Caught all rakats but missed Takbirat Al-Ihram
    score = 80;
  } else {
    // Missed some rakats
    score = Math.round(caught * pointsPerRakat * 10) / 10;
  }

  // If not prayed in mosque at all, prayer is still valid but mosque/takbirah bonuses do not apply
  if (!inMosque) {
    // Home prayer: base rakats points only (up to 80 max, or 70)
    score = Math.min(score, Math.round(caught * pointsPerRakat * 10) / 10);
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    caughtRakats: caught,
    missedRakats: missed,
    percentage: Math.min(100, Math.round(score)),
    inMosque,
    caughtTakbirah: false,
  };
}

/**
 * Calculates day totals for Fard and Sunnah
 * @param {Object} dayRecord - { prayers: { fajr: {...}, ... }, sunnah: { witr: true, ... } }
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
