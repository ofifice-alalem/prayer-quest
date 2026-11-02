import React from 'react';
import { 
  Zap, 
  Calendar as CalendarIcon, 
  Activity, 
  Sparkles, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  ShieldCheck 
} from 'lucide-react';
import { exportDatabaseBackup } from '../services/db';

export const NAVIGATION_TABS = [
  {
    id: 'today',
    title: 'صلوات اليوم',
    subtitle: 'تسجيل الفرائض والنوافل',
    icon: Zap,
    badge: 'اليوم',
  },
  {
    id: 'calendar',
    title: 'التقويم الشهري',
    subtitle: 'عرض الأيام والتعديل بالدرور',
    icon: CalendarIcon,
  },
  {
    id: 'missed',
    title: 'الركعات الفائتة',
    subtitle: 'تحليل الأيام والركعات الضائعة',
    icon: Activity,
  },
  {
    id: 'mosque',
    title: 'المسجد والنوافل',
    subtitle: 'الصلوات الخارجية والسنن',
    icon: Sparkles,
  },
  {
    id: 'export',
    title: 'السجل والتصدير',
    subtitle: 'مصفوفة الشهر وPDF / صور',
    icon: FileSpreadsheet,
  },
];

export default function Sidebar({ activeTab, setActiveTab, onImportClick }) {
  const handleExportBackup = async () => {
    try {
      await exportDatabaseBackup();
    } catch (err) {
      alert('حدث خطأ أثناء تنزيل النسخة الاحتياطية: ' + err.message);
    }
  };

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="sticky top-24 space-y-4">
        
        {/* Navigation Card */}
        <div className="steam-glass rounded-2xl p-3 border border-game-border shadow-steam-card">
          <div className="px-3 py-2 text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
            <span>لوحة التحكم الرئيسية</span>
            <span className="w-2 h-2 rounded-full bg-game-orange animate-ping"></span>
          </div>

          <nav className="mt-2 space-y-1.5" aria-label="أقسام الموقع">
            {NAVIGATION_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-game-orange to-amber-600 text-white shadow-glow-orange scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-game-card/80 hover:border-game-border/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-game-surface text-game-orange group-hover:text-amber-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black tracking-wide leading-tight">
                        {tab.title}
                      </div>
                      <div
                        className={`text-[11px] font-normal leading-tight mt-0.5 ${
                          isActive ? 'text-white/80' : 'text-slate-400'
                        }`}
                      >
                        {tab.subtitle}
                      </div>
                    </div>
                  </div>

                  {tab.badge && !isActive && (
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-game-orange/20 text-game-orange border border-game-orange/40">
                      {tab.badge}
                    </span>
                  )}

                  {isActive && (
                    <div className="w-1.5 h-6 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Cloud/GitHub Backup Card */}
        <div className="steam-glass rounded-2xl p-4 border border-game-border/80 text-right space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-game-green" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                بياناتك في أمان
              </span>
            </div>
            <span className="text-[10px] font-bold text-game-green bg-game-green/10 px-2 py-0.5 rounded border border-game-green/30">
              IndexedDB
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            محفوظة تلقائياً في متصفحك. يمكنك تنزيل نسخة احتياطية لرفعها إلى GitHub أو نقلها إلى أي جهاز آخر.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-game-surface hover:bg-game-card border border-game-border hover:border-game-orange/60 text-xs font-bold text-slate-200 transition-all active:scale-95"
              title="تنزيل نسخة احتياطية بصيغة JSON"
            >
              <Download className="w-3.5 h-3.5 text-game-orange" />
              <span>تصدير نسخة</span>
            </button>

            <button
              onClick={onImportClick}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-game-surface hover:bg-game-card border border-game-border hover:border-cyan-400 text-xs font-bold text-slate-200 transition-all active:scale-95"
              title="استيراد نسخة سابقة من جهازك"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>استيراد نسخة</span>
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}

