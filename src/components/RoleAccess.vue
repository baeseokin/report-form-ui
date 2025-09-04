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
    <table class="w-full border text-center">
      <thead class="bg-gray-200">
        <tr>
          <th class="border p-2">메뉴</th>
          <th class="border p-2">조회(view)</th>
          <th class="border p-2">수정(edit)</th>
          <th class="border p-2">삭제(delete)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in menus" :key="m">
          <td class="border p-2">{{ m }}</td>
          <td class="border">
            <input type="checkbox" :checked="hasAccess(m,'view')"
                   @change="toggleAccess(m,'view',$event.target.checked)" />
          </td>
          <td class="border">
            <input type="checkbox" :checked="hasAccess(m,'edit')"
                   @change="toggleAccess(m,'edit',$event.target.checked)" />
          </td>
          <td class="border">
            <input type="checkbox" :checked="hasAccess(m,'delete')"
                   @change="toggleAccess(m,'delete',$event.target.checked)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const roles = ref([]);
const selectedRole = ref(null);
const access = ref([]);

const menus = [
  "보고서 작성",
  "청구목록 조회",
  "결재목록 조회",
  "결재 처리",
  "사용자 관리",
  "권한 관리"
];

onMounted(async () => {
  const res = await axios.get("http://localhost:3001/api/roles");
  roles.value = res.data.roles;
});

const loadAccess = async () => {
  if (!selectedRole.value) return;
  const res = await axios.get(`http://localhost:3001/api/access/${selectedRole.value}`);
  access.value = res.data.access;
};

const hasAccess = (menu, type) => {
  return access.value.some(a => a.menu_name === menu && a.access_type === type);
};

const toggleAccess = async (menu, type, enabled) => {
  await axios.post("http://localhost:3001/api/access", {
    roleId: selectedRole.value,
    menuName: menu,
    accessType: type,
    enabled
  });
  await loadAccess();
};
</script>
