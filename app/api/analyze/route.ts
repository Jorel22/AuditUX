import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import clientPromise from '@/lib/mongodb';

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

    const prompt = `Actúa como un Auditor Senior de UX/UI. Tu tarea es realizar un análisis profundo de usabilidad y carga cognitiva de la siguiente URL: ${url}.

Para el análisis de usabilidad, debes basar tu evaluación estrictamente en las Heurísticas de Usabilidad de Jakob Nielsen. Evalúa detalladamente las siguientes 5 heurísticas específicas de Nielsen:

1. evaluacion_heuristicas: Un arreglo de objetos para estas 5 heurísticas:
   - "Relación entre el sistema y el mundo real" (Heurística #2)
   - "Consistencia y estándares" (Heurística #4)
   - "Estética y diseño minimalista" (Heurística #8)
   - "Ayudar a los usuarios a reconocer, diagnosticar y recuperarse de errores" (Heurística #9)
   - "Ayuda y documentación" (Heurística #10)
   Profundiza en la evaluación analizando elementos de la interfaz, arquitectura de la información y flujos de usuario presentes en la página.
   Cada objeto debe incluir exactamente estas claves: 
   - "nombre": (El nombre exacto de la heurística)
   - "estado": (valores limitados a: "pasa", "advertencia", "falla")
   - "puntuacion": (número del 1 al 10)
   - "comentario": (Un análisis crítico, profundo y accionable justificando rigurosamente la evaluación)

2. carga_cognitiva: Un objeto que contenga exactamente estas claves:
   - "nivel_esfuerzo": Un valor numérico del 1 al 100 (buscando identificar carga cognitiva intrínseca, extrínseca y germana).
   - "semaforo": Un valor de texto limitado a ("bajo", "medio", "alto") según el nivel de esfuerzo.
   - "factores": Una lista de 3 razones técnicas detalladas (Considerando la Ley de Hick, densidad de información o complejidad visual) que justifican el nivel de carga.

3. puntaje_global: Un número entero del 1 al 100 reflejando la madurez general de la interfaz evaluada.

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
      
      // Guardar en la base de datos
      try {
        const client = await clientPromise;
        const db = client.db('proyectoauditux');
        const collection = db.collection('auditorias');
        
        await collection.insertOne({
          url,
          result: resultData,
          createdAt: new Date()
        });
      } catch (dbError) {
        console.error('Error al guardar en MongoDB:', dbError);
        // Continuamos de todos modos para retornar el resultado al cliente
      }
      
    } catch (e) {
      console.error('Failed to parse JSON from Gemini:', cleanedText);
      return NextResponse.json({ error: 'El modelo no devolvió un JSON válido.' }, { status: 500 });
    }

    return NextResponse.json({ result: resultData });
  } catch (error: any) {
    console.error('Error al llamar a Gemini:', error);
    
    let errorMessage = 'Ocurrió un error en el análisis con el LLM.';
    let statusCode = 500;
    const errorStr = typeof error?.message === 'string' ? error.message : JSON.stringify(error);

    if (errorStr.includes('503') || error?.status === 503) {
      errorMessage = 'Los servidores de Gemini (IA) están experimentando intermitencias o alta demanda (Error 503). El problema no es de la aplicación. Por favor, intenta nuevamente en unos momentos.';
      statusCode = 503;
    } else if (errorStr.includes('429') || error?.status === 429) {
      errorMessage = 'Se alcanzó el límite rápido de peticiones gratuitas de Gemini (Error 429). Por favor, espera alrededor de 30 segundos y vuelve a hacer clic en Ejecutar Evaluación.';
      statusCode = 429;
    }

    return NextResponse.json(
      { error: errorMessage, details: errorStr },
      { status: statusCode }
    );
  }
}
