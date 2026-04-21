"use client";

import { useState, useEffect } from "react";
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

interface HistoryItem {
  _id: string;
  url: string;
  result: AnalysisData;
  createdAt: string;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [pendingUrl, setPendingUrl] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const storedPasscode = sessionStorage.getItem("app_passcode");
    if (storedPasscode) {
      setPasscode(storedPasscode);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    try {
      const p = passcode || sessionStorage.getItem("app_passcode");
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: p }),
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error("Error fetching history");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        sessionStorage.setItem("app_passcode", passcode);
        setIsAuthenticated(true);
      } else {
        const data = await res.json();
        setAuthError(data.error || "Código de acceso incorrecto.");
      }
    } catch (err: any) {
      setAuthError("Error de conexión al verificar el código.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("app_passcode");
    setIsAuthenticated(false);
    setPasscode("");
    setResult(null);
    setHistory([]);
  };

  const executeAnalysis = async (targetUrl: string) => {
    setSubmittedUrl(targetUrl);
    setLoading(true);
    setResult(null);
    setError(null);
    setShowModal(false);

    try {
      const p = passcode || sessionStorage.getItem("app_passcode");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, passcode: p }),
      });

      const data = await res.json();

      if (res.status === 401) {
        handleLogout();
        setError(data.error || "Código de acceso incorrecto. Por favor, ingréselo nuevamente.");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Ocurrió un error al analizar la URL.");
      } else {
        setResult(data.result);
        fetchHistory(); // Refresh history
      }
    } catch (err: any) {
      setError(err.message || "Error de red al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInput = normalizeUrl(url);
    const existingMatchedItem = history.find(h => normalizeUrl(h.url) === normalizedInput);
    if (existingMatchedItem) {
      setPendingUrl(existingMatchedItem.url);
      setShowModal(true);
    } else {
      executeAnalysis(url);
    }
  };

  const loadExistingResult = () => {
    const existingMatchedItem = history.find(h => h.url === pendingUrl);
    if (existingMatchedItem) {
      setResult(existingMatchedItem.result);
      setSubmittedUrl(pendingUrl);
      setUrl(pendingUrl);
      setError(null);
    }
    setShowModal(false);
  };

  const normalizeUrl = (urlStr: string) => {
    try {
      let clean = urlStr.trim().toLowerCase();
      clean = clean.replace(/^https?:\/\//, '');
      clean = clean.replace(/^www\./, '');
      clean = clean.replace(/\/$/, '');
      return clean;
    } catch (e) {
      return urlStr;
    }
  };

  const groupedHistory = history.reduce((acc, current) => {
    const normalized = normalizeUrl(current.url);
    if (!acc[normalized]) acc[normalized] = [];
    acc[normalized].push(current);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#e9eff5] text-slate-900 font-sans flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold italic text-xl">
              U
            </div>
            <span className="font-bold text-2xl tracking-tight">AuditUX</span>
          </div>
          <h2 className="text-xl font-bold text-center mb-6 text-slate-800">Acceso Restringido</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label htmlFor="passcode" className="block text-sm font-medium text-slate-700 mb-1">
                Código de Acceso
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                placeholder="Ingresa la clave secreta"
                required
              />
            </div>
            {authError && <p className="text-red-500 text-sm font-medium text-center">{authError}</p>}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-[#0ba5e9] hover:bg-[#0284c7] text-white py-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#e9eff5] text-slate-900 font-sans flex flex-col print:bg-white overflow-hidden print:h-auto print:overflow-visible">
      {/* Header */}
      <header className="print:hidden flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md z-10 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold italic">
            U
          </div>
          <span className="font-bold text-xl tracking-tight">AuditUX</span>
        </div>
        <button onClick={handleLogout} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          Cerrar Sesión
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        {/* Left Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 overflow-y-auto hidden md:block print:hidden shadow-sm z-0 relative">
          <div className="p-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Historial de Auditorías</h2>
            
            <div className="flex flex-col gap-4">
              {Object.keys(groupedHistory).length === 0 && (
                <div className="text-sm text-slate-500 italic px-2">No hay historial aún.</div>
              )}
              {Object.entries(groupedHistory).map(([site, items]) => (
                <div key={site} className="flex flex-col gap-1">
                   <div title={site} className="font-semibold text-slate-700 text-sm mb-1 truncate px-2">{site}</div>
                   {items.map((item) => (
                     <button
                        key={item._id}
                        onClick={() => {
                          setResult(item.result);
                          setUrl(item.url);
                          setSubmittedUrl(item.url);
                          setError(null);
                        }}
                        className={`text-left px-3 py-2 text-xs rounded-lg transition-colors border ${
                           result === item.result ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                        }`}
                     >
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.result.puntaje_global >= 80 ? 'bg-green-500' : item.result.puntaje_global >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                       </div>
                     </button>
                   ))}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center pt-8 md:pt-12 px-4 sm:px-6 print:pt-0 print:px-0 overflow-y-auto print:overflow-visible relative pb-20 print:pb-0">
          {/* Stepper Mock */}
          <div className="print:hidden hidden sm:flex items-center gap-4 text-sm font-medium text-slate-500 mb-8 md:mb-12">
            <span className="text-slate-900">1. Ingresar URL</span>
            <div className="w-16 h-[1px] bg-slate-300"></div>
            <span>2. Analizar</span>
            <div className="w-16 h-[1px] bg-slate-300"></div>
            <span>3. Resultados</span>
          </div>

          <h1 className="print:hidden text-3xl sm:text-4xl font-bold mb-8 tracking-tight text-center">
            INICIAR ANÁLISIS
          </h1>

          <div className="print:hidden w-full max-w-3xl mb-8">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center w-full bg-white rounded-xl shadow-sm border border-slate-200 p-1 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all"
            >
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
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
            <div className="w-full max-w-5xl flex flex-col gap-4 print:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="print:hidden flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 mb-2">
                <span className="text-slate-500 font-medium text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.247 1.856a.5.5 0 0 1-.494.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/></svg>
                  Resultados para: <span className="text-slate-800 font-bold">{submittedUrl}</span>
                </span>
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
                <h2 className="text-xl font-bold mb-6 text-slate-800">Carga Cognitiva</h2>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col items-center hover:shadow-md transition-shadow">
                  
                  <div className="flex w-full justify-between items-center mb-8">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Puntaje General</span>
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
                      <span className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Heurísticas</span>
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
                      <span className="font-semibold text-sm text-slate-700">Carga Cognitiva</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${result.carga_cognitiva.semaforo === 'bajo' ? 'bg-green-100 text-green-700' : result.carga_cognitiva.semaforo === 'medio' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'} uppercase tracking-wide`}>
                        {result.carga_cognitiva.semaforo === 'bajo' ? 'Baja' : result.carga_cognitiva.semaforo === 'medio' ? 'Media' : 'Alta'}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div className={`h-full transition-all duration-1000 ease-out ${result.carga_cognitiva.semaforo === 'bajo' ? 'bg-green-500' : result.carga_cognitiva.semaforo === 'medio' ? 'bg-orange-400' : 'bg-red-500'}`} style={{ width: `${result.carga_cognitiva.nivel_esfuerzo}%` }}></div>
                    </div>
                    {result.carga_cognitiva.factores && (
                       <ul className="text-xs text-slate-600 mt-2 list-disc pl-4 space-y-1">
                          {result.carga_cognitiva.factores.map((f, i) => <li key={i}>{f}</li>)}
                       </ul>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
          )}
        </main>
      </div>

      {/* Duplicate URL Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Sitio ya analizado</h3>
              <p className="text-slate-600 text-sm mb-6">
                Hemos encontrado que <strong>{pendingUrl}</strong> ya se encuentra en el historial de auditorías. ¿Qué deseas hacer?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={loadExistingResult}
                  className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                >
                  Revisar existente
                </button>
                <button
                  onClick={() => executeAnalysis(pendingUrl)}
                  className="flex-1 bg-[#0ba5e9] hover:bg-[#0284c7] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
                >
                  Repetir análisis
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
