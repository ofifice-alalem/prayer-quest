import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Image as ImageIcon, 
  FileText, 
  Download, 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Sparkles,
  Printer
} from 'lucide-react';
import { getMonthRecords } from '../services/db';
import { PRAYERS_CONFIG, calculatePrayerScore, calculateDayScore } from '../services/scoring';
import { ARABIC_MONTHS, ARABIC_DAYS, getTodayKey, formatDateKey } from '../utils/dateUtils';
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
      const canvas = await html2canvas(tableRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#0B132B',
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

      // Title & Metadata
      doc.setFontSize(18);
      doc.text(`Prayer Quest Matrix - ${ARABIC_MONTHS[currentMonth - 1]} ${currentYear}`, 40, 40);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('ar-EG')}`, 40, 60);

      const tableData = rows.map((r) => {
        const prayers = r.record ? r.record.prayers || {} : {};
        
        const getCellText = (pId) => {
          const p = prayers[pId];
          if (!p || !p.prayed) return '-';
          if (p.caughtTakbirah && p.inMosque) return '✓ (100)';
          if (p.inMosque && (p.missedRakats || 0) === 0) return '✓ (80)';
          if (p.missedRakats > 0) return `Missed: ${p.missedRakats}`;
          if (!p.inMosque) return 'Home';
          return '✓';
        };

        return [
          `${r.dayNumber} - ${r.dayName}`,
          getCellText('fajr'),
          getCellText('dhuhr'),
          getCellText('asr'),
          getCellText('maghrib'),
          getCellText('isha'),
          r.dayScore ? `${r.dayScore.totalFardScore}/500` : '0',
          r.dayScore ? `${r.dayScore.totalFardMissedRakats}` : '0',
        ];
      });

      doc.autoTable({
        startY: 75,
        head: [['Day', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Points', 'Missed Rakats']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
        headStyles: { fillColor: [255, 122, 0], textColor: [255, 255, 255] },
      });

      doc.save(`prayer_matrix_${monthStr}.pdf`);
    } catch (err) {
      alert('حدث خطأ أثناء إنشاء ملف PDF: ' + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Action Bar */}
      <div className="steam-glass rounded-2xl p-5 sm:p-6 border border-game-border shadow-steam-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-game-orange/20 border border-game-orange/40 flex items-center justify-center text-game-orange shadow-glow-orange">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              السجل الشهري الشامل واستوديو التصدير
            </h2>
            <p className="text-xs text-slate-400">
              جدول الفرائض مع علامة (✓) لصلاة المسجد ورقم الركعات الفائتة، مع إمكانية التصدير المباشر
            </p>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            disabled={exportingImage}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-game-card hover:bg-game-cardHover border border-game-border hover:border-game-orange text-xs font-bold text-white transition-all active:scale-95 shadow-sm"
          >
            <ImageIcon className="w-4 h-4 text-game-orange" />
            <span>{exportingImage ? 'جاري التصدير...' : 'تصدير كصورة PNG'}</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-game-card hover:bg-game-cardHover border border-game-border hover:border-cyan-400 text-xs font-bold text-white transition-all active:scale-95 shadow-sm"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>{exportingPdf ? 'جاري الإنشاء...' : 'تصدير كملف PDF'}</span>
          </button>

          {/* Month Switcher */}
          <div className="flex items-center gap-1 bg-game-surface p-1 rounded-xl border border-game-border">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-game-card text-slate-300 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-black text-slate-200">
              {ARABIC_MONTHS[currentMonth - 1]}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-game-card text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Mode Switcher */}
      <div className="flex items-center justify-between text-xs font-bold px-2">
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={viewOnlyUntilToday}
            onChange={(e) => setViewOnlyUntilToday(e.target.checked)}
            className="w-4 h-4 accent-game-orange rounded"
          />
          <span>عرض الأيام حتى اليوم الحالي فقط ({maxDay} يوماً)</span>
        </label>

        <span className="text-slate-400">
          الرمز <span className="text-game-green font-black">✓</span> يعني صلاة المسجد كاملة | الرقم يُشير لعدد الركعات الفائتة
        </span>
      </div>

      {/* Printable / Exportable Table Container */}
      <div 
        ref={tableRef}
        className="steam-glass rounded-2xl p-5 sm:p-6 border border-game-border shadow-steam-card overflow-x-auto"
      >
        {/* Table Title for exported image */}
        <div className="mb-4 pb-3 border-b border-game-border/80 flex items-center justify-between">
          <div className="text-right">
            <h3 className="text-lg font-black text-white">
              سجل صلوات شهر {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
            </h3>
            <p className="text-xs text-slate-400">
              متتبع الصلوات اليومية | Daily Prayer Quest
            </p>
          </div>

          <div className="text-left text-xs text-slate-400">
            <div>النقاط القصوى: 500 نقطة/يوم</div>
            <div className="text-game-orange font-bold">تكبيرة الإحرام 20 نقطة</div>
          </div>
        </div>

        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b-2 border-game-border bg-game-surface/80 text-slate-300 font-black">
              <th className="py-3 px-3 text-right">اليوم والتاريخ</th>
              <th className="py-3 px-3 text-center">الفجر (2)</th>
              <th className="py-3 px-3 text-center">الظهر (4)</th>
              <th className="py-3 px-3 text-center">العصر (4)</th>
              <th className="py-3 px-3 text-center">المغرب (3)</th>
              <th className="py-3 px-3 text-center">العشاء (4)</th>
              <th className="py-3 px-3 text-center">النقاط</th>
              <th className="py-3 px-3 text-center">الفائت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-game-border/50">
            {rows.map((row) => {
              const rec = row.record;
              const prayers = rec ? rec.prayers || {} : {};

              const renderPrayerCell = (prayerId) => {
                const p = prayers[prayerId];
                if (!p || !p.prayed) {
                  return (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-game-surface/60 text-slate-600 font-bold">
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
                          ? 'bg-emerald-500/20 border border-emerald-500/80 text-emerald-400' 
                          : 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                      }`}
                      title={p.caughtTakbirah ? 'أدرك تكبيرة الإحرام (100 نقطة)' : 'أدرك جميع الركعات (80 نقطة)'}
                    >
                      ✓
                    </span>
                  );
                }

                // If missed rak'ahs -> display number of missed rak'ahs
                if (p.missedRakats > 0) {
                  return (
                    <span 
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-game-red/20 border border-game-red text-game-red font-black text-sm shadow-sm"
                      title={`ضاعت ${p.missedRakats} ركعة`}
                    >
                      {p.missedRakats}
                    </span>
                  );
                }

                // Prayed at home
                if (!p.inMosque) {
                  return (
                    <span 
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-[10px]"
                      title="صُلّيت في البيت"
                    >
                      بيت
                    </span>
                  );
                }

                return <span>-</span>;
              };

              return (
                <tr 
                  key={row.dateKey}
                  className="hover:bg-game-card/40 transition-colors"
                >
                  {/* Day Info */}
                  <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center text-game-orange font-black">{row.dayNumber}</span>
                      <span className="text-slate-300">{row.dayName}</span>
                    </div>
                  </td>

                  {/* Fajr */}
                  <td className="py-2.5 px-3 text-center">{renderPrayerCell('fajr')}</td>
                  {/* Dhuhr */}
                  <td className="py-2.5 px-3 text-center">{renderPrayerCell('dhuhr')}</td>
                  {/* Asr */}
                  <td className="py-2.5 px-3 text-center">{renderPrayerCell('asr')}</td>
                  {/* Maghrib */}
                  <td className="py-2.5 px-3 text-center">{renderPrayerCell('maghrib')}</td>
                  {/* Isha */}
                  <td className="py-2.5 px-3 text-center">{renderPrayerCell('isha')}</td>

                  {/* Points */}
                  <td className="py-2.5 px-3 text-center font-black">
                    {row.dayScore ? (
                      <span className="text-game-orange">
                        {row.dayScore.totalFardScore}
                      </span>
                    ) : (
                      <span className="text-slate-600">0</span>
                    )}
                  </td>

                  {/* Total Missed Rakats */}
                  <td className="py-2.5 px-3 text-center font-black">
                    {row.dayScore && row.dayScore.totalFardMissedRakats > 0 ? (
                      <span className="text-game-red">
                        {row.dayScore.totalFardMissedRakats}
                      </span>
                    ) : (
                      <span className="text-game-green">0</span>
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
