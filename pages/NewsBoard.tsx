
import React, { useEffect, useState } from 'react';
import { Calendar, ArrowRight, Newspaper } from 'lucide-react';

export const NewsBoard: React.FC = () => {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'GET_NEWS' })
        })
        .then(res => res.json())
        .then(data => {
            if(Array.isArray(data)) setNews(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Cargando Prensa...</div>;

    return (
        <div className="p-4 md:p-10 max-w-6xl mx-auto pb-32 animate-fade-in font-sans">
            <header className="mb-12 flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-xl">
                    <Newspaper size={32}/>
                </div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Diario La Placeta</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Canal Oficial de Comunicación SIDS</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {news.map(item => (
                    <article key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden group hover:shadow-xl transition-all cursor-pointer flex flex-col h-full hover:border-indigo-100">
                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                            <img src={item.imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title}/>
                            <div className="absolute top-4 left-4">
                                <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-600 border border-white/20 shadow-sm">
                                    {item.tag}
                                </span>
                            </div>
                        </div>
                        <div className="p-8 flex flex-col flex-1">
                            <div className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-widest mb-3">
                                <Calendar size={12}/> {new Date(item.publishedAt).toLocaleDateString()}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors line-clamp-3">{item.title}</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-4 mb-6 flex-1">{item.summary}</p>
                            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 group-hover:translate-x-2 transition-transform self-start">
                                Leer Artículo <ArrowRight size={14}/>
                            </button>
                        </div>
                    </article>
                ))}
            </div>
            
            {news.length === 0 && (
                <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay noticias publicadas</p>
                </div>
            )}
        </div>
    );
};
