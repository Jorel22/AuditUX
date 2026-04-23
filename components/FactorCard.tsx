export function FactorCard({ factorStr, semaforo, onOpen }: { factorStr: string, semaforo: string, onOpen: (parsed: any) => void }) {
  const match = factorStr.match(/^(?:\*\*)?(.*?)(?:\*\*)?:\s*(.*)$/);
  const title = match ? match[1].replace(/\*\*/g, '').trim() : "Factor detectado";
  const desc = match ? match[2].trim() : factorStr.trim();

  const sentences = desc.split(/(?<=\.)\s+/).filter(Boolean).slice(0, 3);
  if (sentences.length === 0) sentences.push(desc);

  const isBajo = semaforo === 'bajo';
  const isMedio = semaforo === 'medio';
  const iconColor = isBajo ? 'text-green-500' : isMedio ? 'text-yellow-500' : 'text-red-500';
  const borderColor = isBajo ? 'border-green-200' : isMedio ? 'border-yellow-200' : 'border-red-200';
  const bgColor = isBajo ? 'bg-green-50' : isMedio ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-xl border shadow-sm ${bgColor} ${borderColor}`}>
      <div className="flex items-center gap-2">
        <svg className={`w-4 h-4 flex-shrink-0 ${iconColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h4 className="font-bold text-slate-800 text-xs truncate" title={title}>{title}</h4>
      </div>
      <ul className="print:hidden list-disc list-inside text-slate-600 text-[11px] space-y-1 line-clamp-3 overflow-hidden ml-1">
        {sentences.map((s, i) => <li key={i} className="truncate">{s}</li>)}
      </ul>
      <div className="hidden print:block text-slate-600 text-[11px] ml-1 mt-1">
        {desc}
      </div>
      <button
        onClick={() => onOpen({ title, original: factorStr, semaforo })}
        className="print:hidden text-[#0ba5e9] hover:text-[#0284c7] text-[10px] font-semibold mt-1 text-left flex items-center gap-1 transition-colors w-fit"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        Ver análisis completo
      </button>
    </div>
  );
}
