import { createRouter, createWebHistory } from "vue-router";
import Login from "../components/Login.vue";
import ReportForm from "../components/ReportForm.vue";
import ApprovalList from "../components/ApprovalList.vue";
import UserManagement from "../components/UserManagement.vue";
import RoleAccess from "../components/RoleAccess.vue";
import { useUserStore } from "../store/userStore";

const routes = [
  // 기본 진입은 로그인
  { path: "/", redirect: "/login" },

  // 로그인
  { path: "/login", component: Login },

  // 보고서 관련
  { path: "/reportForm", component: ReportForm },
  { path: "/report/:id?", name: "ReportForm", component: ReportForm, props: true },
  { path: "/approvalList", component: ApprovalList },

  // 사용자 / 권한 관리 (관리자 전용)
  { path: "/userManagement", component: UserManagement, meta: { requiresAdmin: true } },
  { path: "/roleAccess", component: RoleAccess, meta: { requiresAdmin: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ✅ 라우터 가드: 로그인 및 관리자 권한 체크
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // 세션 복원 (새로고침 시)
  if (!userStore.user) {
    await userStore.loadSession();
  }

  // 관리자 권한 필요할 경우 체크
  if (to.meta.requiresAdmin) {
    if (!userStore.user) {
      alert("로그인이 필요합니다.");
      return next("/login");
    }

    if (!userStore.roles.includes("관리자")) {
      alert("관리자 권한이 필요합니다.");
      return next("/login");
    }
  }

  next();
});

export default router;
