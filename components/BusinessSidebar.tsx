import React, { useState } from 'react';
import { LayoutDashboard, Users, ShoppingCart, MessageCircle, User, LogOut, PieChart, Wallet, FileText, Code, History, ChevronDown, Building2, Check } from 'lucide-react';
import { Company } from '../types';

interface BusinessSidebarProps {
  selectedCompany: Company;
  myCompanies: Company[];
  currentView: string;
  setView: (view: string) => void;
  onSelectCompany: (id: string) => void;
  onSwitchToPersonal: () => void;
  onLogout: () => void;
}

export const BusinessSidebar: React.FC<BusinessSidebarProps> = ({ selectedCompany, myCompanies, currentView, setView, onSelectCompany, onSwitchToPersonal, onLogout }) => {
  const [showSwitcher, setShowSwitcher] = useState(false);
    
  const menuItems = [
    { id: 'OVERVIEW', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'FINANCE', label: 'Tesorería', icon: Wallet },
    { id: 'AUDIT', label: 'Auditoría', icon: History },
    { id: 'INVOICING', label: 'Facturación', icon: FileText },
    { id: 'EMPLOYEES', label: 'Recursos Humanos', icon: Users },
    { id: 'CATALOG', label: 'Catálogo', icon: ShoppingCart },
    { id: 'MESSAGING', label: 'Mensajería', icon: MessageCircle },
    { id: 'DEVELOPERS', label: 'Auditoría & API', icon: Code },
  ];

  if (selectedCompany.isPublic) {
      menuItems.splice(4, 0, { id: 'SHAREHOLDERS', label: 'Accionistas', icon: PieChart });
  }

  return (
    <div className="hidden md:flex w-72 bg-white h-screen fixed left-0 top-0 flex-col z-50 border-r border-slate-100 shadow-sm font-sans">
      <div className="p-6 pb-6 border-b border-slate-100 relative">
        <button 
          onClick={() => setShowSwitcher(!showSwitcher)}
          className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all group border ${showSwitcher ? 'bg-slate-50 border-slate-200' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg tracking-tighter shrink-0 ${selectedCompany.isPublic ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-900 shadow-slate-900/10'}`}>
                {selectedCompany.name.charAt(0)}
            </div>
            <div className="text-left flex-1 min-w-0">
                <h1 className="text-sm font-black leading-none text-slate-900 tracking-tight truncate">{selectedCompany.name}</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cambiar sociedad</p>
            </div>
            <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 ${showSwitcher ? 'rotate-180' : ''}`} />
        </button>

        {showSwitcher && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-[60] overflow-hidden animate-slide-up py-2">
                <p className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 flex justify-between items-center">
                    Mis Sociedades
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{myCompanies.length}</span>
                </p>
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {myCompanies.map(c => (
                        <button 
                            key={c.id} 
                            onClick={() => { onSelectCompany(c.id); setShowSwitcher(false); }}
                            className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left relative ${selectedCompany.id === c.id ? 'bg-indigo-50/50' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${c.isPublic ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                                {c.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate ${selectedCompany.id === c.id ? 'text-indigo-600' : 'text-slate-900'}`}>{c.name}</p>
                                <p className="text-[9px] text-slate-400 font-mono">{c.nif}</p>
                            </div>
                            {selectedCompany.id === c.id && (
                                <div className="absolute right-4 text-indigo-500">
                                    <Check size={14} strokeWidth={3}/>
                                </div>
                            )}
                        </button>
                    ))}
                    <button 
                        onClick={() => { onSelectCompany(''); setShowSwitcher(false); }}
                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left border-t border-slate-50"
                    >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-400 shrink-0">
                            <Building2 size={16}/>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-600">Ver todas las empresas</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Vista de Rejilla</p>
                        </div>
                    </button>
                </div>
            </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar py-4">
        <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2">Gestión Corporativa</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group text-sm font-bold relative overflow-hidden ${
              currentView === item.id
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <item.icon size={18} className={currentView === item.id ? 'text-brand-300' : 'text-slate-400 group-hover:text-slate-700 transition-colors'} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <button 
          onClick={onSwitchToPersonal}
          className="w-full flex items-center gap-3 px-4 py-3 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-2xl transition-all text-xs font-bold group"
        >
          <User size={16} />
          <span>Vista Personal</span>
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all text-xs font-bold group"
        >
          <LogOut size={16}/>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};