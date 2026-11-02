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
console.log('✔ Test 2 Passed: Missed Takbirah with all rakats in mosque gives 80 points');

// Test 3: Home prayer -> 0 points strictly
const dhuhrHome = calculatePrayerScore('dhuhr', { prayed: true, inMosque: false, caughtTakbirah: false, missedRakats: 0 });
assert.strictEqual(dhuhrHome.score, 0, 'Home prayer must give 0 points');
console.log('✔ Test 3 Passed: Home prayer strictly gives 0 points');

// Test 4: Dhuhr in mosque, missed Takbirah, missed 1 rakat (caught 3) -> 60 points
const dhuhrMissed1 = calculatePrayerScore('dhuhr', { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 1 });
assert.strictEqual(dhuhrMissed1.score, 60, '3 of 4 rakats should give 60 points');
console.log('✔ Test 4 Passed: Dhuhr in mosque missed 1 rakat gives 60 points');

// Test 5: Fajr in mosque, missed Takbirah, missed 1 rakat (caught 1) -> 40 points
const fajrMissed1 = calculatePrayerScore('fajr', { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 1 });
assert.strictEqual(fajrMissed1.score, 40, '1 of 2 rakats in Fajr should give 40 points');
console.log('✔ Test 5 Passed: Fajr in mosque missed 1 rakat gives 40 points');

// Test 6: Maghrib in mosque, missed 1 rakat (caught 2) -> ~53.3 points
const maghribMissed1 = calculatePrayerScore('maghrib', { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 1 });
assert.strictEqual(maghribMissed1.score, 53.3, '2 of 3 rakats in Maghrib should give 53.3 points');
console.log('✔ Test 6 Passed: Maghrib in mosque missed 1 rakat gives 53.3 points');

// Test 7: Gold Tier day (all 5 in mosque with Takbirat Al-Ihram, 0 missed)
const goldDay = calculateDayScore({
  prayers: {
    fajr: { prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 },
    dhuhr: { prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 },
    asr: { prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 },
    maghrib: { prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 },
    isha: { prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 },
  }
});
assert.strictEqual(goldDay.isGoldTier, true, 'All takbirah in mosque should be Gold Tier');
assert.strictEqual(goldDay.totalFardScore, 500);
console.log('✔ Test 7 Passed: Gold Tier recognized for 500/500 all Takbirah in mosque');

// Test 8: Silver Tier day (all 5 in mosque, 0 missed rakats, but missed some takbirah)
const silverDay = calculateDayScore({
  prayers: {
    fajr: { prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 },
    dhuhr: { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 0 }, // caught 4/4
    asr: { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 0 },   // caught 4/4
    maghrib: { prayed: true, inMosque: true, caughtTakbirah: true, missedRakats: 0 },
    isha: { prayed: true, inMosque: true, caughtTakbirah: false, missedRakats: 0 },  // caught 4/4
  }
});
assert.strictEqual(silverDay.isGoldTier, false, 'Should not be gold because takbirah missed');
assert.strictEqual(silverDay.isSilverTier, true, 'Should be Silver Tier because all 5 in mosque and 0 missed rakats');
assert.strictEqual(silverDay.totalFardMissedRakats, 0);
console.log('✔ Test 8 Passed: Silver Tier recognized for 0 missed rakats in mosque');

console.log('All scoring engine tests passed successfully! 🎉');
