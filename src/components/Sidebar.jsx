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
  Award,
  Trophy,
  Target
} from 'lucide-react';
import { exportDatabaseBackup } from '../services/db';

export const NAVIGATION_TABS = [
  {
    id: 'today',
    title: 'صلوات اليوم',
    shortTitle: 'اليوم',
    subtitle: 'مهام الفرائض والنوافل',
    icon: Zap,
    badge: 'LIVE',
  },
  {
    id: 'calendar',
    title: 'التقويم الشهري',
    shortTitle: 'التقويم',
    subtitle: 'سجل الأيام والأوسمة',
    icon: CalendarIcon,
  },
  {
    id: 'missed',
    title: 'الركعات الفائتة',
    shortTitle: 'الفائتة',
    subtitle: 'تحليل الأيام السابقة',
    icon: Activity,
  },
  {
    id: 'mosque',
    title: 'المسجد والنوافل',
    shortTitle: 'المسجد',
    subtitle: 'إحصائيات الجماعة والسنن',
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

  // XP progress inside current level (1000 XP per level)
  const currentLevelXP = totalPoints % 1000;
  const nextLevelXP = 1000;
  const levelProgress = Math.min(100, Math.round((currentLevelXP / nextLevelXP) * 100));

  return (
    <aside className="hidden lg:block w-72 shrink-0 space-y-4">
      
      {/* Gamer Profile Card */}
      <div className="gaming-card rounded-2xl p-4 space-y-3.5 border-t-2 border-t-amber-500/80">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md">
              <div className="w-full h-full rounded-[14px] bg-slate-100 dark:bg-[#070A13] flex items-center justify-center text-amber-500 font-black">
                <User className="w-6 h-6" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0E1424] shadow-sm"></div>
          </div>

          <div className="text-right flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black tracking-wider uppercase font-mono">
                LVL {level} PLAYER
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono font-bold">
                RANK S
              </span>
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

        {/* Level XP Progress Bar */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1A243D] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-500 dark:text-slate-400">تقدم المستوى القادم</span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-black">
              {currentLevelXP} / {nextLevelXP} XP
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#070A13] overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 shadow-sm"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Navigation Panel */}
      <div className="gaming-card rounded-2xl p-3">
        <div className="px-3 pt-2 pb-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center justify-between font-mono">
          <span>GAME ARENA TABS</span>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        </div>

        <nav className="space-y-1.5" aria-label="أقسام التطبيق">
          {NAVIGATION_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold transition-all group relative overflow-hidden ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-md border border-amber-500 font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141C33] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-black/15 text-black font-black'
                        : 'bg-slate-100 dark:bg-[#080C17] text-slate-500 dark:text-slate-400 group-hover:text-amber-500 border border-slate-200 dark:border-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div className={`text-sm ${isActive ? 'text-black font-black' : 'text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400'}`}>
                      {tab.title}
                    </div>
                    <div className={`text-[10px] ${isActive ? 'text-black/75 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {tab.subtitle}
                    </div>
                  </div>
                </div>

                {tab.badge && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono ${
                    isActive 
                      ? 'bg-black/20 text-black' 
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
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
            <span>حفظ البيانات الآمن</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 font-mono">
            OFFLINE DB
          </span>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          جميع بيانات نقاطك وجوائزك محفوظة محلياً على جهازك. صدّر نسختك الاحتياطية دورياً.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141C33] dark:hover:bg-[#1C2747] border border-slate-200 dark:border-[#222E4D] text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
            title="تصدير نسخة احتياطية من كافة الصلوات"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>تصدير نسخة</span>
          </button>

          <button
            onClick={onImportClick}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141C33] dark:hover:bg-[#1C2747] border border-slate-200 dark:border-[#222E4D] text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
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
