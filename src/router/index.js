import { createRouter, createWebHistory } from "vue-router";
import Login from "../components/Login.vue";
import ReportForm from "../components/ReportForm.vue";
import ApprovalList from "../components/ApprovalList.vue";
import ApprovalListPage from "../components/ApprovalListPage.vue"; // ✅ 신규 추가
import UserManagement from "../components/UserManagement.vue";
import RoleAccess from "../components/RoleAccess.vue";
import { useUserStore } from "../store/userStore";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },

  // 보고서 관련
  { path: "/reportForm", component: ReportForm },
  { path: "/report/:id?", name: "ReportForm", component: ReportForm, props: true },
  { path: "/approvalList", component: ApprovalList },

  // ✅ 신규 결재현황 메뉴
  { path: "/approvalStatus", component: ApprovalListPage },

  // 사용자 / 권한 관리 (관리자 전용)
  { path: "/userManagement", component: UserManagement, meta: { requiresAdmin: true } },
  { path: "/roleAccess", component: RoleAccess, meta: { requiresAdmin: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  if (!userStore.user) {
    await userStore.loadSession();
  }

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
