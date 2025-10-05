// src/store/userStore.js
import { defineStore } from "pinia";
import axios from "axios";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null,
    access: [],
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    roles: (state) => state.user?.roles?.map(r => r.role_name) || [],
  },
  actions: {
    async loadSession() {
      try {
        const res = await axios.get("/api/session", { withCredentials: true });
        this.user = res.data.user;

        if (this.user && this.user.roles) {
          let roleAccess = [];
          for (const role of this.user.roles) {
            const r = await axios.get(`/api/access/${role.id}`, {
              withCredentials: true,
            });
            roleAccess = roleAccess.concat(r.data.access);
          }
          this.access = roleAccess;
        }
      } catch {
        this.user = null;
        this.access = [];
      }
    },
    setUser(user) {
      this.user = user;
      sessionStorage.setItem("user", JSON.stringify(user));
    },
    clearUser() {
      this.user = null;
      this.access = [];
      sessionStorage.removeItem("user");
    },
    async logout() {
      try {
        await axios.post("/api/logout", {}, { withCredentials: true });
      } catch {
        // 서버 오류 상관없이 클라이언트 정리
      } finally {
        try { localStorage.removeItem("token"); } catch {}
        try { sessionStorage.clear(); } catch {}
        this.clearUser(); // user, access 초기화
      }
    }

  },
});
