import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,          // bind to 0.0.0.0 — makes the site reachable from other devices
    proxy: {
      '/api': {
        target: 'http://localhost:5000',   // proxy always goes backend-to-backend on this machine
        changeOrigin: true,
      }
    }
  }
})
