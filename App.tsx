
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Palette, 
  BarChart3, 
  History, 
  Download, 
  CheckCircle2,
  X,
  Clock,
  Languages,
  LayoutDashboard,
  Lock,
  UserCircle,
  MapPinned,
  Plus,
  Calendar,
  Filter,
  AlertCircle
} from 'lucide-react';
import { storageService } from './services/storageService';
import { Visit, VisitorCategory, LocationType } from './types';
import { translations, Language } from './translations';
import StatsCard from './components/StatsCard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

const ADMIN_ID = "IPM_UNIT_P&G";
const ADMIN_PASSWORD = "Rexy";

const App: React.FC = () => {
  const [view, setView] = useState<'checkin' | 'dashboard'>('checkin');
  const [lang, setLang] = useState<Language>('en');
  const [dashboardFilter, setDashboardFilter] = useState<LocationType | 'ALL'>('ALL');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [lastVisit, setLastVisit] = useState<Visit | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  
  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminIdInput, setAdminIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Lawatan Form state
  const [showLawatanModal, setShowLawatanModal] = useState(false);
  const [lawatanLocation, setLawatanLocation] = useState<LocationType>(LocationType.MUSEUM);
  const [orgName, setOrgName] = useState('');
  const [paxCount, setPaxCount] = useState<string>('');
  const [formTouched, setFormTouched] = useState({ org: false, pax: false });

  // Date Range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const t = translations[lang];

  useEffect(() => {
    setVisits(storageService.getVisits());
  }, []);

  const handleCheckIn = (category: VisitorCategory, location: LocationType, groupInfo?: string, groupSize: number = 1) => {
    const visit = storageService.saveVisit(category, location, groupInfo, groupSize);
    setVisits(prev => [visit, ...prev]);
    setLastVisit(visit);
    setShowPopup(true);
    // Reset Lawatan form
    setOrgName('');
    setPaxCount('');
    setFormTouched({ org: false, pax: false });
    setShowLawatanModal(false);
  };

  const openLawatanForm = (location: LocationType) => {
    setLawatanLocation(location);
    setShowLawatanModal(true);
  };

  // Lawatan Validation
  const orgError = useMemo(() => {
    if (!formTouched.org) return null;
    const trimmed = orgName.trim();
    if (!trimmed) return t.errOrgRequired;
    if (trimmed.length < 3) return t.errOrgShort;
    return null;
  }, [orgName, formTouched.org, t]);

  const paxError = useMemo(() => {
    if (!formTouched.pax) return null;
    if (!paxCount) return t.errPaxRequired;
    const val = parseInt(paxCount);
    if (isNaN(val) || val < 1) return t.errPaxMin;
    if (val > 500) return t.errPaxMax;
    return null;
  }, [paxCount, formTouched.pax, t]);

  const isLawatanFormValid = useMemo(() => {
    const trimmedOrg = orgName.trim();
    const valPax = parseInt(paxCount);
    return trimmedOrg.length >= 3 && !isNaN(valPax) && valPax >= 1 && valPax <= 500;
  }, [orgName, paxCount]);

  const filteredVisitsByLocation = useMemo(() => {
    if (dashboardFilter === 'ALL') return visits;
    return visits.filter(v => v.location === dashboardFilter);
  }, [visits, dashboardFilter]);

  const visitsInRange = useMemo(() => {
    if (!startDate && !endDate) return filteredVisitsByLocation;
    
    return filteredVisitsByLocation.filter(v => {
      const vDate = new Date(v.timestamp);
      vDate.setHours(0, 0, 0, 0);
      
      const start = startDate ? new Date(startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(0, 0, 0, 0);

      if (start && end) return vDate >= start && vDate <= end;
      if (start) return vDate >= start;
      if (end) return vDate <= end;
      return true;
    });
  }, [filteredVisitsByLocation, startDate, endDate]);

  const stats = useMemo(() => {
    const now = new Date();
    
    const dailyStart = new Date(now);
    dailyStart.setHours(0, 0, 0, 0);

    const weeklyStart = new Date(now);
    weeklyStart.setDate(now.getDate() - now.getDay());
    weeklyStart.setHours(0, 0, 0, 0);

    const monthlyStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const yearlyStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

    const sumSince = (date: Date) => 
      filteredVisitsByLocation
        .filter(v => new Date(v.timestamp) >= date)
        .reduce((sum, v) => sum + (v.groupSize || 1), 0);

    return {
      daily: sumSince(dailyStart),
      weekly: sumSince(weeklyStart),
      monthly: sumSince(monthlyStart),
      yearly: sumSince(yearlyStart),
      allTime: filteredVisitsByLocation.reduce((sum, v) => sum + (v.groupSize || 1), 0),
      rangeTotal: visitsInRange.reduce((sum, v) => sum + (v.groupSize || 1), 0)
    };
  }, [filteredVisitsByLocation, visitsInRange]);

  const chartData = useMemo(() => {
    const museumCount = visitsInRange.reduce((sum, v) => v.location === LocationType.MUSEUM ? sum + (v.groupSize || 1) : sum, 0);
    const galleryCount = visitsInRange.reduce((sum, v) => v.location === LocationType.ARTS_GALLERY ? sum + (v.groupSize || 1) : sum, 0);
    
    const studentCount = visitsInRange.filter(v => v.category === VisitorCategory.STUDENT).length;
    const visitorCount = visitsInRange.filter(v => v.category === VisitorCategory.VISITOR).length;
    const lawatanCount = visitsInRange.filter(v => v.category === VisitorCategory.LAWATAN).length;

    return {
      locations: [
        { name: t.museum, value: museumCount },
        { name: t.gallery, value: galleryCount }
      ],
      categories: [
        { name: t.students, value: studentCount, fill: '#4338ca' },
        { name: t.visitors, value: visitorCount, fill: '#f43f5e' },
        { name: t.lawatan, value: lawatanCount, fill: '#f59e0b' }
      ]
    };
  }, [visitsInRange, t]);

  const executeExport = () => {
    const headers = [t.category, t.location, 'Org Name', 'Pax', 'Date', 'Time', 'Daily #', 'Weekly #', 'Monthly #', 'Yearly #'];
    const rows = visitsInRange.map(v => {
      const d = new Date(v.timestamp);
      return [
        v.category,
        v.location,
        v.groupInfo || '-',
        v.groupSize || 1,
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        v.dailyNumber,
        v.weeklyNumber,
        v.monthlyNumber,
        v.yearlyNumber
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `IPM_Logs_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportClick = () => {
    if (isAuthenticated) {
      executeExport();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminIdInput === ADMIN_ID && passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthError(false);
      setAdminIdInput('');
      setPasswordInput('');
      executeExport();
    } else {
      setAuthError(true);
    }
  };

  const IMAGES = {
    bg: "input_file_2.png",
    museum: "input_file_0.png",
    gallery: "input_file_1.png"
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${IMAGES.bg})` }}
      >
        <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[4px]"></div>
      </div>

      <nav className="bg-white/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 md:h-20 items-center">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-10 md:h-10 bg-indigo-700 rounded-lg flex items-center justify-center shadow-lg">
                <Building2 className="text-white w-4 h-4 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs md:text-xl font-serif text-slate-900 truncate">Malay Civilization Institute</h1>
                <p className="text-[7px] md:text-[10px] uppercase tracking-widest text-slate-500 font-black">IPM Visitor Mgmt</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-6">
              <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setView('checkin')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${view === 'checkin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {t.navCheckin}
                </button>
                <button onClick={() => setView('dashboard')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${view === 'dashboard' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {t.navAnalytics}
                </button>
              </div>

              <button onClick={() => setLang(l => l === 'en' ? 'ms' : 'en')} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-slate-200 text-slate-600 bg-white text-[9px] font-bold uppercase">
                <Languages className="w-2.5 h-2.5 text-indigo-600" />
                {lang}
              </button>
            </div>
          </div>
          <div className="sm:hidden flex items-center justify-around border-t border-slate-100 py-1.5">
            <button onClick={() => setView('checkin')} className={`flex flex-col items-center gap-0.5 ${view === 'checkin' ? 'text-indigo-700' : 'text-slate-400'}`}>
              <UserCircle className="w-4 h-4" /><span className="text-[8px] font-bold uppercase">{t.navCheckin}</span>
            </button>
            <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-0.5 ${view === 'dashboard' ? 'text-indigo-700' : 'text-slate-400'}`}>
              <LayoutDashboard className="w-4 h-4" /><span className="text-[8px] font-bold uppercase">{t.navAnalytics}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-4 md:py-12">
        {view === 'checkin' && (
          <div className="max-w-5xl mx-auto space-y-4 md:space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-1">
              <h2 className="text-xl md:text-5xl font-serif text-white drop-shadow-lg leading-tight">{t.welcome}</h2>
              <p className="text-slate-200 text-xs md:text-lg max-w-xl mx-auto font-medium drop-shadow-sm">{t.selectCategory}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
              {[
                { type: LocationType.MUSEUM, title: t.museum, img: IMAGES.museum, icon: Building2 },
                { type: LocationType.ARTS_GALLERY, title: t.gallery, img: IMAGES.gallery, icon: Palette }
              ].map((loc) => (
                <div key={loc.type} className="group bg-white rounded-xl md:rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col transition-all">
                  <div className="h-28 md:h-64 relative overflow-hidden">
                    <img src={loc.img} className="w-full h-full object-cover" alt={loc.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <div className="p-1.5 md:p-3 bg-white/20 backdrop-blur-md rounded-lg"><loc.icon className="text-white w-4 h-4 md:w-6 md:h-6" /></div>
                      <h3 className="text-lg md:text-3xl font-bold text-white tracking-tight">{loc.title}</h3>
                    </div>
                  </div>
                  <div className="p-3 md:p-10 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleCheckIn(VisitorCategory.STUDENT, loc.type)} className="flex flex-col items-center justify-center gap-1 py-3 md:py-6 bg-slate-900 text-white rounded-lg md:rounded-2xl hover:bg-indigo-700 transition-all font-bold text-[10px] md:text-base">
                        <GraduationCap className="w-4 h-4 md:w-6 md:h-6" /> {t.studentLogin}
                      </button>
                      <button onClick={() => handleCheckIn(VisitorCategory.VISITOR, loc.type)} className="flex flex-col items-center justify-center gap-1 py-3 md:py-6 bg-white border border-slate-200 text-slate-900 rounded-lg md:rounded-2xl hover:bg-slate-50 transition-all font-bold text-[10px] md:text-base">
                        <Users className="w-4 h-4 md:w-6 md:h-6 text-slate-400" /> {t.visitorLogin}
                      </button>
                    </div>
                    <button onClick={() => openLawatanForm(loc.type)} className="flex items-center justify-center gap-1.5 w-full py-3 md:py-5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg md:rounded-2xl hover:bg-indigo-100 transition-all font-black text-[11px] md:text-lg">
                      <MapPinned className="w-4 h-4 md:w-6 md:h-6" /> {t.lawatanLogin}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 text-slate-100 text-[9px] md:text-sm font-semibold pt-1">
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{t.dailyReset}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>{t.trackingEnabled}</span>
              </div>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-4 md:space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white/95 backdrop-blur-xl p-3 md:p-10 rounded-xl md:rounded-[3rem] shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-12">
                <div>
                  <div className="flex items-center gap-2 md:gap-3 mb-0.5">
                    <LayoutDashboard className="w-5 h-5 md:w-8 md:h-8 text-indigo-700" />
                    <h2 className="text-lg md:text-4xl font-serif text-slate-900">{t.analytics}</h2>
                  </div>
                  <p className="text-slate-500 font-medium text-[10px] md:text-lg">{t.overview}</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {['ALL', LocationType.MUSEUM, LocationType.ARTS_GALLERY].map((f) => (
                        <button key={f} onClick={() => setDashboardFilter(f as any)} className={`px-2 md:px-4 py-1 rounded-md text-[9px] md:text-xs font-black transition-all uppercase tracking-tighter ${dashboardFilter === f ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>
                          {f === 'ALL' ? t.allLocations : f === LocationType.MUSEUM ? t.museum : f === LocationType.ARTS_GALLERY ? t.gallery : f}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleExportClick} className="flex items-center gap-1.5 bg-indigo-700 text-white px-3 md:px-6 py-1.5 rounded-lg hover:bg-indigo-800 transition-all font-black text-[9px] uppercase">
                      {!isAuthenticated && <Lock className="w-2.5 h-2.5" />}
                      <Download className="w-3 h-3" /> {t.export}
                    </button>
                  </div>

                  <div className="bg-slate-50 p-2 md:p-6 rounded-lg md:rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 md:gap-6 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                      <span className="text-[9px] md:text-sm font-black text-slate-700 uppercase tracking-widest">{t.dateRange}</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-4">
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[9px] md:text-sm font-bold outline-none" />
                      <span className="text-slate-400 font-bold">-</span>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[9px] md:text-sm font-bold outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-6">
                <StatsCard label={t.daily} value={stats.daily} icon={<Users />} color="bg-blue-600" />
                <StatsCard label={t.weekly} value={stats.weekly} icon={<BarChart3 />} color="bg-indigo-700" />
                <StatsCard label={t.monthly} value={stats.monthly} icon={<History />} color="bg-purple-600" />
                <StatsCard label={t.yearly} value={stats.yearly} icon={<Building2 />} color="bg-amber-600" />
                <StatsCard label={t.allTime} value={stats.allTime} icon={<CheckCircle2 />} color="bg-emerald-600" />
                {(startDate || endDate) && <StatsCard label={t.rangeTotal} value={stats.rangeTotal} icon={<Filter />} color="bg-rose-600" />}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Popups & Modals refined for smaller icon footprint */}
      {showLawatanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-2xl md:rounded-[3rem] shadow-2xl relative p-5 md:p-10 animate-in zoom-in-95 duration-300">
            <button onClick={() => { setShowLawatanModal(false); setFormTouched({ org: false, pax: false }); }} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3"><MapPinned className="w-5 h-5 text-indigo-700" /></div>
              <h3 className="text-lg md:text-3xl font-serif text-slate-900 mb-1">{t.lawatanLogin}</h3>
              <p className="text-[10px] text-slate-500 font-bold mb-5 text-center">{t.groupDetails}</p>
              
              <div className="w-full space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">{t.orgName}</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} onBlur={() => setFormTouched(prev => ({ ...prev, org: true }))} placeholder={t.orgNamePlaceholder} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-[11px] focus:border-indigo-700" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">{t.totalPax}</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="number" min="1" max="500" value={paxCount} onChange={(e) => setPaxCount(e.target.value)} onBlur={() => setFormTouched(prev => ({ ...prev, pax: true }))} placeholder={t.paxPlaceholder} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-[11px] focus:border-indigo-700" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowLawatanModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-black rounded-lg uppercase text-[9px] tracking-widest">{t.cancel}</button>
                  <button disabled={!isLawatanFormValid} onClick={() => handleCheckIn(VisitorCategory.LAWATAN, lawatanLocation, orgName.trim(), parseInt(paxCount))} className="flex-1 py-2.5 bg-indigo-700 text-white font-black rounded-lg shadow-lg uppercase text-[9px] tracking-widest disabled:opacity-30">
                    {t.confirm}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPopup && lastVisit && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-white w-full max-sm rounded-[2rem] md:rounded-[3.5rem] shadow-2xl relative p-7 md:p-12 text-center animate-in zoom-in-95 duration-500">
            <button onClick={() => setShowPopup(false)} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
            <div className="w-14 h-14 md:w-20 md:h-20 bg-emerald-100 rounded-2xl md:rounded-[2rem] flex items-center justify-center mb-5 mx-auto shadow-inner"><CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-emerald-600" /></div>
            <h3 className="text-xl md:text-4xl font-serif text-slate-900 mb-0.5 leading-tight">{t.checkinSuccess}</h3>
            <p className="text-[9px] md:text-sm text-slate-500 font-bold mb-6 md:mb-10 uppercase tracking-widest">{t.welcomeTo} {lastVisit.location === LocationType.MUSEUM ? t.museum : t.gallery}</p>
            
            <div className="bg-slate-50 p-5 md:p-10 rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">{t.ticketNumber}</p>
              <div className="text-5xl md:text-8xl font-mono font-black text-indigo-700 tabular-nums leading-none tracking-tighter">
                #{String(lastVisit.dailyNumber).padStart(3, '0')}
              </div>
            </div>
            
            <button onClick={() => setShowPopup(false)} className="mt-6 md:mt-10 w-full py-3.5 md:py-5 bg-slate-900 text-white font-black rounded-xl md:rounded-2xl hover:bg-indigo-700 transition-all text-xs md:text-lg uppercase tracking-widest">{t.closeTicket}</button>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-2xl md:rounded-[2.5rem] p-8 animate-in zoom-in-95">
             <h3 className="text-xl font-serif text-center mb-6">{t.staffAccess}</h3>
             <form onSubmit={handleAuthConfirm} className="space-y-4">
                <input type="text" value={adminIdInput} onChange={(e) => setAdminIdInput(e.target.value)} placeholder={t.adminId} className="w-full px-4 py-3 bg-slate-100 rounded-xl outline-none font-bold" />
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder={t.adminPassword} className="w-full px-4 py-3 bg-slate-100 rounded-xl outline-none font-bold" />
                {authError && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{t.invalidPasscode}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAuthModal(false)} className="flex-1 py-3 text-slate-400 font-black text-xs uppercase">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-black rounded-xl text-xs uppercase tracking-widest">{t.confirm}</button>
                </div>
             </form>
          </div>
        </div>
      )}

      <footer className="relative z-10 bg-white/10 backdrop-blur-md border-t border-white/10 py-6 md:py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center space-y-1.5">
          <span className="text-white font-serif text-xs md:text-xl">Malay Civilization Institute</span>
          <p className="text-slate-300 text-[7px] md:text-xs font-black uppercase tracking-widest opacity-80">IPM Visitor Management &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
