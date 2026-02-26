import React, { useState } from 'react';
import { useBank } from '../context/useBank';
import { Store, Layers, Repeat, DollarSign, X, User, Trash2 } from 'lucide-react';
import { CardDesign } from '../types';

interface GroupedDesign {
    name: string;
    imageUrl: string;
    rarity: string;
    minPrice: number;
    count: number;
    listings: CardDesign[];
}

export const Market: React.FC = () => {
  const { marketDesigns, buyDesign, listDesign, userAccounts, currentUser, deleteDesign } = useBank();
  const [activeTab, setActiveTab] = useState<'STORE' | 'RESALE' | 'INVENTORY'>('STORE');
  const [selectedDesign, setSelectedDesign] = useState<CardDesign | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedDesign | null>(null);
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0);
  const [resalePrice, setResalePrice] = useState('');

  const currentAccount = userAccounts[selectedAccountIdx];

  const handleBuy = async (designId: string, price: number) => {
      if (!currentAccount) return;
      if (currentAccount.balance < price) {
          alert("Saldo insuficiente");
          return;
      }
      await buyDesign(designId, currentAccount.id);
      setSelectedDesign(null);
      setSelectedGroup(null);
  };

  const handleListForSale = async () => {
      if (!selectedDesign || !resalePrice) return;
      await listDesign(selectedDesign.id, Number(resalePrice));
      setSelectedDesign(null);
      setResalePrice('');
  };

  const handleDelete = async (e: React.MouseEvent, designId: string) => {
      e.stopPropagation();
      if(confirm('¿Eliminar permanentemente este diseño de la tienda oficial?')) {
          await deleteDesign(designId);
          setSelectedDesign(null);
          setSelectedGroup(null);
      }
  };

  const groupedResale = React.useMemo(() => {
      const groups: {[key: string]: GroupedDesign} = {};
      const storeItems = marketDesigns?.store || [];
      const resaleItems = storeItems.filter(d => d.isListed === true);
      
      resaleItems.forEach(item => {
          if (!groups[item.name]) {
              groups[item.name] = {
                  name: item.name,
                  imageUrl: item.imageUrl,
                  rarity: item.rarity,
                  minPrice: item.price,
                  count: 0,
                  listings: []
              };
          }
          groups[item.name].listings.push(item);
          groups[item.name].count++;
          if (item.price < groups[item.name].minPrice) groups[item.name].minPrice = item.price;
      });
      Object.values(groups).forEach(g => g.listings.sort((a,b) => a.price - b.price));
      return Object.values(groups);
  }, [marketDesigns]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-fade-in font-sans">
        <header className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mercado SIDS</h1>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
                 <button onClick={() => setActiveTab('STORE')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'STORE' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>
                     <Store size={18}/> Tienda Oficial
                 </button>
                 <button onClick={() => setActiveTab('RESALE')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'RESALE' ? 'bg-brand-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>
                     <Repeat size={18}/> Segunda Mano
                 </button>
                 <button onClick={() => setActiveTab('INVENTORY')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'INVENTORY' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>
                     <Layers size={18}/> Mi Colección
                 </button>
            </div>
        </header>

        {activeTab === 'STORE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
                {(marketDesigns?.store || []).filter(d => !d.ownerId).map(design => (
                    <div key={design.id} className="bg-white rounded-[2rem] overflow-hidden shadow-soft border border-slate-100 group hover:-translate-y-1 transition-all cursor-pointer relative" onClick={() => setSelectedDesign(design)}>
                        {currentUser?.role === 'ADMIN' && (
                            <button onClick={(e) => handleDelete(e, design.id)} className="absolute top-4 right-4 z-20 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                <Trash2 size={16}/>
                            </button>
                        )}
                        <div className="relative aspect-[1.586] overflow-hidden bg-slate-100">
                            <img src={design.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-brand-50 text-brand-600 border border-brand-100">{design.rarity}</span>
                                <span className="font-black text-slate-900 text-lg">{design.price} Pz</span>
                            </div>
                            <h3 className="font-bold text-slate-700">{design.name}</h3>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'RESALE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
                {groupedResale.length === 0 ? (
                    <div className="col-span-full text-center text-slate-400 py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 font-bold uppercase tracking-widest text-xs">No hay ofertas de usuarios ahora mismo.</div>
                ) : (
                    groupedResale.map((group, idx) => (
                        <div key={idx} className="bg-white rounded-[2.5rem] overflow-hidden shadow-soft border border-brand-100 cursor-pointer relative group hover:shadow-xl transition-all" onClick={() => setSelectedGroup(group)}>
                            <div className="absolute top-4 right-4 bg-brand-600 text-white text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-lg">
                                {group.count} EN VENTA
                            </div>
                            <div className="relative aspect-[1.586] overflow-hidden">
                                <img src={group.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Desde</span>
                                    <span className="font-black text-brand-600 text-xl">{group.minPrice} Pz</span>
                                </div>
                                <h3 className="font-black text-slate-800 text-lg leading-tight">{group.name}</h3>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {activeTab === 'INVENTORY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
                {(marketDesigns?.inventory || []).length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[2rem] font-bold uppercase tracking-widest text-xs">Tu colección está vacía.</div>
                ) : (
                    marketDesigns.inventory.map(design => (
                        <div key={design.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-soft border border-slate-100 cursor-pointer hover:border-brand-300 transition-colors" onClick={() => setSelectedDesign(design)}>
                            <img src={design.imageUrl} className="w-full aspect-[1.586] object-cover"/>
                            <div className="p-5 flex justify-between items-center">
                                <h3 className="font-bold text-sm text-slate-800">{design.name}</h3>
                                <button className="bg-slate-100 p-2 rounded-lg text-slate-400 hover:text-brand-600 transition-colors"><Repeat size={16}/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* MODAL DETALLES */}
        {(selectedDesign || selectedGroup) && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={() => {setSelectedDesign(null); setSelectedGroup(null);}}>
                <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl animate-scale-up overflow-hidden max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedDesign?.name || selectedGroup?.name}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedDesign?.rarity || selectedGroup?.rarity}</p>
                        </div>
                        <button onClick={() => {setSelectedDesign(null); setSelectedGroup(null);}} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={24}/></button>
                    </div>

                    <div className="relative group/img mb-10">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-brand-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover/img:opacity-40 transition-opacity"></div>
                        <img src={selectedDesign?.imageUrl || selectedGroup?.imageUrl} className="relative w-full rounded-2xl shadow-2xl transition-transform duration-500 group-hover/img:scale-[1.02]"/>
                    </div>
                    
                    {activeTab === 'STORE' && selectedDesign && (
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <select className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold border-2 border-slate-100 outline-none focus:border-brand-100 transition-all" onChange={e => setSelectedAccountIdx(Number(e.target.value))}>
                                    {userAccounts.map((acc, i) => <option key={acc.id} value={i}>{acc.alias} ({acc.balance} Pz)</option>)}
                                </select>
                                <div className="p-4 bg-brand-50 rounded-2xl text-center border-2 border-brand-100 min-w-[120px]">
                                    <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Precio</p>
                                    <p className="text-xl font-black text-brand-600">{selectedDesign.price} Pz</p>
                                </div>
                            </div>
                            <button onClick={() => handleBuy(selectedDesign.id, selectedDesign.price)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-brand-600 transition-all active:scale-95">Firmar Compra</button>
                        </div>
                    )}

                    {activeTab === 'RESALE' && selectedGroup && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ofertas del Mercado</span>
                                <span className="text-[9px] font-black text-brand-600 bg-brand-50 px-2 py-1 rounded uppercase tracking-widest">Vendedor → Precio</span>
                            </div>
                            <div className="space-y-2">
                                {selectedGroup.listings.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-200 transition-all group/item">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><User size={20}/></div>
                                            <p className="font-black text-slate-800 text-sm">{item.sellerName || 'Ciudadano'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-slate-900">{item.price} Pz</span>
                                            <button onClick={() => handleBuy(item.id, item.price)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover/item:bg-brand-600 transition-colors">Comprar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'INVENTORY' && selectedDesign && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                                <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-sm tracking-widest"><DollarSign size={18} className="text-brand-600"/> Vender en el Mercado</h4>
                                <div className="flex gap-3">
                                    <input type="number" className="flex-1 p-4 bg-white rounded-xl font-black outline-none border-2 border-slate-100 focus:border-brand-300 transition-all" placeholder="Precio Pz" value={resalePrice} onChange={e => setResalePrice(e.target.value)} />
                                    <button onClick={handleListForSale} className="px-8 bg-slate-900 text-white font-black rounded-xl hover:bg-brand-600 transition-all uppercase text-[10px] tracking-widest">Listar</button>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-4 text-center uppercase tracking-widest">Comisión de reventa estatal: 10%</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};