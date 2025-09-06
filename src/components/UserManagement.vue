<template>
  <div class="flex h-screen font-nanum">
    <!-- 좌측: 검색 & 목록 -->
    <div class="w-1/2 border-r overflow-y-auto bg-gray-50 flex flex-col">
      <h2 class="text-xl font-bold p-4 border-b bg-white">👥 사용자 검색</h2>

      <!-- 🔍 검색 조건 -->
      <div class="p-4 space-y-2 border-b bg-gray-100">
        <!-- 부서 선택 -->
        <div>
          <label class="block text-sm font-semibold">부서</label>
          <select v-model="filters.dept" class="w-full border px-2 py-1 rounded">
            <option value="">전체</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.name">
              {{ dept.name }}
            </option>
          </select>
        </div>

        <!-- 역할 선택 -->
        <div>
          <label class="block text-sm font-semibold">역할</label>
          <select v-model="filters.role" class="w-full border px-2 py-1 rounded">
            <option value="">전체</option>
            <option v-for="role in roles" :key="role.id" :value="role.name">
              {{ role.name }}
            </option>
          </select>
        </div>

        <!-- 사용자명 입력 -->
        <div>
          <label class="block text-sm font-semibold">사용자명</label>
          <input
            v-model="filters.name"
            placeholder="이름 입력"
            class="w-full border px-2 py-1 rounded"
          />
        </div>

        <!-- 조회 버튼 -->
        <div class="pt-2">
          <button
            @click="searchUsers"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            조회
          </button>
        </div>
      </div>

      <!-- 사용자 목록 (테이블) -->
      <div class="flex-1 overflow-y-auto p-4">
        <table class="w-full border-collapse border">
          <thead>
            <tr class="bg-gray-200 text-left">
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
              class="cursor-pointer hover:bg-gray-100"
              :class="selectedUser && selectedUser.id === user.id ? 'bg-gray-300 font-semibold' : ''"
            >
              <td class="border px-3 py-2">{{ user.userId }}</td>
              <td class="border px-3 py-2">{{ user.name }}</td>
              <td class="border px-3 py-2">{{ user.dept }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 우측: 사용자 상세 -->
    <div class="w-1/2 p-6 overflow-y-auto">
      <div v-if="selectedUser">
        <h2 class="text-2xl font-bold mb-4">📋 사용자 상세</h2>
        <div class="space-y-3">
          <label class="block">
            <span class="font-semibold">이름:</span>
            <input v-model="selectedUser.name" class="border px-3 py-2 rounded w-64 ml-2" />
          </label>
          <label class="block">
            <span class="font-semibold">이메일:</span>
            <input v-model="selectedUser.email" class="border px-3 py-2 rounded w-64 ml-2" />
          </label>
          <label class="block">
            <span class="font-semibold">부서:</span>
            <select v-model="selectedUser.dept" class="border px-3 py-2 rounded w-64 ml-2">
              <option v-for="dept in departments" :key="dept.id" :value="dept.name">
                {{ dept.name }}
              </option>
            </select>
          </label>
          <!-- ✅ 다중 역할 선택 -->
          <label class="block">
            <span class="font-semibold">역할:</span>
            <select v-model="selectedUser.roles" multiple class="border px-3 py-2 rounded w-64 ml-2 h-32">
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </label>



          <!-- ✅ 비밀번호 변경 -->
          <label class="block">
            <span class="font-semibold">새 비밀번호:</span>
            <input
              type="password"
              v-model="selectedUser.newPassword"
              class="border px-3 py-2 rounded w-64 ml-2"
            />
          </label>
          <label class="block">
            <span class="font-semibold">비밀번호 확인:</span>
            <input
              type="password"
              v-model="selectedUser.confirmPassword"
              class="border px-3 py-2 rounded w-64 ml-2"
            />
          </label>

          <!-- 버튼 -->
          <div class="flex space-x-4 mt-6">
            <button
              @click="updateUser"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              저장하기
            </button>
            <button
              @click="deleteUser"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
    // ✅ 부서 조회 (departments 테이블에서 가져오기)
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
        // ✅ role_id, role_name 매핑
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
          const res = await axios.get("/api/users/search", {
            params: this.filters,
          });

          // ✅ roles를 배열로 변환 (예: "관리자,회계" → [1, 6])
          this.users = res.data.map(u => ({
            ...u,
            roles: u.roles ? u.roles.split(",").map(r => r.trim()) : []
          }));
        } catch (err) {
          console.error("사용자 검색 실패:", err);
        }
      },
      selectUser(user) {
        // ✅ 다중 역할 배열 유지
        this.selectedUser = { ...user, newPassword: "", confirmPassword: "" };
      },
      async updateUser() {
        try {
          if (this.selectedUser.newPassword && this.selectedUser.newPassword !== this.selectedUser.confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
          }

          const payload = { ...this.selectedUser };
          if (!payload.newPassword) {
            delete payload.newPassword; // 비밀번호 변경 없으면 전달하지 않음
          }

          // ✅ roles 배열 전달
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
