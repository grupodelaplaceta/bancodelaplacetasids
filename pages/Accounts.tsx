
import React, { useState, useMemo } from 'react';
import { useBank } from '../context/useBank';
import { 
  Plus, CreditCard, Shield, Lock, Copy, 
  X, History, ArrowUpRight, Building2, AlertCircle, ArrowDownLeft, 
  Receipt, Share2, Download, Wallet, FileText, Undo2
} from 'lucide-react';
import { CardDesigner } from '../components/CardDesigner';
import { Transaction } from '../types';

interface ExtendedTransaction extends Transaction {
    resultingBalance: number;
}

export const Accounts: React.FC<{ addNotification: any }> = ({ addNotification }) => {
  const { userAccounts, cards = [], currentUser, requestCard, toggleCardStatus, transactions, companies, linkAccountToCompany, activeAccountId, setActiveAccountId, generatePDF } = useBank();
  
  const [showDesigner, setShowDesigner] = useState(false);
  const [cardPin, setCardPin] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null);
  const [linkingAccId, setLinkingAccId] = useState<string | null>(null);
  const [targetCompanyId, setTargetCompanyId] = useState('');

  const currentAccount = useMemo(() => userAccounts.find(a => a.id === activeAccountId), [userAccounts, activeAccountId]);

  const unlinkedBusinessAccounts = useMemo(() => 
    userAccounts.filter(a => a.type === 'BUSINESS' && !a.companyId), 
  [userAccounts]);

  const accountCards = useMemo(() => cards.filter(c => c.accountId === activeAccountId), [cards, activeAccountId]);
  
  // Logic to calculate running balance accurately (working backwards from current balance)
  const extendedTransactions: ExtendedTransaction[] = useMemo(() => {
      if (!currentAccount) return [];
      
      const accTxs = transactions
        .filter(t => t.senderIban === currentAccount.iban || t.receiverIban === currentAccount.iban)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

      let currentBalance = currentAccount.balance;
      const result: ExtendedTransaction[] = [];

      for (const tx of accTxs) {
          result.push({ ...tx, resultingBalance: currentBalance });

          const isIncome = tx.receiverIban === currentAccount.iban;
          const isExpense = tx.senderIban === currentAccount.iban;
          
          if (isIncome) {
              currentBalance -= tx.amount; 
          } else if (isExpense) {
              currentBalance += tx.amount; 
          }
      }
      return result;
  }, [transactions, currentAccount]);

  const groupedTransactions = useMemo(() => {
      const groups: Record<string, ExtendedTransaction[]> = {};
      extendedTransactions.forEach(tx => {
          const date = new Date(tx.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
          if (!groups[date]) groups[date] = [];
          groups[date].push(tx);
      });
      return groups;
  }, [extendedTransactions]);

  const handleLink = async () => {
      if(!linkingAccId || !targetCompanyId) return;
      await linkAccountToCompany(linkingAccId, targetCompanyId);
      setLinkingAccId(null);
      addNotification("Cuenta vinculada a sociedad correctamente", "success");
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      addNotification("Copiado al portapapeles", "success");
  };

  const handleDownloadExtract = () => {
      if (!currentAccount) return;
      
      // Prepare data for PDF (reversing to show oldest to newest is standard for statements, but API sorts newest first. 
      // Usually users want to read from top (oldest) to bottom (newest) or vice versa. 
      // Let's keep the display order (Newest First) as it matches the UI.
      const rows = extendedTransactions.map(tx => {
          const isIncome = tx.receiverIban === currentAccount.iban;
          const amountSign = isIncome ? '+' : '-';
          return [
              new Date(tx.date).toLocaleDateString(),
              tx.description || (tx.type === 'REVERSAL' ? 'Reembolso / Corrección' : 'Movimiento'),
              `${amountSign}${tx.amount.toFixed(2)}`,
              `${tx.resultingBalance.toFixed(2)}`
          ];
      });

      generatePDF('EXTRACTO_CUENTA', {
          metadata: {
              alias: currentAccount.alias,
              iban: currentAccount.iban,
              balance: currentAccount.balance
          },
          rows: rows
      });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-fade-in font-sans min-h-screen">
        <header className="mb-8 flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Mi Cartera</h2>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1 flex items-center gap-2">
                    <Shield size={12} className="text-brand-600"/> PlacetaPay Wallet v8.2
                </p>
            </div>
            <button onClick={() => setShowDesigner(true)} className="hidden md:flex px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-brand-600 transition-all items-center gap-3 active:scale-95">
                <Plus size={16}/> Nueva Tarjeta
            </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-4 pb-4 lg:pb-0 no-scrollbar">
                    {userAccounts.map(acc => {
                        const isSelected = activeAccountId === acc.id;
                        return (
                            <button key={acc.id} onClick={() => setActiveAccountId(acc.id)} className={`shrink-0 lg:w-full p-5 rounded-[2rem] border-2 text-left transition-all duration-300 relative overflow-hidden group w-72 ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-900 hover:border-slate-300'}`}>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                        {acc.type === 'BUSINESS' ? <Building2 size={18}/> : <Wallet size={18}/>}
                                    </div>
                                    {isSelected && <div className="bg-brand-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Activa</div>}
                                </div>
                                <div className="relative z-10">
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{acc.alias}</p>
                                    <p className="text-2xl font-black tracking-tighter truncate">{acc.balance.toLocaleString()} <span className="text-sm opacity-50">Pz</span></p>
                                    <p className={`font-mono text-[10px] tracking-wider truncate mt-2 opacity-60`}>**** {acc.iban.slice(-4)}</p>
                                </div>
                                {isSelected && <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>}
                            </button>
                        );
                    })}
                    <button onClick={() => setShowDesigner(true)} className="md:hidden shrink-0 w-16 rounded-[2rem] border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300"><Plus size={24}/></button>
                </div>
                {unlinkedBusinessAccounts.length > 0 && (
                    <div className="bg-orange-50 p-5 rounded-[2rem] border border-orange-100 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-3"><AlertCircle className="text-orange-500" size={20}/><h4 className="font-black text-orange-800 text-xs uppercase tracking-widest">Atención</h4></div>
                        <p className="text-[10px] text-orange-700/80 font-bold mb-3 leading-relaxed">Tienes cuentas de empresa sin asignar.</p>
                        {unlinkedBusinessAccounts.map(acc => (
                            <button key={acc.id} onClick={() => setLinkingAccId(acc.id)} className="w-full py-2 bg-white text-orange-700 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm mb-2 last:mb-0 hover:bg-orange-100 transition-colors">Vincular {acc.alias}</button>
                        ))}
                    </div>
                )}
            </div>

            <div className="lg:col-span-8 space-y-8">
                {currentAccount && (
                    <>
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-soft relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2"><CreditCard size={16}/> Tarjetas Vinculadas</h3>
                                <button onClick={() => copyToClipboard(currentAccount.iban)} className="text-[10px] font-bold text-slate-400 hover:text-brand-600 flex items-center gap-1 transition-colors uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full"><Copy size={12}/> {currentAccount.iban}</button>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                {accountCards.length === 0 ? (
                                    <div className="w-full p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center"><p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Sin tarjetas activas</p><button onClick={() => setShowDesigner(true)} className="text-brand-600 font-black text-xs hover:underline">Solicitar Ahora</button></div>
                                ) : (
                                    accountCards.map(card => (
                                        <div key={card.id} onClick={() => toggleCardStatus(card.id)} className="relative w-72 h-44 shrink-0 rounded-3xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:-translate-y-1">
                                            <div className="absolute inset-0 z-0 bg-slate-800" style={{ background: card.design && card.design.startsWith('data:') ? `url(${card.design}) center/cover` : '#1e293b' }}></div>
                                            <div className="absolute inset-0 bg-black/20 z-10 transition-colors group-hover:bg-black/10"></div>
                                            {card.status === 'FROZEN' && <div className="absolute inset-0 bg-slate-900/60 z-20 flex items-center justify-center backdrop-blur-sm"><Lock className="text-white" size={24}/></div>}
                                            <div className="absolute bottom-5 left-6 z-20 text-white drop-shadow-md">
                                                <p className="font-mono text-lg font-bold tracking-widest">•••• {card.pan.slice(-4)}</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-80">{card.holderName}</p>
                                            </div>
                                            <div className="absolute top-5 right-6 z-20"><div className={`w-2.5 h-2.5 rounded-full ${card.status === 'ACTIVE' ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div></div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-soft min-h-[500px]">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="font-black text-slate-900 text-xl tracking-tight">Movimientos</h3>
                                    <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Historial de {currentAccount.alias}</p>
                                </div>
                                <button onClick={handleDownloadExtract} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                                    <FileText size={14}/> Extracto PDF
                                </button>
                            </div>

                            <div className="space-y-8">
                                {Object.keys(groupedTransactions).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                                        <History size={48} className="mb-4 opacity-30 stroke-1"/>
                                        <p className="font-black text-[10px] uppercase tracking-widest">Sin actividad registrada</p>
                                    </div>
                                ) : (
                                    Object.entries(groupedTransactions).map(([date, txs]) => (
                                        <div key={date}>
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 sticky top-0 bg-white/95 backdrop-blur py-2 z-10">{date}</h4>
                                            <div className="space-y-2">
                                                {(txs as ExtendedTransaction[]).map(tx => {
                                                    const isIncoming = tx.receiverIban === currentAccount?.iban;
                                                    const isReverted = tx.status === 'REVERTED';
                                                    const isReversal = tx.type === 'REVERSAL';
                                                    
                                                    return (
                                                        <div key={tx.id} onClick={() => setSelectedTransaction(tx)} className={`flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-slate-100 ${isReverted ? 'opacity-50' : ''}`}>
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 ${isReversal ? 'bg-indigo-600' : isIncoming ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                                                                    {isReversal ? <Undo2 size={18}/> : isIncoming ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                                                                </div>
                                                                <div>
                                                                    <p className={`font-bold text-sm mb-0.5 ${isReverted ? 'text-slate-500 line-through decoration-red-500' : 'text-slate-900'}`}>{tx.description}</p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                                        {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                        {isReverted && <span className="ml-2 text-red-500">REVERTIDA</span>}
                                                                        {isReversal && <span className="ml-2 text-indigo-500">CORRECCIÓN</span>}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`font-black text-sm tracking-tight ${isReversal ? 'text-indigo-600' : isIncoming ? 'text-emerald-600' : 'text-slate-900'} ${isReverted ? 'line-through decoration-red-500' : ''}`}>
                                                                    {isIncoming ? '+' : '-'}{tx.amount.toLocaleString()} Pz
                                                                </p>
                                                                <p className="text-[9px] font-bold text-slate-300 mt-1">Saldo: {tx.resultingBalance.toLocaleString()} Pz</p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* --- MODALS --- */}
        {linkingAccId && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-scale-up relative border border-white/50">
                    <button onClick={() => setLinkingAccId(null)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X size={20}/></button>
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><Building2 size={32}/></div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Vincular Activo</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Seleccionar Sociedad</label>
                            <select value={targetCompanyId} onChange={e => setTargetCompanyId(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold text-sm outline-none transition-all">
                                <option value="">Elegir Empresa...</option>
                                {companies.filter(c => c.ownerId === currentUser?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <button onClick={handleLink} disabled={!targetCompanyId} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-600 disabled:opacity-30 active:scale-95 transition-all">Sincronizar Activo</button>
                    </div>
                </div>
            </div>
        )}

        {showDesigner && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-8 md:p-10 shadow-2xl animate-scale-up relative overflow-y-auto max-h-[95vh]">
                    <button onClick={() => setShowDesigner(false)} className="absolute top-6 right-6 p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all"><X size={24}/></button>
                    <div className="mb-10 text-center"><h3 className="text-3xl font-black text-slate-900 tracking-tight">Nueva Tarjeta SIDS</h3></div>
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Vincular a Cuenta</label>
                                <select value={activeAccountId} onChange={e => setActiveAccountId(e.target.value)} className="w-full p-4.5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold text-sm outline-none transition-all">
                                    <option value="">Elegir fondos...</option>
                                    {userAccounts.map(a => <option key={a.id} value={a.id}>{a.alias} ({a.balance.toLocaleString()} Pz)</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">PIN de Seguridad</label>
                                <input type="password" maxLength={4} placeholder="••••" value={cardPin} onChange={e => setCardPin(e.target.value.replace(/\D/g, ''))} className="w-full p-4.5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-mono text-center text-xl font-black outline-none transition-all tracking-widest"/>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-100"><CardDesigner holderName={currentUser?.name || ''} onSave={(d) => { if(activeAccountId && cardPin) requestCard(activeAccountId, currentUser?.name||'', d, cardPin); setShowDesigner(false); }} /></div>
                    </div>
                </div>
            </div>
        )}

        {selectedTransaction && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-4" onClick={() => setSelectedTransaction(null)}>
                <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl animate-pop-in overflow-hidden relative transform transition-all" onClick={e => e.stopPropagation()}>
                    <div className="bg-slate-50 border-b border-slate-100 p-8 text-center relative">
                        <button onClick={() => setSelectedTransaction(null)} className="absolute top-6 right-6 p-2 bg-white rounded-full text-slate-400 hover:text-slate-900 shadow-sm transition-all"><X size={18}/></button>
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 text-slate-900"><Receipt size={28}/></div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Comprobante</h3>
                        <p className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-widest">ID: {selectedTransaction.id.slice(-12)}</p>
                    </div>
                    <div className="p-8 relative">
                        <div className="text-center mb-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Importe Total</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tighter">{selectedTransaction.amount.toLocaleString()} <span className="text-xl text-slate-300">Pz</span></p>
                            <div className="mt-4 inline-block bg-slate-100 px-3 py-1 rounded-lg"><p className="text-[10px] font-bold text-slate-500 uppercase">Saldo resultante: {selectedTransaction.resultingBalance.toLocaleString()} Pz</p></div>
                        </div>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center py-3 border-b border-slate-50"><span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Fecha</span><span className="font-bold text-slate-900">{new Date(selectedTransaction.date).toLocaleString()}</span></div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-50"><span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Concepto</span><span className="font-bold text-slate-900 text-right truncate max-w-[150px]">{selectedTransaction.description}</span></div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-50"><span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Emisor</span><span className="font-mono font-bold text-slate-600 text-[10px]">{selectedTransaction.senderIban}</span></div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-50"><span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Receptor</span><span className="font-mono font-bold text-slate-600 text-[10px]">{selectedTransaction.receiverIban}</span></div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => copyToClipboard(selectedTransaction.id)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center gap-2 transition-all"><Share2 size={16}/> Copiar ID</button>
                            <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-brand-600 flex items-center justify-center gap-2 transition-all shadow-lg"><Download size={16}/> Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
