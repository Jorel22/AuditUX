"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full">
              <h2 className="text-xl font-bold mb-4">Resultados del Análisis</h2>
              <p className="text-slate-600 mb-4">
                URL ingresada: <span className="font-semibold text-slate-800">{submittedUrl}</span>
              </p>
              
              {loading && (
                <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse bg-blue-50 p-4 rounded-lg">
                  <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analizando heurísticas de Nielsen con IA, espera un momento...
                </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                  <span className="font-bold">Error:</span> {error}
                </div>
              )}
              
              {result && (
                <div className="bg-slate-50 p-6 rounded-lg text-sm border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {result}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
