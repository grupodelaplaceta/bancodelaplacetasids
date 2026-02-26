
import React, { useState } from 'react';
import { useBank } from '../context/useBank';
import { ArrowLeft, ArrowRightLeft, FileText, LogOut, ShieldCheck, User, ChevronDown } from 'lucide-react';
import { PENDING_TAXES } from '../constants';

interface ATMProps {
  onExit: () => void;
}

type ATMView = 'MENU' | 'TRANSFER' | 'TAXES' | 'PROCESSING' | 'SUCCESS';

const NumPad = ({ value, setValue }: { value: string, setValue: (v: string) => void }) => (
    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-6">
        {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => setValue(value + n)} className="h-16 bg-white rounded-2xl shadow-sm border border-slate-200 text-2xl font-bold text-slate-900 hover:bg-slate-50 active:scale-95 transition-all">{n}</button>
        ))}
        <button onClick={() => setValue('')} className="h-16 bg-red-50 text-red-600 rounded-2xl font-bold uppercase text-xs tracking-wider">Borrar</button>
        <button onClick={() => setValue(value + '0')} className="h-16 bg-white rounded-2xl shadow-sm border border-slate-200 text-2xl font-bold text-slate-900 hover:bg-slate-50 active:scale-95 transition-all">0</button>
    </div>
);

export const ATM: React.FC<ATMProps> = ({ onExit }) => {
  const { userAccounts, transfer } = useBank();
  const [view, setView] = useState<ATMView>('MENU');
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDest, setTransferDest] = useState('');
  
  const [pendingTaxes, setPendingTaxes] = useState(PENDING_TAXES);

  const accountsCount = userAccounts?.length || 0;
  const safeIdx = selectedAccountIdx < accountsCount ? selectedAccountIdx : 0;
  const selectedAccount = accountsCount > 0 ? userAccounts[safeIdx] : null;

  const handleTransfer = async () => {
      if(!selectedAccount || !transferAmount || !transferDest) return;
      if(Number(transferAmount) > selectedAccount.balance) {
          alert('Saldo insuficiente');
          return;
      }
      setView('PROCESSING');
      try {
          await transfer(selectedAccount.iban, transferDest.startsWith('PL') ? transferDest : 'PL' + transferDest, Number(transferAmount), 'ATM Transfer');
          setView('SUCCESS');
          setTransferAmount('');
          setTransferDest('');
      } catch {
          alert('Error en la transferencia');
          setView('MENU');
      }
  };

  const handlePayTax = (amount: number, id: string) => {
      if(!selectedAccount) return;
      if(amount > selectedAccount.balance) {
          alert('Saldo insuficiente');
          return;
      }
      setView('PROCESSING');
      setTimeout(() => {
          setPendingTaxes(prev => prev.filter(t => t.id !== id));
          setView('SUCCESS');
      }, 1500);
  };

  if (!selectedAccount) {
      return (
          <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-bold">Iniciando sistema seguro...</p>
              <button onClick={onExit} className="mt-8 text-slate-400 font-bold hover:text-slate-900 transition-colors flex items-center gap-2">
                  <ArrowLeft size={20} /> Cancelar y salir
              </button>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col font-sans">
        <div className="bg-white p-6 border-b border-slate-200 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-6">
                <img src="https://i.postimg.cc/s2s2RdgX/BANCO-DE.png" className="h-14 w-auto object-contain" alt="Logo"/>
                <div>
                    <h1 className="font-bold text-xl text-slate-900 leading-none">Cajero Automático</h1>
                    <div className="relative mt-1">
                        <button 
                            onClick={() => setShowAccountMenu(!showAccountMenu)}
                            className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            {selectedAccount.alias} ({selectedAccount.balance.toLocaleString()} Pz)
                            <ChevronDown size={14} />
                        </button>
                        
                        {showAccountMenu && (
                            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 w-64 z-50 overflow-hidden">
                                {userAccounts.map((acc, i) => (
                                    <button
                                        key={acc.id}
                                        onClick={() => { setSelectedAccountIdx(i); setShowAccountMenu(false); }}
                                        className={`w-full text-left p-3 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 ${safeIdx === i ? 'bg-slate-50 font-bold' : ''}`}
                                    >
                                        <p className="text-slate-900">{acc.alias}</p>
                                        <p className="text-xs text-slate-500">{acc.balance.toLocaleString()} Pz</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <button onClick={onExit} className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2">
                <LogOut size={18} /> Salir
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
            
            {view === 'MENU' && (
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                    <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl mb-4">
                        <h2 className="text-3xl font-bold mb-2">Bienvenido</h2>
                        <p className="text-slate-300 mb-8">Selecciona una operación oficial bajo protocolo SIDS.</p>
                        <div className="flex gap-8">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Saldo Disponible</p>
                                <p className="text-4xl font-bold">{selectedAccount.balance.toLocaleString()} Pz</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => setView('TRANSFER')} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center gap-4 group hover:border-brand-500 transition-all">
                        <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                            <ArrowRightLeft size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">Transferencias</h3>
                        <p className="text-slate-500 text-center">Giro bancario directo entre nodos</p>
                    </button>

                    <button onClick={() => setView('TAXES')} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center gap-4 group hover:border-purple-500 transition-all">
                        <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <FileText size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">Impuestos</h3>
                        <p className="text-slate-500 text-center">Tributos locales y tasas estatales</p>
                    </button>
                </div>
            )}

            {view === 'TRANSFER' && (
                <div className="w-full max-w-2xl animate-fade-in">
                    <button onClick={() => setView('MENU')} className="mb-8 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900"><ArrowLeft size={20}/> Volver</button>
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-8">
                        <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Nueva Transferencia</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-2 block">DIP Destino</label>
                                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 focus-within:border-brand-500 flex items-center gap-3">
                                    <User className="text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={transferDest} 
                                        onChange={e => setTransferDest(e.target.value)} 
                                        className="bg-transparent w-full outline-none font-bold text-lg text-slate-900 uppercase"
                                        placeholder="DIP-XXXX"
                                    />
                                </div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-2 block mt-6">Importe</label>
                                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 flex items-center gap-3">
                                    <span className="text-2xl font-bold text-slate-900">{transferAmount || '0'}</span>
                                    <span className="text-slate-400 font-bold">Pz</span>
                                </div>
                            </div>
                            <div>
                                <NumPad value={transferAmount} setValue={setTransferAmount} />
                            </div>
                        </div>
                        <button onClick={handleTransfer} className="w-full mt-8 bg-slate-900 text-white py-5 rounded-2xl font-bold text-xl shadow-lg hover:bg-slate-800 transition-colors">Confirmar Envío</button>
                    </div>
                </div>
            )}

            {view === 'TAXES' && (
                <div className="w-full max-w-3xl animate-fade-in">
                    <button onClick={() => setView('MENU')} className="mb-8 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900"><ArrowLeft size={20}/> Volver</button>
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Impuestos Pendientes</h2>
                    <div className="space-y-4">
                        {pendingTaxes.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200">
                                <ShieldCheck size={64} className="mx-auto text-green-500 mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900">Sin deudas</h3>
                                <p className="text-slate-500">Usted está al corriente de pago.</p>
                            </div>
                        ) : (
                            pendingTaxes.map(tax => (
                                <div key={tax.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                                            <FileText size={32} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-900">{tax.concept}</h3>
                                            <p className="text-slate-500">Vence: {new Date(tax.dueDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900 mb-2">{tax.amount} Pz</p>
                                        <button onClick={() => handlePayTax(tax.amount, tax.id)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800">Pagar</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {view === 'PROCESSING' && (
                <div className="text-center animate-fade-in">
                    <div className="w-24 h-24 border-8 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-8"></div>
                    <h2 className="text-3xl font-bold text-slate-900">Procesando...</h2>
                    <p className="text-slate-500 mt-2">Sincronizando firma con el Ledger Central</p>
                </div>
            )}

            {view === 'SUCCESS' && (
                <div className="text-center animate-scale-up">
                    <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <ShieldCheck size={64} />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4">¡Operación Finalizada!</h2>
                    <button onClick={() => setView('MENU')} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 shadow-lg">Volver al Menú</button>
                </div>
            )}
        </div>
    </div>
  );
};
