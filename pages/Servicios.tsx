
import React from 'react';
import { 
  ShieldCheck, CreditCard, Landmark, 
  Briefcase, Zap, HelpCircle, ArrowRight,
  CheckCircle2, Info, Clock
} from 'lucide-react';

export const Servicios: React.FC = () => {
  const administrativeServices = [
    {
      id: 'id-digital',
      title: 'Identidad Digital SIDS',
      icon: ShieldCheck,
      description: 'Gestión y validación de su identidad digital soberana para acceso a servicios estatales.',
      requirements: ['DIP válido', 'Fecha de nacimiento verificada', 'Residencia en La Placeta'],
      process: 'Solicitud vía Sede Electrónica -> Validación por la Junta -> Emisión de credenciales.',
      benefits: ['Acceso universal a servicios', 'Seguridad criptográfica', 'Portabilidad de datos'],
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'cuentas',
      title: 'Gestión de Cuentas',
      icon: Landmark,
      description: 'Apertura y mantenimiento de cuentas ciudadanas e institucionales.',
      requirements: ['Mayoría de edad (o tutor legal)', 'Validación SIDS'],
      process: 'Elección de tipo de cuenta -> Aceptación de términos -> Activación inmediata.',
      benefits: ['Sin comisiones de mantenimiento', 'Transferencias instantáneas', 'Interoperabilidad total'],
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 'tarjetas',
      title: 'Emisión de Tarjetas',
      icon: CreditCard,
      description: 'Solicitud de tarjetas físicas y virtuales para pagos en comercios.',
      requirements: ['Cuenta activa', 'Saldo mínimo de 50 Pz'],
      process: 'Solicitud en sección Cartera -> Diseño personalizado -> Envío a domicilio o activación virtual.',
      benefits: ['Pagos seguros', 'Control de gastos en tiempo real', 'Diseños exclusivos'],
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      id: 'empresas',
      title: 'Servicios Empresariales',
      icon: Briefcase,
      description: 'Constitución de sociedades y gestión de nóminas estatales.',
      requirements: ['Plan de negocio aprobado', 'Capital social mínimo', 'DIP de administrador'],
      process: 'Registro mercantil -> Apertura de cuenta empresa -> Alta de empleados.',
      benefits: ['Gestión simplificada', 'Acceso a subvenciones', 'Integración con el Market'],
      color: 'bg-slate-900 text-white'
    }
  ];

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto pb-48 font-sans animate-fade-in">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Zap size={24} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Servicios <span className="text-brand-600">Administrativos</span></h1>
        </div>
        <p className="text-slate-500 font-bold max-w-2xl leading-relaxed">
          Explore el catálogo completo de servicios ofrecidos por el Banco de La Placeta. 
          Gestione su identidad, sus finanzas y su actividad empresarial con total transparencia y seguridad.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {administrativeServices.map((service) => (
          <div key={service.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden group hover:border-brand-200 transition-all duration-300">
            <div className="p-8 md:p-10">
              <div className="flex items-start justify-between mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${service.color}`}>
                  <service.icon size={32} />
                </div>
                <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-brand-50 hover:text-brand-600 transition-all">
                  <ArrowRight size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{service.title}</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">{service.description}</p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info size={12} /> Requisitos
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {service.requirements.map((req, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock size={12} /> Proceso
                  </h4>
                  <p className="text-xs font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                    {service.process}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle2 size={12} /> Beneficios
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {service.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-16 bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] -ml-32 -mb-32"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/10">
            <HelpCircle size={32} className="text-brand-400" />
          </div>
          <h2 className="text-4xl font-black mb-6 tracking-tight italic">¿Necesita ayuda personalizada?</h2>
          <p className="text-slate-400 font-bold text-lg mb-10 leading-relaxed">
            Nuestro equipo de atención al ciudadano está disponible para resolver cualquier duda sobre los procesos administrativos o financieros.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-500 transition-all shadow-xl shadow-brand-600/20 active:scale-95">
              Contactar Soporte
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/20 transition-all active:scale-95">
              Preguntas Frecuentes
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
