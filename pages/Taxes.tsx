
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useBank } from '../context/useBank';
import { 
    Scale, AlertTriangle, Download, 
    ArrowDownRight, ArrowUpRight, ShieldCheck, Calculator, BookOpen, X
} from 'lucide-react';

export const Taxes: React.FC = () => {
  const { payCitizenTax, addNotification, getFiscalProjection, generatePDF } = useBank();
  const [projections, setProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTerms, setShowTerms] = useState(false);

  const loadData = useCallback(async () => {
      const now = new Date();
      try {
          const data = await getFiscalProjection(now.getMonth() + 1, now.getFullYear());
          setProjections(data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [getFiscalProjection]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalDebt = useMemo(() => projections.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0), [projections]);
  const totalProjected = useMemo(() => projections.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0), [projections]);

  const handlePayTax = async (accountId: string, amount: number, alias: string) => {
      if(!confirm(`¿Liquidar obligación tributaria por valor de ${amount.toLocaleString()} Pz?`)) return;
      try {
        await payCitizenTax(accountId, amount, `Liquidación de Impuestos - ${alias}`);
        addNotification("Impuesto liquidado satisfactoriamente", "success");
        loadData();
      } catch(e: any) {
          addNotification(e.message, 'error');
      }
  };

  const handleDownloadCertificate = () => {
      generatePDF('CERTIFICADO_SITUACION_FISCAL', { 
          Titular: projections[0]?.alias || 'Usuario',
          Fecha: new Date().toLocaleDateString(),
          Deuda_Pendiente: `${totalDebt} Pz`,
          Estado: totalDebt > 0 ? 'IRREGULAR' : 'AL CORRIENTE'
      });
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Consultando Registro Fiscal SIDS...</div>;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto pb-32 font-sans animate-fade-in">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                    <Scale size={28}/>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hacienda Pública</h2>
            </div>
            <p className="text-slate-500 font-bold text-sm tracking-tight">Cálculo de Índice de Acumulación (IA) y Gravamen SIDS.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => setShowTerms(true)} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2">
                <BookOpen size={16}/> T&C Fiscales
            </button>
            <button onClick={handleDownloadCertificate} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
                <Download size={16}/> Certificado
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Deuda Tributaria</p>
              <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter">{totalDebt.toLocaleString()}</span>
                  <span className="text-sm font-bold opacity-50">Pz</span>
              </div>
              {totalDebt > 0 && <div className="mt-4 inline-flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-red-200 animate-pulse"><AlertTriangle size={12}/> Acción Requerida</div>}
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-soft">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Impuesto Proyectado</p>
              <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">{totalProjected.toLocaleString()}</span>
                  <span className="text-sm font-bold text-slate-400">Pz</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Cierre de Periodo Mensual</p>
          </div>

          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm relative overflow-hidden">
               <ShieldCheck className="absolute -bottom-4 -right-4 text-emerald-200 w-32 h-32 opacity-50"/>
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Estado Normativo</p>
               <h3 className="text-2xl font-black text-emerald-900 leading-tight">
                   {totalDebt > 0 ? "Revisión Pendiente" : "Soberanía Fiscal"}
               </h3>
          </div>
      </div>

      <div className="space-y-6">
          {projections.map(acc => {
              const ia = acc.ia || 0;
              const isHigh = ia > 0.15;

              return (
                  <div key={acc.accountId} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-soft flex flex-col lg:flex-row gap-8 items-stretch group hover:border-slate-300 transition-all">
                      <div className="flex-1">
                          <div className="flex justify-between items-start mb-6">
                              <div>
                                  <h4 className="font-black text-xl text-slate-900">{acc.alias}</h4>
                                  <p className="text-xs font-mono font-bold text-slate-400 mt-1 tracking-widest">{acc.iban}</p>
                              </div>
                              <div className="flex gap-2">
                                  <div className={`px-4 py-2 rounded-xl text-xs font-black text-center ${isHigh ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
                                      <p className="uppercase tracking-widest text-[8px] opacity-70">RIESGO IA</p>
                                      <p>{isHigh ? 'ALTO' : 'BAJO'}</p>
                                  </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowDownRight size={10}/> Ingresos</p>
                                  <p className="text-lg font-black text-slate-900">{acc.income.toLocaleString()}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowUpRight size={10}/> Gastos</p>
                                  <p className="text-lg font-black text-slate-900">{acc.expenses.toLocaleString()}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Patrimonio Medio</p>
                                  <p className="text-lg font-black text-slate-900">{acc.patrimonioMedio.toLocaleString()}</p>
                              </div>
                              <div className="bg-brand-600 p-4 rounded-2xl text-white">
                                  <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">IA Calculado</p>
                                  <p className="text-2xl font-black">{ia.toFixed(4)}</p>
                              </div>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center gap-4">
                              <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400"><Calculator size={20}/></div>
                              <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Algoritmo de Acumulación (Art. 4.9)</p>
                                  <p className="text-xs font-bold text-slate-700 mt-0.5">IA = (Media Ingresos - Media Gastos) / Patrimonio Medio | Gravamen: {(acc.taxRate * 100).toFixed(2)}%</p>
                              </div>
                          </div>
                      </div>

                      <div className={`lg:w-80 rounded-[2.5rem] p-8 flex flex-col justify-between ${acc.taxAmount > 0 ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`}>
                          <div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Impuesto Adeudado</p>
                              <p className={`text-4xl font-black tracking-tighter ${acc.taxAmount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{acc.taxAmount.toLocaleString()} <span className="text-lg opacity-40 font-bold">Pz</span></p>
                              
                              <div className="mt-8 space-y-2">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Periodo: {new Date().toLocaleString('es-ES', {month:'long'}).toUpperCase()}</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Estado: {acc.taxAmount > 0 ? 'PENDIENTE' : 'AL DÍA'}</p>
                              </div>
                          </div>

                          <button 
                              onClick={() => handlePayTax(acc.accountId, acc.taxAmount, acc.alias)}
                              disabled={acc.taxAmount === 0}
                              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${acc.taxAmount > 0 ? 'bg-red-600 text-white hover:bg-red-700 shadow-xl' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                          >
                              {acc.taxAmount > 0 ? 'Liquidar Deuda' : 'Sin Deudas'}
                          </button>
                      </div>
                  </div>
              );
          })}
      </div>
      
      {showTerms && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[500] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-scale-up relative max-h-[80vh] overflow-y-auto">
                  <button onClick={() => setShowTerms(false)} className="absolute top-10 right-10 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
                  <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Términos y Condiciones Fiscales</h3>
                  <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed space-y-6">
                      <section>
                          <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3">1. Impuesto de Regulación Monetaria (IRM)</h4>
                          <p>El IRM es un gravamen obligatorio que grava el capital estancado en el ecosistema SIDS. Su objetivo es incentivar la circulación de la moneda Peseta Digital (Pz) a través de la inversión productiva o el consumo responsable.</p>
                      </section>
                      <section>
                          <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3">2. Cálculo del Índice de Acumulación (IA)</h4>
                          <p>El IA se calcula dividiendo la diferencia entre los ingresos y gastos mensuales por el patrimonio (saldo actual del periodo). <strong>Nota importante:</strong> Los pagos realizados en concepto de impuestos NO se consideran gastos deducibles para el cálculo del IA.</p>
                      </section>
                      <section>
                          <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3">3. Acumulación Pasiva (Art. 4.9)</h4>
                          <p>Si una cuenta mantiene un saldo positivo y registra <strong>menos de 2 movimientos mensuales</strong> (excluyendo pagos de impuestos), se considerará acumulación pasiva. En este caso, se aplicará un IA mínimo ficticio de 0.05, impidiendo el acceso a los tramos bonificados o exentos, gravando la retención improductiva del capital.</p>
                      </section>
                      <section>
                          <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3">4. Liquidación y Pago</h4>
                          <p>Las obligaciones tributarias deben liquidarse antes del último día hábil del mes natural. El impago conlleva el bloqueo automático de las credenciales de transaccionabilidad PlacetaID y una penalización del 10% sobre la deuda principal.</p>
                      </section>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
