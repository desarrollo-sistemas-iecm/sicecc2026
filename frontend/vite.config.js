import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Si está definido VITE_BASE_PATH lo usamos; en local development usamos '/'
  const base = env.VITE_BASE_PATH || (mode === 'development' ? '/' : '/sisec_2026/')

  return {
    plugins: [vue()],
    base: base,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      outDir: path.resolve(__dirname, '../backend/public'),
      emptyOutDir: true
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3013',
          changeOrigin: true
        },
        '/socket.io': {
          target: 'http://localhost:3013',
          ws: true
        },
        '/sisec_2026/socket.io': {
          target: 'http://localhost:3013',
          ws: true,
          rewrite: (p) => p.replace(/^\/sisec_2026/, '')
        },
        '/sisec_2026/api': {
          target: 'http://localhost:3013',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/sisec_2026/, '')
        }
      }
    }
  }
})
