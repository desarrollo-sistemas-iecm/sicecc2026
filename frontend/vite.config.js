import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // En local de desarrollo usamos '/', en desarrollo/producción usamos '/sicec_2026/'
  const base = mode === 'development' ? '/' : '/sicec_2026/'

  return {
    plugins: [vue()],
    base: base,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      outDir: '../backend/public',
      emptyOutDir: true
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3005',
          changeOrigin: true
        }
      }
    }
  }
})
