const STORAGE_KEYS = {
  home: {
    radius: 'es.home.radius',
    fuel: 'es.home.fuel',
    sort: 'es.home.sort',
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

export { STORAGE_KEYS };
