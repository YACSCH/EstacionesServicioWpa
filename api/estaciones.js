import { getEstaciones } from './_cne.js';

/**
 * Función serverless de Vercel: GET /api/estaciones
 *
 * Variables de entorno requeridas (sin prefijo VITE_):
 *   CNE_USER, CNE_PASS
 * Opcionales:
 *   CNE_TOKEN_URL, CNE_ESTACIONES_URL
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status, body, contentType } = await getEstaciones();

    res.status(status);
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Cache-Control',
      status >= 200 && status < 300
        ? 's-maxage=300, stale-while-revalidate=600'
        : 'no-store'
    );

    return res.send(body);
  } catch (error) {
    // Solo el mensaje: nunca loguear credenciales ni el error completo.
    console.error('CNE proxy error:', error.message);
    return res.status(502).json({ error: 'No se pudo obtener la información de CNE.' });
  }
}
