import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allow access through other hosts, such as internal Nginx in Docker.
    host: true,
    allowedHosts: true,
    // In development, route API calls through Nginx to match production.
    // Change VITE_API_PROXY_TARGET when Nginx runs on another host.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    // Bind mounts sometimes miss file events inside containers.
    // Enable polling with WATCH_USEPOLLING=1.
    watch: {
      usePolling: process.env.WATCH_USEPOLLING === 'true',
      interval: 300,
    },
  },
})
