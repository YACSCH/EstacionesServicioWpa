const STORAGE_KEYS = {
  home: {
    radius: 'es.home.radius',
    fuel: 'es.home.fuel',
  },
  location: 'es.user.location',
  theme: 'theme',
};

export const getStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    if (value === null || value === undefined) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

// Variantes sin JSON: el script inline de index.html escribe el tema como
// texto plano antes del primer pintado, así que debe leerse igual.
export const getRawStorage = (key, fallback = null) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export const setRawStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

// La ubicación es un dato personal: se descarta a las 24 h.
const LOCATION_TTL_MS = 24 * 60 * 60 * 1000;

export const getStoredLocation = () => {
  const value = getStorage(STORAGE_KEYS.location, null);
  if (!value || typeof value !== 'object') return null;

  const lat = Number(value.lat);
  const lon = Number(value.lon);
  const savedAt = Number(value.savedAt);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !Number.isFinite(savedAt) ||
    Date.now() - savedAt > LOCATION_TTL_MS
  ) {
    removeStorage(STORAGE_KEYS.location);
    return null;
  }

  return { lat, lon };
};

export const setStoredLocation = ({ lat, lon }) => {
  setStorage(STORAGE_KEYS.location, { lat, lon, savedAt: Date.now() });
};

export { STORAGE_KEYS };
