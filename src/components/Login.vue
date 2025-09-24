<template>
  <div class="h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 shadow rounded-lg w-96">
      <h2 class="text-2xl font-bold mb-6 text-center">🔐 로그인</h2>

      <input
        v-model="userId"
        type="text"
        placeholder="사용자 ID"
        class="w-full mb-3 p-2 border rounded"
      />

      <input
        v-model="password"
        type="password"
        placeholder="비밀번호"
        class="w-full mb-3 p-2 border rounded"
        @keyup.enter="login"
      />

      <button
        @click="login"
        class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
      >
        로그인
      </button>

      <p v-if="error" class="text-red-500 mt-3">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useUserStore } from "../store/userStore";

const userId = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();
const userStore = useUserStore();

const login = async () => {
  try {
    const res = await axios.post("/api/login",
      { userId: userId.value, password: password.value },
      { withCredentials: true });
    if (res.data.success) {
      console.log("/api/login - res:", res);
      await userStore.loadSession();   // ✅ 세션에서 사용자 정보 가져오기
      const roles = userStore.roles.map(r => r.role_name || r);

      if (roles.includes("회계")) {
        router.push("/reportForm");    // 회계 → 보고서 작성 화면
      } else {
        router.push("/approvalStatus"); // 나머지 → 결재목록 조회 화면
      }
    }
  } catch (err) {
    error.value = "로그인 실패";
  }
};
</script>