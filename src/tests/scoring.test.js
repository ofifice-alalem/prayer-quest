import assert from 'node:assert';
import { calculatePrayerScore, calculateDayScore } from '../services/scoring.js';

console.log('--- Testing Scoring Engine ---');

// Test 1: Fajr caught Takbirat Al-Ihram in mosque -> 100 points auto
const fajrTakbirah = calculatePrayerScore('fajr', { prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 });
assert.strictEqual(fajrTakbirah.score, 100, 'Takbirah should give 100 points');
assert.strictEqual(fajrTakbirah.missedRakats, 0, 'Takbirah implies 0 missed rakats');
console.log('✔ Test 1 Passed: Takbirat Al-Ihram gives 100 points');

// Test 2: Dhuhr in mosque, missed Takbirat Al-Ihram, but caught all 4 rakats -> 80 points
const dhuhrNoTakbirah = calculatePrayerScore('dhuhr', { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 0 });
assert.strictEqual(dhuhrNoTakbirah.score, 80, 'Caught all rakats without takbirah should give 80 points');
assert.strictEqual(dhuhrNoTakbirah.missedRakats, 0);
console.log('✔ Test 2 Passed: Missed Takbirah with all rakats gives 80 points');

// Test 3: Dhuhr in mosque, missed Takbirah, missed 1 rakat (caught 3) -> 60 points
const dhuhrMissed1 = calculatePrayerScore('dhuhr', { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 1 });
assert.strictEqual(dhuhrMissed1.score, 60, '3 of 4 rakats should give 60 points');
console.log('✔ Test 3 Passed: Dhuhr missed 1 rakat gives 60 points');

// Test 4: Fajr in mosque, missed Takbirah, missed 1 rakat (caught 1) -> 40 points
const fajrMissed1 = calculatePrayerScore('fajr', { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 1 });
assert.strictEqual(fajrMissed1.score, 40, '1 of 2 rakats in Fajr should give 40 points');
console.log('✔ Test 4 Passed: Fajr missed 1 rakat gives 40 points');

// Test 5: Maghrib in mosque, missed 1 rakat (caught 2) -> ~53.3 points
const maghribMissed1 = calculatePrayerScore('maghrib', { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 1 });
assert.strictEqual(maghribMissed1.score, 53.3, '2 of 3 rakats in Maghrib should give 53.3 points');
console.log('✔ Test 5 Passed: Maghrib missed 1 rakat gives 53.3 points');

// Test 6: Day calculations with Sunnah
const daySample = {
  prayers: {
    fajr: { prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 }, // 100
    dhuhr: { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 0 }, // 80
    asr: { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 1 }, // 60
    maghrib: { prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 }, // 100
    isha: { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 2 }, // 40
  },
  sunnah: {
    sunnah_fajr: true, // 100
    witr: true, // 100
    duha: false,
  }
};

const dayRes = calculateDayScore(daySample);
assert.strictEqual(dayRes.totalFardScore, 380, 'Total Fard score should be 380');
assert.strictEqual(dayRes.totalFardMissedRakats, 3, 'Total missed rakats should be 1 + 2 = 3');
assert.strictEqual(dayRes.totalSunnahScore, 200, 'Sunnah score should be 200');
assert.strictEqual(dayRes.completedSunnahCount, 2, '2 Sunnah completed');
console.log('✔ Test 6 Passed: Day totals and Sunnah separate track are accurate');

console.log('All scoring engine tests passed successfully! 🎉');
