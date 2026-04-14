import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'La URL es requerida.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'La API Key de Gemini no está configurada en .env.local' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Actúa como un experto en UX y analiza la siguiente URL o el sistema al que se accede mediante ella: ${url}

Por favor, enfócate en evaluar la usabilidad del sitio basándote específicamente en las siguientes 5 heurísticas de Nielsen:
#2: Relación entre el sistema y el mundo real.
#4: Consistencia y estándares.
#8: Estética y diseño minimalista.
#9: Ayudar a los usuarios a reconocer, diagnosticar y recuperarse de errores.
#10: Ayuda y documentación.

Entrega tu respuesta en texto claro, estructurada comentando las fortalezas, debilidades o sugerencias para cada una de estas 5 heurísticas.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error('Error al llamar a Gemini:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error en el análisis con el LLM.', details: error.message },
      { status: 500 }
    );
  }
}
