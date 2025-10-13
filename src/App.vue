<template>
  <div class="flex h-screen font-nanum">
    <!-- ✅ Sidebar -->
    <aside
      :class="[
        'bg-gray-800 text-white flex flex-col p-6 fixed top-0 left-0 h-full z-40 transform transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'w-64 lg:translate-x-0' // PC에서는 항상 보이도록
      ]"
    >
      <h2 class="text-2xl font-bold mb-8">📑 메뉴</h2>

      <nav class="flex-1 space-y-4">
        <!-- ✅ 로그인 사용자만 메뉴 표시 -->
        <template v-if="user">
          <router-link
            v-for="m in allowedMenus"
            :key="m.path"
            :to="m.path"
            class="block hover:bg-gray-700 px-3 py-2 rounded"
            @click="closeSidebar"
          >
            {{ m.icon }} {{ m.label }}
          </router-link>
        </template>
      </nav>

      <!-- ⏱ 자동 로그아웃 카운트다운 -->
      <div v-if="showLogoutTimer && timeVisible" class="mb-3 px-3 py-2 rounded bg-yellow-100 text-yellow-800 text-sm">
        ⏱ 자동 로그아웃까지: <strong>{{ mmss }}</strong>
      </div>

      <!-- 사용자 정보 & 로그아웃 -->
      <div class="mt-auto text-sm text-gray-300">
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

    <!-- ✅ Overlay (Tablet/Mobile 전용) -->
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
      @click="closeSidebar"
    ></div>

    <!-- ✅ 본문 -->
    <main class="flex-1 bg-gray-100 p-6 overflow-y-auto lg:ml-64">
      <!-- 햄버거 버튼 (Tablet/Mobile 전용) -->
      <button
        class="lg:hidden mb-4 px-3 py-2 bg-purple-600 text-white rounded"
        @click="toggleSidebar"
      >
        ☰ 메뉴
      </button>

      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "./store/userStore";
import { useAutoLogout } from "@/composables/useAutoLogout";
import axios from "axios";
const showLogoutTimer = true  //자동로그인이 안될 경우에 true 로 변경해서 확인

const router = useRouter();
const userStore = useUserStore();

// 프로젝트 로그아웃 로직: Pinia + 라우팅
async function projectLogout() {
  await userStore.logout();
  router.push("/login");
}

const { start, stop, reset, remainingMs, isExcluded } = useAutoLogout({
  timeoutMs: 1 * 60 * 1000,
  onLogout: projectLogout,
  excludePaths: ["/login", "/auth/*"],
  getCurrentPath: () => router.currentRoute.value.path,
  resetOnFetch: false,                       // 폴링이 있다면 false 권장
  debug: false,
});

onMounted(() => {
  start();
  router.afterEach(() => {
    start();   // ✅ 멱등. stop된 상태면 재등록, 이미 시작이면 noop
    reset();   // ✅ 경로에 따라 무장/해제
  });

  userStore.loadSession();

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

// ✅ 전체 메뉴 정의
const allMenus = [
  { label: "보고서 작성", path: "/reportForm", icon: "📝" },
  { label: "청구목록 조회", path: "/approvalList", icon: "📑" },
  { label: "내결재목록 조회", path: "/approvalStatus", icon: "✅" },
  { label: "계정과목 관리", path: "/accountCategories", icon: "📊" },
  { label: "예산 관리", path: "/budgets", icon: "💰" }, 
  { label: "예산집행 현황", path: "/budgetStatus", icon: "🏛" },
  { label: "사용자 관리", path: "/userManagement", icon: "👤" },
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
    userStore.access.some(
      (a) => a.menu_name === m.label && a.access_type === "all"
    )
  );

  console.log("✅ 필터링된 메뉴(allowedMenus):", filtered);

  return filtered;
});


// ✅ Sidebar 상태 (모바일/테블릿용)
const isOpen = ref(false);
const toggleSidebar = () => { isOpen.value = !isOpen.value; };
const closeSidebar = () => { isOpen.value = false; };

const logout = async () => {
  await axios.post("/api/logout", {}, { withCredentials: true });
  userStore.clearUser();
  router.push("/login");
};

</script>
