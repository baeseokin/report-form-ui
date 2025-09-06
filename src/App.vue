<template>
  <div class="flex h-screen font-nanum">
    <!-- 사이드바 -->
    <aside class="w-64 bg-gray-800 text-white flex flex-col p-6">
      <h2 class="text-2xl font-bold mb-8">📑 메뉴</h2>

      <nav class="flex-1 space-y-4">
        <!-- ✅ 로그인 사용자만 메뉴 표시 -->
        <template v-if="user">
          <router-link
            v-for="m in allowedMenus"
            :key="m.path"
            :to="m.path"
            class="block hover:bg-gray-700 px-3 py-2 rounded"
          >
            {{ m.icon }} {{ m.label }}
          </router-link>
        </template>
      </nav>

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

    <!-- 본문 -->
    <main class="flex-1 bg-gray-100 p-6 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "./store/userStore";
import axios from "axios";

const router = useRouter();
const userStore = useUserStore();

onMounted(() => {
  userStore.loadSession();
});

const user = computed(() => userStore.user);

// ✅ 전체 메뉴 정의
const allMenus = [
  { label: "보고서 작성", path: "/reportForm", icon: "📝" },
  { label: "청구목록 조회", path: "/approvalList", icon: "📑" },
  { label: "결재목록 조회", path: "/approvalStatus", icon: "✅" },
  { label: "사용자 관리", path: "/userManagement", icon: "👤" },
  { label: "권한 관리", path: "/roleAccess", icon: "🔑" },
];

// ✅ role_access 기준으로 필터링
const allowedMenus = computed(() => {
  if (!user.value) return [];
  return allMenus.filter((m) =>
    userStore.access.some((a) => a.menu_name === m.label && a.access_type === "all")
  );
});

const logout = async () => {
  await axios.post("/api/logout", {}, { withCredentials: true });
  userStore.clearUser();
  router.push("/login");
};
</script>
