import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-proxy': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, '')
      },
      '/analysis-proxy': {
        target: 'https://interviewaiapi.bestworks.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/analysis-proxy/, '')
      }
    }
  }
})

