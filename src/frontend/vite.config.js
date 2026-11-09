import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Cho phép truy cập qua host khác (vd: nginx nội bộ trong docker)
    host: true,
    allowedHosts: true,
    // Ở dev, frontend gọi API qua Nginx (load balancer) để đúng luồng thật.
    // Đổi VITE_API_PROXY_TARGET nếu Nginx chạy ở host khác.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    // Trong container, bind-mount đôi lúc không nhận được sự kiện file.
    // Bật polling khi WATCH_USEPOLLING=1.
    watch: {
      usePolling: process.env.WATCH_USEPOLLING === 'true',
      interval: 300,
    },
  },
})
