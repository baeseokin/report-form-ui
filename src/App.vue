<template>
  <div class="flex h-screen font-nanum" :class="{ 'left-menu-open': isOpen }">
    <!-- ✅ Sidebar (로그인 화면에서는 숨김) -->
    <aside
      v-if="!isLoginPage && !isMobileViewport()"
      :class="[
        'bg-gray-800 text-white flex flex-col fixed top-0 left-0 h-full z-40 transform transition-transform duration-300 w-64 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <nav class="left-menu-nav flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 pt-6 space-y-1">
        <!-- ✅ 로그인 사용자만 메뉴 표시 -->
        <template v-if="user">
          <router-link
            v-for="m in allowedMenus"
            :key="m.path"
            :to="m.path"
            :class="[
              'block px-3 py-2 rounded transition-colors',
              isMenuActive(m) ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-gray-700'
            ]"
            @click="closeSidebar"
          >
            {{ m.icon }} {{ m.label }}
          </router-link>
        </template>
      </nav>

      <!-- ⏱ 자동 로그아웃 카운트다운 + 사용자 정보 & 로그아웃 (하단 고정) -->
      <div class="flex-shrink-0 p-6 pt-4 text-sm text-gray-300">
        <div v-if="showLogoutTimer && timeVisible" class="mb-3 px-3 py-2 rounded bg-yellow-100 text-yellow-800 text-sm">
          ⏱ 자동 로그아웃까지: <strong>{{ mmss }}</strong>
        </div>
        <div v-if="user">
          👤 {{ user.userName }} ({{ user.userId }})<br />
          권한: {{ user.roles.map(r => r.role_name).join(", ") }}<br />
          부서: {{ user?.deptName }}
          <button
            @click="logout"
            class="block mt-2 text-red-400 hover:underline"
          >
            로그아웃
          </button>
        </div>
      </div>
    </aside>

    <!-- ✅ Overlay (Tablet/Mobile 전용, 터치 스크롤 전파 방지, 로그인 화면 제외) -->
    <div
      v-if="isOpen && !isLoginPage && !isMobileViewport()"
      class="fixed inset-0 bg-black/50 z-30 lg:hidden overlay-no-scroll"
      @click="closeSidebar"
    ></div>

    <!-- ✅ 본문 (로그인 시 여백 없음) -->
    <main ref="mainEl" class="flex-1 bg-gray-100 p-6 overflow-y-auto relative" :class="{ 'lg:ml-64': !isLoginPage }">
      <!-- 플로팅 책갈피 메뉴: body로 텔레포트하여 최상위 배치, 좌측 고정, 28px 노출 (로그인 시 숨김) -->
      <Teleport to="body">
        <div
          v-if="!isLoginPage && !isMobileViewport()"
          class="mobile-menu-tab lg:hidden"
          :class="{ 'mobile-menu-tab--open': isOpen }"
          :style="{ top: menuTabTopPx + 'px' }"
          @pointerdown.prevent="onMenuTabPointerDown"
        >
          <button
            type="button"
            class="mobile-menu-tab__btn"
            aria-label="메뉴 열기"
            @click="onMenuTabClick"
          >
            <span class="mobile-menu-tab__label">MENU</span>
          </button>
        </div>
      </Teleport>

      <!-- 화면 제목 + HELP 버튼 (로그인 페이지 제외) -->
      <div v-if="helpContent && !isLoginPage" class="flex items-center gap-3 mb-4">
        <h1 class="text-2xl font-bold text-gray-800">{{ pageTitle }}</h1>
        <HelpButton :content="helpContent" variant="amber" />
      </div>

      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, provide } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "./store/userStore";
import { useAutoLogout } from "@/composables/useAutoLogout";
import { getHelpForPath } from "@/helpContent";
import HelpButton from "@/components/HelpButton.vue";
import axios from "axios";
const showLogoutTimer = true  //자동로그인이 안될 경우에 true 로 변경해서 확인

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const mainEl = ref(null);

const isLoginPage = computed(() => route.path === "/login");

// ✅ Sidebar 상태 (모바일/테블릿용) — watch보다 먼저 정의 필요
const isOpen = ref(false);
const toggleSidebar = () => { isOpen.value = !isOpen.value; };
const closeSidebar = () => { isOpen.value = false; };
provide("closeSidebar", closeSidebar);

const isMobileViewport = () => typeof window !== "undefined" && window.innerWidth < 1024;
watch(
  () => route.path,
  (path) => {
    if (path === "/login") closeSidebar();
    else if (isMobileViewport()) closeSidebar();
  },
  { immediate: true, flush: "sync" }
);

// ✅ 화면 전환 시 본문(main) 스크롤 맨 위로 (모바일 메뉴 버튼이 위에 있어 바로 보이도록)
watch(
  () => route.path,
  () => {
    nextTick(() => {
      mainEl.value?.scrollTo?.(0, 0);
    });
  },
  { immediate: true }
);

// ✅ 현재 경로와 메뉴가 일치하면 선택 상태
function isMenuActive(m) {
  if (route.path === m.path) return true;
  if (m.path === "/reportForm" && route.path.startsWith("/report")) return true;
  return false;
}

// 프로젝트 로그아웃 로직: Pinia + 라우팅
async function projectLogout() {
  await userStore.logout();
  router.push("/login");
}

const { start, stop, reset, remainingMs, isExcluded } = useAutoLogout({
  timeoutMs: 5 * 60 * 1000,
  onLogout: projectLogout,
  excludePaths: ["/login", "/auth/*"],
  getCurrentPath: () => router.currentRoute.value.path,
  resetOnFetch: false,                       // 폴링이 있다면 false 권장
  debug: false,
});

// ✅ 관리자일 때만 Eruda(톱니바퀴 디버그) 로드 (한 번만)
let erudaLoaded = false;
function loadEruda() {
  if (erudaLoaded) return;
  erudaLoaded = true;
  if (typeof window === "undefined") return;
  if (window.eruda) {
    window.eruda.init();
    return;
  }
  const script = document.createElement("script");
  script.src = "//cdn.jsdelivr.net/npm/eruda";
  script.onload = () => {
    if (window.eruda) window.eruda.init();
  };
  document.body.appendChild(script);
}

watch(
  () => userStore.user?.roles,
  (roles) => {
    const isAdmin = roles?.some((r) => r.role_name === "관리자");
    if (isAdmin) loadEruda();
  },
  { immediate: true }
);

onMounted(async () => {
  start();
  router.afterEach((to) => {
    start();   // ✅ 멱등. stop된 상태면 재등록, 이미 시작이면 noop
    reset();   // ✅ 경로에 따라 무장/해제
    // ✅ 로그인 페이지 진입 시·모바일에서 비로그인 페이지 진입 시 left menu 접기 (네비게이션 완료 후 적용)
    nextTick(() => {
      if (to.path === "/login") closeSidebar();
      else if (isMobileViewport()) closeSidebar();
    });
  });

  await userStore.loadSession();
  menuTabTopPx.value = defaultMenuTabTop();
});
onBeforeUnmount(() => stop());

// ⏱ mm:ss 포맷
const mmss = computed(() => {
  const ms = remainingMs.value;
  if (ms < 0) return "—"; // 제외 경로(/login)에서는 숨김
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
});
const timeVisible = computed(() => remainingMs.value >= 0);

const user = computed(() => userStore.user);

// ✅ 현재 화면 도움말 (경로별 용도 + 사용 순서)
const helpContent = computed(() => getHelpForPath(route.path));

// ✅ 현재 화면 제목 (라우트 meta 또는 경로 기반)
const pageTitle = computed(() => {
  const meta = route.meta?.menuName;
  if (meta) return meta;
  if (route.path === "/login") return "원천교회 지출청구 시스템";
  if (route.path === "/email-test") return "이메일 테스트";
  return "";
});

// ✅ 전체 메뉴 정의 (label은 권한 관리/role_access의 menu_name과 일치해야 함)
const allMenus = [
  { label: "홈", path: "/portal", icon: "🏠", alwaysShow: true },
  { label: "공지사항", path: "/notices", icon: "📢", alwaysShow: true },
  { label: "게시판", path: "/boards", icon: "💬", alwaysShow: true },
  { label: "지출결의서 작성", path: "/reportForm", icon: "📝" },
  { label: "청구목록 조회", path: "/approvalList", icon: "📑" },
  { label: "내결재목록 조회", path: "/approvalStatus", icon: "✅" },
  { label: "계정과목 관리", path: "/accountCategories", icon: "📊" },
  { label: "예산 관리", path: "/budgets", icon: "💰" }, 
  { label: "예산집행 현황", path: "/budgetStatus", icon: "🏛" },
  { label: "부서 예산집행 현황", path: "/deptBudgetStatus", icon: "📉" },  
  { label: "부서 관리", path: "/departments", icon: "🏢" },
  { label: "사용자 관리", path: "/userManagement", icon: "👤" },
  { label: "결재선 관리", path: "/approval-lines", icon: "📄" },
  { label: "권한 관리", path: "/roleAccess", icon: "🔑" },
  { label: "이메일 테스트", path: "/email-test", icon: "🔑" },
  
];

// ✅ role_access 기준으로 필터링
const allowedMenus = computed(() => {
  if (!user.value) {
    console.log("❌ allowedMenus: 사용자 없음");
    return [];
  }

  console.log("👤 현재 사용자:", user.value);
  console.log("📑 전체 메뉴 목록:", allMenus);
  console.log("🔑 사용자 접근권한(userStore.access):", userStore.access);

  const filtered = allMenus.filter((m) =>
    m.alwaysShow || userStore.access.some(
      (a) => a.menu_name === m.label && a.access_type === "all"
    )
  );

  console.log("✅ 필터링된 메뉴(allowedMenus):", filtered);

  return filtered;
});


// ✅ 모바일 메뉴 탭 상하 위치 (드래그로 조정, localStorage 저장)
const MENU_TAB_STORAGE_KEY = "report-form-ui:menuTabTop";
const MENU_TAB_HEIGHT = 72;
const defaultMenuTabTop = () => {
  if (typeof window === "undefined") return 16;
  const saved = localStorage.getItem(MENU_TAB_STORAGE_KEY);
  if (saved != null) {
    const n = parseInt(saved, 10);
    if (!Number.isNaN(n) && n >= 0) return Math.min(n, window.innerHeight - MENU_TAB_HEIGHT);
  }
  // 기본 위치: 화면 중앙
  return Math.max(0, (window.innerHeight / 2) - (MENU_TAB_HEIGHT / 2));
};
const menuTabTopPx = ref(defaultMenuTabTop());

const menuTabDrag = ref({ active: false, startY: 0, startTop: 0 });
const menuTabDidDrag = ref(false);

function onMenuTabPointerDown(e) {
  if (e.button !== 0 && e.pointerType !== "touch") return;
  e.preventDefault(); /* 터치 시 스크롤이 아닌 드래그로 인식되도록 */
  menuTabDidDrag.value = false;
  menuTabDrag.value = { active: true, startY: e.clientY, startTop: menuTabTopPx.value };
  const el = e.currentTarget;
  if (el && el.setPointerCapture) el.setPointerCapture(e.pointerId);
  window.addEventListener("pointermove", onMenuTabPointerMove, { passive: false });
  window.addEventListener("pointerup", onMenuTabPointerUp);
  window.addEventListener("pointercancel", onMenuTabPointerUp);
}

function onMenuTabPointerMove(e) {
  if (!menuTabDrag.value.active) return;
  e.preventDefault(); /* 터치 드래그 시 본문 스크롤 방지 */
  const dy = e.clientY - menuTabDrag.value.startY;
  if (Math.abs(dy) > 5) menuTabDidDrag.value = true;
  const minTop = 0;
  const maxTop = Math.max(0, window.innerHeight - MENU_TAB_HEIGHT);
  let next = menuTabDrag.value.startTop + dy;
  next = Math.max(minTop, Math.min(maxTop, next));
  menuTabTopPx.value = Math.round(next);
}

function onMenuTabPointerUp() {
  if (menuTabDrag.value.active) {
    try { localStorage.setItem(MENU_TAB_STORAGE_KEY, String(menuTabTopPx.value)); } catch (_) {}
    // 터치/펜으로 탭만 했을 때(드래그 아님): click이 preventDefault 때문에 안 날 수 있어 직접 토글
    if (!menuTabDidDrag.value) {
      toggleSidebar();
      menuTabClickHandledByPointer.value = true;
      setTimeout(() => { menuTabClickHandledByPointer.value = false; }, 300);
    }
  }
  menuTabDrag.value = { active: false, startY: 0, startTop: 0 };
  window.removeEventListener("pointermove", onMenuTabPointerMove);
  window.removeEventListener("pointerup", onMenuTabPointerUp);
  window.removeEventListener("pointercancel", onMenuTabPointerUp);
  setTimeout(() => { menuTabDidDrag.value = false; }, 0);
}

const menuTabClickHandledByPointer = ref(false);

function onMenuTabClick(e) {
  if (menuTabDidDrag.value) return;
  if (menuTabClickHandledByPointer.value) return; // pointerup에서 이미 토글함 (중복 방지)
  toggleSidebar();
}

const logout = async () => {
  await axios.post("/api/logout", {}, { withCredentials: true });
  userStore.clearUser();
  router.push("/login");
};

</script>

<style scoped>
/* ✅ Android: 메뉴 열렸을 때 본문 스크롤 잠금 → 메뉴만 스크롤되도록 */
@media (max-width: 1023px) {
  .left-menu-open main {
    overflow: hidden !important;
    touch-action: none;
    overscroll-behavior: none;
  }
}

.overlay-no-scroll {
  touch-action: none;
  overflow: hidden;
}

/* 좌측 메뉴 nav: 터치 스크롤을 메뉴 안에만 묶기 (Android 스크롤 격리) */
.left-menu-nav {
  touch-action: pan-y;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

/* 모바일 전용: 좌측 플로팅 책갈피 탭 (36px 노출, 상하 드래그로 위치 조정) */
/* 닫힐 때: left 0에서 36px만 노출. 열릴 때: left 256px(사이드바 w-64)에 붙어 함께 슬라이드 */
.mobile-menu-tab {
  position: fixed;
  left: 0;
  z-index: 35;
  transform: translateX(calc(-100% + 28px)); /* 28px 노출 */
  transition: transform 0.3s ease-out, left 0.3s ease-out;
  touch-action: none;
  overflow: visible;
}

.mobile-menu-tab--open {
  left: 16rem; /* 256px, 사이드바(w-64) 오른쪽에 붙음 */
  transform: translateX(0);
}

.mobile-menu-tab__btn {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  width: 40px;
  min-width: 40px;
  height: 72px;
  padding: 0 6px 0 10px;
  background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
  color: white;
  border: none;
  border-radius: 0 12px 12px 0;
  box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.2);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  overflow: visible;
}

.mobile-menu-tab__btn:active {
  transform: scale(0.98);
}

/* MENU 글씨 세로 배치 */
.mobile-menu-tab__label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.2;
  padding-right: 2px;
}
</style>
