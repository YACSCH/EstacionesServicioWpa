import axios from 'axios';

const api = axios.create({ timeout: 20000 });
let tokenCache = null;

export const GetToken = async () => {
  if (tokenCache) return tokenCache;

  const url = import.meta.env.VITE_URL_TOKEN;
  const user = import.meta.env.VITE_USUARIO;
  const pass = import.meta.env.VITE_PASS;

  const response = await api.post(url, { email: user, password: pass });
  tokenCache = `Bearer ${response.data.token}`;
  return tokenCache;
};

const authorizedGet = async (url) => {
  const token = await GetToken();
  return api.get(url, { headers: { Authorization: token } });
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
