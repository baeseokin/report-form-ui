import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // ✅ @ → src 경로로 매핑
    },
  },
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
