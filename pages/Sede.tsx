
import React, { useEffect, useState } from 'react';
import { useBank } from '../context/useBank';
import { 
  Check, Download, UserCircle,
  Landmark, Scale, Calculator,
  Receipt
} from 'lucide-react';

export const SedeElectronica: React.FC = () => {
  const { currentUser, getFiscalProjection } = useBank();
  const [projections, setProjections] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
      const load = async () => {
          if(!currentUser) return;
          const now = new Date();
          try {
              const data = await getFiscalProjection(now.getMonth() + 1, now.getFullYear());
              setProjections(Array.isArray(data) ? data : []);
              
              const resInv = await fetch('/api', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ action: 'GET_INVOICES', userId: currentUser.id, role: currentUser.role })
              });
              const dataInv = await resInv.json();
              // FIX: Ensure dataInv is an array before setting state
              if (Array.isArray(dataInv)) {
                  setInvoices(dataInv);
              } else {
                  console.warn("API Error (Invoices):", dataInv);
                  setInvoices([]);
              }
          } catch(e) {
              console.error(e);
              setInvoices([]);
          }
      };
      load();
  }, [currentUser, getFiscalProjection]);
  
  if (!currentUser) return null;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto pb-40 font-sans animate-fade-in">
      {/* Official Header */}
      <div className="bg-slate-950 rounded-[3rem] p-10 md:p-16 mb-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[120px] -mr-40 -mt-40"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600 rounded-full blur-[100px] -ml-40 -mb-40"></div>
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                <Landmark size={24} className="text-brand-300" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-300">Sede Electrónica v5.0</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter leading-tight max-w-2xl">Portal Oficial del <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Ciudadano Soberano.</span></h2>
            <div className="flex flex-wrap gap-4">
                <button className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all active:scale-95 shadow-xl">Carpeta Ciudadana</button>
                <button className="px-6 py-3 bg-white/5 border border-white/10 backdrop-blur-md text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">Consultar Notificaciones</button>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 space-y-10">
              {/* Facturación Reciente */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-soft">
                  <div className="flex justify-between items-center mb-10">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Receipt className="text-brand-600"/> Registro de Facturas</h3>
                      <button className="text-[9px] font-black uppercase text-indigo-600 hover:underline">Ver Historial Completo</button>
                  </div>
                  
                  <div className="space-y-4">
                      {invoices.length === 0 ? (
                          <div className="py-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin facturas emitidas o recibidas</p>
                          </div>
                      ) : invoices.map(inv => (
                          <div key={inv.id} className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-brand-500 transition-all flex items-center justify-between group shadow-sm">
                               <div className="flex items-center gap-5">
                                    <div className="w-11 h-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black italic">#{inv.numberSerial}</div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm">{inv.concept}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{inv.status} • {new Date(inv.createdAt).toLocaleDateString()}</p>
                                    </div>
                               </div>
                               <div className="text-right">
                                   <p className="font-black text-slate-900">{inv.amount.toLocaleString()} Pz</p>
                                   <button className="text-indigo-600 hover:text-indigo-800 transition-colors mt-1"><Download size={14}/></button>
                               </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Identidad & Certificados */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-soft">
                  <div className="flex justify-between items-center mb-10">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><UserCircle className="text-brand-600"/> Identidad Certificada</h3>
                      <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[9px] font-black uppercase border border-emerald-100 flex items-center gap-2">
                          <Check size={12} strokeWidth={3}/> Nodo Validado
                      </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre Legal</p>
                          <p className="font-black text-slate-900 text-lg">{currentUser.name}</p>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DIP SIDS</p>
                          <p className="font-mono font-black text-slate-900 text-lg">{currentUser.dip}</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="space-y-10">
            {/* Obligations Sidebar */}
            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-soft">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-900 flex items-center gap-3 text-lg"><Scale size={20} className="text-brand-600"/> Tributos</h3>
                </div>

                <div className="space-y-4">
                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Calculator size={14}/> Tu IA Actual</h4>
                        <div className="flex items-center justify-between">
                             <span className="text-3xl font-black tracking-tighter text-slate-900">{projections[0]?.ia.toFixed(4) || '0.0000'}</span>
                             <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${projections[0]?.ia > 0.15 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {projections[0]?.ia > 0.15 ? 'IA ALTO' : 'IA BAJO'}
                             </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 leading-relaxed">Índice de Acumulación Mensual</p>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};
