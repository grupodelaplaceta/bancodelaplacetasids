
import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileNavbar } from './components/MobileNavbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { Admin } from './pages/Admin';
import { Accounts } from './pages/Accounts';
import { Transfers } from './pages/Transfers';
import { Payments } from './pages/Payments';
import { Investments } from './pages/Investments';
import { Taxes } from './pages/Taxes';
import { SedeElectronica } from './pages/Sede';
import { Family } from './pages/Family';
import { Lottery } from './pages/Lottery';
import { Market } from './pages/Market';
import { ATM } from './pages/ATM';
import { NewsBoard } from './pages/NewsBoard';
import { Servicios } from './pages/Servicios';
import { SearchOverlay } from './components/SearchOverlay';
import { useBank } from './context/useBank';
import { X, ShieldAlert, Calendar, ArrowRight } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, notifications, logout, addNotification, fetchData, updateSelfBirthDate, companies } = useBank();
  const [currentView, setView] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [showATM, setShowATM] = useState(false);
  const [isBusinessView, setIsBusinessView] = useState(false);
  const [birthDateInput, setBirthDateInput] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Logic to determine if user has business access
  const hasBusinessAccess = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === 'COMPANY' || companies.some(c => c.ownerId === currentUser.id);
  }, [currentUser, companies]);

  useEffect(() => {
    if (currentUser?.id) {
        fetchData(currentUser.id).catch(console.error);
    }
  }, [currentUser?.id, fetchData]);

  if (!currentUser) {
    if (showATM) return <ATM onExit={() => setShowATM(false)} />;
    if (showLogin) return <Login onLogin={() => setView('dashboard')} onBack={() => setShowLogin(false)} onATMEnter={() => setShowATM(true)} />;
    return <Landing onEnter={() => setShowLogin(true)} />;
  }

  // PANTALLA DE BLOQUEO: VALIDACIÓN DE IDENTIDAD SIDS (OBLIGATORIA)
  if (!currentUser.birthDate) {
      return (
          <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-900/10 to-indigo-900/10 pointer-events-none"></div>
              <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl text-center animate-pop-in relative z-10">
                  <div className="w-20 h-20 bg-brand-500/20 text-brand-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-glow">
                      <ShieldAlert size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-4 tracking-tight leading-none">Validación SIDS</h2>
                  <p className="text-slate-400 font-medium mb-10 leading-relaxed text-sm">
                      Debe completar su perfil de identidad digital. Introduzca su fecha de nacimiento para habilitar las funciones bancarias según el Capítulo 1.
                  </p>
                  
                  <div className="space-y-6">
                      <div className="text-left">
                          <label className="text-[10px] font-black text-brand-300 uppercase tracking-[0.2em] ml-2 mb-3 block">Fecha de Nacimiento</label>
                          <div className="relative group">
                              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20}/>
                              <input 
                                  type="date" 
                                  value={birthDateInput}
                                  onChange={(e) => setBirthDateInput(e.target.value)}
                                  className="w-full pl-14 pr-6 py-5 bg-slate-800/50 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-lg"
                              />
                          </div>
                      </div>
                      <button 
                        onClick={() => birthDateInput && updateSelfBirthDate(birthDateInput)}
                        disabled={!birthDateInput}
                        className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-20 active:scale-95 group"
                      >
                          Finalizar Registro <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                      </button>
                      <button onClick={logout} className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors pt-4">Salir del Sistema</button>
                  </div>
              </div>
          </div>
      );
  }
  
  if (isBusinessView && hasBusinessAccess) {
      return <BusinessDashboard onSwitchView={() => setIsBusinessView(false)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setView} onSwitchToBusiness={() => hasBusinessAccess && setIsBusinessView(true)} />;
      case 'accounts': return <Accounts addNotification={addNotification} />;
      case 'transfers': return <Transfers addNotification={addNotification} />;
      case 'payments': return <Payments addNotification={addNotification} />;
      case 'investments': return <Investments addNotification={addNotification} />;
      case 'taxes': return <Taxes />;
      case 'sede': return <SedeElectronica />;
      case 'family': return <Family />;
      case 'lottery': return <Lottery addNotification={addNotification} />;
      case 'market': return <Market />;
      case 'admin': return <Admin />;
      case 'news': return <NewsBoard />;
      case 'servicios': return <Servicios />;
      default: return <Dashboard onNavigate={setView} onSwitchToBusiness={() => hasBusinessAccess && setIsBusinessView(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex w-full overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        onLogout={logout} 
        onSearchOpen={(q) => { setSearchQuery(q); setIsSearchOpen(true); }}
      />
      <MobileNavbar 
        currentView={currentView} 
        setView={setView} 
        onSwitchToBusiness={() => hasBusinessAccess && setIsBusinessView(true)} 
        onSearchOpen={(q) => { setSearchQuery(q); setIsSearchOpen(true); }}
      />
      
      <main className="flex-1 md:ml-72 w-full min-h-screen transition-all duration-300 relative overflow-y-auto overflow-x-hidden">
         {renderView()}
      </main>

      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onNavigate={setView}
        initialQuery={searchQuery}
      />

      <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 pointer-events-none w-[calc(100%-2rem)] md:w-auto">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto w-full md:min-w-[320px] p-5 rounded-2xl shadow-2xl text-white font-bold flex justify-between items-center animate-slide-up backdrop-blur-md border border-white/10 ${
            n.type === 'success' ? 'bg-emerald-600/90' : 
            n.type === 'error' ? 'bg-rose-600/90' : 
            'bg-slate-900/90'
          }`}>
            <span className="text-sm tracking-tight">{n.message}</span>
            <X size={18} className="cursor-pointer opacity-60 hover:opacity-100" onClick={() => {}} />
          </div>
        ))}
      </div>
    </div>
  );
};

const App = () => <AppContent />;
export default App;
