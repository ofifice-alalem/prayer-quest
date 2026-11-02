import React from 'react';
import { 
  Zap, 
  Calendar as CalendarIcon, 
  Activity, 
  Sparkles, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  ShieldCheck,
  User,
  Flame,
  Award
} from 'lucide-react';
import { exportDatabaseBackup } from '../services/db';

export const NAVIGATION_TABS = [
  {
    id: 'today',
    title: 'صلوات اليوم',
    shortTitle: 'اليوم',
    subtitle: 'تسجيل الفرائض والنوافل',
    icon: Zap,
    badge: 'اليوم',
  },
  {
    id: 'calendar',
    title: 'التقويم الشهري',
    shortTitle: 'التقويم',
    subtitle: 'عرض وتعديل الأيام',
    icon: CalendarIcon,
  },
  {
    id: 'missed',
    title: 'الركعات الفائتة',
    shortTitle: 'الفائتة',
    subtitle: 'تحليل الركعات والأيام',
    icon: Activity,
  },
  {
    id: 'mosque',
    title: 'المسجد والنوافل',
    shortTitle: 'المسجد',
    subtitle: 'صلوات المسجد والسنن',
    icon: Sparkles,
  },
  {
    id: 'export',
    title: 'السجل والتصدير',
    shortTitle: 'التصدير',
    subtitle: 'مصفوفة الشهر وPDF / صور',
    icon: FileSpreadsheet,
  },
];

export default function Sidebar({ activeTab, setActiveTab, onImportClick, level = 1, totalPoints = 0 }) {
  const handleExportBackup = async () => {
    try {
      await exportDatabaseBackup();
    } catch (err) {
      alert('حدث خطأ أثناء تنزيل النسخة الاحتياطية: ' + err.message);
    }
  };

  return (
    <aside className="hidden lg:block w-72 shrink-0 space-y-4">
      
      {/* Gamer Profile Card */}
      <div className="gaming-card rounded-2xl p-4 flex items-center gap-3.5">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md">
            <div className="w-full h-full rounded-[14px] bg-slate-100 dark:bg-[#0E1424] flex items-center justify-center text-amber-500 font-black">
              <User className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#121829]"></div>
        </div>

        <div className="text-right flex-1 min-w-0">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            المُصلي المثابر
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-white truncate">
            فارس المساجد
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>تصنيف الفئة الذهبية</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Panel */}
      <div className="gaming-card rounded-2xl p-3">
        <div className="px-3 pt-2 pb-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>قائمة الأقسام</span>
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        </div>

        <nav className="space-y-1.5" aria-label="أقسام التطبيق">
          {NAVIGATION_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-md border border-amber-500 font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161F36] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-black/15 text-black font-black'
                        : 'bg-slate-100 dark:bg-[#0E1424] text-slate-500 dark:text-slate-400 group-hover:text-amber-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div className={`text-sm ${isActive ? 'text-black font-black' : 'text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400'}`}>
                      {tab.title}
                    </div>
                    <div className={`text-[10px] ${isActive ? 'text-black/70 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {tab.subtitle}
                    </div>
                  </div>
                </div>

                {tab.badge && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                    isActive 
                      ? 'bg-black/20 text-black' 
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Local IndexedDB & Storage Hub */}
      <div className="gaming-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>حفظ البيانات</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 font-mono">
            IndexedDB
          </span>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          بيانات صلواتك محفوظة بأمان على جهازك. صدّر نسختك الاحتياطية دورياً.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161F36] dark:hover:bg-[#1E2B4B] border border-slate-200 dark:border-[#243358] text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
            title="تصدير نسخة احتياطية من كافة الصلوات"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>تصدير نسخة</span>
          </button>

          <button
            onClick={onImportClick}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161F36] dark:hover:bg-[#1E2B4B] border border-slate-200 dark:border-[#243358] text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
            title="استيراد نسخة احتياطية سابقة"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-500" />
            <span>استيراد نسخة</span>
          </button>
        </div>
      </div>

    </aside>
  );
}
