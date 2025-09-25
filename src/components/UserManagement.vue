<template>
  <div class="flex h-screen font-nanum">
    <!-- 좌측: 검색 & 목록 -->
    <div class="w-1/2 border-r overflow-y-auto bg-gray-50 flex flex-col">
      <!-- ✅ 화면 제목 -->
      <h2 class="text-2xl font-bold text-purple-700 mb-6 p-4 border-b bg-white">
        👥 사용자 관리
      </h2>

      <!-- 🔍 검색 조건 -->
      <div class="p-4 space-y-4 border-b bg-white shadow-inner">
        <!-- 부서 선택 -->
        <div>
          <label class="block text-sm font-semibold text-gray-700">부서</label>
          <select v-model="filters.dept" class="w-full border rounded-lg px-3 py-2">
            <option value="">전체</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.name">
              {{ dept.name }}
            </option>
          </select>
        </div>

        <!-- 역할 선택 -->
        <div>
          <label class="block text-sm font-semibold text-gray-700">역할</label>
          <select v-model="filters.role" class="w-full border rounded-lg px-3 py-2">
            <option value="">전체</option>
            <option v-for="role in roles" :key="role.id" :value="role.name">
              {{ role.name }}
            </option>
          </select>
        </div>

        <!-- 사용자명 입력 -->
        <div>
          <label class="block text-sm font-semibold text-gray-700">사용자명</label>
          <input
            v-model="filters.name"
            placeholder="이름 입력"
            class="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <!-- 조회 버튼 -->
        <div class="pt-2">
          <button
            @click="searchUsers"
            class="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow hover:from-purple-600 hover:to-indigo-700 transition"
          >
            조회
          </button>
        </div>
      </div>

      <!-- 사용자 목록 -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-purple-100 text-gray-700">
                <th class="border px-3 py-2">사용자ID</th>
                <th class="border px-3 py-2">사용자명</th>
                <th class="border px-3 py-2">부서명</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.id"
                @click="selectUser(user)"
                class="cursor-pointer hover:bg-purple-50 transition"
                :class="selectedUser && selectedUser.id === user.id ? 'bg-purple-200 font-semibold' : ''"
              >
                <td class="border px-3 py-2">{{ user.userId }}</td>
                <td class="border px-3 py-2">{{ user.name }}</td>
                <td class="border px-3 py-2">{{ user.dept }}</td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="3" class="text-center text-gray-500 p-4">검색 결과가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 우측: 사용자 상세 -->
    <div class="w-1/2 p-6 overflow-y-auto bg-gray-50">
      <div v-if="selectedUser">
        <h2 class="text-2xl font-bold mb-6 text-purple-700">📋 사용자 상세</h2>
        <div class="space-y-4 bg-white p-6 rounded-lg shadow">
          <label class="block">
            <span class="font-semibold text-gray-700">이름</span>
            <input v-model="selectedUser.name" class="border px-3 py-2 rounded-lg w-64 ml-2" />
          </label>

          <label class="block">
            <span class="font-semibold text-gray-700">이메일</span>
            <input v-model="selectedUser.email" class="border px-3 py-2 rounded-lg w-64 ml-2" />
          </label>

          <label class="block">
            <span class="font-semibold text-gray-700">부서</span>
            <select v-model="selectedUser.dept" class="border px-3 py-2 rounded-lg w-64 ml-2">
              <option v-for="dept in departments" :key="dept.id" :value="dept.name">
                {{ dept.name }}
              </option>
            </select>
          </label>

          <!-- ✅ 다중 역할 선택 -->
          <label class="block">
            <span class="font-semibold text-gray-700">역할</span>
            <select v-model="selectedUser.roles" multiple class="border px-3 py-2 rounded-lg w-64 ml-2 h-32">
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </label>

          <!-- ✅ 비밀번호 변경 -->
          <label class="block">
            <span class="font-semibold text-gray-700">새 비밀번호</span>
            <input
              type="password"
              v-model="selectedUser.newPassword"
              class="border px-3 py-2 rounded-lg w-64 ml-2"
            />
          </label>

          <label class="block">
            <span class="font-semibold text-gray-700">비밀번호 확인</span>
            <input
              type="password"
              v-model="selectedUser.confirmPassword"
              class="border px-3 py-2 rounded-lg w-64 ml-2"
            />
          </label>

          <!-- 버튼 -->
          <div class="flex space-x-4 mt-6">
            <button
              @click="updateUser"
              class="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow hover:from-purple-600 hover:to-indigo-700 transition"
            >
              저장하기
            </button>
            <button
              @click="deleteUser"
              class="px-6 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
            >
              삭제하기
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-gray-500 text-lg flex items-center justify-center h-full">
        좌측에서 사용자를 선택하세요.
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "UserManagement",
  data() {
    return {
      users: [],
      departments: [],
      roles: [],
      selectedUser: null,
      filters: {
        dept: "",
        role: "",
        name: "",
      },
    };
  },
  methods: {
    async fetchDepartments() {
      try {
        const res = await axios.get("/api/departments");
        this.departments = res.data.map(d => ({
          id: d.id,
          name: d.dept_name
        }));
      } catch (err) {
        console.error("부서 데이터 불러오기 실패:", err);
      }
    },
    async fetchRoles() {
      try {
        const res = await axios.get("/api/roles");
        this.roles = res.data.map(r => ({
          id: r.role_id,
          name: r.role_name
        }));
      } catch (err) {
        console.error("역할 데이터 불러오기 실패:", err);
      }
    },
    async searchUsers() {
      try {
        const res = await axios.get("/api/users/search", { params: this.filters });
        this.users = res.data.map(u => ({
          ...u,
          roles: u.roles ? u.roles.split(",").map(r => r.trim()) : []
        }));
      } catch (err) {
        console.error("사용자 검색 실패:", err);
      }
    },
    selectUser(user) {
      this.selectedUser = { ...user, newPassword: "", confirmPassword: "" };
    },
    async updateUser() {
      try {
        if (this.selectedUser.newPassword && this.selectedUser.newPassword !== this.selectedUser.confirmPassword) {
          alert("비밀번호가 일치하지 않습니다.");
          return;
        }
        const payload = { ...this.selectedUser };
        if (!payload.newPassword) delete payload.newPassword;
        await axios.put(`/api/users/${this.selectedUser.id}`, payload);
        alert("사용자가 성공적으로 업데이트되었습니다.");
        this.searchUsers();
      } catch (err) {
        console.error("업데이트 실패:", err);
        alert("업데이트 중 오류가 발생했습니다.");
      }
    },
    async deleteUser() {
      if (!confirm("정말로 이 사용자를 삭제하시겠습니까?")) return;
      try {
        await axios.delete(`/api/users/${this.selectedUser.id}`);
        alert("사용자가 삭제되었습니다.");
        this.selectedUser = null;
        this.searchUsers();
      } catch (err) {
        console.error("삭제 실패:", err);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  },
  mounted() {
    this.fetchDepartments();
    this.fetchRoles();
    this.searchUsers();
  },
};
</script>
