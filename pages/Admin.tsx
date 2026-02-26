
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBank } from '../context/useBank';
import { 
    Shield, Activity, Users, 
    FileText, Terminal, Search, 
    ArrowLeftRight, X, Heart, Lock, Unlock, Undo2, Receipt, Gift
} from 'lucide-react';

export const Admin: React.FC = () => {
  const { 
    adminGetSummary, adminGetUsers, adminManageUser, 
    adminGetRaffles, adminManageRaffle,
    adminRevertTransaction, adminGetAuditLogs, adminCalcTaxes,
    generatePDF,
    addNotification, triggerHaptic, currentUser
  } = useBank();
  
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'USERS' | 'TRANSACTIONS' | 'RAFFLES' | 'INVOICES' | 'AUDIT'>('MONITOR');
  
  // Data States
  const [summary, setSummary] = useState({ totalUsers: 0, totalBalance: 0, txsToday: 0, moneyInCirculation: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [showRaffleForm, setShowRaffleForm] = useState(false);
  // TicketPrice locked to 0 for non-gambling compliance
  const [newRaffle, setNewRaffle] = useState({ name: '', prizePool: '', ticketPrice: '0', description: '', type: 'AUTOMATIC' });
  
  const loadData = useCallback(async () => {
      try {
          const s = await adminGetSummary(); setSummary(s);
          if (activeTab === 'USERS') { const u = await adminGetUsers(); setUsers(Array.isArray(u) ? u : []); }
          if (activeTab === 'TRANSACTIONS') { 
              const resTxs = await fetch('/api', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action: 'ADMIN_GET_ALL_TRANSACTIONS' }) }); 
              const dataTxs = await resTxs.json(); if (Array.isArray(dataTxs)) setTxs(dataTxs); 
          }
          if (activeTab === 'RAFFLES') { const r = await adminGetRaffles(); setRaffles(Array.isArray(r) ? r : []); }
          if (activeTab === 'INVOICES') { 
              const resInv = await fetch('/api', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action: 'GET_INVOICES', role: 'ADMIN' }) });
              const dataInv = await resInv.json(); if (Array.isArray(dataInv)) setInvoices(dataInv);
          }
          if (activeTab === 'AUDIT') { const a = await adminGetAuditLogs(); setAuditLogs(Array.isArray(a) ? a : []); }
      } catch (e) { console.error(e); } 
  }, [activeTab, adminGetSummary, adminGetUsers, adminGetRaffles, adminGetAuditLogs]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateRaffle = async () => {
      if(!newRaffle.name || !newRaffle.prizePool) return;
      try {
          // Force ticketPrice to 0 explicitly before sending
          const payload = { ...newRaffle, ticketPrice: 0 }; 
          const res = await fetch('/api', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ action: 'ADMIN_CREATE_RAFFLE', ...payload, organizerId: currentUser?.id })
          });
          if(!res.ok) throw new Error("Fallo al crear sorteo");
          addNotification("Evento social programado correctamente", "success");
          setShowRaffleForm(false);
          setNewRaffle({ name: '', prizePool: '', ticketPrice: '0', description: '', type: 'AUTOMATIC' });
          loadData();
      } catch(e: any) { addNotification(e.message, 'error'); }
  };

  const handleExportTx = (tx: any) => { triggerHaptic('light'); generatePDF('NOTIFICACION_PAGO_OFICIAL', { transaction: tx }); };
  const handleRevert = async (id: string) => { if(!confirm("¿REVERTIR transacción?")) return; try { await adminRevertTransaction(id); addNotification("Transacción revertida", "success"); loadData(); } catch(e: any) { addNotification(e.message, "error"); } };
  const handleRaffleStatus = async (id: string, status: string) => { await adminManageRaffle(id, status); loadData(); };

  const filteredUsers = useMemo(() => users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.dip.includes(search.toUpperCase())), [users, search]);

  return (
    <div className="p-4 md:p-10 max-w-[1600px] mx-auto pb-48 font-sans animate-fade-in bg-white min-h-screen">
        <header className="mb-12 flex flex-col xl:flex-row justify-between items-center gap-8 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-6 w-full xl:w-auto">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0"><Shield size={32}/></div>
                <div>
                    <h2 className="text-3xl font-black text-slate-950 tracking-tighter italic">SIDS <span className="text-indigo-600">Gobernanza</span></h2>
                    <div className="flex items-center gap-3 mt-1"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Nodo Central de Control Financiero</p></div>
                </div>
            </div>
            <nav className="bg-slate-50 p-2 rounded-[2rem] flex shadow-inner border border-slate-100 overflow-x-auto no-scrollbar max-w-full gap-1">
                {[{id:'MONITOR', label:'Monitor', icon: Activity}, {id:'USERS', label:'Ciudadanos', icon: Users}, {id:'TRANSACTIONS', label:'Ledger', icon: ArrowLeftRight}, {id:'RAFFLES', label:'Ayudas Social', icon: Heart}, {id:'INVOICES', label:'Facturas', icon: Receipt}, {id:'AUDIT', label:'Logs', icon: Terminal}].map(t => (
                    <button key={t.id} onClick={() => { triggerHaptic('light'); setActiveTab(t.id as any); }} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-white text-slate-950 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                        <t.icon size={14} className={activeTab === t.id ? 'text-indigo-600' : 'text-slate-300'}/>{t.label}
                    </button>
                ))}
            </nav>
        </header>

        {activeTab === 'MONITOR' && (
            <div className="space-y-8 animate-slide-up">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Masa Monetaria M1</p>
                        <div className="flex items-baseline gap-2"><span className="text-4xl font-black tracking-tighter">{summary.totalBalance.toLocaleString()}</span><span className="text-xl text-slate-500 font-black">Pz</span></div>
                    </div>
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col justify-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Nodos ID Verificados</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">{summary.totalUsers} <span className="text-xl text-slate-200 font-black">ID</span></p>
                    </div>
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col justify-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Volumen 24h</p>
                        <p className="text-4xl font-black text-indigo-600 tracking-tighter">{summary.txsToday} <span className="text-xl text-slate-200 font-black">OPS</span></p>
                    </div>
                    <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100 flex flex-col justify-center">
                         <button onClick={() => setActiveTab('INVOICES')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 shadow-lg flex justify-center items-center gap-2 transition-all">
                            <Receipt size={16}/> Auditoría Fiscal
                        </button>
                    </div>
                </div>
                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex items-center justify-between">
                    <div><h4 className="text-2xl font-black text-slate-800 tracking-tight italic">Cierre Fiscal SIDS</h4><p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">Ejecución masiva de IRM pendiente para periodo mensual</p></div>
                    <button onClick={() => adminCalcTaxes(new Date().getMonth() + 1, new Date().getFullYear())} className="px-10 py-5 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl">Ejecutar Recaudación IRM</button>
                </div>
            </div>
        )}

        {activeTab === 'RAFFLES' && (
            <div className="space-y-8 animate-slide-up">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 italic tracking-tight">Eventos de Distribución</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Asignación de recursos y ayudas (No Juego)</p>
                    </div>
                    <button onClick={() => setShowRaffleForm(true)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex gap-3 items-center hover:bg-brand-600 transition-all"><Heart size={16}/> Crear Nueva Ayuda/Evento</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {raffles.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3rem] font-black uppercase text-xs tracking-widest">No hay eventos activos</div>
                    ) : raffles.map(r => (
                        <div key={r.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl group hover:-translate-y-1 transition-all relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
                            <div className="flex justify-between items-start mb-6">
                                <div><h4 className="text-xl font-black text-slate-900 leading-tight">{r.name}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ORG: {r.organizerName}</p></div>
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>{r.status}</span>
                            </div>
                            <div className="flex items-center gap-6 mb-8">
                                <div><p className="text-[9px] font-black text-slate-300 uppercase mb-1">Fondo Social</p><p className="text-2xl font-black text-slate-900">{r.prizePool.toLocaleString()} Pz</p></div>
                                <div><p className="text-[9px] font-black text-slate-300 uppercase mb-1">Entrada</p><p className="text-2xl font-black text-emerald-600">GRATIS</p></div>
                            </div>
                            <div className="flex gap-2">
                                {r.status === 'PENDING' && (
                                    <>
                                        <button onClick={() => handleRaffleStatus(r.id, 'APPROVED')} className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">Aprobar</button>
                                        <button onClick={() => handleRaffleStatus(r.id, 'REJECTED')} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Denegar</button>
                                    </>
                                )}
                                {r.status === 'APPROVED' && <button className="w-full py-3 bg-slate-950 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">Ejecutar Distribución</button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'USERS' && (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-black text-sm text-slate-400 uppercase tracking-[0.2em]">Censo de Ciudadanos</h3>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o DIP..." 
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl text-xs font-bold border-2 border-transparent focus:border-indigo-600 outline-none transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-300 tracking-widest">
                            <tr>
                                <th className="p-6 pl-10">Ciudadano</th>
                                <th className="p-6">DIP</th>
                                <th className="p-6">Edad</th>
                                <th className="p-6">Rol</th>
                                <th className="p-6 text-right pr-10">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 pl-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">
                                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover rounded-lg" alt="Avatar"/> : u.name.charAt(0)}
                                            </div>
                                            <span className="text-slate-900">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 font-mono text-slate-400">{u.dip}</td>
                                    <td className="p-6">
                                        {u.birthDate ? (
                                            <div className="flex flex-col">
                                                <span>{new Date().getFullYear() - new Date(u.birthDate).getFullYear()} años</span>
                                                <span className="text-[8px] opacity-50">{u.birthDate}</span>
                                            </div>
                                        ) : 'N/D'}
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${u.role === 'ADMIN' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{u.role}</span>
                                    </td>
                                    <td className="p-6 text-right pr-10">
                                        <button onClick={() => adminManageUser(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
                                            {u.role === 'ADMIN' ? <Lock size={16}/> : <Unlock size={16}/>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'TRANSACTIONS' && (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-black text-sm text-slate-400 uppercase tracking-[0.2em]">Libro Mayor (Ledger)</h3>
                    <div className="flex gap-2">
                        <button onClick={loadData} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><Activity size={16}/></button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-300 tracking-widest">
                            <tr>
                                <th className="p-6 pl-10">Fecha</th>
                                <th className="p-6">Origen</th>
                                <th className="p-6">Destino</th>
                                <th className="p-6">Monto</th>
                                <th className="p-6 text-right pr-10">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                            {txs.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 pl-10 text-slate-400">{new Date(t.date).toLocaleString()}</td>
                                    <td className="p-6 font-mono text-slate-900">{t.senderIban}</td>
                                    <td className="p-6 font-mono text-slate-900">{t.receiverIban}</td>
                                    <td className="p-6 font-black text-slate-900">{t.amount.toLocaleString()} Pz</td>
                                    <td className="p-6 text-right pr-10">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleExportTx(t)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"><FileText size={16}/></button>
                                            <button onClick={() => handleRevert(t.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600"><Undo2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'AUDIT' && (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-black text-sm text-slate-400 uppercase tracking-[0.2em]">Registros de Auditoría</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-300 tracking-widest">
                            <tr>
                                <th className="p-6 pl-10">Fecha</th>
                                <th className="p-6">Usuario</th>
                                <th className="p-6">Acción</th>
                                <th className="p-6">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                            {auditLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 pl-10 text-slate-400">{new Date(log.date).toLocaleString()}</td>
                                    <td className="p-6 text-slate-900">{log.userName}</td>
                                    <td className="p-6 font-black uppercase tracking-widest text-[9px] text-indigo-600">{log.action}</td>
                                    <td className="p-6 text-slate-500 max-w-xs truncate">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {activeTab === 'INVOICES' && (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-slide-up">
                 <div className="p-8 border-b border-slate-50 flex justify-between items-center"><h3 className="font-black text-sm text-slate-400 uppercase tracking-[0.2em]">Libro de Facturas SIDS</h3><span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black">Recaudación Activa</span></div>
                 <div className="overflow-x-auto"><table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-300 tracking-widest"><tr><th className="p-6 pl-10">Serial</th><th className="p-6">Concepto</th><th className="p-6">Base Imponible</th><th className="p-6">IVA (12%)</th><th className="p-6 text-right pr-10">Estado</th></tr></thead>
                    <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                        {invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-6 pl-10 font-mono text-slate-400">#{inv.numberSerial}</td>
                                <td className="p-6 text-slate-900">{inv.concept}</td>
                                <td className="p-6">{inv.amount.toLocaleString()} Pz</td>
                                <td className="p-6 text-brand-600">{(inv.amount * 0.12).toFixed(2)} Pz</td>
                                <td className="p-6 text-right pr-10">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>{inv.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table></div>
            </div>
        )}
        
        {/* MODAL NUEVO EVENTO SOCIAL (NO JUEGO DE AZAR) */}
        {showRaffleForm && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-[600] flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 md:p-14 shadow-2xl relative animate-scale-up border border-white/50 overflow-y-auto max-h-[90vh]">
                    <button onClick={() => setShowRaffleForm(false)} className="absolute top-10 right-10 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all"><X size={20}/></button>
                    <div className="mb-10 text-center"><div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-sm"><Gift size={32}/></div><h3 className="text-3xl font-black text-slate-900 tracking-tight italic">Nuevo Evento Social</h3><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Ayudas, Subvenciones y Distribución Pública</p></div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nombre de la Iniciativa</label>
                            <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-600 outline-none" value={newRaffle.name} onChange={e=>setNewRaffle({...newRaffle, name: e.target.value})} placeholder="Ej: Fondo Cultural 2025" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Fondo Total a Repartir (Pz)</label>
                                <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-600 outline-none" value={newRaffle.prizePool} onChange={e=>setNewRaffle({...newRaffle, prizePool: e.target.value})} placeholder="10000" />
                            </div>
                            <div className="opacity-50 pointer-events-none">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Costo Participación</label>
                                <div className="w-full p-4 bg-slate-100 rounded-2xl font-black border-2 border-transparent text-emerald-600">0 Pz (Gratuito)</div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Criterio de Asignación:</span>
                            <div className="flex gap-2">
                                <button onClick={()=>setNewRaffle({...newRaffle, type: 'AUTOMATIC'})} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-bold transition-all ${newRaffle.type === 'AUTOMATIC' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 shadow-sm'}`}>Sorteo Cívico (Aleatorio)</button>
                                <button onClick={()=>setNewRaffle({...newRaffle, type: 'MANUAL'})} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-bold transition-all ${newRaffle.type === 'MANUAL' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 shadow-sm'}`}>Asignación Directa</button>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium px-1">
                                {newRaffle.type === 'AUTOMATIC' ? 'Se seleccionará un ciudadano al azar de entre todos los inscritos gratuitamente.' : 'El administrador seleccionará manualmente al beneficiario basado en méritos.'}
                            </p>
                        </div>
                        <button onClick={handleCreateRaffle} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-brand-600 transition-all active:scale-95">Publicar en Tablón Oficial</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
