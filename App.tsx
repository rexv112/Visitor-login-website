
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
  const [view, setView] = useState<'checkin' | 'dashboard' | 'history'>('checkin');
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

  // Updated images with provided local files
  const IMAGES = {
    bg: "input_file_2.png",      // IPM Building Background
    museum: "input_file_0.png",  // Muzium Warisan
    gallery: "input_file_1.png"   // Galeri Seni
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
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                <Building2 className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-serif text-slate-900 tracking-tight leading-none">Malay Civilization Institute</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mt-1">IPM Visitor Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setView('checkin')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'checkin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {t.navCheckin}
                </button>
                <button onClick={() => setView('dashboard')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'dashboard' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {t.navAnalytics}
                </button>
                <button onClick={() => setView('history')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {t.navLogs}
                </button>
              </div>

              <button onClick={() => setLang(l => l === 'en' ? 'ms' : 'en')} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wider">
                <Languages className="w-4 h-4 text-indigo-600" />
                {lang}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {view === 'checkin' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-serif text-white drop-shadow-xl">{t.welcome}</h2>
              <p className="text-slate-100 text-lg max-w-2xl mx-auto font-medium drop-shadow-md">{t.selectCategory}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="group bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-all hover:scale-[1.01] border-4 border-transparent hover:border-indigo-500/20">
                <div className="h-64 relative overflow-hidden">
                  <img src={IMAGES.museum} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Museum" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                  <div className="absolute bottom-6 left-8 flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl"><Building2 className="text-white w-7 h-7" /></div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{t.museum}</h3>
                  </div>
                </div>
                <div className="p-10 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleCheckIn(VisitorCategory.STUDENT, LocationType.MUSEUM)} className="flex flex-col items-center justify-center gap-2 py-6 bg-slate-900 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl font-bold text-base">
                      <GraduationCap className="w-6 h-6" /> {t.studentLogin}
                    </button>
                    <button onClick={() => handleCheckIn(VisitorCategory.VISITOR, LocationType.MUSEUM)} className="flex flex-col items-center justify-center gap-2 py-6 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all font-bold text-base">
                      <Users className="w-6 h-6 text-slate-400" /> {t.visitorLogin}
                    </button>
                  </div>
                  <button onClick={() => openLawatanForm(LocationType.MUSEUM)} className="flex items-center justify-center gap-3 w-full py-5 bg-indigo-50 border-2 border-indigo-200 text-indigo-700 rounded-2xl hover:bg-indigo-100 transition-all font-black text-lg">
                    <MapPinned className="w-6 h-6" /> {t.lawatanLogin}
                  </button>
                </div>
              </div>

              <div className="group bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-all hover:scale-[1.01] border-4 border-transparent hover:border-indigo-500/20">
                <div className="h-64 relative overflow-hidden">
                  <img src={IMAGES.gallery} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Gallery" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                  <div className="absolute bottom-6 left-8 flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl"><Palette className="text-white w-7 h-7" /></div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{t.gallery}</h3>
                  </div>
                </div>
                <div className="p-10 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleCheckIn(VisitorCategory.STUDENT, LocationType.ARTS_GALLERY)} className="flex flex-col items-center justify-center gap-2 py-6 bg-indigo-700 text-white rounded-2xl hover:bg-indigo-800 transition-all shadow-xl font-bold text-base">
                      <GraduationCap className="w-6 h-6" /> {t.studentLogin}
                    </button>
                    <button onClick={() => handleCheckIn(VisitorCategory.VISITOR, LocationType.ARTS_GALLERY)} className="flex flex-col items-center justify-center gap-2 py-6 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all font-bold text-base">
                      <Users className="w-6 h-6 text-slate-400" /> {t.visitorLogin}
                    </button>
                  </div>
                  <button onClick={() => openLawatanForm(LocationType.ARTS_GALLERY)} className="flex items-center justify-center gap-3 w-full py-5 bg-indigo-50 border-2 border-indigo-200 text-indigo-700 rounded-2xl hover:bg-indigo-100 transition-all font-black text-lg">
                    <MapPinned className="w-6 h-6" /> {t.lawatanLogin}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-slate-100 text-sm font-semibold pt-4">
              <div className="flex items-center gap-2 bg-black/50 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{t.dailyReset}</span>
              </div>
              <div className="flex items-center gap-2 bg-black/50 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>{t.trackingEnabled}</span>
              </div>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/20">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-12">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-2">
                    <LayoutDashboard className="w-8 h-8 text-indigo-700" />
                    <h2 className="text-4xl font-serif text-slate-900">{t.analytics}</h2>
                  </div>
                  <p className="text-slate-500 font-medium text-lg">{t.overview}</p>
                </div>
                
                <div className="flex flex-col items-end gap-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                      <button onClick={() => setDashboardFilter('ALL')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${dashboardFilter === 'ALL' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                        {t.allLocations}
                      </button>
                      <button onClick={() => setDashboardFilter(LocationType.MUSEUM)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${dashboardFilter === LocationType.MUSEUM ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                        {t.museum}
                      </button>
                      <button onClick={() => setDashboardFilter(LocationType.ARTS_GALLERY)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${dashboardFilter === LocationType.ARTS_GALLERY ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                        {t.gallery}
                      </button>
                    </div>

                    <button onClick={handleExportClick} className="flex items-center gap-3 bg-indigo-700 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-800 transition-all shadow-lg font-black text-xs uppercase tracking-wider">
                      {!isAuthenticated && <Lock className="w-3.5 h-3.5" />}
                      <Download className="w-4 h-4" /> {t.export}
                    </button>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-wrap items-center gap-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-indigo-700" />
                      <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{t.dateRange}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.startDate}</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-700 focus:outline-none transition-all" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.endDate}</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-700 focus:outline-none transition-all" />
                      </div>
                    </div>
                    {(startDate || endDate) && (
                      <button onClick={() => {setStartDate(''); setEndDate('');}} className="flex items-center gap-2 text-rose-500 hover:text-rose-600 font-black text-xs uppercase tracking-widest transition-colors">
                        <X className="w-4 h-4" /> {t.clearFilter}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                <StatsCard label={t.daily} value={stats.daily} icon={<Users />} color="bg-blue-600" />
                <StatsCard label={t.weekly} value={stats.weekly} icon={<BarChart3 />} color="bg-indigo-700" />
                <StatsCard label={t.monthly} value={stats.monthly} icon={<History />} color="bg-purple-600" />
                <StatsCard label={t.yearly} value={stats.yearly} icon={<Building2 />} color="bg-amber-600" />
                <StatsCard label={t.allTime} value={stats.allTime} icon={<CheckCircle2 />} color="bg-emerald-600" />
                {(startDate || endDate) && (
                  <div className="animate-in zoom-in-95 duration-300">
                    <StatsCard label={t.rangeTotal} value={stats.rangeTotal} icon={<Filter />} color="bg-rose-600" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">
                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-indigo-700" /> {t.distByLocation}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.locations}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 700, fontSize: 13}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 600}} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }} />
                        <Bar dataKey="value" radius={[14, 14, 0, 0]} barSize={80}>
                          {chartData.locations.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#4f46e5'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Users className="w-6 h-6 text-rose-500" /> {t.visitorSplit}
                  </h3>
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData.categories} cx="50%" cy="50%" innerRadius={90} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none">
                          {chartData.categories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/20 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
              <div className="space-y-1">
                <h2 className="text-4xl font-serif text-slate-900">{t.visitLogs}</h2>
                <p className="text-slate-500 font-medium text-lg">{t.logDesc}</p>
              </div>
              <button onClick={handleExportClick} className="flex items-center gap-3 text-indigo-700 font-black hover:bg-indigo-50 px-8 py-4 rounded-2xl transition-all border-2 border-indigo-100">
                {!isAuthenticated && <Lock className="w-4 h-4 text-indigo-300" />}
                <Download className="w-5 h-5" /> {t.download}
              </button>
            </div>

            <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.dateTime}</th>
                      <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.location}</th>
                      <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.category}</th>
                      <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">{t.seq}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-10 py-6 whitespace-nowrap">
                          <div className="text-sm font-black text-slate-900">{new Date(visit.timestamp).toLocaleDateString()}</div>
                          <div className="text-xs font-bold text-slate-400 mt-1">{new Date(visit.timestamp).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${visit.location === LocationType.MUSEUM ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
                            {visit.location === LocationType.MUSEUM ? t.museum : t.gallery}
                          </span>
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap">
                          <div className="text-sm font-black text-slate-600">
                            {visit.category === VisitorCategory.STUDENT ? t.students : 
                             visit.category === VisitorCategory.VISITOR ? t.visitors : t.lawatan}
                          </div>
                          {visit.groupInfo && <div className="text-xs font-bold text-indigo-500 mt-0.5">{visit.groupInfo} (x{visit.groupSize})</div>}
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap text-sm font-mono font-black text-indigo-700 text-right">
                          {visit.groupSize && visit.groupSize > 1 ? (
                            `#${String(visit.dailyNumber - visit.groupSize + 1).padStart(4, '0')} - #${String(visit.dailyNumber).padStart(4, '0')}`
                          ) : (
                            `#${String(visit.dailyNumber).padStart(4, '0')}`
                          )}
                        </td>
                      </tr>
                    ))}
                    {visits.length === 0 && (
                      <tr><td colSpan={4} className="px-10 py-24 text-center text-slate-400 font-bold italic bg-slate-50/50">{t.noData}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {showLawatanModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-400 border border-white/20">
            <button onClick={() => { setShowLawatanModal(false); setFormTouched({ org: false, pax: false }); }} className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
              <X className="w-6 h-6" />
            </button>
            <div className="p-10">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><MapPinned className="w-8 h-8 text-indigo-700" /></div>
              <h3 className="text-3xl font-serif text-slate-900 mb-2">{t.lawatanLogin}</h3>
              <p className="text-slate-500 font-bold mb-8 text-sm">{t.groupDetails} - {lawatanLocation === LocationType.MUSEUM ? t.museum : t.gallery}</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t.orgName}</label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none"><UserCircle className="h-5 w-5 text-slate-400" /></div>
                    <input 
                      type="text" 
                      value={orgName} 
                      onChange={(e) => setOrgName(e.target.value)} 
                      onBlur={() => setFormTouched(prev => ({ ...prev, org: true }))}
                      placeholder={t.orgNamePlaceholder} 
                      className={`w-full pl-14 pr-6 py-5 bg-slate-100 border-2 rounded-[1.5rem] font-bold focus:outline-none focus:ring-4 transition-all ${orgError ? 'border-rose-300 ring-rose-500/10' : 'border-transparent focus:ring-indigo-500/10 focus:border-indigo-700'}`} 
                    />
                  </div>
                  {orgError && <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-black mt-1 ml-1 uppercase tracking-wider animate-in fade-in slide-in-from-top-1"><AlertCircle className="w-3.5 h-3.5" /> {orgError}</div>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t.totalPax}</label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none"><Plus className="h-5 w-5 text-slate-400" /></div>
                    <input 
                      type="number" 
                      min="1" 
                      max="500"
                      value={paxCount} 
                      onChange={(e) => setPaxCount(e.target.value)} 
                      onBlur={() => setFormTouched(prev => ({ ...prev, pax: true }))}
                      placeholder={t.paxPlaceholder} 
                      className={`w-full pl-14 pr-6 py-5 bg-slate-100 border-2 rounded-[1.5rem] font-black focus:outline-none focus:ring-4 transition-all ${paxError ? 'border-rose-300 ring-rose-500/10' : 'border-transparent focus:ring-indigo-500/10 focus:border-indigo-700'}`} 
                    />
                  </div>
                  {paxError && <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-black mt-1 ml-1 uppercase tracking-wider animate-in fade-in slide-in-from-top-1"><AlertCircle className="w-3.5 h-3.5" /> {paxError}</div>}
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => { setShowLawatanModal(false); setFormTouched({ org: false, pax: false }); }} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-sm tracking-widest">{t.cancel}</button>
                  <button 
                    disabled={!isLawatanFormValid}
                    onClick={() => handleCheckIn(VisitorCategory.LAWATAN, lawatanLocation, orgName.trim(), parseInt(paxCount))} 
                    className="flex-1 py-4 bg-indigo-700 text-white font-black rounded-2xl hover:bg-indigo-800 transition-all shadow-xl uppercase text-sm tracking-widest disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
                  >
                    {t.completeCheckin}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-400 border border-white/20">
            <button onClick={() => { setShowAuthModal(false); setAuthError(false); setAdminIdInput(''); setPasswordInput(''); }} className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
              <X className="w-6 h-6" />
            </button>
            <div className="p-12">
              <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner"><Lock className="w-10 h-10 text-indigo-700" /></div>
              <h3 className="text-3xl font-serif text-slate-900 mb-3 text-center">{t.staffAccess}</h3>
              <p className="text-slate-500 font-bold text-center mb-8 text-sm leading-relaxed">{t.enterPasscode}</p>
              <form onSubmit={handleAuthConfirm} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none"><UserCircle className="h-5 h-5 text-slate-400" /></div>
                  <input type="text" value={adminIdInput} onChange={(e) => setAdminIdInput(e.target.value)} placeholder={t.adminId} autoFocus className="w-full pl-14 pr-6 py-5 bg-slate-100 border-2 border-transparent rounded-[1.5rem] font-bold tracking-wide focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all focus:border-indigo-700" />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none"><Lock className="h-5 h-5 text-slate-400" /></div>
                  <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder={t.adminPassword} className={`w-full pl-14 pr-6 py-5 bg-slate-100 border-2 rounded-[1.5rem] font-bold tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${authError ? 'border-rose-300 bg-rose-50' : 'border-transparent focus:border-indigo-700'}`} />
                  {authError && <p className="text-rose-600 text-xs font-black mt-3 ml-2 uppercase tracking-wider">{t.invalidPasscode}</p>}
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => { setShowAuthModal(false); setAdminIdInput(''); setPasswordInput(''); setAuthError(false); }} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-sm tracking-widest">{t.cancel}</button>
                  <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl uppercase text-sm tracking-widest">{t.confirm}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPopup && lastVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500 border border-white/20">
            <button onClick={() => setShowPopup(false)} className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
              <X className="w-6 h-6" />
            </button>
            <div className="p-12 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner shadow-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-4xl font-serif text-slate-900 mb-2 leading-tight">{t.checkinSuccess}</h3>
              <p className="text-slate-500 font-bold mb-10 text-lg">{t.welcomeTo} <span className="text-indigo-700 font-black">{lastVisit.location === LocationType.MUSEUM ? t.museum : t.gallery}</span>!</p>
              
              <div className="bg-slate-50 w-full p-10 rounded-[3rem] border-4 border-dashed border-slate-200 relative">
                <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 mb-4">
                  {lastVisit.groupSize && lastVisit.groupSize > 1 ? t.ticketRange : t.ticketNumber}
                </p>
                
                {lastVisit.groupSize && lastVisit.groupSize > 1 ? (
                   <div className="space-y-2">
                     <div className="text-5xl font-mono font-black text-indigo-700 tracking-tighter tabular-nums leading-none">
                       #{String(lastVisit.dailyNumber - lastVisit.groupSize + 1).padStart(3, '0')}
                     </div>
                     <div className="text-2xl font-black text-slate-300 uppercase tracking-widest">to</div>
                     <div className="text-5xl font-mono font-black text-indigo-700 tracking-tighter tabular-nums leading-none">
                       #{String(lastVisit.dailyNumber).padStart(3, '0')}
                     </div>
                     <p className="text-xs font-black text-indigo-400 mt-4 uppercase tracking-[0.1em]">{lastVisit.groupInfo} (x{lastVisit.groupSize})</p>
                   </div>
                ) : (
                  <div className="text-9xl font-mono font-black text-indigo-700 tracking-tighter tabular-nums leading-none">
                    #{String(lastVisit.dailyNumber).padStart(3, '0')}
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                <Clock className="w-3.5 h-3.5" /> <span>{t.dailyReset}</span>
              </div>
              <button onClick={() => setShowPopup(false)} className="mt-12 w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] hover:bg-indigo-700 transition-all shadow-2xl text-xl uppercase tracking-widest">{t.closeTicket}</button>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 bg-white/5 backdrop-blur-md border-t border-white/10 py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center"><Building2 className="text-white w-5 h-5" /></div>
              <span className="text-white font-serif text-xl tracking-tight">Malay Civilization Institute</span>
          </div>
          <div className="text-center text-slate-300 text-sm font-black uppercase tracking-[0.25em] opacity-80">
            <p>IPM Visitor Management &copy; {new Date().getFullYear()}</p>
          </div>
          <div className="flex items-center justify-center gap-6">
            <span className="px-4 py-1.5 rounded-full bg-white/10 text-white text-[9px] font-black uppercase tracking-widest border border-white/10">{t.staffOnly}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
