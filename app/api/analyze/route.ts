import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { url, passcode } = await request.json();

    const correctPasscode = process.env.APP_PASSCODE;
    if (correctPasscode && passcode !== correctPasscode) {
      return NextResponse.json({ error: 'No autorizado. Código de acceso incorrecto.' }, { status: 401 });
    }

    if (!url) {
      return NextResponse.json({ error: 'La URL es requerida.' }, { status: 400 });
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return NextResponse.json({ error: 'Solo se permiten URLs que empiecen con HTTP o HTTPS.' }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'La URL proporcionada no tiene un formato válido. Evite añadir texto extra.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'La API Key de Gemini no está configurada en .env.local' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Actúa como un experto en UX y análisis de interfaces. Tu tarea es analizar la usabilidad y la carga cognitiva de la siguiente URL: ${url}.

Debes entregar tu análisis EXCLUSIVAMENTE en formato JSON para que pueda ser procesado por una aplicación web. La estructura debe ser la siguiente:

1. evaluacion_heuristicas: Un arreglo de objetos para estas 5 heurísticas:
   - Relación con el mundo real
   - Consistencia y estándares
   - Estética y diseño minimalista
   - Recuperación de errores
   - Ayuda y documentación
   Cada objeto debe incluir: "nombre", "estado" (valores: "pasa", "advertencia", "falla"), "puntuacion" (1-10) y "comentario".

2. carga_cognitiva: Un objeto que contenga:
   - nivel_esfuerzo: Un valor numérico del 1 al 100 (donde 100 es carga máxima).
   - semaforo: Un valor de texto ("bajo", "medio", "alto") basado en el nivel de esfuerzo.
   - factores: Una lista de 3 razones técnicas que justifican ese nivel.

3. puntaje_global: Un número entero del 1 al 100.

IMPORTANTE: No añadas texto introductorio ni explicaciones fuera del bloque JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    // Limpiar posibles bloques de código markdown
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let resultData;
    try {
      resultData = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse JSON from Gemini:', cleanedText);
      return NextResponse.json({ error: 'El modelo no devolvió un JSON válido.' }, { status: 500 });
    }

    return NextResponse.json({ result: resultData });
  } catch (error: any) {
    console.error('Error al llamar a Gemini:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el análisis con el LLM.', details: error.message },
      { status: 500 }
    );
  }
}
