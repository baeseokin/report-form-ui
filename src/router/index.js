import { createRouter, createWebHistory } from "vue-router";
import Login from "../components/Login.vue";
import ReportForm from "../components/ReportForm.vue";
import ApprovalList from "../components/ApprovalList.vue";
import ApprovalListPage from "../components/ApprovalListPage.vue"; 
import UserManagement from "../components/UserManagement.vue";
import RoleAccess from "../components/RoleAccess.vue";
import { useUserStore } from "../store/userStore";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },

  // 보고서 관련
  { path: "/reportForm", component: ReportForm, meta: { menuName: "보고서 작성" } },
  { path: "/report/:id?", name: "ReportForm", component: ReportForm, props: true, meta: { menuName: "보고서 작성" } },
  { path: "/approvalList", component: ApprovalList, meta: { menuName: "청구목록 조회" } },

  // ✅ 신규 결재현황 메뉴
  { path: "/approvalStatus", component: ApprovalListPage, meta: { menuName: "결재목록 조회" } },

  // 사용자 / 권한 관리
  { path: "/userManagement", component: UserManagement, meta: { menuName: "사용자 관리" } },
  { path: "/roleAccess", component: RoleAccess, meta: { menuName: "권한 관리" } }
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

  // ✅ 로그인 안 되어 있으면 로그인 페이지로
  if (!userStore.user && to.path !== "/login") {
    alert("로그인이 필요합니다.");
    return next("/login");
  }

  // ✅ 메뉴 접근 권한 체크
  if (to.meta.menuName) {
    const hasAccess = userStore.access.some(
      (a) => a.menu_name === to.meta.menuName && a.access_type === "all"
    );
    if (!hasAccess) {
      alert("해당 메뉴에 대한 권한이 없습니다.");
      return next("/login");
    }
  }

  next();
});

export default router;
