
import React, { useState } from 'react';
import { LayoutDashboard, ArrowRightLeft, Wallet, Landmark, Menu, X, TrendingUp, Palette, FileText, Users, Gift, Shield, Zap, LogOut, Building2, Briefcase, Search } from 'lucide-react';
import { useBank } from '../context/useBank';

interface MobileNavbarProps {
  currentView: string;
  setView: (view: string) => void;
  onSwitchToBusiness?: () => void;
  onSearchOpen?: (query: string) => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ currentView, setView, onSwitchToBusiness, onSearchOpen }) => {
  const { currentUser, logout, getAge, triggerHaptic, companies } = useBank();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isTeen = currentUser ? getAge(currentUser.birthDate) >= 14 : false;
  const isBusinessOwner = companies.some(c => c.ownerId === currentUser?.id);

  const dockItems = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'accounts', icon: Wallet },
    { id: 'transfers', icon: ArrowRightLeft }, 
    { id: 'sede', icon: Landmark },
  ];

  let drawerItems = [];
  if (isTeen) {
      drawerItems = [
        { id: 'payments', icon: Zap, label: 'Pagos', color: 'bg-brand-50 text-brand-600' },
        { id: 'investments', icon: TrendingUp, label: 'Mercado', color: 'bg-emerald-50 text-emerald-600' },
        { id: 'market', icon: Palette, label: 'Diseños', color: 'bg-indigo-50 text-indigo-600' },
        { id: 'taxes', icon: FileText, label: 'Hacienda', color: 'bg-orange-50 text-orange-600' },
        { id: 'family', icon: Users, label: 'Vínculos', iconSize: 20, color: 'bg-blue-50 text-blue-600' },
        { id: 'lottery', icon: Gift, label: 'Sorteos', color: 'bg-purple-50 text-purple-600' },
        { id: 'servicios', icon: Briefcase, label: 'Servicios', color: 'bg-slate-100 text-slate-600' },
      ];
  }
  if (currentUser?.role === 'ADMIN') {
      drawerItems.push({ id: 'admin', icon: Shield, label: 'Gobierno', color: 'bg-slate-900 text-white' });
  }

  const handleNavigate = (viewId: string) => { 
      triggerHaptic('light');
      setView(viewId); 
      setIsMenuOpen(false); 
  };

  const handleSwitch = () => {
      triggerHaptic('medium');
      onSwitchToBusiness?.();
      setIsMenuOpen(false);
  };

  return (
    <>
        {/* Drawer Overlay */}
        {isMenuOpen && (
            <div className="md:hidden fixed inset-0 z-[110] flex flex-col justify-end">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setIsMenuOpen(false)}></div>
                <div className="relative bg-white rounded-t-[2.5rem] p-6 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slide-up max-h-[85vh] overflow-y-auto border-t border-white/50">
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-8 opacity-50"></div>
                    
                    {/* Search Bar Mobile */}
                    <div className="relative mb-8 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar en el sistema..." 
                            onFocus={() => { setIsMenuOpen(false); onSearchOpen?.(''); }}
                            readOnly
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none cursor-pointer"
                        />
                    </div>

                    <div className="flex justify-between items-center mb-6 px-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Menú Extendido</h3>
                        {isBusinessOwner && (
                            <button 
                                onClick={handleSwitch} 
                                className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                            >
                                <Building2 size={14}/> Gestión Empresa
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {drawerItems.map((item: any) => (
                            <button key={item.id} onClick={() => handleNavigate(item.id)} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${item.color}`}>
                                    <item.icon size={24} strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate w-full text-center">{item.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <button onClick={() => { triggerHaptic('medium'); logout(); }} className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            </div>
        )}

        {/* Floating Dock Compacto */}
        <div className="md:hidden fixed bottom-6 left-0 w-full z-[100] pointer-events-none pb-safe px-6">
            <div className="glass-dark backdrop-blur-xl pointer-events-auto rounded-full p-2 shadow-2xl flex justify-around items-center max-w-[320px] mx-auto border border-white/10 ring-1 ring-white/5">
                {dockItems.map((item) => { 
                    const isActive = currentView === item.id && !isMenuOpen;
                    return (
                    <button key={item.id} onClick={() => { handleNavigate(item.id); }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-white text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110' : 'text-slate-400 hover:text-white active:scale-90'}`}>
                        <item.icon size={20} strokeWidth={isActive ? 3 : 2.5}/>
                    </button>
                )})}
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button onClick={() => { triggerHaptic('medium'); setIsMenuOpen(!isMenuOpen); }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isMenuOpen ? 'bg-brand-600 text-white shadow-glow scale-110' : 'text-slate-400 hover:text-white active:scale-90'}`}>
                    {isMenuOpen ? <X size={20} strokeWidth={3}/> : <Menu size={20} strokeWidth={3}/>}
                </button>
            </div>
        </div>
    </>
  );
};
