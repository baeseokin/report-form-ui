import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0", // 모바일에서도 접속 가능하게
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001", // Express 서버 주소
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});