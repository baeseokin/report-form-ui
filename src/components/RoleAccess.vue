<template>
  <div class="p-6 bg-white shadow rounded-lg">
    <h2 class="text-2xl font-bold mb-6">🔑 권한별 접근 관리</h2>

    <!-- 역할 선택 -->
    <label class="block font-semibold mb-2">역할 선택</label>
    <select v-model="selectedRole" @change="loadAccess"
            class="border p-2 rounded mb-6 w-64">
      <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.role_name }}</option>
    </select>

    <!-- 메뉴 접근 권한 테이블 -->
    <table class="w-full border text-center mb-4">
      <thead class="bg-gray-200">
        <tr>
          <th class="border p-2">메뉴</th>
          <th class="border p-2">접근(all)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in menus" :key="m">
          <td class="border p-2">{{ m }}</td>
          <td class="border">
            <input type="checkbox"
                   v-model="localAccess[m]" />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ✅ 저장 버튼 -->
    <div>
      <button @click="saveAccess"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
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
  "결재목록 조회",
  "사용자 관리",
  "권한 관리"
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
