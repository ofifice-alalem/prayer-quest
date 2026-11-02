/**
 * IndexedDB Service for Daily Prayer Quest
 * Provides reliable, offline-first, client-side persistence with unlimited storage.
 */

const DB_NAME = 'PrayerQuestDB';
const DB_VERSION = 1;
const STORE_NAME = 'daily_prayers';

let dbInstance = null;

export function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'date' });
        store.createIndex('date', 'date', { unique: true });
        store.createIndex('month', 'month', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Creates default record for a day
 * @param {string} dateStr YYYY-MM-DD
 */
export function getDefaultDayRecord(dateStr) {
  const monthStr = dateStr.substring(0, 7); // YYYY-MM
  return {
    date: dateStr,
    month: monthStr,
    updatedAt: new Date().toISOString(),
    prayers: {
      fajr: { prayed: false, inMosque: false, caughtTakbirah: false, missedRakats: 0 },
      dhuhr: { prayed: false, inMosque: false, caughtTakbirah: false, missedRakats: 0 },
      asr: { prayed: false, inMosque: false, caughtTakbirah: false, missedRakats: 0 },
      maghrib: { prayed: false, inMosque: false, caughtTakbirah: false, missedRakats: 0 },
      isha: { prayed: false, inMosque: false, caughtTakbirah: false, missedRakats: 0 },
    },
    sunnah: {
      sunnah_fajr: false,
      duha: false,
      sunnah_dhuhr: false,
      sunnah_maghrib: false,
      sunnah_isha: false,
      witr: false,
    },
    notes: '',
  };
}

/**
 * Get single day record
 */
export async function getDayRecord(dateStr) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(dateStr);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else {
        resolve(getDefaultDayRecord(dateStr));
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Save single day record
 */
export async function saveDayRecord(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const dataToSave = {
      ...record,
      month: record.date.substring(0, 7),
      updatedAt: new Date().toISOString(),
    };
    const request = store.put(dataToSave);

    request.onsuccess = () => resolve(dataToSave);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all records for a specific month (e.g. "2026-11")
 */
export async function getMonthRecords(monthStr) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('month');
    const request = index.getAll(monthStr);

    request.onsuccess = () => {
      const records = request.result || [];
      // Map into a dictionary by date
      const recordMap = {};
      records.forEach((r) => {
        recordMap[r.date] = r;
      });
      resolve(recordMap);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all records in the database
 */
export async function getAllRecords() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Export all data as downloadable JSON
 */
export async function exportDatabaseBackup() {
  const allRecords = await getAllRecords();
  const exportPayload = {
    appName: 'Daily Prayer Quest',
    version: '1.0',
    exportDate: new Date().toISOString(),
    recordsCount: allRecords.length,
    records: allRecords,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `prayer_quest_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Import records from parsed JSON payload
 */
export async function importDatabaseBackup(jsonData) {
  if (!jsonData || !Array.isArray(jsonData.records)) {
    throw new Error('الملف المستورد غير صالح أو لا يحتوي على سجلات صحيحة.');
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    jsonData.records.forEach((rec) => {
      if (rec.date) {
        store.put({
          ...rec,
          month: rec.date.substring(0, 7),
        });
      }
    });

    transaction.oncomplete = () => resolve(jsonData.records.length);
    transaction.onerror = () => reject(transaction.error);
  });
}
