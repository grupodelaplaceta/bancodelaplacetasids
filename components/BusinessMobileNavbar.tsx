import React, { useState } from 'react';
import { LayoutDashboard, Wallet, FileText, Users, ShoppingCart, Menu, X, User, LogOut, Code, Building2, ChevronRight } from 'lucide-react';
import { useBank } from '../context/useBank';

interface BusinessMobileNavbarProps {
  currentView: string;
  setView: (view: string) => void;
  isPublic: boolean;
  companyName: string;
  onSwitchToPersonal: () => void;
  onBackToCompanies: () => void;
}

export const BusinessMobileNavbar: React.FC<BusinessMobileNavbarProps> = ({ 
  currentView, setView, isPublic, companyName, onSwitchToPersonal, onBackToCompanies 
}) => {
  const { logout } = useBank();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const dockItems = [
    { id: 'OVERVIEW', icon: LayoutDashboard },
    { id: 'FINANCE', icon: Wallet },
    { id: 'INVOICING', icon: FileText },
    { id: 'EMPLOYEES', icon: Users },
  ];

  const drawerItems = [
    { id: 'CATALOG', icon: ShoppingCart, label: 'Catálogo', color: 'bg-indigo-50 text-indigo-600' },
    { id: 'DEVELOPERS', icon: Code, label: 'Devs', color: 'bg-slate-100 text-slate-600' },
  ];

  const handleNavigate = (viewId: string) => { 
      triggerHaptic();
      setView(viewId); 
      setIsMenuOpen(false); 
  };

  return (
    <>
        {isMenuOpen && (
            <div className="md:hidden fixed inset-0 z-[110] flex flex-col justify-end">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setIsMenuOpen(false)}></div>
                <div className="relative bg-white rounded-t-[2.5rem] p-8 pb-safe shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 opacity-50"></div>
                    
                    <div className="flex items-center gap-4 mb-10 px-2">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${isPublic ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                            {companyName.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900">{companyName}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isPublic ? 'S.P. Pública' : 'S.PV. Privada'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        {drawerItems.map((item) => (
                            <button key={item.id} onClick={() => handleNavigate(item.id)} className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-3xl group active:scale-95 transition-transform">
                                <item.icon size={26} className={item.color} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3 mb-4">
                        <button onClick={() => { triggerHaptic(); onBackToCompanies(); }} className="w-full py-4 px-6 bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-between active:scale-95 border border-slate-100">
                           <div className="flex items-center gap-3"><Building2 size={16}/> Mis Sociedades</div>
                           <ChevronRight size={14} />
                        </button>
                        <button onClick={() => { triggerHaptic(); onSwitchToPersonal(); }} className="w-full py-4 px-6 bg-brand-50 text-brand-600 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-between active:scale-95 border border-brand-100">
                           <div className="flex items-center gap-3"><User size={16}/> Vista Ciudadano</div>
                           <ChevronRight size={14} />
                        </button>
                        <button onClick={() => { triggerHaptic(); logout(); }} className="w-full py-4 px-6 text-red-500 font-bold text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95">
                            <LogOut size={16} /> Cerrar Sesión Corporativa
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="md:hidden fixed bottom-6 left-0 w-full z-[100] pointer-events-none pb-safe px-4">
            <div className="glass-dark backdrop-blur-2xl pointer-events-auto rounded-[2rem] p-2 shadow-2xl flex justify-between items-center max-w-[360px] mx-auto border border-white/10">
                {dockItems.map((item) => { 
                    const isActive = currentView === item.id && !isMenuOpen;
                    return (
                    <button key={item.id} onClick={() => { handleNavigate(item.id); }}
                        className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-white text-slate-900 shadow-lg scale-110' : 'text-white/40 hover:text-white active:scale-90'}`}>
                        <item.icon size={22} strokeWidth={isActive ? 2.5 : 2}/>
                    </button>
                )})}
                <button onClick={() => { triggerHaptic(); setIsMenuOpen(!isMenuOpen); }}
                    className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-300 ${isMenuOpen ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'text-white/40 hover:text-white active:scale-90'}`}>
                    {isMenuOpen ? <X size={22} strokeWidth={2.5}/> : <Menu size={22} strokeWidth={2.5}/>}
                </button>
            </div>
        </div>
    </>
  );
};