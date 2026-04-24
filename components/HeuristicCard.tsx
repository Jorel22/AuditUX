import { useState } from "react";

export function HeuristicCard({ h }: { h: any }) {
  const [expanded, setExpanded] = useState(false);
  
  const estadoCalculado = h.estado || (h.puntuacion >= 8 ? 'pasa' : h.puntuacion >= 6 ? 'advertencia' : 'falla');
  
  const badgeConfig =
    estadoCalculado === 'pasa' ? { color: 'bg-green-50 text-green-700 border-green-200', text: 'Cumple' } :
      estadoCalculado === 'advertencia' ? { color: 'bg-orange-50 text-orange-700 border-orange-200', text: 'Advertencia' } :
        { color: 'bg-red-50 text-red-700 border-red-200', text: 'Falla' };

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex items-start justify-between mb-4 gap-3">
        <h3 className="font-bold text-slate-800 text-sm leading-snug">{h.nombre}</h3>
        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${badgeConfig.color} flex-shrink-0 uppercase tracking-widest`}>
          {badgeConfig.text} • {h.puntuacion * 10}/100
        </span>
      </div>
      <div className={`text-slate-600 text-sm leading-relaxed flex-grow print:line-clamp-none print:overflow-visible ${expanded ? '' : 'line-clamp-3'} overflow-hidden`}>
        {h.comentario}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="print:hidden text-[#0ba5e9] hover:text-[#0284c7] text-xs font-semibold mt-4 text-left w-fit transition-colors flex items-center gap-1"
      >
        {expanded ? (
          <><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg> Ver menos</>
        ) : (
          <><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg> Ver análisis completo</>
        )}
      </button>
    </div>
  );
}
