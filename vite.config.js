import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { getEstaciones } from './api/_cne.js'

// En desarrollo no hay funciones serverless: servimos /api/estaciones desde
// el dev server para que las credenciales tampoco estén en el bundle local.
const cneDevProxy = (env) => ({
  name: 'cne-dev-proxy',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/api/estaciones', async (req, res) => {
      if (req.method !== 'GET') {
        res.statusCode = 405
        res.setHeader('Allow', 'GET')
        res.end('Method Not Allowed')
        return
      }

      const requestUrl = req.url || ''
      if (requestUrl.includes('?')) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'Unexpected query parameters' }))
        return
      }

      try {
        const { status, body } = await getEstaciones({
          user: env.CNE_USER,
          pass: env.CNE_PASS,
          tokenUrl: env.CNE_TOKEN_URL,
          estacionesUrl: env.CNE_ESTACIONES_URL,
        })
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(body)
      } catch (error) {
        console.error('CNE dev proxy error:', error.message)
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'No se pudo obtener la información de CNE.' }))
      }
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: process.env.BASE_PATH || '/',
    plugins: [
      react(),
      cneDevProxy(env),
      VitePWA({
        registerType: 'autoUpdate',
        // La registración la hace src/pwa.js con workbox-window, que recarga
        // la página cuando el service worker nuevo toma el control.
        injectRegister: null,
        includeAssets: ['img/*.png', 'vite.svg'],
        manifest: {
          name: 'Estaciones de Servicio',
          short_name: 'Estaciones',
          description: 'Encuentra estaciones de servicio cercanas y consulta precios de combustibles',
          theme_color: '#29353b',
          background_color: '#29353b',
          display: 'standalone',
          start_url: '.',
          scope: '.',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          shortcuts: [
            {
              name: 'Estaciones',
              short_name: 'Estaciones',
              description: 'Ver listado de estaciones',
              url: 'estaciones',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Cercanas',
              short_name: 'Cercanas',
              description: 'Estaciones cercanas a tu ubicación',
              url: './',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Calefacción',
              short_name: 'Calefacción',
              description: 'Puntos de venta de calefacción',
              url: 'distribuidores',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}'],
          runtimeCaching: [
            {
              // Los endpoints del proxy nunca se cachean: los datos cambian y
              // no queremos respuestas obsoletas ni contenido autenticado.
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly'
            },
            {
              urlPattern: ({ url }) => url.origin.includes('tile.openstreetmap.org'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'osm-tiles-cache',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true
        }
      })
    ],
  }
})
