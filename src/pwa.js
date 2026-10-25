import { registerSW } from 'virtual:pwa-register';

// Una PWA instalada puede pasar días abierta sin recargar: además del chequeo
// que hace el navegador al navegar, forzamos uno cada hora y al volver a la app.
const UPDATE_CHECK_MS = 60 * 60 * 1000;

export function setupServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        if (document.visibilityState !== 'visible' || !navigator.onLine) return;
        // Si no hay red o el servidor falla, se reintenta en el próximo ciclo.
        registration.update().catch(() => {});
      };

      setInterval(checkForUpdate, UPDATE_CHECK_MS);
      document.addEventListener('visibilitychange', checkForUpdate);
      window.addEventListener('online', checkForUpdate);
    },
    onRegisterError(error) {
      console.warn(
        'No se pudo registrar el service worker:',
        error?.message || 'error desconocido'
      );
    },
  });
}
