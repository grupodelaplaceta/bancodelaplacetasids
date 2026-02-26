import React, { useState, useMemo } from 'react';
import { useBank } from '../context/useBank';
import { SECURITY_THRESHOLD_AMOUNT } from '../constants';
import { 
  Send, X, CheckCircle2, ShieldCheck, User, 
  ArrowRight, 
  Clock, Star, Landmark, Save, Trash2
} from 'lucide-react';

interface TransfersProps {
  addNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type TransferStep = 'IDLE' | 'SECURITY' | 'CONFIRM' | 'PROCESSING' | 'SUCCESS';

const KeypadButton: React.FC<{ val: string; onClick: () => void; icon?: React.ReactNode; primary?: boolean; secondary?: boolean }> = ({ val, onClick, icon, primary, secondary }) => (
  <button 
    onClick={(e) => {
        const btn = e.currentTarget;
        btn.classList.add('scale-90', 'bg-slate-200');
        setTimeout(() => btn.classList.remove('scale-90', 'bg-slate-200'), 100);
        onClick();
    }}
    className={`h-14 w-full rounded-2xl transition-all duration-150 text-xl font-bold flex items-center justify-center select-none ${
        primary ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700' : 
        secondary ? 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200' :
        'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm'
    }`}
  >
      {icon ? icon : val}
  </button>
);

export const Transfers: React.FC<TransfersProps> = ({ addNotification }) => {
  const { currentUser, userAccounts, transfer, contacts, transactions, triggerHaptic, saveContact, deleteContact, getAge } = useBank();
  
  const [recipientInput, setRecipientInput] = useState(''); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [transferStep, setTransferStep] = useState<TransferStep>('IDLE');

  // Contact Form
  const [contactName, setContactName] = useState('');
  const [contactIban, setContactIban] = useState('');
  
  const [selectedAccountIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);

  const currentAccount = userAccounts[selectedAccountIndex];

  const age = getAge(currentUser?.birthDate);
  const limits = useMemo(() => {
      if (!currentUser) return { type: 'Ciudadana plena', maxBalance: 500000, dailyLimit: Infinity };
      if (currentUser.role === 'COMPANY' || currentUser.role === 'ADMIN') {
          return { type: 'Institucional', maxBalance: 10000000, dailyLimit: Infinity };
      }
      if (age < 16) return { type: 'Junior básica', maxBalance: 500, dailyLimit: 50 };
      if (age < 18) return { type: 'Junior senior', maxBalance: 1000, dailyLimit: 100 };
      return { type: 'Ciudadana plena', maxBalance: 500000, dailyLimit: Infinity };
  }, [age, currentUser]);

  const dailySpent = useMemo(() => {
      if (!currentAccount) return 0;
      const today = new Date();
      today.setHours(0,0,0,0);
      return transactions
          .filter(tx => tx.senderIban === currentAccount.iban && new Date(tx.date).getTime() > today.getTime())
          .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, currentAccount]);

  const remainingDaily = limits.dailyLimit - dailySpent;

  const suggestionsList = useMemo(() => {
      const contactSuggestions = contacts.map(c => ({
          id: `contact-${c.id}`,
          name: c.name,
          iban: c.iban,
          type: 'CONTACT'
      }));

      const recentMap = new Map();
      transactions.forEach(tx => {
          if (tx.senderIban === currentAccount?.iban && tx.receiverIban && !tx.receiverIban.startsWith('PL000000')) {
             if (!contacts.some(c => c.iban === tx.receiverIban)) {
                 if (!recentMap.has(tx.receiverIban)) {
                     recentMap.set(tx.receiverIban, {
                         id: `recent-${tx.id}`,
                         name: tx.receiverIban,
                         iban: tx.receiverIban,
                         type: 'RECENT'
                     });
                 }
             }
          }
      });
      return [...contactSuggestions, ...Array.from(recentMap.values()).slice(0, 5)];
  }, [contacts, transactions, currentAccount]);

  const filteredSuggestions = useMemo(() => {
      if (!recipientInput) return suggestionsList;
      const cleanInput = recipientInput.replace(/\s/g, '').toUpperCase();
      return suggestionsList.filter(s => 
          s.name.toLowerCase().includes(recipientInput.toLowerCase()) || 
          s.iban.includes(cleanInput)
      );
  }, [suggestionsList, recipientInput]);

  const detectedBeneficiary = useMemo(() => {
      if (recipientInput.length < 4) return null;
      const clean = 'PL' + recipientInput.replace(/\s/g, '').toUpperCase();
      const match = suggestionsList.find(s => s.iban === clean);
      return match ? match.name : null;
  }, [recipientInput, suggestionsList]);

  const handleSaveContact = async () => {
      if (!contactName || !contactIban) return;
      await saveContact(contactName, contactIban);
      setShowContactModal(false);
      setContactName('');
      setContactIban('');
  };

  const handleKeypad = (val: string) => {
      triggerHaptic('light');
      if (val === 'DEL') setAmount(prev => prev.slice(0, -1));
      else if (val === '.') { if (!amount.includes('.')) setAmount(prev => prev + '.'); }
      else if (val === '+10') setAmount(prev => (Number(prev) + 10).toString());
      else if (val === '+50') setAmount(prev => (Number(prev) + 50).toString());
      else if (amount.length < 9) setAmount(prev => prev + val);
  };

  const handleVerify = () => {
    triggerHaptic('medium');
    const rawIban = recipientInput.replace(/\s/g, '');
    if (rawIban.length !== 20) { addNotification("IBAN incompleto", 'error'); return; }
    if (Number(amount) <= 0) { addNotification("Importe no válido", 'error'); return; }
    setTransferStep(Number(amount) > SECURITY_THRESHOLD_AMOUNT ? 'SECURITY' : 'CONFIRM');
  };
  
  const handleConfirm = async () => {
    triggerHaptic('heavy');
    setTransferStep('PROCESSING');
    const fullRecipient = 'PL' + recipientInput.replace(/\s/g, '');
    try {
        await transfer(currentAccount.iban, fullRecipient, Number(amount), 'Giro Administrativo SIDS');
        setTransferStep('SUCCESS');
    } catch (e: any) {
        addNotification(e.message, 'error');
        setTransferStep('IDLE');
    }
  };

  if (!currentAccount) return null;

  return (
    <div className="pb-safe-nav h-full flex flex-col max-w-lg mx-auto animate-fade-in pt-safe px-4 min-h-screen font-sans">
      
      <div className="flex justify-between items-center mb-6 pt-4">
            <h2 className="text-3xl font-black text-slate-900">Giro de Fondos</h2>
            <button onClick={() => setShowContactModal(true)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-brand-600 shadow-sm transition-all"><UserPlus size={20}/></button>
      </div>

      <div className="relative mb-6">
             <button 
                className="w-full p-6 bg-slate-900 text-white rounded-[2.5rem] flex flex-col justify-between shadow-2xl active:scale-[0.98] transition-all relative overflow-hidden h-40"
                onClick={() => setShowAccountDrawer(true)}
             >
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="flex justify-between items-start w-full relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                            {currentAccount.type === 'BUSINESS' ? <Landmark size={24}/> : <User size={24}/>}
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Cuenta Origen</p>
                            <p className="font-bold text-lg leading-tight">{currentAccount.alias}</p>
                        </div>
                    </div>
                    {limits.dailyLimit !== Infinity && (
                        <div className="text-right">
                            <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Límite Diario</p>
                            <p className="text-xs font-black text-brand-400">{remainingDaily.toLocaleString()} Pz disp.</p>
                        </div>
                    )}
                </div>
                <div className="relative z-10 text-left">
                    <p className="text-[10px] font-mono text-slate-500 mb-1">{currentAccount.iban.slice(0, 4)} •••• {currentAccount.iban.slice(-4)}</p>
                    <p className="text-3xl font-black tracking-tight">{currentAccount.balance.toLocaleString()} <span className="text-lg opacity-40">Pz</span></p>
                </div>
            </button>
      </div>

      {/* Sugerencias de Agenda */}
      <div className="mb-6 px-1">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
              {contacts.map((c) => (
                  <button key={c.id} onClick={() => { setRecipientInput(c.iban.substring(2).replace(/(.{4})/g, '$1 ').trim()); setShowSuggestions(false); }} className="flex flex-col items-center gap-2 shrink-0 group">
                      <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-lg font-bold transition-all group-hover:scale-105 shadow-sm">
                          {c.name.charAt(0)}
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 truncate w-14 text-center">{c.name.split(' ')[0]}</span>
                  </button>
              ))}
          </div>
      </div>

      <div className="relative mb-6 z-30">
          <div className="flex justify-between items-center mb-2 px-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinatario SIDS</label>
              {detectedBeneficiary && <span className="text-[10px] font-black text-brand-600 uppercase bg-brand-50 px-2 py-0.5 rounded">{detectedBeneficiary}</span>}
          </div>
          <div className={`bg-white p-2 rounded-3xl border-2 flex items-center shadow-soft transition-all ${showSuggestions ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-slate-100'}`}>
              <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs shrink-0">PL</div>
              <input 
                  type="text" 
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 25))}
                  onFocus={() => setShowSuggestions(true)}
                  className="flex-1 bg-transparent px-3 font-mono text-lg font-bold outline-none text-slate-900 placeholder:text-slate-200 tracking-wider"
                  placeholder="0000 0000..."
              />
              {recipientInput && <button onClick={() => setRecipientInput('')} className="p-3 text-slate-300"><X size={20}/></button>}
          </div>

          {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-slide-up z-50 p-2 max-h-64 overflow-y-auto">
                  {filteredSuggestions.map((s: any) => (
                      <button key={s.id} onClick={() => { setRecipientInput(s.iban.substring(2).replace(/(.{4})/g, '$1 ').trim()); setShowSuggestions(false); }} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 rounded-2xl transition-all group">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${s.type === 'CONTACT' ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
                              {s.type === 'CONTACT' ? <Star size={18} fill="currentColor"/> : <Clock size={18}/>}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                              <p className="font-black text-slate-900 text-sm truncate">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono truncate">{s.iban}</p>
                          </div>
                      </button>
                  ))}
              </div>
          )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className="flex flex-col items-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Importe</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black tracking-tighter text-slate-900">{amount || '0'}</span>
                    <span className="text-2xl text-slate-400 font-black">Pz</span>
                 </div>
            </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
          {[1,2,3,4,5,6,7,8,9].map(n => <KeypadButton key={n} val={n.toString()} onClick={() => handleKeypad(n.toString())} />)}
          <KeypadButton val="+10" onClick={() => handleKeypad('+10')} secondary />
          <KeypadButton val="0" onClick={() => handleKeypad('0')} />
          <KeypadButton val="DEL" onClick={() => handleKeypad('DEL')} icon={<X size={20} className="text-slate-400"/>} secondary />
      </div>

      <button onClick={handleVerify} disabled={!amount || recipientInput.length < 15} className="w-full py-5 bg-brand-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/40 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3">
          Firmar Operación <ArrowRight size={20} />
      </button>

      {/* --- MODALS --- */}
      {showContactModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-scale-up relative">
                  <button onClick={() => setShowContactModal(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full"><X size={20}/></button>
                  <h3 className="text-2xl font-black text-slate-900 mb-6">Gestionar Agenda</h3>
                  <div className="space-y-4">
                      <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-brand-500" placeholder="Nombre" value={contactName} onChange={e => setContactName(e.target.value)} />
                      <input className="w-full p-4 bg-slate-50 rounded-2xl font-mono font-bold text-sm outline-none border-2 border-transparent focus:border-brand-500 uppercase" placeholder="PL..." value={contactIban} onChange={e => setContactIban(e.target.value)} />
                      <button onClick={handleSaveContact} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-600 transition-all flex items-center justify-center gap-2">
                          <Save size={16}/> Guardar Beneficiario
                      </button>
                      <div className="pt-4 border-t border-slate-100 max-h-40 overflow-y-auto">
                          {contacts.map(c => (
                              <div key={c.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl group">
                                  <div className="min-w-0">
                                      <p className="font-bold text-sm text-slate-900 truncate">{c.name}</p>
                                      <p className="text-[10px] text-slate-400 font-mono truncate">{c.iban}</p>
                                  </div>
                                  <button onClick={() => deleteContact(c.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {transferStep === 'CONFIRM' && (
           <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg z-[200] flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl animate-pop-in relative">
                    <button onClick={() => setTransferStep('IDLE')} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full"><X size={20}/></button>
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4">
                            <Send size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Confirmar Giro</h3>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] mb-10 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Base</span>
                            <span className="font-black text-xl text-slate-900">{Number(amount).toLocaleString()} Pz</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Tasas SIDS (1%)</span>
                            <span className="font-bold text-slate-500">{(Number(amount) * 0.01).toLocaleString()} Pz</span>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                            <span className="text-[10px] font-black text-brand-600 uppercase">Total</span>
                            <span className="font-black text-3xl text-brand-600">{(Number(amount) * 1.01).toLocaleString()}</span>
                        </div>
                    </div>
                    <button onClick={handleConfirm} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-brand-600 transition-all flex items-center justify-center gap-2">
                        <ShieldCheck size={18}/> Firmar en Ledger
                    </button>
                </div>
           </div>
      )}

      {transferStep === 'PROCESSING' && (
           <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[300] flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 border-4 border-white/10 border-t-brand-500 rounded-full animate-spin mb-8"></div>
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Sincronizando Nodo</h2>
                <p className="text-slate-400 font-bold text-sm">Validando firma administrativa...</p>
           </div>
      )}

      {transferStep === 'SUCCESS' && (
           <div className="fixed inset-0 bg-white z-[300] flex flex-col items-center justify-center p-10 text-center animate-fade-in">
               <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl animate-pop-in">
                   <CheckCircle2 size={72} strokeWidth={2.5} />
               </div>
               <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Liquidado</h2>
               <p className="text-slate-500 font-bold mb-14 text-lg">Operación registrada satisfactoriamente.</p>
               <button onClick={() => { setTransferStep('IDLE'); setAmount(''); setRecipientInput(''); }} className="w-full max-w-xs py-5 bg-slate-900 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl">Volver al Inicio</button>
           </div>
      )}
    </div>
  );
};