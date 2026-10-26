export const FUEL_OPTIONS = [
  { key: '93', label: '93', name: 'Gasolina 93' },
  { key: '95', label: '95', name: 'Gasolina 95' },
  { key: '97', label: '97', name: 'Gasolina 97' },
  { key: 'DI', label: 'Diésel', name: 'Diésel' },
  { key: 'KE', label: 'Kerosene', name: 'Kerosene' },
];

const priceValue = (precios, key) => {
  if (!precios) return null;
  const value = precios[key]?.precio ?? precios[`A${key}`]?.precio;
  return value === undefined || value === null || value === '' ? null : value;
};

/**
 * La CNE entrega precios como "1639.000" (punto decimal, 3 decimales).
 * Si algún día llega formato es-CL ("1.299,5") o con separadores de miles
 * ("1.299.000"), se normaliza para no multiplicar el valor por 10 o 1000.
 */
export function parsePrice(raw) {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }
  if (raw === null || raw === undefined) return null;

  const text = String(raw).trim();
  if (!text) return null;

  let normalized = text;
  if (text.includes(',')) {
    // Coma decimal: "1.299,5" o "1299,5" → "1299.5".
    normalized = text.replace(/\./g, '').replace(',', '.');
  } else if ((text.match(/\./g) || []).length > 1) {
    // Varios puntos: son separadores de miles ("1.299.000").
    normalized = text.replace(/\./g, '');
  }

  const numeric = Number(normalized.replace(/[^\d.]/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export function getNumericPrice(station, key) {
  const raw = priceValue(station?.precios, key);
  if (raw === null) return null;
  return parsePrice(raw);
}

export function formatPrice(station, key) {
  const value = getNumericPrice(station, key);
  return value === null ? '—' : `$${value.toLocaleString('es-CL')}`;
}

export function hasFuel(station, key) {
  return getNumericPrice(station, key) !== null;
}

export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      (error) => {
        const messages = {
          1: 'Permiso de ubicación denegado. Actívalo en los ajustes del sitio (icono del candado) para ver estaciones cercanas.',
          2: 'No se pudo determinar tu ubicación.',
          3: 'La ubicación tardó demasiado en responder.',
        };
        reject(messages[error.code] || 'Error al obtener tu ubicación.');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
}

export const routeUrl = (lat, lon) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

export const markerUrl = (lat, lon) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

export const openExternal = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

export async function shareStation({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return false;
  }
}

export const stationCoordinates = (station) => {
  const lat = station?.ubicacion?.latitud;
  const lon = station?.ubicacion?.longitud;
  if (!lat || !lon) return null;
  const parsed = [parseFloat(lat), parseFloat(lon)];
  return parsed.every(Number.isFinite) ? parsed : null;
};

export const stationAddress = (station) =>
  [
    station?.direccion_calle || station?.ubicacion?.direccion,
    station?.direccion_numero,
  ]
    .filter(Boolean)
    .join(' ') || 'Dirección no disponible';

export const stationBrand = (station) =>
  station?.distribuidor?.marca ||
  station?.distribuidor?.nombre ||
  station?.nombre_empresa ||
  'Estación de servicio';
