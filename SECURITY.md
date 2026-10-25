# Seguridad

Estado de la revisión y pasos pendientes. **Lee el punto 1 antes de desplegar.**

## 1. Acción obligatoria: rotar la contraseña CNE

La contraseña anterior (asociada a `yamilcs@gmail.com`) estuvo incluida en el
bundle público de `https://estacioneswpa.vercel.app`. Aunque el código ya no la
expone, **cualquiera que haya descargado ese JS la conserva**:

1. Cambia la contraseña de la cuenta CNE.
2. Si reutilizabas esa contraseña en otro servicio (correo, GitHub, etc.), cámbiala también.
3. Actualiza `CNE_PASS` en `.env` (local) y en Vercel (Production/Preview/Development).
4. Redespliega para publicar el bundle limpio.

## 2. Cómo funciona ahora

```
Navegador ──GET /api/estaciones──► Función serverless (Vercel)
                                      │  login con CNE_USER/CNE_PASS
                                      ▼
                                   api.cne.cl
```

- `api/_cne.js`: login y caché de token (30 min) del lado servidor.
- `api/estaciones.js`: función de Vercel, `GET /api/estaciones`, con caché de 5 min.
- `vite.config.js`: en `npm run dev` el mismo endpoint se sirve desde el dev server,
  así que las credenciales nunca entran al bundle local.
- `src/api/getData.js`: el cliente solo llama a `/api/estaciones`; ya no existe
  ninguna ruta de login directo en el navegador.

Las variables `CNE_*` **no llevan prefijo `VITE_`**, por lo que Vite no las
inyecta en el navegador.

## 3. Configuración en Vercel

En *Project → Settings → Environment Variables*:

| Variable | Valor | Entornos |
|---|---|---|
| `CNE_USER` | correo de la cuenta CNE | Production, Preview, Development |
| `CNE_PASS` | contraseña (rotada) | Production, Preview, Development |
| `CNE_TOKEN_URL` | `https://api.cne.cl/api/login` | opcional |
| `CNE_ESTACIONES_URL` | `https://api.cne.cl/api/v4/estaciones` | opcional |

Después elimina `VITE_USUARIO`, `VITE_PASS`, `VITE_URL_TOKEN` y
`VITE_URL_ESTACIONES` del proyecto de Vercel si existen.

Local: copia `.env.example` a `.env` y completa `CNE_USER` / `CNE_PASS`.

GitHub Pages (`npm run deploy`) no ejecuta funciones serverless: el proxy no
funciona ahí. Usa Vercel como destino principal o aloja el proxy por separado.

## 4. Cabeceras de seguridad (Vercel)

`vercel.json` aplica CSP, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, COOP y HSTS.

La CSP permite un único script inline (el que aplica el tema antes del primer
pintado) mediante hash SHA-256. `connect-src` está limitado a `'self'`: el
cliente solo habla con nuestro proxy, no con `api.cne.cl` directamente. **Si
editas ese script en `index.html`**, recalcula el hash y actualízalo en
`vercel.json`:

```bash
npm run csp:hash
```

Verificación tras desplegar:

```bash
curl -sI https://estacioneswpa.vercel.app/ | grep -iE "content-security|x-frame|referrer|permissions"
```

Si algo se bloquea, revisa la consola del navegador: el mensaje indica la
directiva CSP afectada. No añadas `'unsafe-inline'` a `script-src`.

## 5. Dependencias

Actualizadas en esta revisión:

- `axios` 1.9.0 → 1.20.0 (corrige SSRF, prototype pollution, header injection, DoS).
- `react-router-dom` 6.14.2 → 7.18.4 (corrige open redirect / XSS).
- `form-data` y `follow-redirects` transitivas corregidas.
- `vite` 4.5.14 → 7.3.7 y `@vitejs/plugin-react` 4.0.3 → 5.2.0: eliminan los
  avisos del dev server (lectura de archivos, XSS, path traversal) y de
  `esbuild`. Requiere Node ≥ 20.19/22.12 (CI usa Node 22).

`npm audit` (incluyendo desarrollo) queda en **0 vulnerabilidades**.

## 6. Otras medidas aplicadas

- Logs saneados: ya no se imprime el objeto de error de axios (incluía la
  cabecera `Authorization`) en `Home` ni en `ErrorBoundary`.
- Se eliminaron `GetRegion` / `GetComuna`: eran código muerto que llamaba a
  `api.cne.cl` sin token (siempre habría devuelto 401).
- `dev-dist/` dejó de trackearse y está en `.gitignore`.
- La ubicación guardada en `localStorage` caduca a las 24 h (`getStoredLocation` /
  `setStoredLocation` en `src/utils/storage.js`); los datos antiguos sin marca de
  tiempo se descartan al leerlos.
- Actualización de la PWA: `src/pwa.js` registra el service worker con
  `workbox-window`; cuando una versión nueva toma el control, la página se
  recarga automáticamente (sin mezclar bundles viejos y nuevos). Además se busca
  actualización cada hora y al volver a la app.
- `/api/*` usa `NetworkFirst` con `networkTimeoutSeconds: 5` y caché de 24 h:
  con red lenta o sin conexión se muestra la última lista descargada. Solo se
  cachean respuestas `200` (nunca errores del proxy).
- `/api/estaciones` rechaza query strings (evita claves de caché infinitas y
  llamadas innecesarias a CNE), fuerza `Content-Type: application/json`, valida
  que la respuesta sea JSON y redirige `/api/estaciones.js` y
  `/api/estaciones/` a la ruta canónica.
- Cabecera `Cross-Origin-Resource-Policy: same-origin` y CSP sin `blob:` en
  `worker-src`/`img-src`.
- Tipografía **autoalojada** (`src/assets/fonts`): Plus Jakarta Sans en formato
  variable (latin y latin-ext) se sirve desde el propio dominio y se precachea.
  Ya no hay peticiones a `fonts.googleapis.com` / `fonts.gstatic.com`, así que
  Google no recibe la IP del usuario; la CSP ya no necesita esos orígenes.
- Un solo lockfile (`package-lock.json`); `yarn.lock` se eliminó para que nadie
  instale un árbol de dependencias distinto.
- CI en `.github/workflows/ci.yml`: `npm ci`, lint, tests (`node --test`), build,
  `npm audit --omit=dev` y comprobación de que no se usen variables `VITE_` para
  credenciales.

## 7. Recomendaciones pendientes

- Rate limiting en `/api/estaciones` si el uso crece (Vercel Firewall o Upstash).
- Sustituir el correo personal del footer por uno de contacto dedicado.
- Los tiles de OpenStreetMap siguen revelando la zona aproximada del usuario;
  si importa la privacidad, se puede añadir un proxy de tiles.
