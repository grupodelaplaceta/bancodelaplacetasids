
import React from 'react';
import { LayoutDashboard, ArrowRightLeft, TrendingUp, FileText, LogOut, Gift, Zap, Palette, Wallet, Users, Shield, Newspaper, Search, Briefcase } from 'lucide-react';
import { useBank } from '../context/useBank';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  onLogout: () => void;
  onSearchOpen?: (query: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout, onSearchOpen }) => {
  const { currentUser, getAge, triggerHaptic } = useBank();
  const age = currentUser ? getAge(currentUser.birthDate) : 0;
  const isTeen = age >= 14; 

  let menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'accounts', label: 'Cartera', icon: Wallet },
    { id: 'transfers', label: 'Enviar', icon: ArrowRightLeft },
    { id: 'news', label: 'Prensa', icon: Newspaper },
    { id: 'servicios', label: 'Servicios', icon: Briefcase },
  ];

  if (isTeen) {
      menuItems = [
        ...menuItems,
        { id: 'payments', label: 'Pagos', icon: Zap },
        { id: 'lottery', label: 'Sorteos', icon: Gift },
        { id: 'market', label: 'Market', icon: Palette },
        { id: 'investments', label: 'Inversión', icon: TrendingUp },
        { id: 'taxes', label: 'Hacienda', icon: FileText },
        { id: 'family', label: 'Vínculos', icon: Users },
      ];
  }

  if (currentUser?.role === 'ADMIN') {
      menuItems.push({ id: 'admin', label: 'Junta Admin', icon: Shield });
  }

  const handleNav = (id: string) => {
    triggerHaptic('light');
    setView(id);
  }

  return (
    <div className="hidden md:flex w-64 bg-[#f8fafc] h-screen fixed left-0 top-0 flex-col z-50 border-r border-slate-200/60 font-sans">
      <div className="p-6">
        <div className="flex items-center justify-center mb-8 px-2">
            <img 
              src="https://i.postimg.cc/s2s2RdgX/BANCO-DE.png" 
              alt="Banco de La Placeta" 
              className="h-16 w-auto object-contain drop-shadow-sm" 
            />
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            onFocus={() => onSearchOpen?.('')}
            readOnly
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer hover:border-brand-300 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm mb-4">
            <img src={currentUser?.avatarUrl} alt="User" className="w-10 h-10 rounded-xl bg-slate-200 object-cover" />
            <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-900">{currentUser?.name.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-400 font-bold font-mono truncate">{currentUser?.dip}</p>
            </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar pb-4">
        <p className="px-4 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Menú</p>
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-bold btn-press ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-600 transition-colors'} strokeWidth={2.5} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-bold group btn-press"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/>
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
};
