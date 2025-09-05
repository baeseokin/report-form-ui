<template>
  <div class="flex h-screen font-nanum">
    <!-- 사이드바 -->
    <aside class="w-64 bg-gray-800 text-white flex flex-col p-6">
      <h2 class="text-2xl font-bold mb-8">📑 메뉴</h2>

      <nav class="flex-1 space-y-4">
        <!-- ✅ 로그인 사용자만 메뉴 표시 -->
        <template v-if="user">
          <!-- 기본 메뉴 -->
          <router-link
            to="/reportForm"
            class="block hover:bg-gray-700 px-3 py-2 rounded"
          >
            보고서 작성
          </router-link>
          <router-link
            to="/approvalList"
            class="block hover:bg-gray-700 px-3 py-2 rounded"
          >
            청구목록 조회
          </router-link>
          <router-link
            to="/approvalStatus"
            class="block hover:bg-gray-700 px-3 py-2 rounded"
          >
            결재목록 조회
          </router-link>

          <!-- 관리자 전용 -->
          <div v-if="roles.includes('관리자')">
            <router-link
              to="/userManagement"
              class="block hover:bg-purple-700 px-3 py-2 rounded"
            >
              사용자 관리
            </router-link>
            <router-link
              to="/roleAccess"
              class="block hover:bg-purple-700 px-3 py-2 rounded"
            >
              권한 관리
            </router-link>
          </div>
        </template>
      </nav>

      <!-- 사용자 정보 & 로그아웃 -->
      <div class="mt-auto text-sm text-gray-300">
        <div v-if="user">
          👤 {{ user.userName }} ({{ user.userId }})<br />
          권한: {{ roles.join(", ") }}<br />
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
const roles = computed(() => userStore.roles);

const logout = async () => {
  await axios.post("/api/logout", {}, { withCredentials: true });
  userStore.clearUser();
  router.push("/login");
};
</script>
