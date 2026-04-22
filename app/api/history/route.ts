import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();

    const correctPasscode = process.env.APP_PASSCODE;
    if (correctPasscode && passcode !== correctPasscode) {
      return NextResponse.json({ error: 'No autorizado. Código de acceso incorrecto.' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('proyectoauditux');
    const collection = db.collection('auditorias');

    // Fetch all documents, sorted by createdAt descending
    const documents = await collection.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ history: documents });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Ocurrió un error al obtener el historial.' }, { status: 500 });
  }
}
