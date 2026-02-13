<template>
  <div class="font-nanum text-gray-800 min-h-screen bg-gray-50 pb-safe">
    <!-- Header (부서 관리와 동일 스타일) -->
    <div class="sticky top-0 z-10 bg-purple-50 border-b border-purple-100">
      <div class="p-3 flex justify-between items-center flex-wrap gap-2">
        <h3 class="font-bold text-base text-purple-800">👤 사용자 관리</h3>
        <div class="flex items-center gap-1">
          <button
            @click="newUser"
            class="px-3 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 active:bg-purple-200 text-sm font-medium touch-manipulation"
          >
            ＋ 사용자 등록
          </button>
        </div>
      </div>
    </div>

    <div class="px-4 py-4 space-y-4">
      <!-- 검색조건 접기/펼치기 (보라색 스타일) -->
      <div class="mb-4 bg-purple-100 rounded-lg border border-purple-200 shadow-sm overflow-hidden">
        <!-- 접힌 상태: 터치하면 펼침 -->
        <button
          type="button"
          @click="showFilters = true"
          class="w-full flex items-center justify-between p-3 text-left hover:bg-purple-200 active:bg-purple-300 transition"
          :class="{ 'hidden': showFilters }"
        >
          <span class="font-semibold text-gray-700">검색조건</span>
          <span class="text-sm text-gray-500 truncate flex-1 mx-2">{{ searchConditionSummary }}</span>
          <span class="text-gray-400 shrink-0">▼</span>
        </button>

        <!-- 펼친 상태: 조건 영역 -->
        <div v-show="showFilters" class="border-t border-purple-200">
          <button
            type="button"
            @click="showFilters = false"
            class="w-full flex items-center justify-between p-3 text-left bg-purple-200 hover:bg-purple-300 active:bg-purple-400 transition"
          >
            <span class="font-semibold text-gray-700">검색조건 접기</span>
            <span class="text-gray-400">▲</span>
          </button>
          <div class="p-3 pt-4 space-y-3 bg-white">
            <div>
              <label class="block text-sm mb-1">부서</label>
              <select v-model="filters.dept" class="w-full mobile-form-control mobile-form-control-select">
                <option value="">전체</option>
                <option v-for="dept in departments" :key="dept.id" :value="dept.name">
                  {{ dept.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">역할</label>
              <select v-model="filters.role" class="w-full mobile-form-control mobile-form-control-select">
                <option value="">전체</option>
                <option v-for="role in roles" :key="role.id" :value="role.name">
                  {{ role.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">사용자명</label>
              <input
                v-model="filters.name"
                placeholder="이름 입력"
                class="w-full mobile-form-control"
              />
            </div>
            <button
              type="button"
              @click="searchUsers"
              class="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-purple-700 active:bg-purple-800 transition touch-manipulation"
            >
              조회
            </button>
          </div>
        </div>
      </div>

      <!-- 사용자 목록 (카드 형태) -->
      <section class="bg-white rounded-xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-800">사용자 목록</h2>
          <span class="text-xs text-gray-500">총 {{ users.length }}명</span>
        </div>

        <p v-if="users.length === 0" class="text-sm text-gray-500 py-6 text-center">
          검색 결과가 없습니다.
        </p>
        <ul v-else class="space-y-2 max-h-[280px] overflow-y-auto">
          <li
            v-for="user in users"
            :key="user.id"
            @click="selectUser(user)"
            class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer touch-manipulation active:bg-purple-50 transition"
            :class="selectedUser && selectedUser.id === user.id ? 'bg-purple-100 border-purple-300' : 'border-gray-200 hover:bg-gray-50'"
          >
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-800 truncate">{{ user.name }}</p>
              <p class="text-xs text-gray-500 truncate">{{ user.userId }} · {{ user.dept }}</p>
              <p class="text-xs text-gray-600 mt-0.5">{{ user.roleNames || '-' }}</p>
            </div>
            <span v-if="selectedUser && selectedUser.id === user.id" class="text-purple-600 text-lg">✓</span>
          </li>
        </ul>
      </section>

      <!-- 사용자 상세/등록 폼 -->
      <section v-if="selectedUser" class="bg-white rounded-xl shadow p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-purple-800">
            {{ selectedUser.isNew ? '🆕 사용자 등록' : '📋 사용자 상세' }}
          </h2>
          <div class="flex gap-1">
            <button
              v-if="!selectedUser.isNew"
              @click="newUser"
              class="px-2 py-1.5 text-xs bg-emerald-500 text-white rounded-lg touch-manipulation"
            >
              신규
            </button>
            <button
              @click="clearSelection"
              class="px-2 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg touch-manipulation"
            >
              닫기
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <label class="block text-sm font-semibold text-gray-700">
            사용자ID
            <input
              v-model="selectedUser.userId"
              :disabled="!selectedUser.isNew"
              class="mt-1 w-full mobile-form-control disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="예: user01"
            />
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            이름
            <input
              v-model="selectedUser.name"
              class="mt-1 w-full mobile-form-control"
              placeholder="예: 홍길동"
            />
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            이메일
            <input
              v-model="selectedUser.email"
              type="email"
              class="mt-1 w-full mobile-form-control"
              placeholder="예: user@example.com"
              autocomplete="email"
            />
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            부서
            <select
              v-model="selectedUser.dept"
              class="mt-1 w-full mobile-form-control mobile-form-control-select"
            >
              <option v-for="dept in departments" :key="dept.id" :value="dept.name">
                {{ dept.name }}
              </option>
            </select>
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            역할
            <select
              v-model="selectedUser.roles[0]"
              class="mt-1 w-full mobile-form-control mobile-form-control-select"
            >
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            {{ selectedUser.isNew ? '비밀번호' : '새 비밀번호' }}
            <input
              type="password"
              v-model="selectedUser.newPassword"
              class="mt-1 w-full mobile-form-control"
              autocomplete="new-password"
            />
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            비밀번호 확인
            <input
              type="password"
              v-model="selectedUser.confirmPassword"
              class="mt-1 w-full mobile-form-control"
              autocomplete="new-password"
            />
          </label>
        </div>

        <!-- 서명 영역 -->
        <div class="border-t pt-4 mt-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700">서명</span>
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1.5 text-xs">
                <input type="checkbox" v-model="setAsDefault" class="rounded" />
                <span>기본 지정</span>
              </label>
              <button @click="clearCanvas" class="px-2 py-1 bg-gray-100 rounded text-xs touch-manipulation">
                지우기
              </button>
              <button
                v-if="!selectedUser?.isNew"
                @click="saveSignatureNow"
                :disabled="!hasSignature"
                class="px-2 py-1 bg-emerald-500 text-white rounded text-xs touch-manipulation disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="flex flex-col items-center gap-1">
              <span class="text-xs text-gray-500">기본 서명</span>
              <div class="w-16 h-16 border rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                <img
                  v-if="defaultSignaturePath"
                  :src="`/api/files/${encodeURIComponent(defaultSignaturePath)}`"
                  class="object-contain w-full h-full"
                />
                <span v-else class="text-[10px] text-gray-400">없음</span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="border rounded-lg bg-white overflow-hidden relative">
                <canvas ref="signCanvas" class="w-full touch-none block" style="height: 140px;"></canvas>
                <div class="absolute bottom-1 right-2 text-[10px] text-gray-400 select-none">
                  손가락으로 서명
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="flex flex-wrap gap-2 pt-2">
          <button
            v-if="selectedUser.isNew"
            @click="createUser"
            class="flex-1 min-w-[120px] py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium touch-manipulation active:scale-[0.98]"
          >
            등록하기
          </button>
          <button
            v-else
            @click="updateUser"
            class="flex-1 min-w-[120px] py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium touch-manipulation active:scale-[0.98]"
          >
            저장하기
          </button>
          <button
            v-if="!selectedUser.isNew"
            @click="deleteUser"
            class="flex-1 min-w-[100px] py-3 bg-red-500 text-white rounded-lg font-medium touch-manipulation active:scale-[0.98]"
          >
            삭제
          </button>
          <button
            @click="clearSelection"
            class="py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium touch-manipulation active:scale-[0.98]"
          >
            취소
          </button>
        </div>
      </section>

      <!-- 선택 안내 -->
      <p
        v-else
        class="text-center text-gray-500 text-sm py-8"
      >
        목록에서 사용자를 선택하거나<br />상단의 <strong>사용자 등록</strong>으로 새로 추가하세요.
      </p>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "UserManagementMobile",
  data() {
    return {
      showFilters: false,
      users: [],
      departments: [],
      roles: [],
      roleNameToId: {},
      roleIdToName: {},
      roleIdSet: new Set(),
      selectedUser: null,
      filters: { dept: "", role: "", name: "" },

      setAsDefault: true,
      defaultSignaturePath: "",
      defaultSignatureId: null,
      isDrawing: false,
      hasSignature: false,
      lastX: 0,
      lastY: 0,
      dpr: 1,
      _onResize: null,
    };
  },
  computed: {
    searchConditionSummary() {
      const parts = [];
      if (this.filters.dept) parts.push(this.filters.dept);
      else parts.push("부서 전체");
      if (this.filters.role) parts.push(this.filters.role);
      else parts.push("역할 전체");
      if (this.filters.name) parts.push(this.filters.name);
      return parts.join(" · ") || "조회 조건 선택";
    },
  },
  methods: {
    async fetchDepartments() {
      try {
        const res = await axios.get("/api/departments");
        this.departments = res.data
          .map(d => ({ id: d.id, name: d.dept_name }))
          .sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        console.error("부서 데이터 불러오기 실패:", err);
      }
    },
    async fetchRoles() {
      try {
        const res = await axios.get("/api/roles");
        this.roles = res.data.map(r => ({
          id: Number(r.role_id),
          name: r.role_name
        }));
        this.roleNameToId = Object.fromEntries(this.roles.map(r => [r.name, r.id]));
        this.roleIdToName = Object.fromEntries(this.roles.map(r => [r.id, r.name]));
        this.roleIdSet = new Set(this.roles.map(r => r.id));
      } catch (err) {
        console.error("역할 데이터 불러오기 실패:", err);
      }
    },
    normalizeRoles(raw) {
      if (raw == null) return [];
      const arr = Array.isArray(raw)
        ? raw
        : String(raw).split(",").map(s => s.trim()).filter(Boolean);
      return arr
        .map(v => (isNaN(v) ? this.roleNameToId[v] : Number(v)))
        .filter(id => this.roleIdSet.has(id));
    },
    roleIdsToNames(ids) {
      if (!ids || ids.length === 0) return "";
      return ids.map(id => this.roleIdToName[id]).filter(Boolean).join(", ");
    },
    async searchUsers() {
      try {
        const res = await axios.get("/api/users/search", { params: this.filters });
        this.users = res.data.map(u => {
          const roleIds = this.normalizeRoles(u.roleIds ?? u.roles);
          const roleNames = u.roleNames && u.roleNames.length
            ? u.roleNames
            : this.roleIdsToNames(roleIds);
          return { ...u, roles: roleIds, roleNames };
        });
      } catch (err) {
        console.error("사용자 검색 실패:", err);
      }
    },

    selectUser(user) {
      const normalized = this.normalizeRoles(user.roles);
      this.selectedUser = {
        ...user,
        roles: normalized,
        newPassword: "",
        confirmPassword: "",
        isNew: false
      };
      this.loadDefaultSignature(this.selectedUser.id);
      this.$nextTick(() => {
        this.setupSignatureCanvas();
        this.clearCanvas();
      });
    },

    newUser() {
      this.selectedUser = {
        id: null,
        userId: "",
        name: "",
        email: "",
        dept: this.departments[0]?.name || "",
        roles: [],
        newPassword: "",
        confirmPassword: "",
        isNew: true,
      };
      this.defaultSignaturePath = "";
      this.defaultSignatureId = null;
      this.$nextTick(() => {
        this.setupSignatureCanvas();
        this.clearCanvas();
      });
    },

    clearSelection() {
      this.selectedUser = null;
      this.teardownResizeListener();
    },

    async createUser() {
      try {
        const su = this.selectedUser;
        su.roles = this.normalizeRoles(su.roles);

        if (!su.userId) return alert("사용자ID를 입력하세요.");
        if (!su.name) return alert("이름을 입력하세요.");
        if (!su.dept) return alert("부서를 선택하세요.");
        if (!su.newPassword) return alert("비밀번호를 입력하세요.");
        if (su.newPassword !== su.confirmPassword) return alert("비밀번호가 일치하지 않습니다.");

        const payload = {
          userId: su.userId,
          name: su.name,
          email: su.email,
          dept: su.dept,
          roles: Array.isArray(su.roles) ? su.roles : [],
          password: su.newPassword,
        };

        const res = await axios.post(`/api/users`, payload);

        let newUserId = res?.data?.id || res?.data?.user?.id;
        if (!newUserId) {
          await this.searchUsers();
          const found = this.users.find(u => u.userId === su.userId);
          newUserId = found?.id;
        }

        const blob = await this.canvasToBlob();
        if (newUserId && blob) {
          await this.uploadSignatureBlobForUser(newUserId, blob);
        }

        alert("사용자가 등록되었습니다.");
        this.selectedUser = null;
        this.searchUsers();
      } catch (err) {
        console.error("등록 실패:", err);
        alert(err?.response?.data?.message || "등록 중 오류가 발생했습니다.");
      }
    },

    async updateUser() {
      try {
        if (!this.selectedUser) return;
        if (this.selectedUser.newPassword && this.selectedUser.newPassword !== this.selectedUser.confirmPassword) {
          alert("비밀번호가 일치하지 않습니다.");
          return;
        }
        const { isNew, confirmPassword, newPassword, ...rest } = this.selectedUser;
        const payload = {
          ...rest,
          roles: this.normalizeRoles(rest.roles)
        };
        if (newPassword) payload.newPassword = newPassword;

        await axios.put(`/api/users/${this.selectedUser.id}`, payload);
        alert("사용자가 성공적으로 업데이트되었습니다.");
        this.searchUsers();
      } catch (err) {
        console.error("업데이트 실패:", err);
        alert(err?.response?.data?.message || "업데이트 중 오류가 발생했습니다.");
      }
    },

    async deleteUser() {
      if (!this.selectedUser || this.selectedUser.isNew) return this.clearSelection();
      if (!confirm("정말로 이 사용자를 삭제하시겠습니까?")) return;
      try {
        await axios.delete(`/api/users/${this.selectedUser.id}`);
        alert("사용자가 삭제되었습니다.");
        this.selectedUser = null;
        this.searchUsers();
      } catch (err) {
        console.error("삭제 실패:", err);
        alert(err?.response?.data?.message || "삭제 중 오류가 발생했습니다.");
      }
    },

    async loadDefaultSignature(userId) {
      try {
        if (!userId) { this.defaultSignaturePath = ""; this.defaultSignatureId = null; return; }
        const { data } = await axios.get(`/api/users/${userId}/signature/default`);
        this.defaultSignaturePath = data?.file_path || "";
        this.defaultSignatureId = data?.id ?? null;
      } catch (e) {
        console.error("기본 서명 조회 실패:", e);
        this.defaultSignaturePath = "";
        this.defaultSignatureId = null;
      }
    },

    setupSignatureCanvas() {
      const canvas = this.$refs.signCanvas;
      if (!canvas) return;

      const parent = canvas.parentElement;
      const widthCss = parent ? parent.clientWidth : 280;
      const heightCss = 140;

      this.dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(widthCss * this.dpr);
      canvas.height = Math.floor(heightCss * this.dpr);
      canvas.style.width = widthCss + "px";
      canvas.style.height = heightCss + "px";

      const ctx = canvas.getContext("2d");
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";

      canvas.onpointerdown = (e) => {
        e.preventDefault();
        const { x, y } = this._canvasPos(e, canvas);
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
      };
      canvas.onpointermove = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        const { x, y } = this._canvasPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        this.lastX = x;
        this.lastY = y;
        this.hasSignature = true;
      };
      const end = () => (this.isDrawing = false);
      canvas.onpointerup = end;
      canvas.onpointerleave = end;

      canvas.style.touchAction = "none";

      this.teardownResizeListener();
      this._onResize = () => {
        const wasDrawn = this.hasSignature;
        this.setupSignatureCanvas();
        if (!wasDrawn) this.clearCanvas();
      };
      window.addEventListener("resize", this._onResize);
    },

    teardownResizeListener() {
      if (this._onResize) {
        window.removeEventListener("resize", this._onResize);
        this._onResize = null;
      }
    },

    _canvasPos(e, canvas) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return { x, y };
    },

    clearCanvas() {
      const canvas = this.$refs.signCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.hasSignature = false;
    },

    async canvasToBlob() {
      const canvas = this.$refs.signCanvas;
      if (!canvas) return null;
      if (!this.hasSignature) return null;
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      });
    },

    async uploadSignatureBlobForUser(userId, blob) {
      if (!blob || !userId) return;
      const fd = new FormData();
      fd.append("file", blob, "signature.png");
      fd.append("isDefault", this.setAsDefault ? "1" : "0");

      await axios.post(`/api/users/${userId}/signatures`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await this.loadDefaultSignature(userId);
      alert("서명이 저장되었습니다.");
    },

    async saveSignatureNow() {
      if (!this.selectedUser || this.selectedUser.isNew) return;
      const blob = await this.canvasToBlob();
      if (!blob) return alert("서명을 입력하세요.");
      await this.uploadSignatureBlobForUser(this.selectedUser.id, blob);
    },
  },
  async mounted() {
    await Promise.all([this.fetchDepartments(), this.fetchRoles()]);
    this.searchUsers();
  },
  beforeUnmount() {
    this.teardownResizeListener();
  }
};
</script>

<style scoped>
canvas {
  cursor: crosshair;
  -webkit-touch-callout: none;
  touch-action: none;
}
</style>
