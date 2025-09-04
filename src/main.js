import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./index.css";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:3001";
axios.defaults.withCredentials = true;  // ✅ 모든 요청에서 세션 쿠키 자동 포함ß

const app = createApp(App);
app.use(createPinia());

// 로그인 후 세션 값 (user + access) 전역 주입
app.provide("session", {
  user: null,
  access: []
});

app.use(router).mount("#app");
