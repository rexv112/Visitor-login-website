
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
  KeyRound
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
  Pie
} from 'recharts';

const STAFF_PASSCODE = "2024"; // Simple passcode for demonstration

const App: React.FC = () => {
  const [view, setView] = useState<'checkin' | 'dashboard' | 'history'>('checkin');
  const [lang, setLang] = useState<Language>('en');
  const [dashboardFilter, setDashboardFilter] = useState<LocationType | 'ALL'>('ALL');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [lastVisit, setLastVisit] = useState<Visit | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  
  // Auth states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    setVisits(storageService.getVisits());
  }, []);

  const handleCheckIn = (category: VisitorCategory, location: LocationType) => {
    const visit = storageService.saveVisit(category, location);
    setVisits(prev => [visit, ...prev]);
    setLastVisit(visit);
    setShowPopup(true);
  };

  const filteredVisitsForStats = useMemo(() => {
    if (dashboardFilter === 'ALL') return visits;
    return visits.filter(v => v.location === dashboardFilter);
  }, [visits, dashboardFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const filterByDate = (dateLimit: Date) => 
      filteredVisitsForStats.filter(v => new Date(v.timestamp) >= dateLimit).length;

    const startOfDay = new Date(new Date(now).setHours(0,0,0,0));
    const startOfWeek = new Date(new Date(now).setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return {
      daily: filterByDate(startOfDay),
      weekly: filterByDate(startOfWeek),
      monthly: filterByDate(startOfMonth),
      yearly: filterByDate(startOfYear),
      allTime: filteredVisitsForStats.length
    };
  }, [filteredVisitsForStats]);

  const chartData = useMemo(() => {
    const museumCount = visits.filter(v => v.location === LocationType.MUSEUM).length;
    const galleryCount = visits.filter(v => v.location === LocationType.ARTS_GALLERY).length;
    
    const currentData = dashboardFilter === 'ALL' ? visits : visits.filter(v => v.location === dashboardFilter);
    const studentCount = currentData.filter(v => v.category === VisitorCategory.STUDENT).length;
    const visitorCount = currentData.filter(v => v.category === VisitorCategory.VISITOR).length;

    return {
      locations: [
        { name: t.museum, value: museumCount },
        { name: t.gallery, value: galleryCount }
      ],
      categories: [
        { name: t.students, value: studentCount },
        { name: t.visitors, value: visitorCount }
      ]
    };
  }, [visits, dashboardFilter, t]);

  const executeExport = () => {
    const headers = [t.category, t.location, 'Date', 'Time', t.seq];
    const rows = visits.map(v => {
      const d = new Date(v.timestamp);
      return [
        v.category,
        v.location,
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        v.dailyNumber
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Artemis_Logs_${new Date().toISOString().split('T')[0]}.csv`);
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
    if (passcodeInput === STAFF_PASSCODE) {
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthError(false);
      setPasscodeInput('');
      executeExport();
    } else {
      setAuthError(true);
    }
  };

  const IMAGES = {
    bg: "https://images.unsplash.com/photo-1518998053574-53ee753cf47e?auto=format&fit=crop&q=80&w=2000",
    museum: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&q=80&w=800",
    gallery: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80&w=800"
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${IMAGES.bg})` }}
      >
        <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[3px]"></div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                <Building2 className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif text-slate-900 tracking-tight leading-none">Artemis</h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Museum & Gallery</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setView('checkin')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'checkin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {t.navCheckin}
                </button>
                <button 
                  onClick={() => setView('dashboard')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {t.navAnalytics}
                </button>
                <button 
                  onClick={() => setView('history')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {t.navLogs}
                </button>
              </div>

              <button 
                onClick={() => setLang(l => l === 'en' ? 'ms' : 'en')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <Languages className="w-4 h-4 text-indigo-500" />
                {lang}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        
        {view === 'checkin' && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-serif text-white drop-shadow-lg">{t.welcome}</h2>
              <p className="text-slate-100 text-lg max-w-2xl mx-auto font-medium">{t.selectCategory}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Museum Card */}
              <div className="group bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-all hover:scale-[1.01] border-4 border-transparent hover:border-indigo-500/20">
                <div className="h-56 relative overflow-hidden">
                  <img src={IMAGES.museum} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Museum" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-6 left-8 flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                      <Building2 className="text-white w-7 h-7" />
                    </div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{t.museum}</h3>
                  </div>
                </div>
                <div className="p-10 space-y-5">
                  <button 
                    onClick={() => handleCheckIn(VisitorCategory.STUDENT, LocationType.MUSEUM)}
                    className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl font-bold text-lg"
                  >
                    <GraduationCap className="w-6 h-6" />
                    {t.studentLogin}
                  </button>
                  <button 
                    onClick={() => handleCheckIn(VisitorCategory.VISITOR, LocationType.MUSEUM)}
                    className="flex items-center justify-center gap-3 w-full py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all font-bold text-lg"
                  >
                    <Users className="w-6 h-6 text-slate-400" />
                    {t.visitorLogin}
                  </button>
                </div>
              </div>

              {/* Gallery Card */}
              <div className="group bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-all hover:scale-[1.01] border-4 border-transparent hover:border-indigo-500/20">
                <div className="h-56 relative overflow-hidden">
                  <img src={IMAGES.gallery} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Gallery" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-6 left-8 flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                      <Palette className="text-white w-7 h-7" />
                    </div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{t.gallery}</h3>
                  </div>
                </div>
                <div className="p-10 space-y-5">
                  <button 
                    onClick={() => handleCheckIn(VisitorCategory.STUDENT, LocationType.ARTS_GALLERY)}
                    className="flex items-center justify-center gap-3 w-full py-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl font-bold text-lg"
                  >
                    <GraduationCap className="w-6 h-6" />
                    {t.studentLogin}
                  </button>
                  <button 
                    onClick={() => handleCheckIn(VisitorCategory.VISITOR, LocationType.ARTS_GALLERY)}
                    className="flex items-center justify-center gap-3 w-full py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all font-bold text-lg"
                  >
                    <Users className="w-6 h-6 text-slate-400" />
                    {t.visitorLogin}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-slate-100 text-sm font-semibold pt-4">
              <div className="flex items-center gap-2 bg-black/40 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/20">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{t.dailyReset}</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/20">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>{t.trackingEnabled}</span>
              </div>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/20">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-2">
                    <LayoutDashboard className="w-8 h-8 text-indigo-600" />
                    <h2 className="text-4xl font-serif text-slate-900">{t.analytics}</h2>
                  </div>
                  <p className="text-slate-500 font-medium text-lg">{t.overview}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button 
                      onClick={() => setDashboardFilter('ALL')}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {t.allLocations}
                    </button>
                    <button 
                      onClick={() => setDashboardFilter(LocationType.MUSEUM)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardFilter === LocationType.MUSEUM ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {t.museum}
                    </button>
                    <button 
                      onClick={() => setDashboardFilter(LocationType.ARTS_GALLERY)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardFilter === LocationType.ARTS_GALLERY ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {t.gallery}
                    </button>
                  </div>
                  <button 
                    onClick={handleExportClick}
                    className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-black tracking-wide"
                  >
                    {!isAuthenticated && <Lock className="w-4 h-4 text-indigo-200" />}
                    <Download className="w-5 h-5" />
                    {t.export}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatsCard label={t.daily} value={stats.daily} icon={<Users />} color="bg-blue-600" />
                <StatsCard label={t.weekly} value={stats.weekly} icon={<BarChart3 />} color="bg-indigo-600" />
                <StatsCard label={t.monthly} value={stats.monthly} icon={<History />} color="bg-purple-600" />
                <StatsCard label={t.yearly} value={stats.yearly} icon={<Building2 />} color="bg-amber-600" />
                <StatsCard label={t.allTime} value={stats.allTime} icon={<CheckCircle2 />} color="bg-emerald-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">
                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                    {t.distByLocation}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.locations}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 700, fontSize: 13}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 600}} />
                        <Tooltip 
                          cursor={{fill: '#f1f5f9'}}
                          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                        />
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
                    <Users className="w-6 h-6 text-rose-500" />
                    {t.visitorSplit}
                  </h3>
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.categories}
                          cx="50%"
                          cy="50%"
                          innerRadius={90}
                          outerRadius={120}
                          paddingAngle={10}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#4f46e5" />
                          <Cell fill="#f43f5e" />
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-6 pr-8 min-w-[150px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-lg bg-indigo-600 shadow-md"></div>
                          <span className="text-base font-black text-slate-700">{t.students}</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900 ml-8">{chartData.categories[0].value}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-lg bg-rose-500 shadow-md"></div>
                          <span className="text-base font-black text-slate-700">{t.visitors}</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900 ml-8">{chartData.categories[1].value}</p>
                      </div>
                    </div>
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
              <button 
                onClick={handleExportClick}
                className="flex items-center gap-3 text-indigo-600 font-black hover:bg-indigo-50 px-8 py-4 rounded-2xl transition-all border-2 border-indigo-100"
              >
                {!isAuthenticated && <Lock className="w-4 h-4 text-indigo-300" />}
                <Download className="w-5 h-5" />
                {t.download}
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
                          <div className="text-sm font-black text-slate-900">
                            {new Date(visit.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs font-bold text-slate-400 mt-1">
                            {new Date(visit.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${visit.location === LocationType.MUSEUM ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
                            {visit.location === LocationType.MUSEUM ? t.museum : t.gallery}
                          </span>
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap text-sm font-black text-slate-600">
                          {visit.category === VisitorCategory.STUDENT ? t.students : t.visitors}
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap text-sm font-mono font-black text-indigo-600 text-right">
                          #{String(visit.dailyNumber).padStart(4, '0')}
                        </td>
                      </tr>
                    ))}
                    {visits.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-10 py-24 text-center text-slate-400 font-bold italic bg-slate-50/50">
                          {t.noData}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Staff Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-400 border border-white/20">
            <button 
              onClick={() => { setShowAuthModal(false); setAuthError(false); setPasscodeInput(''); }}
              className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-12">
              <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner">
                <Lock className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-serif text-slate-900 mb-3 text-center">{t.staffAccess}</h3>
              <p className="text-slate-500 font-bold text-center mb-8 text-sm leading-relaxed">{t.enterPasscode}</p>
              
              <form onSubmit={handleAuthConfirm} className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <KeyRound className="h-5 h-5 text-slate-400" />
                  </div>
                  <input 
                    type="password"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder={t.passcode}
                    autoFocus
                    className={`w-full pl-14 pr-6 py-5 bg-slate-100 border-2 rounded-[1.5rem] font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${authError ? 'border-rose-300 bg-rose-50' : 'border-transparent focus:border-indigo-500'}`}
                  />
                  {authError && <p className="text-rose-600 text-xs font-black mt-3 ml-2 uppercase tracking-wider">{t.invalidPasscode}</p>}
                </div>
                
                <div className="flex gap-4 pt-4">
                   <button 
                    type="button"
                    onClick={() => { setShowAuthModal(false); setPasscodeInput(''); setAuthError(false); }}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-sm tracking-widest"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all shadow-xl uppercase text-sm tracking-widest"
                  >
                    {t.confirm}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showPopup && lastVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500 border border-white/20">
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-12 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner shadow-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-4xl font-serif text-slate-900 mb-2 leading-tight">{t.checkinSuccess}</h3>
              <p className="text-slate-500 font-bold mb-10 text-lg">
                {t.welcomeTo} <span className="text-indigo-600 font-black">{lastVisit.location === LocationType.MUSEUM ? t.museum : t.gallery}</span>!
              </p>
              
              <div className="bg-slate-50 w-full p-12 rounded-[3rem] border-4 border-dashed border-slate-200 relative">
                <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 mb-5">{t.ticketNumber}</p>
                <div className="text-9xl font-mono font-black text-indigo-600 tracking-tighter tabular-nums leading-none">
                  {String(lastVisit.dailyNumber).padStart(3, '0')}
                </div>
              </div>
              
              <div className="mt-8 flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                <Clock className="w-3.5 h-3.5" />
                <span>{t.dailyReset}</span>
              </div>
              
              <button 
                onClick={() => setShowPopup(false)}
                className="mt-12 w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] hover:bg-indigo-600 transition-all shadow-2xl text-xl uppercase tracking-widest"
              >
                {t.closeTicket}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-md border-t border-white/10 py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                <Building2 className="text-white w-5 h-5" />
              </div>
              <span className="text-white font-serif text-xl tracking-tight">Artemis</span>
          </div>
          <div className="text-center text-slate-300 text-sm font-black uppercase tracking-[0.25em] opacity-80">
            <p>Artemis Management System &copy; {new Date().getFullYear()}</p>
          </div>
          <div className="flex items-center justify-center gap-6">
            <span className="px-4 py-1.5 rounded-full bg-white/10 text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
              {t.staffOnly}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
