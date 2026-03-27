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

const PortalHome = () =>
  isMobile()
    ? import("../components/mobile/PortalHomeMobileV2.vue")
    : import("../components/PortalHome.vue");

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
const UserManagement = () =>
  isMobile()
    ? import("../components/mobile/UserManagementMobile.vue")
    : import("../components/UserManagement.vue");
const RoleAccess = () => import("../components/RoleAccess.vue");
const AccountCategoriesGrid = () =>
  isMobile()
    ? import("../components/mobile/AccountCategoriesGridMobile.vue")
    : import("../components/AccountCategoriesGrid.vue");
const BudgetsGrid = () =>
  isMobile()
    ? import("../components/mobile/BudgetsGridMobile.vue")
    : import("../components/BudgetsGrid.vue");
const BudgetStatus = () =>
  isMobile()
    ? import("../components/mobile/BudgetStatusMobile.vue")
    : import("../components/BudgetStatus.vue");
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
  isMobile()
    ? import("../components/mobile/ApprovalLineManagementMobile.vue")
    : import("../components/ApprovalLineManagement.vue");

const NoticeManagement = () =>
  isMobile()
    ? import("../components/mobile/NoticeManagementMobile.vue")
    : import("../components/NoticeManagement.vue");

const BoardManagement = () =>
  isMobile()
    ? import("../components/mobile/BoardManagementMobile.vue")
    : import("../components/BoardManagement.vue");

const routes = [
  { path: "/", redirect: "/portal" },
  { path: "/login", component: Login },
  { path: "/portal", component: PortalHome, meta: { menuName: "포탈 홈", publicMenu: true } },

  // 보고서 관련
  { path: "/reportForm", component: ReportForm, meta: { menuName: "지출결의서 작성" } },
  { path: "/report/:id?", name: "ReportForm", component: ReportForm, props: true, meta: { menuName: "지출결의서 작성" } },

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

  // ✅ 공지사항 (모두 접근 가능하지만 작성/수정/삭제는 관리자만)
  { path: "/notices", component: NoticeManagement, meta: { menuName: "공지사항", publicMenu: true } },

  // ✅ 게시판 (모두 작성 가능, 수정 삭제는 본인/관리자)
  { path: "/boards", component: BoardManagement, meta: { menuName: "게시판", publicMenu: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0 };
  },
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // ✅ 앱 초기 진입 시 세션 로드 (로그인이 안 된 상태라면 한 번은 무조건 대기)
  if (!userStore.user) {
    await userStore.loadSession();
  }

  // ✅ 이미 로그인된 상태에서 로그인 페이지 진입 시 리다이렉트
  if (userStore.user && to.path === "/login") {
    // replace를 사용하여 히스토리 스택을 오염시키지 않음 (뒤로가기 시 무한 루프 방지)
    return next({ path: "/portal", replace: true });
  }

  // ✅ 로그인 안 되어 있으면 로그인 페이지로
  if (!userStore.user && to.path !== "/login" && !to.meta.public) {
    alert("로그인이 필요합니다.");
    return next({ path: "/login", replace: true });
  }

  // ✅ 메뉴 접근 권한 체크 (로그인된 경우에만 실행됨)
  if (userStore.user && to.meta.menuName && !to.meta.publicMenu) {
    // 권한 목록이 로드되기 전(race condition)에 체크되는 것을 방지하기 위해 userStore.access가 로드되었는지 확인
    const hasAccess = userStore.access.some(
      (a) => a.menu_name === to.meta.menuName && a.access_type === "all"
    );

    if (!hasAccess) {
      alert(`[${to.meta.menuName}] 메뉴에 대한 권한이 없습니다.`);
      // 권한 없는 메뉴 접근 시 포탈 홈으로
      return next({ path: "/portal", replace: true });
    }
  }

  next();
});

export default router;
