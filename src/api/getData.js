import axios from 'axios';

const api = axios.create({
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

// Todas las llamadas pasan por el proxy serverless (/api/estaciones).
// Las credenciales de la CNE viven solo en el servidor (CNE_USER / CNE_PASS):
// nunca deben llegar al bundle del navegador.
const API_BASE = `${import.meta.env.BASE_URL}api`;

export const GetEstaciones = async () => {
  return api.get(`${API_BASE}/estaciones`);
};
