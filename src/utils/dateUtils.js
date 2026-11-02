/**
 * Date and Calendar Utilities (Arabic & Gregorian)
 */

export const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * Returns formatted date string YYYY-MM-DD
 * @param {Date} date
 */
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayKey() {
  return formatDateKey(new Date());
}

/**
 * Checks if a given date string is in the future
 * @param {string} dateStr YYYY-MM-DD
 */
export function isFutureDate(dateStr) {
  const today = getTodayKey();
  return dateStr > today;
}

/**
 * Formats date into readable Arabic string
 * e.g. "الإثنين، 2 نوفمبر 2026"
 * @param {string} dateStr YYYY-MM-DD
 */
export function formatArabicDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayName = ARABIC_DAYS[dateObj.getDay()];
  const monthName = ARABIC_MONTHS[month - 1];
  return `${dayName}، ${day} ${monthName} ${year}`;
}

/**
 * Generates month calendar matrix days
 * @param {number} year e.g. 2026
 * @param {number} month 1-12
 */
export function generateMonthGrid(year, month) {
  // First day of month (0 = Sunday, 1 = Monday, ...)
  const firstDay = new Date(year, month - 1, 1).getDay();
  // Total days in month
  const totalDays = new Date(year, month, 0).getDate();

  const days = [];
  // Leading empty/padding cells (starting week on Sunday)
  for (let i = 0; i < firstDay; i++) {
    days.push({ empty: true, id: `pad-${i}` });
  }

  // Actual days
  const todayKey = getTodayKey();
  for (let d = 1; d <= totalDays; d++) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(month).padStart(2, '0');
    const dateKey = `${year}-${mStr}-${dStr}`;
    const isFuture = dateKey > todayKey;
    const isToday = dateKey === todayKey;

    days.push({
      empty: false,
      dayNumber: d,
      dateKey,
      isFuture,
      isToday,
    });
  }

  return days;
}

