/**
 * Lógica compartida del proxy CNE: la usan tanto la función serverless de
 * Vercel (api/estaciones.js) como el middleware de desarrollo (vite.config.js).
 *
 * Las credenciales se leen de variables de entorno SIN prefijo VITE_, por lo
 * que nunca forman parte del bundle del navegador.
 */

const DEFAULTS = {
  tokenUrl: 'https://api.cne.cl/api/login',
  estacionesUrl: 'https://api.cne.cl/api/v4/estaciones',
};
const TOKEN_TTL_MS = 30 * 60 * 1000;

let cached = { token: null, expiresAt: 0 };

async function fetchToken(config, tokenUrl) {
  const user = config.user || process.env.CNE_USER;
  const pass = config.pass || process.env.CNE_PASS;

  if (!user || !pass) {
    throw new Error('CNE credentials are not configured');
  }

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user, password: pass }),
  });

  if (!res.ok) throw new Error(`CNE login failed (${res.status})`);

  const data = await res.json();
  if (!data || !data.token) throw new Error('CNE login returned no token');

  return `Bearer ${data.token}`;
}

async function getToken(config, force = false) {
  if (!force && cached.token && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const tokenUrl = config.tokenUrl || process.env.CNE_TOKEN_URL || DEFAULTS.tokenUrl;
  const token = await fetchToken(config, tokenUrl);

  cached = { token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return token;
}

function requestEstaciones(url, token) {
  return fetch(url, {
    headers: { Authorization: token, Accept: 'application/json' },
  });
}

/**
 * Obtiene las estaciones desde la CNE.
 * @returns {Promise<{status:number, body:string, contentType:string}>}
 */
export async function getEstaciones(config = {}) {
  const estacionesUrl =
    config.estacionesUrl || process.env.CNE_ESTACIONES_URL || DEFAULTS.estacionesUrl;

  let upstream = await requestEstaciones(estacionesUrl, await getToken(config));

  // Token expirado/invalidado: renovar una vez y reintentar.
  if (upstream.status === 401) {
    upstream = await requestEstaciones(estacionesUrl, await getToken(config, true));
  }

  return {
    status: upstream.status,
    body: await upstream.text(),
    contentType:
      upstream.headers.get('content-type') || 'application/json; charset=utf-8',
  };
}
