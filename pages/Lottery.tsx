import React, { useState } from 'react';
import { useBank } from '../context/useBank';
import { Gift, Package, Zap, Lock, Info, Trophy } from 'lucide-react';
import { LootBox, LootItem } from '../types';

interface LotteryProps {
  addNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Lottery: React.FC<LotteryProps> = ({ addNotification }) => {
  const { lootBoxes, userAccounts, buyLootBox, redeemCode, taxConfig, currentUser, getAge } = useBank();
  
  const [selectedBox, setSelectedBox] = useState<LootBox | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [prize, setPrize] = useState<LootItem | null>(null);
  const [redeemInput, setRedeemInput] = useState('');
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0);

  // AGE RESTRICTION (Cap 2, Art 4.4)
  const age = currentUser ? getAge(currentUser.birthDate) : 0;
  if (age < 12) {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Lock size={40} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso Restringido</h2>
              <p className="text-slate-500 max-w-md">
                  Según la normativa vigente (Capítulo 2, Art 4.4), los menores de 12 años no tienen permitido participar en actividades de lotería.
              </p>
          </div>
      );
  }

  const now = new Date();
  const activeBoxes = (lootBoxes || []).filter(box => {
      if(box.availableFrom && new Date(box.availableFrom) > now) return false;
      if(box.availableUntil && new Date(box.availableUntil) < now) return false;
      return true;
  });

  const handleBuy = async () => {
      if (!selectedBox || userAccounts.length === 0) return;
      
      const mainAccount = userAccounts[selectedAccountIdx]; 
      if (mainAccount.balance < selectedBox.price) {
          addNotification("Saldo insuficiente", "error");
          return;
      }

      setIsOpening(true);
      try {
          const result = await buyLootBox(selectedBox.id, mainAccount.id);
          if (result.success && result.wonItem) {
              setTimeout(() => {
                setPrize(result.wonItem);
                setIsOpening(false);
              }, 2000);
          } else {
              setIsOpening(false);
              setSelectedBox(null);
          }
      } catch {
          setIsOpening(false);
          setSelectedBox(null);
      }
  };

  const closePrizeModal = () => {
      setPrize(null);
      setSelectedBox(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32 animate-fade-in font-sans">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-brand-600 text-white p-2 rounded-xl shadow-lg"><Gift size={24} /></div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lotería Placeta</h1>
                </div>
                <p className="text-slate-500 font-bold ml-1 text-sm">Impuesto sobre premios: {taxConfig.lotteryRate}%</p>
            </div>
            
            <div className="bg-white p-2 pl-4 rounded-2xl border-2 border-slate-100 flex items-center gap-2 shadow-soft w-full md:w-auto">
                <Ticket className="text-brand-400" size={20} />
                <input type="text" placeholder="Código..." value={redeemInput} onChange={e => setRedeemInput(e.target.value)} className="bg-transparent outline-none text-sm font-bold text-slate-900 w-full md:w-32"/>
                <button onClick={() => { redeemCode(redeemInput); setRedeemInput(''); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-600 transition-colors shadow-lg">Canjear</button>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBoxes.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[2rem]">No hay cajas disponibles actualmente.</div>
            ) : activeBoxes.map(box => (
                <div key={box.id} className="bg-white rounded-[2.5rem] border-4 border-white shadow-soft overflow-hidden group hover:-translate-y-2 transition-all">
                    <div className={`h-40 bg-gradient-to-br ${box.color || 'from-slate-700 to-slate-900'} flex items-center justify-center relative`}>
                         <Package size={80} className="text-white drop-shadow-2xl opacity-90 group-hover:scale-110 transition-transform"/>
                         <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-black border border-white/30">{box.price} Pz</div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-2xl font-black text-slate-800 mb-1">{box.name}</h3>
                        <p className="text-sm font-bold text-slate-400 mb-6 min-h-[40px]">{box.description}</p>
                        <button onClick={() => setSelectedBox(box)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-brand-600 transition-all flex justify-center items-center gap-2"><Zap size={18} className="fill-current" /> ABRIR CAJA</button>
                    </div>
                </div>
            ))}
        </div>

        {selectedBox && (
            <div className="fixed inset-0 z-[250] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
                {!prize ? (
                    <div className="text-center relative w-full max-w-md animate-fade-in">
                        <div className={`w-64 h-64 mx-auto mb-12 relative flex items-center justify-center`}>
                             <div className={`absolute inset-0 bg-gradient-to-tr ${selectedBox.color || 'from-slate-700 to-slate-900'} rounded-full blur-[60px] opacity-40 transition-all ${isOpening ? 'scale-150' : ''}`}></div>
                             <div className={`relative z-10 transition-all ${isOpening ? 'animate-shake' : 'animate-float'}`}><Package size={140} className="text-white drop-shadow-2xl" strokeWidth={1} /></div>
                        </div>
                        <div className={`${isOpening ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}>
                            <h2 className="text-3xl font-black text-white mb-2">{selectedBox.name}</h2>
                            <div className="mb-8 text-left">
                                <label className="block text-xs font-bold text-white/50 uppercase mb-2 ml-1">Pagar con</label>
                                <select className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white font-bold outline-none" value={selectedAccountIdx} onChange={e => setSelectedAccountIdx(Number(e.target.value))}>
                                    {userAccounts.map((acc, i) => <option key={acc.id} value={i} className="text-slate-900">{acc.alias} ({acc.balance} Pz)</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 justify-center">
                                <button onClick={() => setSelectedBox(null)} className="px-8 py-4 bg-white/5 text-white rounded-2xl font-bold border border-white/10">Cancelar</button>
                                <button onClick={handleBuy} className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-200 shadow-2xl transition-all active:scale-95">Abrir por {selectedBox.price} Pz</button>
                            </div>
                        </div>
                        {isOpening && <p className="text-white font-black animate-pulse tracking-widest text-xl mt-10 uppercase">PROCESANDO PREMIO...</p>}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] p-8 text-center animate-pop-in relative z-10 border-8 border-white shadow-2xl w-full max-w-sm">
                        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-300 to-orange-400 text-white rounded-full flex items-center justify-center shadow-2xl mb-6"><Trophy size={60} className="animate-bounce" /></div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">¡Recompensa Obtenida!</h2>
                        <h1 className="text-3xl font-black text-slate-900 mb-6">{prize.name}</h1>
                        <div className="inline-block bg-emerald-100 text-emerald-700 px-6 py-3 rounded-xl font-black text-2xl mb-8">+{prize.value * (1 - taxConfig.lotteryRate/100)} <span className="text-sm font-bold">Pz (Neto)</span></div>
                        <div className="p-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-400 mb-8 flex items-center gap-2 uppercase tracking-widest"><Info size={14}/> Retención aplicada: {prize.value * (taxConfig.lotteryRate/100)} Pz</div>
                        <button onClick={closePrizeModal} className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-brand-600 transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest">Recoger y Salir</button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};