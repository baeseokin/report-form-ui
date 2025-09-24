<template>
  <div class="w-64 bg-gray-800 text-white h-screen flex flex-col">
    <!-- 로고/제목 -->
    <div class="p-6 text-2xl font-bold border-b border-gray-700">
      교회 재정관리
    </div>

    <!-- 메뉴 -->
    <nav class="flex-1 p-4 space-y-2">
      <RouterLink
        v-for="m in allowedMenus"
        :key="m.path"
        :to="m.path"
        class="block px-4 py-2 rounded hover:bg-gray-700"
      >
        {{ m.icon }} {{ m.label }}
      </RouterLink>
    </nav>

    <!-- 사용자 정보 -->
    <div class="p-4 border-t border-gray-700">
      <p v-if="user" class="text-sm mb-2">
        👤 {{ user.userName }} ({{ user.userId }}) <br />
        권한: {{ user.roles.map(r => r.role_name).join(", ") }} <br />
        부서: {{ user.deptName }}
      </p>
      <button
        v-if="user"
        @click="logout"
        class="w-full bg-red-500 py-2 rounded hover:bg-red-600"
      >
        로그아웃
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../store/userStore";
import axios from "axios";

const router = useRouter();
const userStore = useUserStore();

onMounted(() => {
  userStore.loadSession(); // 새로고침 시에도 세션 복구
});

const user = computed(() => userStore.user);

const allowedMenus = computed(() => {
  if (!user.value) return [];

  // 전체 메뉴 정의
  const allMenus = [
    { label: "보고서 작성", path: "/reportForm", icon: "📝" },
    { label: "청구목록 조회", path: "/approvalList", icon: "📑" },
    { label: "내결재목록 조회", path: "/approvalStatus", icon: "✅" },
    { label: "사용자 관리", path: "/userManagement", icon: "👤" },
    { label: "권한 관리", path: "/roleAccess", icon: "🔑" },
    { label: "계정과목 관리", path: "/accountCategories", icon: "📊" },
    { label: "예산 관리", path: "/budgets", icon: "💰" }, 
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
