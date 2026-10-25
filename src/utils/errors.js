/**
 * Traduce un fallo de axios a un mensaje útil para el usuario.
 * No expone detalles internos ni el objeto de error.
 */
export function apiErrorMessage(error) {
  if (!error?.response) {
    return 'No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.';
  }

  const status = error.response.status;
  if (status === 429) {
    return 'Hay demasiadas solicitudes en este momento. Espera un momento e inténtalo de nuevo.';
  }
  if (status === 404) {
    return 'No encontramos el servicio de datos. Inténtalo más tarde.';
  }
  if (status >= 500) {
    return 'El servicio de datos no está disponible en este momento. Inténtalo en unos minutos.';
  }
  return `No pudimos cargar las estaciones (error ${status}).`;
}
