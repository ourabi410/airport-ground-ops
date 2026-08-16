import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GUIDE_TRANSLATIONS, GuideLanguage, GuideSection } from './guideContent';
import {
  BookOpen,
  Search,
  Languages,
  Clock,
  Smartphone,
  Fuel,
  Luggage,
  Users,
  AlertOctagon,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Printer,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  MapPin,
  FileText,
} from 'lucide-react';

export const UserGuideView: React.FC = () => {
  const { setActiveTab } = useApp();
  const [lang, setLang] = useState<GuideLanguage>('ar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedRoleIdx, setSelectedRoleIdx] = useState<number | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const t = GUIDE_TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Clock':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-amber-400" />;
      case 'Fuel':
        return <Fuel className="w-5 h-5 text-emerald-400" />;
      case 'Luggage':
        return <Luggage className="w-5 h-5 text-sky-400" />;
      case 'Users':
        return <Users className="w-5 h-5 text-indigo-400" />;
      case 'AlertOctagon':
        return <AlertOctagon className="w-5 h-5 text-red-400" />;
      case 'RefreshCw':
        return <RefreshCw className="w-5 h-5 text-teal-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-blue-400" />;
    }
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return t.sections;
    const q = searchQuery.toLowerCase();
    return t.sections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.summary.toLowerCase().includes(q) ||
        sec.steps.some(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            (s.tips && s.tips.toLowerCase().includes(q))
        ) ||
        sec.keyPoints.some((k) => k.toLowerCase().includes(q))
    );
  }, [t.sections, searchQuery]);

  const handleCopyCheatSheet = () => {
    const text = `
=== ${t.appTitle} ===
${t.cheatSheetTitle} (${t.langName})

1. ${lang === 'ar' ? 'الوصول والتثبيت' : lang === 'fr' ? 'Arrivée & Calage' : 'Arrival & Chocks'}:
   - Stamp CHOCKS ON & GPU CONNECTED immediately upon aircraft stand-still.
   - Record exact UTC timestamp & GPS latitude/longitude.

2. ${lang === 'ar' ? 'الخدمات الأرضية المتوازية' : lang === 'fr' ? 'Services au Sol' : 'Parallel Ground Services'}:
   - Start Bag Offload + Cabin Cleaning + Refueling in parallel.
   - Attach photos for any cargo hold damage or FOD hazard.

3. ${lang === 'ar' ? 'الصعود والركاب' : lang === 'fr' ? 'Embarquement & PMR' : 'Passenger Boarding & PRM'}:
   - Sequence PRM & Priority Boarding -> General Boarding.
   - Check loadsheet sign-off & verify all doors closed before pushback.

4. ${lang === 'ar' ? 'العمل دون اتصال' : lang === 'fr' ? 'Mode Hors-Ligne' : 'Offline Resilience'}:
   - IndexedDB retains all stamps with UUIDs during network loss.
   - Auto-resync flushes queue seamlessly upon reconnection.
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDirectJump = (sectionId: string) => {
    switch (sectionId) {
      case 'timeline':
        setActiveTab('flight-detail');
        break;
      case 'ramp-mode':
        setActiveTab('ramp-mode');
        break;
      case 'ground-services':
        setActiveTab('ground-services');
        break;
      case 'baggage':
        setActiveTab('baggage');
        break;
      case 'passengers':
        setActiveTab('passengers');
        break;
      case 'delays-incidents':
        setActiveTab('delays');
        break;
      case 'offline-sync':
        setActiveTab('sync');
        break;
      case 'ai-assistant':
        setActiveTab('ai-assistant');
        break;
      default:
        setActiveTab('dashboard');
    }
  };

  return (
    <div className={`space-y-6 max-w-5xl mx-auto pb-16 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Top Header & Language Selector */}
      <div className="bg-slate-800 border border-slate-700 p-5 sm:p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl shrink-0 mt-1">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  STANDARD OPERATING PROCEDURE (SOP)
                </span>
                <span className="text-xs text-slate-400 font-mono">v3.2 · DOH</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">{t.appTitle}</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-3xl">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Language Switcher Button Group */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-700 rounded-xl shrink-0 self-start md:self-center">
            <Languages className="w-4 h-4 text-slate-400 mx-2 hidden sm:block" />
            
            <button
              id="btn-lang-ar"
              onClick={() => setLang('ar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-1.5 ${
                lang === 'ar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🇸🇦</span>
              <span>العربية</span>
            </button>

            <button
              id="btn-lang-en"
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                lang === 'en'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>

            <button
              id="btn-lang-fr"
              onClick={() => setLang('fr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-1.5 ${
                lang === 'fr'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🇫🇷</span>
              <span>Français</span>
            </button>

          </div>

        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-700/80">
          <div className="relative flex-1">
            <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full bg-slate-900 border border-slate-700 rounded-lg py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 ${
                isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCheatSheet}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-600 shrink-0"
              title="Copy Summary"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>{copiedNotification ? t.copied : t.copyCheatSheet}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-600 shrink-0"
              title="Print"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">{t.printGuide}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start 4-Step Flow Banner */}
      <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-white text-base">{t.quickStartTitle}</h3>
            <p className="text-xs text-slate-400">{t.quickStartDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          
          <div className="bg-slate-900 border border-slate-700/80 p-3.5 rounded-lg space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">STEP 1</span>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div className="font-bold text-slate-100 text-xs font-sans">
              {lang === 'ar' ? 'استلام الطائرة وتثبيت الكتل' : lang === 'fr' ? 'Arrivée et Calage (Chocks)' : 'Touchdown & Chocks On'}
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {lang === 'ar'
                ? 'اختم ON_BLOCK و CHOCKS_ON فور توقف الطائرة بالموقف.'
                : lang === 'fr'
                ? 'Horodatez ON_BLOCK et CHOCKS_ON dès l’arrêt complet au stand.'
                : 'Stamp ON_BLOCK and CHOCKS_ON upon full standstill at stand.'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700/80 p-3.5 rounded-lg space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">STEP 2</span>
              <Fuel className="w-4 h-4 text-slate-500" />
            </div>
            <div className="font-bold text-slate-100 text-xs font-sans">
              {lang === 'ar' ? 'الخدمات الأرضية المتزامنة' : lang === 'fr' ? 'Déchargement & Plein Carburant' : 'Parallel Ground Servicing'}
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {lang === 'ar'
                ? 'باشر تفريغ الحقائب، تزويد الوقود، تنظيف المقصورة، والتموين بالتوازي.'
                : lang === 'fr'
                ? 'Lancez déchargement bagages, avitaillement carburant et catering en parallèle.'
                : 'Execute baggage offload, refueling, cabin cleaning and catering simultaneously.'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700/80 p-3.5 rounded-lg space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">STEP 3</span>
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <div className="font-bold text-slate-100 text-xs font-sans">
              {lang === 'ar' ? 'صعود الركاب واعتماد الحمولة' : lang === 'fr' ? 'Embarquement & Devis de Masse' : 'Boarding & Loadsheet Sign-off'}
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {lang === 'ar'
                ? 'تتبع ركاب الكراسي المتحركة (PRM)، واعتمد بطاقة الحمولة والتوازن (Loadsheet).'
                : lang === 'fr'
                ? 'Embarquez les passagers PMR, puis clôturez le devis de masse final.'
                : 'Facilitate PRM priority boarding and sign off the final loadsheet.'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700/80 p-3.5 rounded-lg space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">STEP 4</span>
              <CheckCircle2 className="w-4 h-4 text-slate-500" />
            </div>
            <div className="font-bold text-slate-100 text-xs font-sans">
              {lang === 'ar' ? 'إغلاق الأبواب ودفع الطائرة' : lang === 'fr' ? 'Fermeture Portes & Repoussage' : 'Doors Closed & Pushback'}
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {lang === 'ar'
                ? 'اختم DOORS_CLOSED و PUSHBACK لمغادرة الطائرة في الوقت المحدد (On-Time Departure).'
                : lang === 'fr'
                ? 'Horodatez DOORS_CLOSED et PUSHBACK pour un départ ponctuel réussi.'
                : 'Stamp DOORS_CLOSED and PUSHBACK for on-time operational departure.'}
            </p>
          </div>

        </div>
      </div>

      {/* Role-Based Quick Guides */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">{t.roleGuidesTitle}</h3>
            <p className="text-xs text-slate-400">{t.roleGuidesDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {t.roles.map((role, idx) => (
            <div
              key={idx}
              className={`bg-slate-800 border rounded-xl p-4 space-y-3 transition-all cursor-pointer ${
                selectedRoleIdx === idx
                  ? 'border-blue-500 shadow-md bg-slate-800/90'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => setSelectedRoleIdx(selectedRoleIdx === idx ? null : idx)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {role.badge}
                </span>
                <span className="text-xs text-slate-400">
                  {selectedRoleIdx === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">{role.roleTitle}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{role.mission}</p>
              </div>

              {selectedRoleIdx === idx && (
                <div className="pt-3 border-t border-slate-700 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    {lang === 'ar' ? 'خطوات العمل اليومية:' : lang === 'fr' ? 'Plan d’action quotidien :' : 'Daily Action Plan:'}
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {role.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold shrink-0">•</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Operational Sections */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-white text-base">{t.sectionsTitle}</h3>
          <p className="text-xs text-slate-400">
            {lang === 'ar'
              ? 'انقر على أي قسم لعرض الشرح التفصيلي خطوة بخطوة وروابط الانتقال السريع للوحدة.'
              : lang === 'fr'
              ? 'Cliquez sur une section pour afficher les instructions détaillées et l’accès direct au module.'
              : 'Click any module to inspect step-by-step instructions and launch the corresponding screen.'}
          </p>
        </div>

        <div className="space-y-3">
          {filteredSections.map((sec) => {
            const isExpanded = selectedSectionId === sec.id;
            return (
              <div
                key={sec.id}
                id={`guide-section-${sec.id}`}
                className={`bg-slate-800 border rounded-xl transition-all overflow-hidden ${
                  isExpanded ? 'border-blue-500/80 shadow-lg' : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Section Header */}
                <div
                  onClick={() => setSelectedSectionId(isExpanded ? null : sec.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 shrink-0">
                      {getIcon(sec.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-bold">
                          {sec.badge || 'MODULE'}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base mt-1">{sec.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{sec.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDirectJump(sec.id);
                      }}
                      className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors"
                      title="Open Module"
                    >
                      <span>{lang === 'ar' ? 'فتح الوحدة' : lang === 'fr' ? 'Ouvrir' : 'Open'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <div className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Section Body */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-700/80 bg-slate-800/60 space-y-4">
                    
                    {/* Summary */}
                    <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/60">
                      {sec.summary}
                    </div>

                    {/* Step-by-step */}
                    <div className="space-y-3">
                      <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        {lang === 'ar' ? 'إجراءات التنفيذ الميدانية:' : lang === 'fr' ? 'Étapes Opérationnelles :' : 'Operational Step-by-Step Flow:'}
                      </div>

                      <div className="space-y-2.5">
                        {sec.steps.map((step, sIdx) => (
                          <div key={sIdx} className="bg-slate-900 border border-slate-700/70 p-3.5 rounded-lg space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-white text-xs sm:text-sm">
                              <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px] font-mono shrink-0">
                                {sIdx + 1}
                              </span>
                              <span>{step.title}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed pr-7 pl-7">
                              {step.description}
                            </p>
                            {step.tips && (
                              <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded mx-7 mt-1 font-mono">
                                💡 {step.tips}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key points checklist */}
                    {sec.keyPoints && sec.keyPoints.length > 0 && (
                      <div className="p-3.5 bg-slate-900 border border-slate-700/70 rounded-lg space-y-2">
                        <div className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'قواعد السلامة والامتثال:' : lang === 'fr' ? 'Règles Clés de Conformité :' : 'Critical Compliance Rules:'}</span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {sec.keyPoints.map((kp, kpIdx) => (
                            <li key={kpIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{kp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Launch button inside */}
                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={() => handleDirectJump(sec.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors font-mono"
                      >
                        <span>{lang === 'ar' ? 'الانتقال إلى هذه الشاشة الآن' : lang === 'fr' ? 'Ouvrir cet écran maintenant' : 'Launch this Screen Now'}</span>
                        {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white text-base">
            {lang === 'ar' ? 'الأسئلة الشائعة والدعم الفني' : lang === 'fr' ? 'Foire Aux Questions (FAQ)' : 'Frequently Asked Questions (FAQ)'}
          </h3>
        </div>

        <div className="space-y-3">
          {t.quickFaq.map((faq, fIdx) => (
            <div key={fIdx} className="bg-slate-900 border border-slate-700/80 p-3.5 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-200 text-xs sm:text-sm flex items-start gap-2">
                <span className="text-blue-400 font-mono">Q:</span>
                <span>{faq.q}</span>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed pr-5 pl-5">
                <span className="text-emerald-400 font-mono font-bold mr-1 ml-1">A:</span>
                <span>{faq.a}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
