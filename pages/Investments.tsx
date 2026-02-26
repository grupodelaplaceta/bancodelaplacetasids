import React, { useState, useMemo } from 'react';
import { useBank } from '../context/useBank';
import { TrendingUp, TrendingDown, Activity, PlayCircle, Info, AlertTriangle, X, ShieldAlert, BookOpen, Lock } from 'lucide-react';
import { AreaChart, Area, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface InvestmentsProps {
  addNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Investments: React.FC<InvestmentsProps> = ({ addNotification }) => {
  const { companies, buyStock, sellStock, userAccounts, currentUser, getAge } = useBank();
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [operationType, setOperationType] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState<number>(1000);
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [infoTab, setInfoTab] = useState<'MECHANICS' | 'RISKS' | 'DIVIDENDS'>('MECHANICS');
  const [showRiskModal, setShowRiskModal] = useState(false);

  // Fix: Calculate totalBalance which was missing for IA Impact calculation
  const totalBalance = useMemo(() => userAccounts.reduce((acc, curr) => acc + parseFloat(curr.balance.toString()), 0) || 0, [userAccounts]);

  // AGE RESTRICTION (Cap 2, Art 4.6)
  const age = currentUser ? getAge(currentUser.birthDate) : 0;

  // Chart Data Preparation from Company History
  const selectedCompany = useMemo(() => companies.find(c => c.id === selectedCompanyId), [companies, selectedCompanyId]);

  const chartData = useMemo(() => {
      if(!selectedCompany || !selectedCompany.price_history) return [];
      let history = selectedCompany.price_history;
      if (typeof history === 'string') history = JSON.parse(history);
      if (!Array.isArray(history)) return [];
      
      return history.map((point: any) => ({
          time: new Date(point.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          value: parseFloat(point.price)
      }));
  }, [selectedCompany]);

  if (age < 18) {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Lock size={40} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso Restringido</h2>
              <p className="text-slate-500 max-w-md">
                  Según el Capítulo 2, Artículo 4.6 de la normativa vigente, las inversiones de alto riesgo están reservadas exclusivamente para ciudadanos mayores de 18 años.
              </p>
          </div>
      );
  }

  // Filter public companies for the stock market
  const marketCompanies = companies.filter(c => c.isPublic);
  const mainAccount = userAccounts[selectedAccountIdx];

  const currentBondValue = selectedCompany ? selectedCompany.stockValue : 0;
  // Calculate change from first data point in history vs now
  const startBondValue = chartData.length > 0 ? chartData[0].value : currentBondValue;
  const bondChange = startBondValue > 0 ? ((currentBondValue - startBondValue) / startBondValue) * 100 : 0;

  const handlePreExecute = () => {
      if (!selectedCompanyId || !mainAccount) return;
      if (operationType === 'BUY') {
          if (amount > mainAccount.balance) {
              addNotification("Saldo insuficiente", "error");
              return;
          }
          setShowRiskModal(true); // Must accept risk first
      } else {
          // Sell direct
          sellStock(selectedCompanyId, mainAccount.id, amount); // amount is Pz worth
          setSelectedCompanyId(null);
      }
  };

  const confirmBuy = () => {
      if (selectedCompanyId && mainAccount) {
          buyStock(selectedCompanyId, mainAccount.id, amount);
          setShowRiskModal(false);
          setSelectedCompanyId(null);
      }
  };

  const getMyStockValue = (companyId: string) => {
      const co = companies.find(c => c.id === companyId);
      if(!co) return 0;
      const myShares = co.shareholders.find(s => s.userId === currentUser?.id)?.shares || 0;
      return myShares * co.stockValue;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-fade-in font-sans relative">
        
        {/* RISK WARNING MODAL */}
        {showRiskModal && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-scale-up">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">Advertencia de Riesgo</h3>
                    <p className="text-center text-slate-500 mb-6 text-sm">
                        Estás a punto de invertir capital en un activo de renta variable.
                    </p>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl mb-6 space-y-3 text-sm text-slate-700">
                        <div className="flex gap-3">
                            <ShieldAlert className="shrink-0 text-orange-500" size={20}/>
                            <p>El valor de tu inversión puede <strong>bajar</strong> así como subir.</p>
                        </div>
                        <div className="flex gap-3">
                            <Activity className="shrink-0 text-orange-500" size={20}/>
                            <p>El rendimiento pasado no garantiza resultados futuros.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setShowRiskModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                        <button onClick={confirmBuy} className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg">Entiendo y Acepto</button>
                    </div>
                </div>
            </div>
        )}

        {/* EDUCATIONAL MODAL */}
        {showInfo && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowInfo(false)}>
                <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowInfo(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"><X size={24}/></button>
                    
                    <div className="flex flex-col md:flex-row h-[600px] md:h-[500px]">
                        {/* Sidebar Tabs */}
                        <div className="w-full md:w-1/3 bg-slate-50 p-6 flex flex-col gap-2 border-r border-slate-100">
                            <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2"><BookOpen size={24}/> Academia</h3>
                            <button onClick={() => setInfoTab('MECHANICS')} className={`text-left p-3 rounded-xl text-sm font-bold transition-all ${infoTab === 'MECHANICS' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:bg-slate-100'}`}>Mecánica</button>
                            <button onClick={() => setInfoTab('RISKS')} className={`text-left p-3 rounded-xl text-sm font-bold transition-all ${infoTab === 'RISKS' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:bg-slate-100'}`}>Riesgos</button>
                            <button onClick={() => setInfoTab('DIVIDENDS')} className={`text-left p-3 rounded-xl text-sm font-bold transition-all ${infoTab === 'DIVIDENDS' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:bg-slate-100'}`}>Beneficios</button>
                        </div>
                        
                        {/* Content */}
                        <div className="w-full md:w-2/3 p-8 overflow-y-auto">
                            {infoTab === 'MECHANICS' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="text-2xl font-bold text-slate-900">¿Cómo funciona el Mercado?</h4>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        Las empresas pueden decidir "salir a bolsa" para captar capital. Cuando compras una acción, estás comprando una pequeña parte de esa empresa.
                                        El precio de la acción sube o baja dependiendo de la oferta y la demanda, así como del rendimiento de la empresa.
                                    </p>
                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-800 text-sm">
                                        <strong>Orden de Compra:</strong> Intercambias tu dinero líquido (Pz) por títulos de propiedad.
                                    </div>
                                </div>
                            )}
                            {infoTab === 'RISKS' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ShieldAlert className="text-red-500"/> Riesgos</h4>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        Invertir siempre conlleva riesgo. El valor de tu inversión puede bajar y podrías perder parte de tu dinero si la empresa quiebra o pierde valor en el mercado.
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 marker:text-red-400">
                                        <li>Volatilidad del mercado.</li>
                                        <li>Falta de liquidez (nadie quiere comprar tus acciones).</li>
                                        <li>Quiebra de la empresa emisora.</li>
                                    </ul>
                                </div>
                            )}
                            {infoTab === 'DIVIDENDS' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="text-2xl font-bold text-slate-900 text-green-700">Plusvalía y Dividendos</h4>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        Ganas dinero de dos formas:
                                    </p>
                                    <div className="space-y-3">
                                        <div className="p-3 border border-slate-100 rounded-xl">
                                            <p className="font-bold text-slate-800">1. Plusvalía</p>
                                            <p className="text-xs text-slate-500">Vender la acción más cara de lo que la compraste.</p>
                                        </div>
                                        <div className="p-3 border border-slate-100 rounded-xl">
                                            <p className="font-bold text-slate-800">2. Dividendos</p>
                                            <p className="text-xs text-slate-500">Reparto de beneficios que hace la empresa a sus accionistas periódicamente.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        <header className="mb-8 flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Mercado de Valores</h2>
                <div className="flex items-center gap-2 text-slate-500 font-medium cursor-pointer hover:text-brand-600 transition-colors" onClick={() => setShowInfo(true)}>
                    <div className="p-1 bg-brand-50 rounded-lg"><Info size={16} className="text-brand-600"/></div>
                    <p className="underline decoration-dotted">Guía para el inversor soberano</p>
                </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-bold animate-pulse">
                <Activity size={16} /> Mercado Abierto
            </div>
        </header>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-[60px] opacity-40"></div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Empresas Listadas</p>
                <p className="text-4xl font-black tracking-tight">{marketCompanies.length}</p>
            </div>
            <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-soft">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Tu Portafolio</p>
                <p className="text-4xl font-black text-slate-900 tracking-tight">
                    {companies.reduce((acc, co) => {
                        const myShares = co.shareholders.find(s => s.userId === currentUser?.id)?.shares || 0;
                        return acc + (myShares * co.stockValue);
                    }, 0).toLocaleString()} <span className="text-lg text-slate-400 font-bold">Pz</span>
                </p>
            </div>
             <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center gap-4">
                <div className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="font-black text-emerald-900 text-sm">Mercado Activo</p>
                    <p className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-wider">Actualizado en tiempo real</p>
                </div>
            </div>
        </div>

        {/* Stock List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {marketCompanies.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[2rem]">
                    No hay empresas públicas disponibles para inversión.
                </div>
            ) : (
                marketCompanies.map(company => {
                    const myShares = company.shareholders.find(s => s.userId === currentUser?.id)?.shares || 0;
                    const isUp = company.stockValue >= 100; // Placeholder check

                    return (
                        <div key={company.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-soft hover:shadow-xl hover:border-brand-200 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all shadow-lg ${company.isPublic ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {company.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 leading-none">{company.name}</h3>
                                        <p className="text-[10px] text-slate-400 mt-1 font-mono font-bold uppercase tracking-wider">CAP: {company.capital.toLocaleString()} Pz</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm border ${isUp ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                    {isUp ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                                    {company.stockValue.toFixed(2)} Pz
                                </div>
                            </div>
                            
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tus Acciones</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{myShares.toFixed(2)}</p>
                                </div>
                                <button 
                                    onClick={() => { setSelectedCompanyId(company.id); setOperationType('BUY'); }}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-brand-600 transition-all active:scale-95"
                                >
                                    Operar Activo
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Trade Drawer with Chart */}
        {selectedCompany && (
            <>
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[140]" onClick={() => setSelectedCompanyId(null)}></div>
                <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-[3rem] z-[150] p-10 animate-slide-up md:w-[540px] md:inset-x-auto md:right-4 md:bottom-4 md:rounded-[3.5rem] shadow-2xl pb-safe">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCompany.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orden de Mercado SIDS</p>
                        </div>
                        <button onClick={() => setSelectedCompanyId(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                    </div>

                    {/* Chart */}
                    <div className="h-44 w-full mb-8 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden p-4">
                        {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={bondChange >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor={bondChange >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', fontWeight:'bold', fontSize:'12px'}} />
                                    <Area type="monotone" dataKey="value" stroke={bondChange >= 0 ? "#10b981" : "#ef4444"} fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando Histórico...</div>
                        )}
                    </div>
                    
                    {/* Operation Switch */}
                    <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
                        <button onClick={() => setOperationType('BUY')} className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${operationType === 'BUY' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Comprar</button>
                        <button onClick={() => setOperationType('SELL')} className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${operationType === 'SELL' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vender</button>
                    </div>

                    <div className="mb-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-3 block tracking-widest">Cuenta de Liquidación</label>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {userAccounts.map((acc, i) => (
                                <button 
                                    key={acc.id}
                                    onClick={() => setSelectedAccountIdx(i)}
                                    className={`shrink-0 px-5 py-4 rounded-[1.5rem] border-2 text-left transition-all ${selectedAccountIdx === i ? 'border-brand-600 bg-brand-50 shadow-sm shadow-brand-500/10' : 'border-slate-50 bg-slate-50'}`}
                                >
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{acc.alias}</p>
                                    <p className="font-black text-slate-900 tracking-tight">{acc.balance.toLocaleString()} Pz</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem] mb-10 border border-slate-100">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{operationType === 'BUY' ? 'Importe Inversión' : 'Importe Venta'}</span>
                            <span className={`text-4xl font-black tracking-tighter ${operationType === 'BUY' ? 'text-emerald-600' : 'text-red-600'}`}>{amount} <span className="text-xl opacity-40">Pz</span></span>
                        </div>
                        
                        {operationType === 'BUY' ? (
                             <input 
                                type="range" 
                                min="100" 
                                max={Math.min(mainAccount?.balance || 0, 100000)} 
                                step="100"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="range-slider range-green"
                            />
                        ) : (
                             <input 
                                type="range" 
                                min="0" 
                                max={Math.floor(getMyStockValue(selectedCompany.id))} 
                                step="100"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="range-slider range-red"
                            />
                        )}
                        <div className="flex justify-between mt-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IA Impact: {(amount/(totalBalance||1) * 100).toFixed(2)}%</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {operationType === 'BUY' ? `Máx: ${mainAccount?.balance} Pz` : `Disp: ${getMyStockValue(selectedCompany.id).toFixed(0)} Pz`}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={handlePreExecute}
                        className={`w-full py-5 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.25em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${operationType === 'BUY' ? 'bg-slate-900 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'}`}
                    >
                        {operationType === 'BUY' ? <PlayCircle size={20} /> : <TrendingDown size={20} />} 
                        {operationType === 'BUY' ? 'Lanzar Orden Compra' : 'Liquidar Acciones'}
                    </button>
                </div>
            </>
        )}
    </div>
  );
};