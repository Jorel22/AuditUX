import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import clientPromise from '@/lib/mongodb';

const MAX_RETRIES = 1;
const BASE_DELAY_MS = 1000;

async function generateContentWithRetry(ai: GoogleGenAI, prompt: string, model: string, requestId: string, attempt = 1): Promise<any> {
  const startTime = performance.now();
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    const duration = Math.round(performance.now() - startTime);
    console.log(`[OK] Gemini Request ${requestId} | Modelo: ${model} | Intento: ${attempt} | Duración: ${duration}ms`);
    return response;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    const errorStr = typeof error?.message === 'string' ? error.message : JSON.stringify(error);
    const status = error?.status || 'UNKNOWN';

    // Log detallado del error
    console.error(`[ERROR] Gemini Request ${requestId} | Status: ${status} | Modelo: ${model} | Intento: ${attempt} | Duración: ${duration}ms`);
    console.error(`[ERROR BODY] ${requestId}:`, errorStr);

    // Si la librería expone headers, intentar extraer Retry-After
    if (error?.response?.headers) {
      const retryAfter = error.response.headers.get?.('retry-after') || error.response.headers['retry-after'];
      if (retryAfter) console.error(`[HEADERS] ${requestId} Retry-After: ${retryAfter}`);
    }

    const isTransientError = errorStr.includes('503') || status === 503;

    if (isTransientError && attempt <= MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 500); // Jitter aleatorio
      const waitTime = delay + jitter;

      console.warn(`[RETRY] ${requestId} - Error 503 en Gemini. Reintentando en ${waitTime}ms...`);

      await new Promise(resolve => setTimeout(resolve, waitTime));

      return generateContentWithRetry(ai, prompt, model, requestId, attempt + 1);
    }

    throw error;
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const reqStartTime = performance.now();
  console.log(`\n--- NUEVO REQUEST [${requestId}] --- Fecha: ${new Date().toISOString()}`);

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
   - "puntuacion": (número del 1 al 10)
   - "comentario": (Un análisis crítico, profundo y accionable justificando rigurosamente la evaluación)

2. facilidad_cognitiva: Un objeto que contenga exactamente estas claves:
   - "nivel_facilidad": Un valor numérico del 1 al 10 (donde 10 significa excelente facilidad cognitiva/menor esfuerzo, y 1 significa baja facilidad/alto esfuerzo).
   - "factores": Una lista de 3 razones técnicas detalladas (Considerando la Ley de Hick, densidad de información o complejidad visual) que justifican el nivel de facilidad.

IMPORTANTE: 
1. No añadas texto introductorio ni explicaciones fuera del bloque JSON.
2. Asegúrate de que la respuesta sea estrictamente un JSON válido. Si usas comillas dobles (") dentro de cualquier texto o comentario, DEBES escaparlas correctamente usando una barra invertida (\").`;

    const GEMINI_MODEL = 'gemini-2.5-flash'; // Revertido al modelo original de tu proyecto
    console.log(`[INFO] ${requestId} | Preparando prompt. Modelo seleccionado: ${GEMINI_MODEL}`);

    const estimatedTokens = Math.round(prompt.length / 4);
    console.log(`[INFO] ${requestId} | Tamaño del prompt: ${prompt.length} caracteres (~${estimatedTokens} tokens)`);

    const response = await generateContentWithRetry(ai, prompt, GEMINI_MODEL, requestId);

    const text = response.text || '';
    // Limpiar posibles bloques de código markdown
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let resultData;
    try {
      resultData = JSON.parse(cleanedText);

      // Calcular puntajes_categorias y puntaje_global localmente antes de guardar
      const heurs = resultData.evaluacion_heuristicas || [];
      let sum = 0;
      heurs.forEach((h: any) => sum += (h.puntuacion || 0));
      const cHeu = heurs.length > 0 ? Math.round((sum / heurs.length) * 10) : 0;

      let cCog = 0;
      if (resultData.facilidad_cognitiva?.nivel_facilidad !== undefined) {
        cCog = resultData.facilidad_cognitiva.nivel_facilidad * 10;
      } else if (resultData.carga_cognitiva?.nivel_esfuerzo !== undefined) {
        cCog = Math.max(0, 100 - resultData.carga_cognitiva.nivel_esfuerzo);
      }
      const pCog = Math.round(cCog * 0.50);
      const pHeu = Math.round(cHeu * 0.50);
      const puntajeGlobal = pCog + pHeu;

      resultData.puntajes_categorias = {
        heuristicas: cHeu
      };
      resultData.puntaje_global = puntajeGlobal;

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
    const totalDuration = Math.round(performance.now() - reqStartTime);
    console.error(`[FATAL] ${requestId} | Petición falló globalmente tras ${totalDuration}ms.`);

    let errorMessage = 'Ocurrió un error en el análisis con el LLM.';
    let statusCode = 500;
    const errorStr = typeof error?.message === 'string' ? error.message : JSON.stringify(error);

    if (errorStr.includes('503') || error?.status === 503) {
      console.error(`[LOG 503] ${requestId} | Error de sobrecarga de Gemini (503).`);
      errorMessage = 'Los servidores de IA están temporalmente ocupados. Intenta nuevamente en unos momentos.';
      statusCode = 503;
    } else if (errorStr.includes('429') || error?.status === 429) {
      console.error(`[LOG 429] ${requestId} | Rate Limit Exceeded (429). Posibles causas: cuota agotada, límite RPM/TPM, o concurrencia.`);
      errorMessage = 'Se ha excedido la cuota de uso de Inteligencia Artificial. Esto puede deberse al límite de peticiones por minuto, de tokens, o a que se alcanzó la cuota diaria del modelo. Espera unos minutos y vuelve a intentarlo.';
      statusCode = 429;
    } else {
      console.error(`[LOG 4xx/5xx] ${requestId} | Error no recuperable: ${errorStr}`);
      // MODIFICACIÓN TEMPORAL PARA DIAGNÓSTICO: Agregar el error crudo al mensaje de UI para poder verlo
      errorMessage = `Ocurrió un error en el análisis con el LLM. Detalles técnicos: ${errorStr}`;
    }

    return NextResponse.json(
      { error: errorMessage, details: errorStr },
      { status: statusCode }
    );
  }
}
