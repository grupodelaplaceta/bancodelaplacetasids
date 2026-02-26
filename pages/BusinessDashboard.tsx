
import React, { useState, useMemo, useCallback } from 'react';
import { useBank } from '../context/useBank';
import { BusinessSidebar } from '../components/BusinessSidebar';
import { BusinessMobileNavbar } from '../components/BusinessMobileNavbar';
import { 
  Users, 
  X, Building2, 
  Zap, CheckCircle2, 
  Download,
  Edit3, Eye, ShieldCheck, Calendar
} from 'lucide-react';
import { Employee } from '../types';

const getPayrollTaxRate = (salary: number) => {
  if (salary <= 1700) return 0.075;
  if (salary <= 3000) return 0.105;
  return 0.175;
};

export const BusinessDashboard: React.FC<{ onSwitchView: () => void }> = ({ onSwitchView }) => {
  const { 
    currentUser, companies, payPayroll, updateEmployees, 
    userAccounts, addNotification, generatePDF, triggerHaptic
  } = useBank();
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState('OVERVIEW');
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [previewEmployee, setPreviewEmployee] = useState<any | null>(null);
  const [payrollPeriod, setPayrollPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  const selectedCompany = useMemo(() => companies.find(c => c.id === selectedCompanyId), [companies, selectedCompanyId]);
  const myCompanies = useMemo(() => companies.filter(c => c.ownerId === currentUser?.id), [companies, currentUser]);
  
  const companyAccounts = useMemo(() => {
      if(!selectedCompany) return [];
      return userAccounts.filter(a => a.companyId === selectedCompany.id || a.iban === selectedCompany.iban);
  }, [userAccounts, selectedCompany]);

  const totalBalance = useMemo(() => companyAccounts.reduce((acc, curr) => acc + parseFloat(curr.balance.toString()), 0), [companyAccounts]);

  const getEmpDetails = useCallback((emp: Employee) => {
    const salary = parseFloat(emp.salary.toString());
    const rate = getPayrollTaxRate(salary);
    const tax = salary * rate;
    return {
        ...emp,
        salary,
        taxRate: (rate * 100).toFixed(1),
        neto: salary - tax,
        taxAmount: tax,
        companyCost: salary + tax
    };
  }, []);

  const payrollDetails = useMemo(() => {
    if(!selectedCompany?.employees) return [];
    const empList = Array.isArray(selectedCompany.employees) ? selectedCompany.employees : [];
    return empList
      .filter(e => e.status === 'ACTIVE' || !e.status)
      .map(emp => getEmpDetails(emp));
  }, [selectedCompany, getEmpDetails]);

  const payrollTotalCost = useMemo(() => payrollDetails.reduce((acc, curr) => acc + curr.companyCost, 0), [payrollDetails]);

  const handleUpdateSalary = async (empId: string, newSalary: number) => {
      if(!selectedCompany) return;
      if(newSalary < 600) { addNotification("SMI mínimo legal: 600 Pz", "error"); return; }
      const updated = selectedCompany.employees.map(e => e.id === empId ? { ...e, salary: newSalary } : e);
      await updateEmployees(selectedCompany.id, updated);
      setEditingEmployeeId(null);
      addNotification("Sueldo actualizado en el contrato digital", "success");
  };

  const handlePayIndividual = async () => {
      if(!selectedCompany || !previewEmployee) return;
      try {
          await payPayroll(selectedCompany.id, payrollPeriod.month.toString(), payrollPeriod.year.toString(), previewEmployee.id);
          addNotification(`Nómina de ${previewEmployee.name} emitida y firmada`, "success");
          setPreviewEmployee(null);
          triggerHaptic('success');
      } catch(e: any) { addNotification(e.message, 'error'); }
  };

  const handleMassPayroll = async () => {
      if(!selectedCompany || payrollDetails.length === 0) return;
      if(!confirm(`¿Liquidar ${payrollDetails.length} nóminas masivamente? Coste total: ${payrollTotalCost.toLocaleString()} Pz`)) return;
      try {
          const res = await payPayroll(selectedCompany.id, payrollPeriod.month.toString(), payrollPeriod.year.toString());
          addNotification(`Procesadas ${res.count} nóminas correctamente`, "success");
          setShowPayrollModal(false);
          triggerHaptic('success');
      } catch(e: any) { addNotification(e.message, 'error'); }
  };

  const downloadIndividualPDF = (emp: any) => {
      const details = getEmpDetails(emp);
      generatePDF('RECIBO_NOMINA_INDIVIDUAL', {
          companyName: selectedCompany?.name,
          employeeName: details.name,
          period: `${payrollPeriod.month}/${payrollPeriod.year}`,
          bruto: details.salary,
          rate: details.taxRate,
          neto: details.neto
      });
  };

  if (!selectedCompany) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 animate-fade-in font-sans">
        <div className="max-w-5xl w-full text-center">
            <img src="https://i.postimg.cc/s2s2RdgX/BANCO-DE.png" className="h-12 mx-auto mb-8 opacity-90" alt="Logo" />
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter italic">Corporate <span className="text-indigo-600">Ledger</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                {myCompanies.map(c => (
                    <button key={c.id} onClick={() => setSelectedCompanyId(c.id)} className="bg-white p-10 rounded-[2.5rem] shadow-xl text-left group hover:-translate-y-1 transition-all border border-transparent hover:border-indigo-100">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-6 shadow-lg ${c.isPublic ? 'bg-indigo-600' : 'bg-slate-900'}`}>{c.name.charAt(0)}</div>
                        <h3 className="font-black text-xl text-slate-900 truncate mb-1">{c.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.nif}</p>
                    </button>
                ))}
            </div>
            <button onClick={onSwitchView} className="mt-16 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors bg-white px-6 py-3 rounded-full shadow-sm">Volver a Banca Personal</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex w-full font-sans overflow-x-hidden">
        <BusinessSidebar selectedCompany={selectedCompany} myCompanies={myCompanies} currentView={currentView} setView={setCurrentView} onSelectCompany={setSelectedCompanyId} onSwitchToPersonal={onSwitchView} onLogout={onSwitchView} />
        <BusinessMobileNavbar currentView={currentView} setView={setCurrentView} isPublic={selectedCompany.isPublic} companyName={selectedCompany.name} onSwitchToPersonal={onSwitchView} onBackToCompanies={() => setSelectedCompanyId(null)} />
        
        <main className="flex-1 md:ml-72 p-6 md:p-12 pb-40 overflow-y-auto w-full">
            {currentView === 'OVERVIEW' && (
                <div className="space-y-10 animate-fade-in max-w-7xl mx-auto">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2"><span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg tracking-widest shadow-lg">Entidad Certificada SIDS</span><h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter italic">{selectedCompany.name}</h2></div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Building2 size={12}/> CIF: {selectedCompany.nif} • IBAN: {selectedCompany.iban}</p>
                        </div>
                        <div className="text-right bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-xl w-full md:w-auto"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tesorería Corporativa</p><div className="flex items-baseline gap-2 justify-end"><span className="text-3xl md:text-5xl font-black text-slate-950 tracking-tighter">{totalBalance.toLocaleString()}</span><span className="text-xl text-slate-300 font-black">Pz</span></div></div>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div onClick={() => setCurrentView('EMPLOYEES')} className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 hover:shadow-lg transition-all cursor-pointer group">
                            <Users size={32} className="text-indigo-600 mb-4 group-hover:scale-110 transition-transform"/>
                            <h3 className="font-black text-xl text-indigo-900 uppercase text-xs">Gestión de Personal</h3>
                            <p className="text-sm font-bold text-indigo-400 mt-2">{(selectedCompany.employees || []).length} Empleados Activos</p>
                        </div>
                    </div>
                </div>
            )}

            {currentView === 'EMPLOYEES' && (
                <div className="space-y-10 animate-fade-in max-w-7xl mx-auto">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div><h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Planilla de Trabajadores</h2><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Liquidación técnica de salarios bajo protocolo SIDS</p></div>
                        <button onClick={() => setShowPayrollModal(true)} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-brand-600 transition-all"><Zap size={16} fill="currentColor"/> Liquidación Masiva</button>
                    </header>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                                <tr><th className="p-6">Colaborador</th><th className="p-6">Posición</th><th className="p-6">Sueldo Bruto (Pz)</th><th className="p-6">Neto Estimado</th><th className="p-6 text-right pr-10">Firma</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                                {Array.isArray(selectedCompany.employees) && selectedCompany.employees.map(emp => {
                                    const details = getEmpDetails(emp);
                                    return (
                                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-6"><p className="font-black text-slate-800">{emp.name}</p><p className="text-[9px] font-mono text-slate-400 uppercase">{emp.dip}</p></td>
                                            <td className="p-6"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg">{emp.role}</span></td>
                                            <td className="p-6">
                                                {editingEmployeeId === emp.id ? (
                                                    <input type="number" defaultValue={emp.salary} onBlur={(e) => handleUpdateSalary(emp.id, parseFloat(e.target.value))} autoFocus className="w-24 p-2 bg-white border-2 border-indigo-600 rounded-lg font-black text-sm outline-none" />
                                                ) : (
                                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditingEmployeeId(emp.id)}>
                                                        <span className="font-black text-slate-900">{emp.salary.toLocaleString()}</span>
                                                        <Edit3 size={12} className="text-slate-300"/>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-6 font-black text-emerald-600">{details.neto.toLocaleString()} Pz</td>
                                            <td className="p-6 text-right pr-10">
                                                <button onClick={() => setPreviewEmployee(emp)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 ml-auto shadow-sm">
                                                    <Eye size={14}/> Ver Recibo
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PREVIEW INDIVIDUAL MODAL */}
            {previewEmployee && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[600] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative animate-scale-up border border-white/50">
                        <button onClick={() => setPreviewEmployee(null)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900"><X size={20}/></button>
                        <h3 className="text-3xl font-black text-slate-900 mb-8 italic tracking-tight">Liquidación de Haberes</h3>
                        <div className="space-y-6">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <div className="flex justify-between items-center mb-4"><p className="text-[10px] font-black text-slate-400 uppercase">Trabajador</p><p className="font-black text-slate-900">{previewEmployee.name}</p></div>
                                <div className="flex justify-between items-center mb-4"><p className="text-[10px] font-black text-slate-400 uppercase">Salario Bruto</p><p className="font-black text-slate-900">{previewEmployee.salary.toLocaleString()} Pz</p></div>
                                <div className="flex justify-between items-center mb-4 border-t border-slate-200 pt-4"><p className="text-[10px] font-black text-emerald-600 uppercase">A Percibir (Neto)</p><p className="font-black text-2xl text-emerald-600">{getEmpDetails(previewEmployee).neto.toLocaleString()} Pz</p></div>
                                <div className="flex justify-between items-center"><p className="text-[10px] font-black text-indigo-500 uppercase">Cargo Tesorería (Tasas inc)</p><p className="font-bold text-indigo-500">{getEmpDetails(previewEmployee).companyCost.toLocaleString()} Pz</p></div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => downloadIndividualPDF(previewEmployee)} className="flex-1 py-5 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-3">
                                    <Download size={18}/> Descargar PDF
                                </button>
                                <button onClick={handlePayIndividual} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                                    <ShieldCheck size={18}/> Firmar Pago
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MASS PAYROLL MODAL */}
            {showPayrollModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[500] flex items-center justify-center p-4 md:p-6 animate-fade-in">
                    <div className="bg-white w-full max-w-5xl rounded-[3rem] p-10 md:p-14 shadow-2xl relative animate-scale-up max-h-[90vh] flex flex-col">
                        <button onClick={() => setShowPayrollModal(false)} className="absolute top-10 right-10 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900"><X size={20}/></button>
                        <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
                            <div><h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">Liquidación Global</h3><p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mt-1">Previsualización de cargo masivo para {payrollDetails.length} colaboradores</p></div>
                            <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                <Calendar size={18} className="text-slate-400 ml-2"/>
                                <select className="bg-transparent font-black text-xs outline-none" value={payrollPeriod.month} onChange={e=>setPayrollPeriod({...payrollPeriod, month: parseInt(e.target.value)})}>
                                    {[...Array(12)].map((_, i) => <option key={i} value={i+1}>{new Date(0, i).toLocaleString('es', {month: 'long'}).toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto mb-12 border border-slate-50 rounded-[2.5rem] custom-scrollbar shadow-inner">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest sticky top-0 z-10">
                                    <tr><th className="p-6 pl-10">Nombre</th><th className="p-6">Bruto</th><th className="p-6">Neto Colab.</th><th className="p-6">Tasas SIDS (E+T)</th><th className="p-6 text-right pr-10">Coste Entidad</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-xs font-medium">
                                    {payrollDetails.map(det => (
                                        <tr key={det.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6 pl-10"><p className="font-black text-slate-800">{det.name}</p><p className="text-[9px] font-mono text-slate-400 uppercase">{det.role}</p></td>
                                            <td className="p-6 font-bold text-slate-400">{det.salary.toLocaleString()} Pz</td>
                                            <td className="p-6 font-black text-emerald-600">{det.neto.toLocaleString()} Pz</td>
                                            <td className="p-6 font-black text-indigo-500">{(det.taxAmount * 2).toLocaleString()} Pz</td>
                                            <td className="p-6 text-right pr-10 font-black text-slate-950">{det.companyCost.toLocaleString()} Pz</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="p-10 bg-slate-950 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Total Cargo Tesorería</p>
                                <p className="text-4xl font-black tracking-tighter">{payrollTotalCost.toLocaleString()} <span className="text-sm font-bold opacity-30">Pz</span></p>
                            </div>
                            <div className="p-10 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] flex flex-col justify-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Salarios Netos</p>
                                <p className="text-2xl font-black text-emerald-900">{payrollDetails.reduce((a,c)=>a+c.neto,0).toLocaleString()} Pz</p>
                            </div>
                            <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] flex flex-col justify-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Tasas Seguridad Social</p>
                                <p className="text-2xl font-black text-indigo-900">{payrollDetails.reduce((a,c)=>a+(c.taxAmount*2),0).toLocaleString()} Pz</p>
                            </div>
                        </div>
                        <button onClick={handleMassPayroll} className="w-full py-6 bg-brand-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl hover:bg-brand-500 transition-all active:scale-95 flex items-center justify-center gap-4">
                            <CheckCircle2 size={24}/> Confirmar Firma Masiva
                        </button>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};
