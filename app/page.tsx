"use client";

import { useState } from "react";
import Image from "next/image";

interface AnalysisData {
  evaluacion_heuristicas: {
    nombre: string;
    estado: "pasa" | "advertencia" | "falla";
    puntuacion: number;
    comentario: string;
  }[];
  carga_cognitiva: {
    nivel_esfuerzo: number;
    semaforo: "bajo" | "medio" | "alto";
    factores: string[];
  };
  puntaje_global: number;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedUrl(url);
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error al analizar la URL.");
      } else {
        setResult(data.result);
      }
    } catch (err: any) {
      setError(err.message || "Error de red al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e9eff5] text-slate-900 font-sans flex flex-col print:bg-white">
      {/* Header mock */}
      <header className="print:hidden flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {/* Simple logo placeholder */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold italic">
            U
          </div>
          <span className="font-bold text-xl tracking-tight">AuditUX</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          </svg>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-24 px-4 sm:px-6 print:pt-0 print:px-0">
        {/* Stepper Mock (Visual only for now) */}
        <div className="print:hidden hidden sm:flex items-center gap-4 text-sm font-medium text-slate-500 mb-12">
          <span className="text-slate-900">1. Ingresar URL</span>
          <div className="w-16 h-[1px] bg-slate-300"></div>
          <span>2. Analizar</span>
          <div className="w-16 h-[1px] bg-slate-300"></div>
          <span>3. Resultados</span>
        </div>

        <h1 className="print:hidden text-3xl sm:text-4xl font-bold mb-8 tracking-tight">
          INICIAR ANÁLISIS
        </h1>

        <div className="print:hidden w-full max-w-3xl mb-8">
          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center w-full bg-white rounded-xl shadow-sm border border-slate-200 p-1 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all"
          >
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/login"
              className="flex-1 min-w-0 bg-transparent px-4 py-3 outline-none text-slate-700 placeholder:text-slate-400 text-lg"
              required
            />
            <button
              type="submit"
              className="bg-[#0ba5e9] hover:bg-[#0284c7] text-white px-6 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-colors whitespace-nowrap"
            >
              Ejecutar Evaluación
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-3xl flex items-center justify-center gap-3 text-blue-600 font-medium animate-pulse bg-blue-50 p-6 rounded-xl border border-blue-100">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analizando heurísticas de Nielsen con IA, espera un momento...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="w-full max-w-3xl p-6 bg-red-50 text-red-700 border border-red-200 rounded-xl">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {/* Dashboard Results */}
        {result && !loading && (
          <div className="w-full max-w-6xl flex flex-col gap-4 pb-16 print:pb-0">
            <div className="print:hidden flex justify-end">
              <button 
                onClick={() => window.print()} 
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Exportar a PDF
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-[#e9eff5] p-2 rounded-xl print:m-0 print:p-0 print:bg-transparent">
              {/* Left Column: Heuristics */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-bold mb-6 text-slate-800">Reporte de Heurísticas de Nielsen</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.evaluacion_heuristicas.map((h, i) => (
                  <div key={i} className="bg-slate-200/50 backdrop-blur-sm border border-slate-300/50 p-5 rounded-2xl hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                       <h3 className="font-bold text-slate-800 text-sm leading-tight pr-4">{h.nombre}</h3>
                       <span className={`flex-shrink-0 w-3 h-3 rounded-full ${h.estado === 'pasa' ? 'bg-green-500' : h.estado === 'advertencia' ? 'bg-yellow-500' : 'bg-red-500'}`} title={h.estado}></span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {h.comentario}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Key Insights */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold mb-6 text-slate-800">Cognitive Load & Key Insights</h2>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col items-center hover:shadow-md transition-shadow">
                
                <div className="flex w-full justify-between items-center mb-8">
                   <div className="flex flex-col items-center">
                     <span className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Overall Score</span>
                     <div className="relative w-28 h-28 flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                         <circle cx="50" cy="50" r="40" stroke="#0ea5e9" strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * result.puntaje_global / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                       </svg>
                       <div className="absolute text-3xl font-black text-slate-800 tracking-tighter">
                         {result.puntaje_global}<span className="text-base text-slate-400 font-medium">/100</span>
                       </div>
                     </div>
                   </div>

                   <div className="flex flex-col items-center">
                     <span className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Heuristic Passes</span>
                     <div className="relative w-28 h-28 flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                         <circle cx="50" cy="50" r="40" stroke="#22c55e" strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (result.evaluacion_heuristicas.filter(h => h.estado === 'pasa').length / 5))} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                       </svg>
                       <div className="absolute text-2xl font-bold text-slate-800">
                         {result.evaluacion_heuristicas.filter(h => h.estado === 'pasa').length}<span className="text-base text-slate-400 font-medium">/5</span>
                       </div>
                     </div>
                   </div>
                </div>

                <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-sm text-slate-700">Cognitive Load</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${result.carga_cognitiva.semaforo === 'bajo' ? 'bg-green-100 text-green-700' : result.carga_cognitiva.semaforo === 'medio' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'} uppercase tracking-wide`}>
                      {result.carga_cognitiva.semaforo === 'bajo' ? 'Low' : result.carga_cognitiva.semaforo === 'medio' ? 'Moderate' : 'High'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                     <div className={`h-full transition-all duration-1000 ease-out ${result.carga_cognitiva.semaforo === 'bajo' ? 'bg-green-500' : result.carga_cognitiva.semaforo === 'medio' ? 'bg-orange-400' : 'bg-red-500'}`} style={{ width: `${result.carga_cognitiva.nivel_esfuerzo}%` }}></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
