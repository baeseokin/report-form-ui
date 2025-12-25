<template>
  <div class="p-6 font-nanum bg-white shadow rounded-lg">
    <!-- ✅ 화면 제목 -->
    <h2 class="text-2xl font-bold text-purple-700 mb-6">🔑 권한 관리</h2>

    <!-- 역할 선택 -->
    <div class="mb-6">
      <label class="block font-semibold mb-2">역할 선택</label>
      <select v-model="selectedRole" @change="loadAccess"
              class="border p-2 rounded w-64 focus:ring-2 focus:ring-purple-400">
        <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.role_name }}</option>
      </select>
    </div>

    <!-- 메뉴 접근 권한 테이블 -->
    <table class="w-full border text-center mb-6">
      <thead class="bg-purple-100 text-gray-800">
        <tr>
          <th class="border p-2">메뉴</th>
          <th class="border p-2">접근 (all)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in menus" :key="m" class="hover:bg-gray-50">
          <td class="border p-2 font-medium text-gray-700">{{ m }}</td>
          <td class="border">
            <input type="checkbox"
                   v-model="localAccess[m]"
                   class="w-5 h-5 accent-purple-600" />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ✅ 저장 버튼 -->
    <div class="flex justify-end">
      <button @click="saveAccess"
              class="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow hover:from-purple-600 hover:to-indigo-700 transition"
      >
        저장하기
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import axios from "axios";

const roles = ref([]);
const selectedRole = ref(null);
const access = ref([]);
const localAccess = reactive({}); // ✅ 체크박스 로컬 상태

const menus = [
  "보고서 작성",
  "청구목록 조회",
  "내결재목록 조회",
  "부서 관리",
  "사용자 관리",
  "권한 관리",
  "계정과목 관리",
  "예산 관리",
  "예산집행 현황",
  "이메일 테스트"
];

// 역할 목록 불러오기
onMounted(async () => {
  const res = await axios.get("/api/roles");
  roles.value = res.data.map(r => ({
    id: r.role_id,
    role_name: r.role_name
  }));
});

// 특정 역할의 접근 권한 불러오기
const loadAccess = async () => {
  if (!selectedRole.value) return;
  const res = await axios.get(`/api/access/${selectedRole.value}`);
  access.value = res.data.access;

  // ✅ localAccess 갱신
  menus.forEach(m => {
    localAccess[m] = access.value.some(a => a.menu_name === m && a.access_type === "all");
  });
};

// 저장 버튼 클릭 시 서버 반영
const saveAccess = async () => {
  if (!selectedRole.value) {
    alert("먼저 역할을 선택하세요.");
    return;
  }

  // 모든 메뉴 순회해서 enabled 상태 전송
  for (const menu of menus) {
    const enabled = localAccess[menu] === true;
    await axios.post("/api/access", {
      roleId: selectedRole.value,
      menuName: menu,
      accessType: "all",
      enabled
    });
  }

  alert("권한이 저장되었습니다.");
  await loadAccess();
};
</script>
