import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from "path";

export default defineConfig({
  plugins: [vue()],
  base: '/',   // 반드시 / 로 설정
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
  build: {
    target: "es2019",
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ["vue", "vue-router", "pinia"],
          network: ["axios"],
          pdf: ["jspdf", "html2canvas"], // 👉 PDF 전용 청크
        },
      },
    },
  },
  esbuild: {
    drop: ["console", "debugger"], // 👉 운영 빌드에서 제거
  },
});
