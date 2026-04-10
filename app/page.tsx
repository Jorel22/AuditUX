"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedUrl(url);
  };

  return (
    <div className="min-h-screen bg-[#e9eff5] text-slate-900 font-sans flex flex-col">
      {/* Header mock */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-200">
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

      <main className="flex-1 flex flex-col items-center pt-24 px-4 sm:px-6">
        {/* Stepper Mock (Visual only for now) */}
        <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-500 mb-12">
          <span className="text-slate-900">1. Ingresar URL</span>
          <div className="w-16 h-[1px] bg-slate-300"></div>
          <span>2. Analizar</span>
          <div className="w-16 h-[1px] bg-slate-300"></div>
          <span>3. Resultados</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-8 tracking-tight">
          INICIAR ANÁLISIS
        </h1>

        <div className="w-full max-w-2xl">
          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center w-full bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-8 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all"
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

          {/* Results Output (Plain text for now) */}
          {submittedUrl && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold mb-4">Análisis en progreso (Simulación)</h2>
              <p className="text-slate-600 mb-2">URL ingresada:</p>
              <pre className="bg-slate-50 p-4 rounded-lg overflow-x-auto text-sm border border-slate-100 text-slate-800">
                {JSON.stringify({
                  url: submittedUrl,
                  status: "pending",
                  message: "Se ha recibido la URL. Posteriormente aquí se mostrarán los resultados del análisis detallado de heurísticas de Nielsen en la interfaz completa.",
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
