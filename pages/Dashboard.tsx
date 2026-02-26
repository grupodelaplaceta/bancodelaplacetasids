
import React, { useMemo, useState } from 'react';
import { useBank } from '../context/useBank';
import { 
  ArrowRightLeft, TrendingUp, Bell, 
  Building2, ArrowUpRight, ArrowDownLeft, ShieldCheck, 
  QrCode, Zap, History, Eye, EyeOff, Landmark, Newspaper, ChevronRight, ChevronDown
} from 'lucide-react';

interface DashboardProps { onNavigate: (view: string) => void; onSwitchToBusiness?: () => void; }

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSwitchToBusiness }) => {
  const { currentUser, userAccounts, transactions, companies, triggerHaptic, news = [], activeAccountId, setActiveAccountId, claimRbu, addNotification, getAge } = useBank();
  const [showBalance, setShowBalance] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const accounts = useMemo(() => Array.isArray(userAccounts) ? userAccounts : [], [userAccounts]);
  const currentAccount = useMemo(() => accounts.find(a => a.id === activeAccountId) || accounts[0], [accounts, activeAccountId]);

  const age = useMemo(() => currentUser ? getAge(currentUser.birthDate) : 0, [currentUser, getAge]);
  const isMinor = age < 18;

  const canClaimRbu = useMemo(() => {
    if (isMinor) return false;
    if (!currentUser.rbuClaimedAt) return true;
    const lastClaim = new Date(currentUser.rbuClaimedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastClaim.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  }, [currentUser.rbuClaimedAt, isMinor]);

  const handleClaimRbu = async () => {
    if (!currentAccount) return;
    triggerHaptic('success');
    try {
        await claimRbu(currentAccount.id);
        addNotification("RBU reclamada con éxito (+5 Pz)", 'success');
    } catch (e: any) {
        addNotification(e.message, 'error');
    }
  };

  const txsList = useMemo(() => {
      if (!currentAccount) return [];
      const iban = currentAccount.iban;
      return transactions.filter(t => 
          t.senderIban === iban || t.receiverIban === iban
      ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentAccount]);

  const handleNav = (view: string) => {
      triggerHaptic('light');
      onNavigate(view);
  }

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Buenos días';
      if (hour < 20) return 'Buenas tardes';
      return 'Buenas noches';
  };

  return (
    <div className="pb-40 w-full max-w-6xl mx-auto px-4 md:px-8 pt-safe font-sans animate-fade-in overflow-x-hidden">
      
      <header className="flex justify-between items-center mb-6 pt-4">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-[10px] shadow-lg border border-white/10 overflow-hidden group">
                    {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Avatar"/> : currentUser.name.charAt(0)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-50 rounded-full shadow-lg"></div>
            </div>
            <div className="min-w-0">
                <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.2em]">{getGreeting()},</p>
                <h1 className="text-base font-black text-slate-900 leading-none tracking-tight truncate mt-0.5">{currentUser.name.split(' ')[0]}</h1>
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => handleNav('news')} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all active:scale-90 relative group shadow-sm">
                <Newspaper size={16} />
                {news.length > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full group-hover:animate-ping"></span>}
            </button>
            {(companies || []).some(c => c.ownerId === currentUser.id) && (
                <button 
                    onClick={() => { triggerHaptic('medium'); onSwitchToBusiness?.(); }} 
                    className="flex items-center gap-2 px-3 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-slate-950 transition-all shadow-lg active:scale-95 border border-brand-500/20"
                >
                    <Building2 size={16}/>
                    <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">Empresa</span>
                </button>
            )}
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 transition-all active:scale-90 shadow-sm relative">
                <Bell size={16} />
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="relative overflow-visible rounded-[2.5rem] bg-slate-950 text-white p-7 md:p-10 shadow-2xl group flex flex-col justify-center border border-white/5 min-h-[220px]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-[80px] -mr-32 -mt-32 overflow-hidden rounded-t-[2.5rem]"></div>
                  
                  {isDropdownOpen && (
                      <div className="absolute top-20 left-8 right-8 bg-white text-slate-900 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-up">
                          <p className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50">Seleccionar Cuenta</p>
                          <div className="max-h-48 overflow-y-auto">
                              {accounts.map(acc => (
                                  <button 
                                    key={acc.id}
                                    onClick={() => { setActiveAccountId(acc.id); setIsDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-3 flex justify-between items-center hover:bg-slate-50 ${activeAccountId === acc.id ? 'bg-indigo-50 text-indigo-600' : ''}`}
                                  >
                                      <span className="font-bold text-xs">{acc.alias}</span>
                                      <span className="font-mono text-[10px]">{acc.balance.toLocaleString()} Pz</span>
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                          <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="cursor-pointer group/selector">
                              <p className="text-brand-300 font-black text-[9px] uppercase tracking-[0.2em] mb-2 flex items-center gap-2 opacity-80 group-hover/selector:text-white transition-colors">
                                  <ShieldCheck size={12}/> {currentAccount?.alias || 'SIDS Wallet'} <ChevronDown size={12}/>
                              </p>
                              <div className="flex items-center gap-4">
                                <h2 className={`font-black tracking-tighter leading-none transition-all ${showBalance ? 'text-4xl md:text-5xl' : 'text-4xl md:text-5xl opacity-40'}`}>
                                    {showBalance ? (currentAccount?.balance || 0).toLocaleString('es-ES') : '••••••'}
                                </h2>
                                <img src="/PZ.svg" className="w-8 h-8 opacity-90 drop-shadow-glow" alt="Pz" />
                                <button onClick={(e) => { e.stopPropagation(); setShowBalance(!showBalance); }} className="text-white/20 hover:text-white transition-colors ml-1">
                                    {showBalance ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                              </div>
                          </div>
                          <button className="w-11 h-11 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-lg">
                              <QrCode size={20}/>
                          </button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[7px] font-black uppercase tracking-widest border border-emerald-500/20">
                            {currentAccount?.type === 'BUSINESS' ? 'Cuenta Empresa' : 'Cuenta Personal'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 tracking-wider opacity-60">**** {currentAccount?.iban.slice(-4)}</span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                  {[
                      { id: 'transfers', label: 'Girar', icon: ArrowRightLeft, color: 'bg-indigo-50 text-indigo-600', border: 'hover:border-indigo-200' },
                      { id: 'payments', label: 'Pagar', icon: Zap, color: 'bg-emerald-50 text-emerald-600', border: 'hover:border-emerald-200' },
                      { id: 'sede', label: 'Sede', icon: Landmark, color: 'bg-slate-100 text-slate-700', border: 'hover:border-slate-300' },
                      { id: 'investments', label: 'Bolsa', icon: TrendingUp, color: 'bg-purple-50 text-purple-600', border: 'hover:border-purple-200' }
                  ].map(btn => (
                    <button key={btn.id} onClick={() => handleNav(btn.id)} className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3 transition-all group active:scale-95 ${btn.border}`}>
                        <div className={`w-10 h-10 ${btn.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}><btn.icon size={20}/></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{btn.label}</span>
                    </button>
                  ))}
              </div>

              {!isMinor && (
                  <div className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${canClaimRbu ? 'bg-brand-50 border-brand-200 shadow-glow' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                      <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${canClaimRbu ? 'bg-brand-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                              <Zap size={24} />
                          </div>
                          <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Renta Básica Universal</h4>
                              <p className="text-[9px] font-bold text-slate-500">{canClaimRbu ? 'Bono semanal de 5 Pz disponible' : 'Próximo bono en unos días'}</p>
                          </div>
                      </div>
                      <button 
                        onClick={handleClaimRbu}
                        disabled={!canClaimRbu}
                        className={`px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${canClaimRbu ? 'bg-slate-900 text-white hover:bg-brand-600 shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                          {canClaimRbu ? 'Reclamar' : 'Reclamado'}
                      </button>
                  </div>
              )}

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hidden md:block">
                  <div className="flex justify-between items-center mb-5">
                      <h3 className="font-black text-slate-900 text-[9px] uppercase tracking-[0.2em]">Otras Cuentas</h3>
                      <button onClick={() => handleNav('accounts')} className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-2.5 py-1 rounded transition-all border border-indigo-100">Ver Cartera</button>
                  </div>
                  <div className="space-y-3">
                      {accounts.filter(a => a.id !== activeAccountId).slice(0, 2).map(acc => (
                          <div key={acc.id} onClick={() => setActiveAccountId(acc.id)} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all cursor-pointer group">
                              <div className="flex items-center gap-4">
                                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-colors border border-slate-100">
                                      {acc.type === 'BUSINESS' ? <Building2 size={16}/> : <User size={16}/>}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-900 text-[12px] leading-none">{acc.alias}</p>
                                      <p className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider mt-1.5">{acc.iban.slice(0,14)}...</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-black text-sm text-slate-900 tracking-tighter">{acc.balance.toLocaleString()} <span className="text-[10px] text-slate-400 opacity-60">Pz</span></p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-full flex flex-col min-h-[400px]">
                  <div className="flex justify-between items-center mb-5">
                      <h3 className="font-black text-slate-900 text-[9px] uppercase tracking-widest">Actividad Reciente</h3>
                      <History size={14} className="text-slate-300"/>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                      {txsList.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-300 opacity-50">
                              <Zap size={24} className="mb-3"/>
                              <p className="text-[8px] font-black uppercase tracking-widest">Sin movimientos recientes</p>
                          </div>
                      ) : txsList.slice(0, 15).map(tx => {
                          const isIncoming = tx.receiverIban === currentAccount?.iban;
                          return (
                              <div key={tx.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all group border border-transparent hover:border-slate-100">
                                  <div className="flex items-center gap-3.5 min-w-0">
                                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm shrink-0 ${isIncoming ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                          {isIncoming ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}
                                      </div>
                                      <div className="min-w-0">
                                          <p className="font-bold text-slate-800 text-[11px] truncate leading-none mb-1.5">{tx.description}</p>
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString()}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className={`font-black text-[12px] whitespace-nowrap shrink-0 tracking-tight ${isIncoming ? 'text-emerald-600' : 'text-slate-900'}`}>
                                          {isIncoming ? '+' : '-'}{tx.amount.toLocaleString()} Pz
                                      </span>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
                  <button onClick={() => handleNav('accounts')} className="w-full py-3.5 bg-slate-50 text-slate-500 rounded-2xl font-black text-[9px] uppercase tracking-widest mt-6 hover:bg-slate-950 hover:text-white transition-all active:scale-95 border border-slate-100 shadow-inner">
                      Historial Completo
                  </button>
              </div>

              {news.length > 0 && (
                <div onClick={() => handleNav('news')} className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:bg-indigo-700 transition-all">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <Newspaper size={24} className="text-indigo-200 opacity-60"/>
                        <span className="text-[7px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest">{news[0].tag}</span>
                    </div>
                    <h4 className="text-[13px] font-black italic leading-tight mb-2.5 relative z-10">{news[0].title}</h4>
                    <p className="text-[10px] text-indigo-100/70 font-medium line-clamp-2 leading-relaxed relative z-10">{news[0].summary}</p>
                    <div className="mt-5 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-indigo-200 relative z-10 group-hover:translate-x-1 transition-transform">
                        Saber más <ChevronRight size={12}/>
                    </div>
                </div>
              )}
          </div>
      </div>
    </div>
  );
};
