
import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, Check, CreditCard } from 'lucide-react';

interface CardDesignerProps {
  holderName: string;
  onSave: (dataUrl: string) => void;
}

const DESIGNS = [
  { id: 'midnight', name: 'Midnight', colors: ['#1e293b', '#020617'] },
  { id: 'brand', name: 'Placeta', colors: ['#5e17eb', '#2e0785'] },
  { id: 'sunset', name: 'Sunset', colors: ['#f43f5e', '#881337'] },
  { id: 'ocean', name: 'Ocean', colors: ['#06b6d4', '#155e75'] },
  { id: 'forest', name: 'Forest', colors: ['#10b981', '#064e3b'] },
  { id: 'gold', name: 'Prestige', colors: ['#fbbf24', '#78350f'] },
  { id: 'royal', name: 'Royal', colors: ['#c084fc', '#6366f1'] },
  { id: 'noir', name: 'Noir', colors: ['#333333', '#000000'] },
];

export const CardDesigner: React.FC<CardDesignerProps> = ({ holderName, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedDesign, setSelectedDesign] = useState(DESIGNS[1]); // Default to Brand

  // We render the canvas to export the image, but the user sees the HTML preview mostly.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, selectedDesign.colors[0]);
    gradient.addColorStop(1, selectedDesign.colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Add some texture/pattern (Abstract Circles) for depth
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(canvas.width, 0, canvas.height * 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.arc(0, canvas.height, canvas.height * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // 3. Chip (Standard position)
    const chipX = 50; 
    const chipY = 120;
    const chipW = 80;
    const chipH = 60;
    const r = 8;
    
    // Draw Chip Body manually to ensure compatibility
    const chipGradient = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
    chipGradient.addColorStop(0, '#e2e8f0');
    chipGradient.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = chipGradient;
    
    ctx.beginPath();
    ctx.moveTo(chipX + r, chipY);
    ctx.arcTo(chipX + chipW, chipY, chipX + chipW, chipY + chipH, r);
    ctx.arcTo(chipX + chipW, chipY + chipH, chipX, chipY + chipH, r);
    ctx.arcTo(chipX, chipY + chipH, chipX, chipY, r);
    ctx.arcTo(chipX, chipY, chipX + chipW, chipY, r);
    ctx.closePath();
    ctx.fill();
    
    // Chip Lines
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chipX, chipY + chipH * 0.33); ctx.lineTo(chipX + chipW, chipY + chipH * 0.33);
    ctx.moveTo(chipX, chipY + chipH * 0.66); ctx.lineTo(chipX + chipW, chipY + chipH * 0.66);
    ctx.moveTo(chipX + chipW * 0.5, chipY + chipH * 0.15); ctx.lineTo(chipX + chipW * 0.5, chipY + chipH * 0.85);
    ctx.stroke();

    // 4. Contactless Symbol
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    const wifiX = canvas.width - 60;
    const wifiY = canvas.height / 2;
    
    for(let i=1; i<=3; i++) {
        ctx.beginPath();
        ctx.arc(wifiX, wifiY, 12 * i, 1.2 * Math.PI, 1.8 * Math.PI, false); // Arcs facing left roughly
        ctx.stroke();
    }

  }, [selectedDesign]);

  const handleSave = () => {
      if(canvasRef.current) {
          onSave(canvasRef.current.toDataURL('image/png'));
      }
  };

  return (
    <div className="space-y-6">
      {/* Preview Area */}
      <div className="relative w-full aspect-[1.586] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
         {/* The Canvas acts as the generated image source for saving, but we show it here too */}
         <canvas 
           ref={canvasRef}
           width={600}
           height={378}
           className="w-full h-full object-cover absolute inset-0"
         />
         
         {/* HTML Overlay for crisp text preview */}
         <div className="absolute inset-0 p-6 flex flex-col justify-between select-none text-white/90 z-10">
             <div className="flex justify-between items-start">
                 <div className="font-bold tracking-widest opacity-50 text-sm flex items-center gap-1">
                    <CreditCard size={16}/> PL BANK
                 </div>
                 <div className="font-bold tracking-widest italic opacity-80 text-xs border border-white/30 px-2 py-0.5 rounded">DEBIT</div>
             </div>
             
             <div>
                 <div className="mb-4 opacity-90 drop-shadow-md">
                    <div className="text-xl tracking-[0.15em] font-mono">•••• •••• •••• 1234</div>
                 </div>
                 <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[9px] font-bold opacity-70 uppercase mb-0.5">Titular</p>
                        <p className="text-sm font-bold uppercase tracking-wide text-white drop-shadow-sm">{holderName || 'TU NOMBRE'}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-bold opacity-70 uppercase mb-0.5">Válida</p>
                        <p className="text-sm font-bold tracking-wider">12/30</p>
                     </div>
                 </div>
             </div>
         </div>
         
         {/* Gloss effect */}
         <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none z-20"></div>
      </div>

      {/* Controls */}
      <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Elige tu estilo</h4>
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">{DESIGNS.length} opciones</span>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
              {DESIGNS.map(design => (
                  <button 
                    key={design.id}
                    onClick={() => setSelectedDesign(design)}
                    className={`aspect-square rounded-2xl relative overflow-hidden transition-all duration-300 group ${selectedDesign.id === design.id ? 'ring-4 ring-brand-500 ring-offset-2 scale-95 shadow-inner' : 'hover:scale-105 hover:shadow-lg'}`}
                  >
                      <div 
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(to bottom right, ${design.colors[0]}, ${design.colors[1]})` }}
                      ></div>
                      {selectedDesign.id === design.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                              <Check className="text-white w-6 h-6 drop-shadow-lg" strokeWidth={4} />
                          </div>
                      )}
                      <span className="absolute bottom-0 left-0 right-0 p-1 text-[9px] text-center font-bold text-white/90 uppercase tracking-wider bg-black/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          {design.name}
                      </span>
                  </button>
              ))}
          </div>
      </div>

      <button 
        onClick={handleSave}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:bg-brand-600 transition-all flex items-center justify-center gap-2 group active:scale-95"
      >
          <Sparkles size={20} className="text-yellow-400 group-hover:animate-spin-slow" />
          Solicitar Tarjeta
      </button>
    </div>
  );
};
