import { defineStore } from "pinia";
import axios from "axios";

let loadPromise = null;

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
      if (loadPromise) return loadPromise;

      loadPromise = (async () => {
        try {
          const res = await axios.get("/api/session", { withCredentials: true });
          if (!res.data.user) {
            this.user = null;
            this.access = [];
            return null;
          }

          const userData = res.data.user;
          let roleAccess = [];

          if (userData.roles && userData.roles.length > 0) {
            const promises = userData.roles.map(role =>
              axios.get(`/api/access/${role.id}`, { withCredentials: true })
            );
            const results = await Promise.all(promises);
            results.forEach(r => {
              roleAccess = roleAccess.concat(r.data.access || []);
            });
          }

          // ✅ 유저와 권한을 동시에 설정하여 race condition 방지
          this.access = roleAccess;
          this.user = userData;
          return userData;
        } catch (err) {
          console.error("Session load failed:", err);
          this.user = null;
          this.access = [];
          return null;
        } finally {
          loadPromise = null;
        }
      })();

      return loadPromise;
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
        try { localStorage.removeItem("token"); } catch { }
        try { sessionStorage.clear(); } catch { }
        this.clearUser(); // user, access 초기화
      }
    }

  },
});
