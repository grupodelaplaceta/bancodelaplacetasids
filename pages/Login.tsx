
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Monitor, AlertTriangle, ArrowRight, Lock, User, Key, ChevronRight, ShieldCheck, Globe } from 'lucide-react';
import { useBank } from '../context/useBank';

interface LoginProps {
  onLogin: () => void;
  onBack: () => void;
  onATMEnter: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onBack, onATMEnter }) => {
  const { login, loginWithPlacetaID } = useBank();
  const [dip, setDip] = useState('');
  const [password, setPassword] = useState('');
  const [showLegacy, setShowLegacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sdkInitialized, setSdkInitialized] = useState(false);

  const handlePlacetaLogin = useCallback(async (userData: any) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
        const result = await loginWithPlacetaID(userData);
        if (result.success) onLogin();
        else setErrorMessage(result.error || 'Identidad no válida.');
    } catch {
        setErrorMessage("Fallo de sincronización.");
    } finally {
        setIsLoading(false);
    }
  }, [loginWithPlacetaID, onLogin]);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 12;
    
    const initPlacetaID = () => {
      const SDK = (window as any).PlacetaID;
      const mountPoint = document.getElementById('placeta-id-static-mount');
      
      if (SDK && mountPoint) {
        try {
          new SDK({
            containerId: 'placeta-id-static-mount',
            apiUrl: 'https://junta.vercel.app/api/placetaid',
            theme: 'light',
            onSuccess: (userData: any) => handlePlacetaLogin(userData)
          });
          setSdkInitialized(true);
        } catch {
          console.error("PlacetaID Fail");
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(initPlacetaID, 400);
      }
    };

    if (!showLegacy) initPlacetaID();
  }, [showLegacy, handlePlacetaLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!dip || !password) return;
    setIsLoading(true);
    try {
        const result = await login(dip, password);
        if (result.success) onLogin();
        else setErrorMessage(result.error || 'Credenciales incorrectas.');
    } catch {
        setErrorMessage("Servicio fuera de línea.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Luces sutiles de fondo */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-100/40 rounded-full blur-[100px] -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/40 rounded-full blur-[100px] -ml-40 -mb-40"></div>

      <div className="w-full max-w-sm animate-fade-in relative z-10">
        
        <div className="text-center mb-6">
          <img 
            src="https://i.postimg.cc/s2s2RdgX/BANCO-DE.png" 
            alt="Logo" 
            className="h-8 mx-auto mb-4 drop-shadow-sm cursor-pointer hover:scale-105 transition-transform"
            onClick={onBack}
          />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Acceso Institucional</h2>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] mt-1">Grupo La Placeta SIDS</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-200/60 relative overflow-hidden">
          
          <button onClick={onBack} className="absolute top-4 left-4 p-1.5 text-slate-300 hover:text-slate-900 transition-colors bg-slate-50 rounded-lg">
            <ArrowLeft size={16}/>
          </button>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-[10px] font-bold mb-6 flex items-start gap-2 animate-shake">
              <AlertTriangle size={14} className="shrink-0"/>
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-3 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest animate-pulse">Validando Firma...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {!showLegacy ? (
                <div className="space-y-6">
                  <div className="min-h-[50px] relative">
                    <div id="placeta-id-static-mount" className="animate-fade-in" />
                    {!sdkInitialized && (
                      <div className="h-[50px] bg-slate-50 rounded-xl border border-slate-200 border-dashed flex items-center justify-center text-slate-300 text-[9px] font-bold uppercase tracking-widest animate-pulse">
                        Sincronizando PlacetaID...
                      </div>
                    )}
                  </div>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-[0.4em]">
                      <span className="bg-white px-4 text-slate-300">Otras Opciones</span>
                    </div>
                  </div>

                  <button onClick={() => setShowLegacy(true)} className="w-full p-4 bg-slate-50 border border-slate-100 hover:border-indigo-100 text-slate-500 hover:text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-between group active:scale-95 shadow-sm">
                    <span className="flex items-center gap-3"><Key size={14} className="group-hover:rotate-12 transition-transform"/> Clave de Nodo</span>
                    <ChevronRight size={12}/>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento DIP</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={14}/>
                      <input 
                        type="text" 
                        value={dip} 
                        onChange={(e) => setDip(e.target.value.toUpperCase())} 
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs outline-none focus:border-indigo-600 transition-all placeholder:text-slate-200 uppercase font-mono tracking-widest" 
                        placeholder="DIP-XXXXXX" 
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Clave de Nodo</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={14}/>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs outline-none focus:border-indigo-600 transition-all placeholder:text-slate-200" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                    Validar Acceso <ArrowRight size={14}/>
                  </button>
                  
                  <button type="button" onClick={() => setShowLegacy(false)} className="w-full text-center text-slate-400 font-bold text-[8px] hover:text-slate-900 transition-colors uppercase tracking-widest pt-2">
                    Volver a PlacetaID
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between px-2 opacity-40">
          <button onClick={onATMEnter} className="text-slate-400 hover:text-indigo-600 font-bold text-[8px] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
            <Monitor size={12}/> Red de Cajeros
          </button>
          <div className="flex items-center gap-3">
            <ShieldCheck size={14}/>
            <Globe size={14}/>
          </div>
        </div>

      </div>
    </div>
  );
};
