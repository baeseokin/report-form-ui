import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../store/userStore";

// ✅ 모바일 기기 여부
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * ✅ 라우트 레벨 코드 스플리팅
 * 각 컴포넌트를 동적 import로 정의해서
 * 초기 진입 번들을 최소화합니다.
 */
const Login = () => import("../components/Login.vue");

// 보고서 작성 (PC/모바일 모두 같은 컴포넌트 사용 시)
const ReportForm = () => import("../components/ReportForm.vue");

// ✅ 청구목록 조회: 기기별로 필요한 컴포넌트만 로드
const ApprovalList = () =>
  isMobile()
    ? import("../components/mobile/ApprovalListMobile.vue")
    : import("../components/ApprovalList.vue");

// ✅ 내결재목록 조회: 기기별로 필요한 컴포넌트만 로드
const ApprovalListPage = () =>
  isMobile()
    ? import("../components/mobile/ApprovalListPageMobile.vue")
    : import("../components/ApprovalListPage.vue");

// 사용자/권한/그리드/현황 등도 전부 동적 import
const UserManagement = () => import("../components/UserManagement.vue");
const RoleAccess = () => import("../components/RoleAccess.vue");
const AccountCategoriesGrid = () => import("../components/AccountCategoriesGrid.vue");
const BudgetsGrid = () => import("../components/BudgetsGrid.vue");
const BudgetStatus = () => import("../components/BudgetStatus.vue");
const DeptBudgetStatus = () =>
  isMobile()
    ? import("../components/mobile/DeptBudgetStatusMobile.vue")
    : import("../components/DeptBudgetStatus.vue");
const EmailTest = () => import("../views/EmailTest.vue");
const DepartmentManagement = () =>
  isMobile()
    ? import("../components/mobile/DepartmentManagementMobile.vue")
    : import("../components/DepartmentManagement.vue");
const ApprovalLineManagement = () =>
  import("../components/ApprovalLineManagement.vue");

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },

  // 보고서 관련
  { path: "/reportForm", component: ReportForm, meta: { menuName: "보고서 작성" } },
  { path: "/report/:id?", name: "ReportForm", component: ReportForm, props: true, meta: { menuName: "보고서 작성" } },

  // ✅ 청구목록 조회 → 모바일/PC 분기 (동적 import로 분리 청크 생성)
  { path: "/approvalList", component: ApprovalList, meta: { menuName: "청구목록 조회" } },

  // ✅ 내결재목록 조회 → 모바일/PC 분기 (동적 import)
  { path: "/approvalStatus", component: ApprovalListPage, meta: { menuName: "내결재목록 조회" } },

  // 사용자 / 권한 관리 / 결재라인 관리
  { path: "/userManagement", component: UserManagement, meta: { menuName: "사용자 관리" } },
  { path: "/roleAccess", component: RoleAccess, meta: { menuName: "권한 관리" } },
  { path: "/approval-lines", component: ApprovalLineManagement, meta: { menuName: "결재선 관리" } },

  // ✅ 계정과목 / 예산 / 예산집행 현황
  { path: "/accountCategories", component: AccountCategoriesGrid, meta: { menuName: "계정과목 관리" } },
  { path: "/budgets", component: BudgetsGrid, meta: { menuName: "예산 관리" } },
  { path: "/budgetStatus", component: BudgetStatus, meta: { menuName: "예산집행 현황" } },
  { path: "/deptBudgetStatus", component: DeptBudgetStatus, meta: { menuName: "부서 예산집행 현황" } },  
  { path: "/departments", component: DepartmentManagement, meta: { menuName: "부서 관리" } },

  // ✅ 이메일 테스트 (권한 없이 접근 허용)
  { path: "/email-test", name: "EmailTest", component: EmailTest, meta: { public: true } },
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
