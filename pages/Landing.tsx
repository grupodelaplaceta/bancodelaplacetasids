
import React from 'react';
import { ShieldCheck, TrendingUp, Users, ArrowRight, Heart, MapPin, Leaf, Coffee, Globe } from 'lucide-react';

interface LandingProps {
  onEnter: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 flex flex-col font-sans selection:bg-brand-100 overflow-x-hidden">
      
      {/* Navbar con estilo familiar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="https://i.postimg.cc/s2s2RdgX/BANCO-DE.png" alt="Logo" className="h-9 md:h-11 w-auto object-contain"/>
            <div className="hidden md:block h-6 w-px bg-slate-200"></div>
            <p className="hidden md:block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">El Banco de nuestra gente.</p>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onEnter} className="px-6 py-2.5 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl active:scale-95 group flex items-center gap-2">
              Banca Online <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        
        {/* Hero Section Cálido */}
        <div className="relative pt-12 pb-24 md:pt-28 md:pb-40 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-25 pointer-events-none">
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100 rounded-full blur-[140px]"></div>
             <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-100 rounded-full blur-[120px]"></div>
          </div>
          
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-8 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-[10px] font-black uppercase tracking-widest animate-fade-in shadow-sm">
                   <Heart size={12} fill="currentColor" className="text-rose-500"/> Un futuro compartido en La Placeta
                </div>
                <h1 className="text-6xl md:text-8xl font-black text-slate-950 tracking-tighter leading-[0.85] italic">
                   Tu dinero,<br/><span className="text-brand-600">en buenas</span><br/>manos.
                </h1>
                <p className="text-lg md:text-xl text-slate-500 font-medium max-w-lg leading-relaxed mx-auto md:mx-0">
                   Gestionamos tus ahorros con la cercanía de un vecino y la seguridad del sistema SIDS. Tu prosperidad es la de todos.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
                  <button onClick={onEnter} className="px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-brand-600 transition-all active:scale-95">
                    Comenzar ahora
                  </button>
                  <div className="flex items-center gap-4 px-6 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                    <div className="flex -space-x-3">
                      {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm"><img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User"/></div>)}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+500 Ciudadanos</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 relative hidden lg:block">
                 <div className="relative w-full aspect-square bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-50 p-4 transform rotate-2">
                    <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover rounded-[3.5rem]" alt="Familia"/>
                    <div className="absolute bottom-12 left-12 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 animate-float">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg"><TrendingUp size={20}/></div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inversión Local</p>
                             <p className="text-xl font-black text-slate-900">+12.5% Pz</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Valores Familiares */}
        <div className="py-24 bg-white border-y border-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                 <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm"><MapPin size={28}/></div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Cerca de ti</h3>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">Nuestra red de cajeros y atención ciudadana está diseñada para estar siempre a tu disposición, sin esperas ni frialdad.</p>
              </div>
              <div className="space-y-4">
                 <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm"><Users size={28}/></div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Banca Familiar</h3>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">Cuentas compartidas, ahorro para los más pequeños y control parental. El bienestar financiero es un asunto de todos.</p>
              </div>
              <div className="space-y-4">
                 <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm"><Leaf size={28}/></div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Crecimiento Local</h3>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">Cada transacción ayuda a financiar proyectos sostenibles y desarrollo soberano dentro de nuestra comunidad.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Confianza */}
        <div className="py-24 md:py-32">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter mb-8 italic">Construyendo una economía soberana e independiente.</h2>
            <div className="bg-slate-950 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-[80px]"></div>
               <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div><p className="text-4xl font-black tracking-tight mb-1">0 Pz</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comisiones</p></div>
                  <div><p className="text-4xl font-black tracking-tight mb-1">100%</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital</p></div>
                  <div><p className="text-4xl font-black tracking-tight mb-1">24/7</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Soporte Vital</p></div>
                  <div><p className="text-4xl font-black tracking-tight mb-1">SIDS</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seguro</p></div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Familiar */}
      <footer className="bg-white pt-24 pb-12 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-xs">
               <img src="https://i.postimg.cc/s2s2RdgX/BANCO-DE.png" className="h-10 mb-6 opacity-80" alt="Logo"/>
               <p className="text-sm text-slate-400 font-medium leading-relaxed">Entidad financiera regulada por la Junta de La Placeta. Comprometidos con el desarrollo humano de nuestra gente.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Banca</p>
                  <ul className="text-xs text-slate-400 font-bold space-y-3 uppercase tracking-widest">
                    <li className="hover:text-brand-600 cursor-pointer transition-colors">Cuentas Corrientes</li>
                    <li className="hover:text-brand-600 cursor-pointer transition-colors">Tarjetas SIDS</li>
                    <li className="hover:text-brand-600 cursor-pointer transition-colors">Inversión Local</li>
                  </ul>
               </div>
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Institución</p>
                  <ul className="text-xs text-slate-400 font-bold space-y-3 uppercase tracking-widest">
                    <li className="hover:text-brand-600 cursor-pointer transition-colors">Hacienda Pública</li>
                    <li className="hover:text-brand-600 cursor-pointer transition-colors">Sede Electrónica</li>
                    <li className="hover:text-brand-600 cursor-pointer transition-colors">Transparencia</li>
                  </ul>
               </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-slate-50 gap-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">© {new Date().getFullYear()} Banco de La Placeta — Sistema de Identidad Digital Soberana.</p>
            <div className="flex items-center gap-8 opacity-40">
               <ShieldCheck size={16}/>
               <Leaf size={16}/>
               <Coffee size={16}/>
               <Globe size={16}/>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
