<template>
  <div class="w-64 bg-gray-900 text-white h-screen flex flex-col shadow-xl">
    <!-- 로고/제목 -->
    <div class="px-6 py-8 border-b border-gray-700/60">
      <h1 class="text-xl font-semibold tracking-tight text-white">
        교회 재정관리
      </h1>
      <p class="mt-1 text-xs font-medium uppercase tracking-widest text-gray-500">
        Menu
      </p>
    </div>

    <!-- 메뉴 -->
    <nav class="flex-1 overflow-y-auto py-4">
      <ul class="space-y-0.5 px-3">
        <li v-for="m in allowedMenus" :key="m.path">
          <RouterLink
            :to="m.path"
            class="block rounded-lg px-4 py-3 text-sm font-medium tracking-wide transition-all duration-200"
            :class="isActive(m.path)
              ? 'bg-gray-700/90 text-white shadow-inner'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'"
          >
            {{ m.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <!-- 사용자 정보 -->
    <div class="border-t border-gray-700/60 p-4">
      <div v-if="user" class="mb-3 rounded-lg bg-gray-800/60 px-3 py-2.5 text-xs text-gray-400">
        <p class="font-medium text-gray-300">{{ user.userName }}</p>
        <p class="mt-0.5 truncate">{{ user.deptName }}</p>
      </div>
      <button
        v-if="user"
        @click="logout"
        class="w-full rounded-lg bg-gray-700 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-red-600 hover:text-white"
      >
        로그아웃
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "../store/userStore";
import axios from "axios";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

onMounted(() => {
  userStore.loadSession(); // 새로고침 시에도 세션 복구
});

const user = computed(() => userStore.user);

function isActive(path) {
  return route.path === path || (path !== "/" && route.path.startsWith(path));
}

const allowedMenus = computed(() => {
  if (!user.value) return [];

  // 전체 메뉴 정의 (label은 role_access의 menu_name과 일치해야 함)
  const allMenus = [
    { label: "지출결의서 작성", path: "/reportForm" },
    { label: "청구목록 조회", path: "/approvalList" },
    { label: "내결재목록 조회", path: "/approvalStatus" },
    { label: "부서 관리", path: "/departments" },
    { label: "사용자 관리", path: "/userManagement" },
    { label: "결재선 관리", path: "/approval-lines" },
    { label: "권한 관리", path: "/roleAccess" },
    { label: "계정과목 관리", path: "/accountCategories" },
    { label: "예산 관리", path: "/budgets" },
    { label: "예산집행 현황", path: "/budgetStatus" },
    { label: "부서 예산집행 현황", path: "/deptBudgetStatus" },
  ];

  // ✅ role_access 테이블에 access_type = 'all' 등록된 메뉴만 표시
  // 🔍 디버깅 로그 추가
  console.log("✅ allMenus:", allMenus);
  console.log("✅ userStore.access:", userStore.access);

  const result = allMenus.filter((m) =>
    userStore.access.some((a) => {
      const match = a.menu_name === m.label && a.access_type === "all";
      if (match) {
        console.log(`✅ 메뉴 허용됨: ${m.label}`);
      }
      return match;
    })
  );

  console.log("👉 최종 allowedMenus:", result);
  return result;
});

const logout = async () => {
  await axios.post("/api/logout", {}, { withCredentials: true });
  userStore.clearUser();
  router.push("/login");
};
</script>
