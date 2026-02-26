
import React, { useState } from 'react';
import { useBank } from '../context/useBank';
import { Users, Share2, Check, X, Clock, ShieldCheck, ArrowRight, Eye, Key } from 'lucide-react';

export const Family: React.FC = () => {
  const { shareRequests, currentUser, respondShareRequest, userAccounts, requestShareAccount, addNotification } = useBank();
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDip, setShareDip] = useState('');
  const [shareAccId, setShareAccId] = useState('');
  const [accessLevel, setAccessLevel] = useState<'READ_ONLY' | 'FULL_ACCESS'>('READ_ONLY');

  const incomingRequests = shareRequests.filter(r => r.toUserDip === currentUser?.dip && r.status === 'PENDING');
  const outgoingRequests = shareRequests.filter(r => r.fromUserId === currentUser?.id);

  const handleShare = async () => {
      if (!shareDip || !shareAccId) return;
      try {
          await requestShareAccount(shareAccId, shareDip, accessLevel);
          setShowShareModal(false);
          setShareDip('');
          addNotification("Solicitud de vínculo enviada correctamente", "success");
      } catch (e: any) {
          addNotification(e.message || "Error al enviar solicitud", "error");
      }
  };

  const handleResponse = async (id: string, status: string) => {
      try {
          await respondShareRequest(id, status);
          addNotification(status === 'ACCEPTED' ? "Vínculo aceptado y cuenta compartida" : "Solicitud rechazada", "success");
      } catch(e: any) {
          addNotification(e.message || "Error al responder", "error");
      }
  };

  return (
    <div className="p-5 md:p-10 max-w-5xl mx-auto pb-32 animate-fade-in font-sans">
      <header className="mb-10 flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vínculos</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Gestión de Cuentas Compartidas SIDS</p>
        </div>
        <button 
            onClick={() => setShowShareModal(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-600 transition-all shadow-lg flex items-center gap-2 active:scale-95"
        >
            <Share2 size={16}/> Compartir Cuenta
        </button>
      </header>

      {incomingRequests.length > 0 && (
          <section className="mb-12">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-indigo-500"/> Solicitudes Recibidas
              </h3>
              <div className="space-y-3">
                  {incomingRequests.map(req => (
                      <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-soft flex items-center justify-between animate-pop-in">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">
                                  {req.fromUserName.charAt(0)}
                              </div>
                              <div>
                                  <p className="font-black text-slate-900">{req.fromUserName} quiere compartir una cuenta</p>
                                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{req.accessLevel === 'FULL_ACCESS' ? 'Acceso Total (Transferencias)' : 'Solo Lectura (Extractos)'}</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => handleResponse(req.id, 'REJECTED')} className="w-11 h-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
                              <button onClick={() => handleResponse(req.id, 'ACCEPTED')} className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-brand-600 hover:scale-105 transition-all"><Check size={20}/></button>
                          </div>
                      </div>
                  ))}
              </div>
          </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Registro de Autorizaciones</h3>
              <div className="space-y-3">
                  {outgoingRequests.length === 0 ? (
                      <div className="p-10 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No has compartido cuentas aún</p>
                      </div>
                  ) : (
                      outgoingRequests.map(req => (
                          <div key={req.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors"><Users size={18}/></div>
                                  <div>
                                      <p className="font-bold text-slate-800">{req.toUserName}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">{req.toUserDip}</p>
                                  </div>
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${req.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                  {req.status === 'ACCEPTED' ? 'Activo' : 'Pendiente'}
                              </span>
                          </div>
                      ))
                  )}
              </div>
          </section>

          <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Seguridad Institucional</h3>
              <div className="bg-slate-900 text-white p-10 rounded-[3rem] relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                  <ShieldCheck size={40} className="text-brand-300 mb-6"/>
                  <h4 className="text-xl font-black mb-3">Art. 4.12: Autorizaciones</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium mb-8">
                      Otorgar "Acceso Total" permite al destinatario realizar transferencias en su nombre. El Banco de La Placeta no se responsabiliza de operaciones autorizadas bajo este régimen.
                  </p>
                  <button className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300 flex items-center gap-2 hover:translate-x-2 transition-transform">
                      Leer Legislación Vigente <ArrowRight size={14}/>
                  </button>
              </div>
          </section>
      </div>

      {showShareModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-5" onClick={() => setShowShareModal(false)}>
              <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Compartir Activos</h3>
                      <button onClick={() => setShowShareModal(false)} className="p-2.5 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-5">
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">Cuenta a Vincular</label>
                          <select value={shareAccId} onChange={e => setShareAccId(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-bold text-sm outline-none transition-all">
                              <option value="">Selecciona una cuenta...</option>
                              {userAccounts.filter(a => a.ownerId === currentUser?.id).map(a => <option key={a.id} value={a.id}>{a.alias} ({a.balance.toLocaleString()} Pts)</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">Identidad (DIP) del Ciudadano</label>
                          <input type="text" value={shareDip} onChange={e => setShareDip(e.target.value.toUpperCase())} placeholder="DIP-XXXXXX" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl font-mono font-bold text-sm outline-none uppercase placeholder:font-sans" />
                      </div>
                      <div className="p-1 bg-slate-100 rounded-2xl flex gap-1">
                          <button onClick={() => setAccessLevel('READ_ONLY')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all ${accessLevel === 'READ_ONLY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Eye size={16}/> LECTURA</button>
                          <button onClick={() => setAccessLevel('FULL_ACCESS')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all ${accessLevel === 'FULL_ACCESS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Key size={16}/> TOTAL</button>
                      </div>
                      <button onClick={handleShare} disabled={!shareDip || !shareAccId} className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-brand-600 transition-all mt-6 disabled:opacity-50 active:scale-95">Solicitar Vínculo</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
