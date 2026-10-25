import { getEstaciones } from './_cne.js';

function isJsonBody(body) {
  const first = body.trimStart()[0];
  return first === '[' || first === '{';
}

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

  // Sin query strings: evita claves de caché infinitas y llamadas innecesarias a CNE.
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  if (requestUrl.search) {
    return res.status(400).json({ error: 'Unexpected query parameters' });
  }

  try {
    const { status, body } = await getEstaciones();

    if (status < 200 || status >= 300 || !isJsonBody(body)) {
      console.error('CNE proxy returned an unusable response:', status);
      return res.status(502).json({ error: 'No se pudo obtener la información de CNE.' });
    }

    // Content-Type fijo: nunca se reenvía HTML/otro tipo desde el upstream.
    res.status(200);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    return res.send(body);
  } catch (error) {
    // Solo el mensaje: nunca loguear credenciales ni el error completo.
    console.error('CNE proxy error:', error.message);
    return res.status(502).json({ error: 'No se pudo obtener la información de CNE.' });
  }
}
