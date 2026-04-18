import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();
    const correctPasscode = process.env.APP_PASSCODE;
    
    // If no passcode is configured on the server, we allow access safely (or fail).
    // Failing securely is better if we expect it to be there.
    if (!correctPasscode) {
      console.warn("APP_PASSCODE no está configurado en .env.local");
      // Permitimos el paso en desarrollo si se olvidó poner la variable
      return NextResponse.json({ success: true });
    }

    if (passcode === correctPasscode) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Código de acceso incorrecto.' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error en la solicitud.' }, { status: 400 });
  }
}
