<template>
  <div class="p-6 bg-white shadow rounded-lg">
    <h2 class="text-2xl font-bold mb-6">👤 사용자 관리</h2>

    <form @submit.prevent="addUser" class="space-y-4">
      <input v-model="userId" placeholder="사용자 ID" class="border p-2 w-full"/>
      <input v-model="userName" placeholder="사용자명" class="border p-2 w-full"/>
      <input v-model="deptName" type="text" placeholder="부서명" class="w-full mb-3 p-2 border rounded"/>
      <input v-model="email" placeholder="이메일" class="border p-2 w-full"/>
      <input v-model="phone" placeholder="전화번호" class="border p-2 w-full"/>
      <input v-model="password" type="password" placeholder="비밀번호"
             class="border p-2 w-full"/>
      
      <div>
        <label class="font-semibold">권한</label>
        <div class="flex flex-wrap gap-2">
          <label v-for="r in roles" :key="r.id" class="flex items-center gap-2">
            <input type="checkbox" :value="r.id" v-model="selectedRoles" />
            {{ r.role_name }}
          </label>
        </div>
      </div>

      <button class="bg-purple-600 text-white px-4 py-2 rounded">등록</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const userId = ref("");
const userName = ref("");
const email = ref("");
const deptName = ref("");
const phone = ref("");
const password = ref("");
const roles = ref([]);
const selectedRoles = ref([]);

const addUser = async () => {
  await axios.post("http://localhost:3001/api/users", {
    userId: userId.value,
    userName: userName.value,
    email: email.value,
    phone: phone.value,
    deptName: deptName.value,   // ✅ 추가됨
    password: password.value,
    roles: selectedRoles.value
  });
  alert("사용자 등록 완료");
};

onMounted(async () => {
  const res = await axios.get("http://localhost:3001/api/roles");
  roles.value = res.data.roles;
});
</script>
