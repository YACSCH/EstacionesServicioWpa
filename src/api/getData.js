import axios from 'axios';

const api = axios.create({ timeout: 20000 });
let tokenCache = null;
let tokenPromise = null;

const getTokenInternal = async () => {
  const url = import.meta.env.VITE_URL_TOKEN;
  const user = import.meta.env.VITE_USUARIO;
  const pass = import.meta.env.VITE_PASS;

  const response = await api.post(url, { email: user, password: pass });
  tokenCache = `Bearer ${response.data.token}`;
  return tokenCache;
};

export const GetToken = async (force = false) => {
  if (!force && tokenCache) return tokenCache;
  if (!tokenPromise) {
    tokenPromise = getTokenInternal().finally(() => {
      tokenPromise = null;
    });
  }
  return tokenPromise;
};

const authorizedGet = async (url, config = {}, retry = true) => {
  const token = await GetToken();
  try {
    return await api.get(url, {
      ...config,
      headers: {
        ...(config.headers || {}),
        Authorization: token,
      },
    });
  } catch (error) {
    if (retry && error.response?.status === 401) {
      tokenCache = null;
      const newToken = await GetToken(true);
      return api.get(url, {
        ...config,
        headers: {
          ...(config.headers || {}),
          Authorization: newToken,
        },
      });
    }
    throw error;
  }
};

export const GetEstaciones = async () => {
  return authorizedGet(import.meta.env.VITE_URL_ESTACIONES);
};

export const GetDistribuidores = async () => {
  return authorizedGet(import.meta.env.VITE_URL_DISTRIBUIDORES);
};

export const GetRegion = async () => {
  const response = await api.get(import.meta.env.VITE_URL_REGIONES);
  return response.data;
};

export const GetComuna = async (props) => {
  const response = await api.get(import.meta.env.VITE_URL_COMUNAS + props);
  return response.data;
};
