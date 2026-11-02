import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Image as ImageIcon, 
  FileText, 
  ChevronRight, 
  ChevronLeft
} from 'lucide-react';
import { getMonthRecords } from '../services/db';
import { calculateDayScore } from '../services/scoring';
import { ARABIC_MONTHS, ARABIC_DAYS, getTodayKey } from '../utils/dateUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ExportPage({ refreshTrigger }) {
  const today = new Date();
  const todayKey = getTodayKey();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [monthRecords, setMonthRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [exportingImage, setExportingImage] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [viewOnlyUntilToday, setViewOnlyUntilToday] = useState(true);

  const tableRef = useRef(null);

  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  useEffect(() => {
    loadData();
  }, [currentYear, currentMonth, refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      const records = await getMonthRecords(monthStr);
      setMonthRecords(records);
    } catch (err) {
      console.error('Failed to load export data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate days to display
  const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1;
  const currentDayNumber = isCurrentMonth ? today.getDate() : totalDaysInMonth;

  const maxDay = viewOnlyUntilToday && isCurrentMonth ? currentDayNumber : totalDaysInMonth;

  const rows = [];
  for (let d = 1; d <= maxDay; d++) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(currentMonth).padStart(2, '0');
    const dateKey = `${currentYear}-${mStr}-${dStr}`;
    const dateObj = new Date(currentYear, currentMonth - 1, d);
    const dayName = ARABIC_DAYS[dateObj.getDay()];

    const rec = monthRecords[dateKey];
    const dayScore = rec ? calculateDayScore(rec) : null;

    rows.push({
      dayNumber: d,
      dayName,
      dateKey,
      record: rec,
      dayScore,
    });
  }

  // Export as Image (PNG)
  const handleExportPNG = async () => {
    if (!tableRef.current) return;
    try {
      setExportingImage(true);
      const isDark = document.documentElement.classList.contains('dark');
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: isDark ? '#0E1424' : '#FFFFFF',
      });
      const imageURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `prayer_matrix_${monthStr}.png`;
      link.href = imageURL;
      link.click();
    } catch (err) {
      alert('حدث خطأ أثناء تصدير الصورة: ' + err.message);
    } finally {
      setExportingImage(false);
    }
  };

  // Export as PDF
  const handleExportPDF = async () => {
    try {
      setExportingPdf(true);
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      const title = `سجل صلوات شهر ${ARABIC_MONTHS[currentMonth - 1]} ${currentYear}`;
      doc.setFontSize(16);
      doc.text(title, 400, 35, { align: 'center' });

      const headers = [
        ['اليوم والتاريخ', 'الفجر (2)', 'الظهر (4)', 'العصر (4)', 'المغرب (3)', 'العشاء (4)', 'نقاط المسجد', 'الركعات الفائتة']
      ];

      const bodyData = rows.map((r) => {
        const prayers = r.record ? r.record.prayers || {} : {};
        const score = r.dayScore;

        const cellSymbol = (pId) => {
          const p = prayers[pId];
          if (!p || !p.prayed) return '-';
          if (p.inMosque) {
            if (p.caughtTakbirah || (p.missedRakats || 0) === 0) return 'OK';
            return `missed ${p.missedRakats}`;
          }
          return 'Home (0)';
        };

        return [
          `${r.dayName} ${r.dayNumber}`,
          cellSymbol('fajr'),
          cellSymbol('dhuhr'),
          cellSymbol('asr'),
          cellSymbol('maghrib'),
          cellSymbol('isha'),
          score ? `${score.totalFardScore}/500` : '0/500',
          score ? `${score.totalFardMissedRakats}` : '0',
        ];
      });

      doc.autoTable({
        head: headers,
        body: bodyData,
        startY: 50,
        styles: { halign: 'center', fontSize: 9 },
        headStyles: { fillColor: [245, 158, 11] },
      });

      doc.save(`prayer_matrix_${monthStr}.pdf`);
    } catch (err) {
      alert('حدث خطأ أثناء تصدير PDF: ' + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="gaming-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-[#1E2842] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              السجل الشهري والتصدير
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              مصفوفة كاملة لأيام الشهر مع إمكانية التصدير كصورة عالية الدقة أو PDF
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            disabled={exportingImage}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0E1424] dark:hover:bg-[#1A2542] border border-slate-200 dark:border-[#1E2842] hover:border-amber-500 text-xs font-bold text-slate-700 dark:text-white transition-all active:scale-95 shadow-sm"
          >
            <ImageIcon className="w-4 h-4 text-amber-500" />
            <span>{exportingImage ? 'جاري التصدير...' : 'تصدير كصورة PNG'}</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0E1424] dark:hover:bg-[#1A2542] border border-slate-200 dark:border-[#1E2842] hover:border-cyan-500 text-xs font-bold text-slate-700 dark:text-white transition-all active:scale-95 shadow-sm"
          >
            <FileText className="w-4 h-4 text-cyan-500" />
            <span>{exportingPdf ? 'جاري الإنشاء...' : 'تصدير كملف PDF'}</span>
          </button>

          {/* Month Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0E1424] p-1 rounded-xl border border-slate-200 dark:border-[#1E2842]">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-[#1A2542] text-slate-700 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-black text-slate-900 dark:text-white font-mono">
              {ARABIC_MONTHS[currentMonth - 1]}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-[#1A2542] text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Mode Switcher */}
      <div className="flex items-center justify-between text-xs font-bold px-2">
        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={viewOnlyUntilToday}
            onChange={(e) => setViewOnlyUntilToday(e.target.checked)}
            className="w-4 h-4 accent-amber-500 rounded"
          />
          <span>عرض الأيام حتى اليوم الحالي فقط ({maxDay} يوماً)</span>
        </label>

        <span className="text-slate-500 dark:text-slate-400">
          الرمز <span className="text-emerald-500 font-black">✓</span> يعني صلاة المسجد كاملة | الرقم يُشير لعدد الركعات الفائتة بالمسجد
        </span>
      </div>

      {/* Printable / Exportable Table Container */}
      <div 
        ref={tableRef}
        className="gaming-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-[#1E2842] overflow-x-auto shadow-sm"
      >
        {/* Table Title for exported image */}
        <div className="mb-4 pb-3 border-b border-slate-200 dark:border-[#1E2842] flex items-center justify-between">
          <div className="text-right">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              سجل صلوات شهر {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              متتبع الصلوات اليومية | Daily Prayer Quest
            </p>
          </div>

          <div className="text-left text-xs text-slate-500 dark:text-slate-400 font-mono">
            <div>النقاط القصوى: 500 نقطة/يوم</div>
            <div className="text-amber-600 dark:text-amber-400 font-bold">تكبيرة الإحرام بالمسجد 100%</div>
          </div>
        </div>

        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1E2842] bg-slate-50 dark:bg-[#0E1424] text-slate-700 dark:text-slate-300 font-black">
              <th className="py-3 px-3 text-right">اليوم والتاريخ</th>
              <th className="py-3 px-3 text-center">الفجر (2)</th>
              <th className="py-3 px-3 text-center">الظهر (4)</th>
              <th className="py-3 px-3 text-center">العصر (4)</th>
              <th className="py-3 px-3 text-center">المغرب (3)</th>
              <th className="py-3 px-3 text-center">العشاء (4)</th>
              <th className="py-3 px-3 text-center">نقاط المسجد</th>
              <th className="py-3 px-3 text-center">الفائت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#1E2842]/50">
            {rows.map((row) => {
              const rec = row.record;
              const prayers = rec ? rec.prayers || {} : {};

              const renderPrayerCell = (prayerId) => {
                const p = prayers[prayerId];
                if (!p || !p.prayed) {
                  return (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#0E1424] text-slate-400 font-bold">
                      -
                    </span>
                  );
                }

                // If prayed in mosque with full rak'ahs (either caught takbirah or missed 0)
                if (p.inMosque && (p.caughtTakbirah || (p.missedRakats || 0) === 0)) {
                  return (
                    <span 
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-sm shadow-sm ${
                        p.caughtTakbirah 
                          ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-cyan-500/20 border border-cyan-500 text-cyan-600 dark:text-cyan-300'
                      }`}
                      title={p.caughtTakbirah ? 'أدرك تكبيرة الإحرام (100 نقطة)' : 'أدرك جميع الركعات (80 نقطة)'}
                    >
                      ✓
                    </span>
                  );
                }

                // If missed rak'ahs in mosque
                if (p.inMosque && p.missedRakats > 0) {
                  return (
                    <span 
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500 text-rose-500 font-black text-sm font-mono shadow-sm"
                      title={`ضاعت ${p.missedRakats} ركعة بالمسجد`}
                    >
                      {p.missedRakats}
                    </span>
                  );
                }

                // Prayed at home (0 points)
                if (!p.inMosque) {
                  return (
                    <span 
                      className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-[10px]"
                      title="صُلّيت في البيت (0 نقطة)"
                    >
                      بيت (0)
                    </span>
                  );
                }

                return <span>-</span>;
              };

              const dayScore = row.dayScore;
              const hasData = Boolean(rec && dayScore && dayScore.totalFardCompleted > 0);

              return (
                <tr 
                  key={row.dateKey}
                  className={`hover:bg-slate-50 dark:hover:bg-[#141B30] transition-colors ${
                    row.dateKey === todayKey ? 'bg-amber-500/5 font-bold' : ''
                  }`}
                >
                  {/* Date column */}
                  <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-800 dark:text-white">
                    <span className="font-mono text-amber-600 dark:text-amber-400 ml-1">{row.dayNumber}</span>
                    <span>{row.dayName}</span>
                    {row.dateKey === todayKey && (
                      <span className="mr-1.5 px-1.5 py-0.2 rounded text-[9px] bg-amber-500 text-black font-black">
                        اليوم
                      </span>
                    )}
                  </td>

                  {/* 5 Prayers */}
                  <td className="py-2 px-2 text-center">{renderPrayerCell('fajr')}</td>
                  <td className="py-2 px-2 text-center">{renderPrayerCell('dhuhr')}</td>
                  <td className="py-2 px-2 text-center">{renderPrayerCell('asr')}</td>
                  <td className="py-2 px-2 text-center">{renderPrayerCell('maghrib')}</td>
                  <td className="py-2 px-2 text-center">{renderPrayerCell('isha')}</td>

                  {/* Fard Score */}
                  <td className="py-2 px-3 text-center font-mono font-black">
                    {hasData ? (
                      <span className={dayScore.totalFardScore >= 400 ? 'text-emerald-500' : 'text-amber-500'}>
                        {dayScore.totalFardScore}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Total Missed */}
                  <td className="py-2 px-3 text-center font-mono font-bold">
                    {hasData && dayScore.totalFardMissedRakats > 0 ? (
                      <span className="text-rose-500">
                        {dayScore.totalFardMissedRakats}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
