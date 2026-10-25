import axios from 'axios';

const api = axios.create({ timeout: 20000 });

// Todas las llamadas autenticadas pasan por el proxy serverless (/api/estaciones).
// Las credenciales de la CNE viven solo en el servidor (CNE_USER / CNE_PASS):
// nunca deben llegar al bundle del navegador.
const API_BASE = `${import.meta.env.BASE_URL}api`;

export const GetEstaciones = async () => {
  return api.get(`${API_BASE}/estaciones`);
};

export const GetRegion = async () => {
  const response = await api.get(import.meta.env.VITE_URL_REGIONES);
  return response.data;
};

export const GetComuna = async (props) => {
  if (props === undefined || props === null || props === '') {
    throw new Error('Se requiere el identificador de la comuna.');
  }
  const comuna = encodeURIComponent(String(props).trim());
  const response = await api.get(import.meta.env.VITE_URL_COMUNAS + comuna);
  return response.data;
};
