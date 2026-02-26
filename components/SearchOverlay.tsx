
import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, ArrowRight, FileText, Landmark, Wallet, Zap, Gift, Palette, TrendingUp, Users, Shield, Newspaper, Briefcase } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  initialQuery?: string;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, onNavigate, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const results = useMemo(() => {
    const allContent: SearchResult[] = [
      { id: 'dashboard', title: 'Inicio', description: 'Resumen de su cuenta y actividad reciente.', icon: Landmark, category: 'Navegación' },
      { id: 'accounts', title: 'Cartera', description: 'Gestione sus cuentas, saldos e IBANs.', icon: Wallet, category: 'Finanzas' },
      { id: 'transfers', title: 'Enviar Dinero', description: 'Realice transferencias instantáneas entre ciudadanos.', icon: ArrowRight, category: 'Finanzas' },
      { id: 'payments', title: 'Pagos Rápidos', description: 'Pague en comercios o a otros usuarios mediante Zap.', icon: Zap, category: 'Finanzas' },
      { id: 'investments', title: 'Inversiones', description: 'Mercado de valores y activos de La Placeta.', icon: TrendingUp, category: 'Finanzas' },
      { id: 'taxes', title: 'Hacienda', description: 'Consulte sus impuestos, IRM y obligaciones fiscales.', icon: FileText, category: 'Estado' },
      { id: 'sede', title: 'Sede Electrónica', description: 'Trámites administrativos y gestión de identidad.', icon: Landmark, category: 'Estado' },
      { id: 'family', title: 'Vínculos', description: 'Gestione sus relaciones familiares y tutelas.', icon: Users, category: 'Social' },
      { id: 'lottery', title: 'Sorteos', description: 'Participe en la Lotería de La Placeta y otros eventos.', icon: Gift, category: 'Social' },
      { id: 'market', title: 'Market', description: 'Diseños personalizados y mercado de objetos.', icon: Palette, category: 'Comercio' },
      { id: 'news', title: 'Prensa', description: 'Últimas noticias y boletines oficiales.', icon: Newspaper, category: 'Información' },
      { id: 'servicios', title: 'Servicios', description: 'Catálogo de servicios administrativos y requisitos.', icon: Briefcase, category: 'Información' },
      { id: 'admin', title: 'Administración', description: 'Panel de control para la Junta de Gobierno.', icon: Shield, category: 'Estado' },
    ];

    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allContent.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-pop-in relative z-10 border border-white/20">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <Search className="text-brand-600" size={24} />
          <input 
            autoFocus
            type="text" 
            placeholder="¿Qué está buscando?" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-slate-900 placeholder:text-slate-300"
          />
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result) => (
                <button 
                  key={result.id}
                  onClick={() => { onNavigate(result.id); onClose(); }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-brand-50 rounded-2xl transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all">
                    <result.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-slate-900">{result.title}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">{result.category}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">{result.description}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold">No se encontraron resultados para "{query}"</p>
            </div>
          ) : (
            <div className="py-10 px-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Sugerencias</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Cuentas', 'Transferencias', 'Hacienda', 'Sorteos', 'Market', 'Prensa'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-4 py-3 bg-slate-50 hover:bg-brand-50 text-slate-600 hover:text-brand-600 rounded-xl text-xs font-bold transition-all border border-slate-100 text-left"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400 shadow-sm">ESC</kbd>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cerrar</span>
            </div>
          </div>
          <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Banco de La Placeta Search</p>
        </div>
      </div>
    </div>
  );
};
