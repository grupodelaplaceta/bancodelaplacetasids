import React, { useState, useMemo } from 'react';
import { useBank } from '../context/useBank';
import { 
  ShoppingBag, CreditCard, Search, ArrowRight, 
  Store, Zap, User, ShieldCheck, 
  Lock, X, RefreshCw, Wallet, ChevronRight, Smartphone,
  ArrowUpRight, AlertTriangle
} from 'lucide-react';
import { Company, Product, SubscriptionPlan } from '../types';

export const Payments: React.FC<{ addNotification: any }> = ({ addNotification }) => {
  const { userAccounts, companies, cards, payWithCard, transfer, userSubscriptions, subscribeToPlan, cancelSubscription } = useBank();
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'PLACEZUM' | 'SUBSCRIPTIONS'>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Checkout State
  const [selectedProduct, setSelectedProduct] = useState<{p: Product, c: Company} | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'ACCOUNT'>('CARD');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(userAccounts[0]?.id || '');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Subscriptions State
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // PlaceZum State
  const [targetDip, setTargetDip] = useState('');
  const [amount, setAmount] = useState('');

  const activeMarkets = useMemo(() => companies.filter(c => 
    c.catalog?.active && 
    c.catalog.products.length > 0 &&
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.catalog.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())))
  ), [companies, searchQuery]);

  const availablePlans = useMemo(() => {
      const plans: { plan: SubscriptionPlan, company: Company }[] = [];
      companies.forEach(c => {
          if (c.subscriptionPlans) {
              c.subscriptionPlans.forEach(p => plans.push({ plan: p, company: c }));
          }
      });
      return plans;
  }, [companies]);

  const handleCheckout = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProduct) return;
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
          const total = selectedProduct.p.price * 1.12;
          if (paymentMethod === 'CARD') {
              const card = cards.find(c => c.id === selectedCardId);
              if (!card) throw new Error("Selecciona una tarjeta válida");
              await payWithCard({ pan: card.pan, cvv: card.cvv, pin }, selectedProduct.p.price, selectedProduct.c.id, `PlacetaPay: ${selectedProduct.p.name}`);
          } else {
              const acc = userAccounts.find(a => a.id === selectedAccountId);
              if (!acc) throw new Error("Selecciona una cuenta válida");
              await transfer(acc.iban, selectedProduct.c.iban, total, `PlacetaPay Direct: ${selectedProduct.p.name}`, 'MARKET_BUY');
          }
          addNotification("Pago completado correctamente", "success");
          setSelectedProduct(null);
          setPin('');
      } catch (e: any) {
          addNotification(e.message, "error");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleSubscribe = async () => {
      if(!selectedPlan) return;
      setIsProcessing(true);
      try {
          await subscribeToPlan(selectedPlan, selectedAccountId);
          setSelectedPlan(null);
      } catch (e: any) {
          addNotification(e.message, 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  const handleCancelSub = async (subId: string) => {
      if(!confirm("¿Cancelar suscripción?")) return;
      try {
          await cancelSubscription(subId);
      } catch(e: any) {
          addNotification(e.message, 'error');
      }
  };

  const handlePlaceZum = () => {
      if(!targetDip || !amount) return;
      setIsProcessing(true);
      setTimeout(() => {
          setIsProcessing(false);
          addNotification(`Enviado ${amount} Pz a ${targetDip}`, "success");
          setAmount(''); 
          setTargetDip('');
      }, 1000);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32 animate-fade-in font-sans min-h-screen">
      
      {/* Header & Navigation */}
      <div className="sticky top-0 z-30 bg-[#f2f4f8]/95 backdrop-blur-md pt-4 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                Placeta<span className="text-brand-600">Pay</span>
              </h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 flex items-center gap-1">
                <ShieldCheck size={12} className="text-brand-50"/> Pasarela SIDS v4.5
              </p>
            </div>
            
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex">
                {[
                    {id: 'CATALOG', label: 'Explorar', icon: Store},
                    {id: 'PLACEZUM', label: 'PlaceZum', icon: Zap},
                    {id: 'SUBSCRIPTIONS', label: 'Suscripciones', icon: RefreshCw},
                ].map(tab => (
                    <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                    <tab.icon size={16} strokeWidth={2.5}/> {tab.label}
                    </button>
                ))}
            </div>
          </div>

          {activeTab === 'CATALOG' && (
             <div className="relative group max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar productos, servicios o empresas..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                />
            </div>
          )}
      </div>

      {/* --- CATALOG VIEW --- */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-8 animate-slide-up">
          {activeMarkets.length === 0 ? (
              <div className="py-20 text-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <ShoppingBag size={40}/>
                  </div>
                  <p className="text-slate-400 font-bold text-lg">No se encontraron resultados</p>
              </div>
          ) : (
              activeMarkets.map(co => (
                <div key={co.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden group hover:shadow-xl transition-all duration-500">
                  <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center text-slate-700 font-black text-xl shadow-inner">
                        {co.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{co.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Verificado</span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">{co.nif}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-3 rounded-full bg-slate-50 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                        <ArrowUpRight size={20}/>
                    </button>
                  </div>

                  <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {co.catalog.products.map(prod => (
                        <div key={prod.id} className="bg-slate-50 hover:bg-slate-900 hover:text-white rounded-[2rem] p-6 transition-all duration-300 group/card cursor-pointer relative overflow-hidden" onClick={() => setSelectedProduct({p: prod, c: co})}>
                          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/20 rounded-full blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                          <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                            <div>
                                <h4 className="font-bold text-lg leading-tight mb-2">{prod.name}</h4>
                                <p className="text-xs opacity-60 font-medium line-clamp-2">{prod.description || 'Producto oficial certificado.'}</p>
                            </div>
                            <div className="flex justify-between items-end mt-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">Precio</p>
                                    <p className="text-2xl font-black tracking-tighter">{prod.price} <span className="text-sm opacity-60">Pz</span></p>
                                </div>
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transform translate-y-2 group-hover/card:translate-y-0 transition-all">
                                    <ArrowRight size={18}/>
                                </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* --- PLACEZUM VIEW --- */}
      {activeTab === 'PLACEZUM' && (
        <div className="max-w-xl mx-auto animate-slide-up">
            <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl shadow-brand-900/10 border border-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-brand-500 to-indigo-600"></div>
                
                <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                  <Zap size={40} className="fill-current" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">PlaceZum</h3>
                <p className="text-slate-400 font-bold mb-10 text-xs uppercase tracking-widest">Envíos instantáneos gratuitos</p>
                
                <div className="space-y-6 text-left">
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Destinatario</label>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><User size={20}/></div>
                            <input 
                                type="text" 
                                placeholder="DIP-XXXXXX" 
                                className="bg-transparent w-full font-bold text-lg outline-none text-slate-900 placeholder:text-slate-300 uppercase"
                                value={targetDip}
                                onChange={e => setTargetDip(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all text-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Importe a enviar</label>
                        <div className="flex items-center justify-center gap-2">
                            <input 
                                type="number" 
                                placeholder="0" 
                                className="bg-transparent w-40 text-center font-black text-6xl outline-none text-slate-900 placeholder:text-slate-200"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                            <span className="text-2xl font-bold text-slate-400 mt-4">Pz</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 20, 50].map(v => (
                            <button key={v} onClick={() => setAmount(v.toString())} className="py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-all shadow-sm active:scale-95">
                                {v} Pz
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={handlePlaceZum}
                        disabled={isProcessing || !targetDip || !amount}
                        className="w-full py-5 bg-brand-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-500 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? 'ENVIANDO...' : 'DESLIZAR PARA ENVIAR'} <ChevronRight size={16}/>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- SUBSCRIPTIONS VIEW --- */}
      {activeTab === 'SUBSCRIPTIONS' && (
          <div className="space-y-12 animate-slide-up">
              
              {/* Active Subscriptions */}
              {userSubscriptions.length > 0 && (
                  <section>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Mis Suscripciones Activas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userSubscriptions.map(sub => {
                              const plan = availablePlans.find(p => p.plan.id === sub.planId)?.plan;
                              if (!plan) return null;
                              return (
                                  <div key={sub.id} className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm flex justify-between items-center">
                                      <div>
                                          <h4 className="font-bold text-slate-900 text-lg">{plan.name}</h4>
                                          <p className="text-xs text-slate-500 font-medium mt-1">Próximo cobro: {new Date(sub.nextPaymentDate).toLocaleDateString()}</p>
                                          {sub.permanenceEndDate && new Date(sub.permanenceEndDate) > new Date() && (
                                              <p className="text-[10px] font-bold text-orange-500 mt-1 uppercase flex items-center gap-1"><Lock size={10}/> Permanencia: {new Date(sub.permanenceEndDate).toLocaleDateString()}</p>
                                          )}
                                      </div>
                                      <div className="text-right">
                                          <p className="font-black text-xl text-slate-900">{plan.price} Pz</p>
                                          <button onClick={() => handleCancelSub(sub.id)} className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors mt-2">Cancelar</button>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                  </section>
              )}

              {/* Plans Market */}
              <section>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Explorar Planes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availablePlans.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[2rem]">No hay planes disponibles por el momento.</div>
                    ) : (
                        availablePlans.map(({ plan, company }) => (
                            <div key={plan.id} className={`p-8 rounded-[3rem] shadow-xl flex flex-col justify-between h-80 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 bg-white border border-slate-100`}>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-600 font-bold">
                                            {company.name.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full text-slate-500">{plan.billingCycle}</span>
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight leading-tight mb-1 text-slate-900">{plan.name}</h3>
                                    <p className="text-xs font-bold opacity-50 uppercase tracking-widest text-slate-500">{company.name}</p>
                                </div>
                                
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed line-clamp-2">{plan.description}</p>
                                    {plan.permanenceMonths > 0 && <p className="text-[10px] text-orange-500 font-bold mb-2 uppercase flex items-center gap-1"><AlertTriangle size={10}/> Permanencia {plan.permanenceMonths} meses</p>}
                                    <button onClick={() => setSelectedPlan(plan)} className="w-full flex justify-between items-center bg-slate-900 hover:bg-brand-600 p-2 pr-6 rounded-[1.5rem] transition-colors text-white group">
                                        <div className="bg-white text-black w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                                            {plan.price}
                                        </div>
                                        <span className="font-bold text-xs uppercase tracking-widest mr-2">Suscribirse</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
              </section>
          </div>
      )}

      {/* --- CONFIRM SUBSCRIPTION MODAL --- */}
      {selectedPlan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-scale-up relative">
                  <button onClick={() => setSelectedPlan(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Confirmar Suscripción</h3>
                  <p className="text-sm text-slate-500 font-medium mb-6">Estás a punto de contratar <strong>{selectedPlan.name}</strong>.</p>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3 mb-6">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>Precio</span>
                          <span>{selectedPlan.price} Pz / mes</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>Permanencia</span>
                          <span className={selectedPlan.permanenceMonths > 0 ? "text-orange-500" : "text-green-600"}>{selectedPlan.permanenceMonths > 0 ? `${selectedPlan.permanenceMonths} Meses` : 'Sin Permanencia'}</span>
                      </div>
                  </div>

                  <div className="mb-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Cuenta de Cargo</label>
                      <select 
                          value={selectedAccountId} 
                          onChange={e => setSelectedAccountId(e.target.value)}
                          className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm outline-none"
                      >
                          {userAccounts.map(a => <option key={a.id} value={a.id}>{a.alias} ({a.balance} Pz)</option>)}
                      </select>
                  </div>

                  <button onClick={handleSubscribe} disabled={isProcessing} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-brand-600 transition-all active:scale-95 disabled:opacity-50">
                      {isProcessing ? 'Procesando...' : 'Aceptar y Suscribirse'}
                  </button>
              </div>
          </div>
      )}

      {/* --- CHECKOUT DRAWER (APPLE PAY STYLE) --- */}
      {selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
              <div className="bg-[#f8f9fc] w-full max-w-lg md:rounded-[3rem] rounded-t-[2.5rem] shadow-2xl animate-slide-up overflow-hidden relative max-h-[90vh] overflow-y-auto">
                  
                  {/* Handle bar for mobile */}
                  <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-4 mb-2 md:hidden"></div>

                  <div className="p-8">
                      <div className="flex justify-between items-center mb-8">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                              <ShieldCheck className="text-brand-600"/> Checkout Seguro
                          </h3>
                          <button onClick={() => setSelectedProduct(null)} className="p-2 bg-slate-200 rounded-full text-slate-600 hover:bg-slate-300 transition-colors"><X size={20}/></button>
                      </div>

                      {/* Resumen del Pedido */}
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
                          <div className="flex items-start gap-4 mb-6">
                              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                                  <ShoppingBag size={24} className="text-slate-400"/>
                              </div>
                              <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comercio</p>
                                  <p className="font-bold text-slate-900">{selectedProduct.c.name}</p>
                                  <p className="text-sm text-slate-500 mt-1">{selectedProduct.p.name}</p>
                              </div>
                          </div>
                          
                          <div className="space-y-3 pt-4 border-t border-slate-50">
                              <div className="flex justify-between text-xs font-bold text-slate-500">
                                  <span>Subtotal</span>
                                  <span>{selectedProduct.p.price.toFixed(2)} Pz</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold text-slate-500">
                                  <span>IVA (12%)</span>
                                  <span>{(selectedProduct.p.price * 0.12).toFixed(2)} Pz</span>
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                  <span className="font-black text-slate-900">TOTAL A PAGAR</span>
                                  <span className="font-black text-2xl text-slate-900">{(selectedProduct.p.price * 1.12).toFixed(2)} <span className="text-sm text-slate-400">Pz</span></span>
                              </div>
                          </div>
                      </div>

                      {/* Selección de Método */}
                      <div className="mb-8">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Método de Pago</p>
                          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                              <button 
                                onClick={() => setPaymentMethod('CARD')}
                                className={`flex-1 min-w-[140px] p-4 rounded-2xl border-2 text-left transition-all ${paymentMethod === 'CARD' ? 'border-brand-500 bg-brand-50' : 'border-white bg-white shadow-sm'}`}
                              >
                                  <CreditCard size={20} className={paymentMethod === 'CARD' ? 'text-brand-600' : 'text-slate-400'}/>
                                  <p className={`font-bold text-sm mt-2 ${paymentMethod === 'CARD' ? 'text-brand-900' : 'text-slate-600'}`}>Tarjeta SIDS</p>
                              </button>
                              <button 
                                onClick={() => setPaymentMethod('ACCOUNT')}
                                className={`flex-1 min-w-[140px] p-4 rounded-2xl border-2 text-left transition-all ${paymentMethod === 'ACCOUNT' ? 'border-brand-500 bg-brand-50' : 'border-white bg-white shadow-sm'}`}
                              >
                                  <Wallet size={20} className={paymentMethod === 'ACCOUNT' ? 'text-brand-600' : 'text-slate-400'}/>
                                  <p className={`font-bold text-sm mt-2 ${paymentMethod === 'ACCOUNT' ? 'text-brand-900' : 'text-slate-600'}`}>Cuenta Directa</p>
                              </button>
                          </div>
                      </div>

                      <form onSubmit={handleCheckout}>
                          {paymentMethod === 'CARD' ? (
                              <div className="space-y-4 mb-8">
                                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tarjeta</label>
                                      <select 
                                          value={selectedCardId} 
                                          onChange={e => setSelectedCardId(e.target.value)}
                                          className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                      >
                                          <option value="">Seleccionar tarjeta...</option>
                                          {cards.map(c => <option key={c.id} value={c.id}>•••• {c.pan.slice(-4)} | {c.holderName}</option>)}
                                      </select>
                                  </div>
                                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">PIN</label>
                                          <input 
                                              type="password" maxLength={4} placeholder="••••"
                                              className="w-20 font-mono font-black text-xl outline-none"
                                              value={pin} onChange={e => setPin(e.target.value)}
                                          />
                                      </div>
                                      <Lock size={18} className="text-slate-300"/>
                                  </div>
                              </div>
                          ) : (
                              <div className="mb-8 bg-white p-4 rounded-2xl border border-slate-200">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cuenta de Cargo</label>
                                  <select 
                                      value={selectedAccountId} 
                                      onChange={e => setSelectedAccountId(e.target.value)}
                                      className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                  >
                                      {userAccounts.map(a => <option key={a.id} value={a.id}>{a.alias} ({a.balance.toLocaleString()} Pz)</option>)}
                                  </select>
                              </div>
                          )}

                          <button 
                              disabled={isProcessing || (paymentMethod === 'CARD' && !selectedCardId) || (paymentMethod === 'CARD' && pin.length !== 4)}
                              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-brand-600 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                          >
                              {isProcessing ? (
                                  <RefreshCw size={20} className="animate-spin"/>
                              ) : (
                                  <>
                                      <Smartphone size={20}/> {paymentMethod === 'CARD' ? 'Pagar con Tarjeta' : 'Autorizar Transferencia'}
                                  </>
                              )}
                          </button>
                      </form>
                      
                      <div className="mt-6 text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                              <Lock size={10}/> Transacción Encriptada SIDS
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};