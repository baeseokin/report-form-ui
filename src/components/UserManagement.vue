<template>
  <div class="flex h-screen font-nanum">
    <!-- 좌측: 검색 & 목록 -->
    <div class="w-1/2 border-r overflow-y-auto bg-gray-50 flex flex-col">
      <!-- ✅ 화면 제목 / 신규 버튼 -->
      <div class="flex items-center justify-between p-4 border-b bg-white">
        <h2 class="text-2xl font-bold text-purple-700">👥 사용자 관리</h2>
        <button
          @click="newUser"
          class="px-3 py-2 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow hover:from-emerald-600 hover:to-teal-700 transition"
        >
          ＋ 사용자 등록
        </button>
      </div>

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
                <th class="border px-3 py-2 w-32">사용자ID</th>
                <th class="border px-3 py-2 w-32">사용자명</th>
                <th class="border px-3 py-2 w-32">부서명</th>
                <th class="border px-3 py-2">역할</th>
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
                <td class="border px-3 py-2">
                  <span class="text-gray-700">{{ user.roleNames || '-' }}</span>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="4" class="text-center text-gray-500 p-4">검색 결과가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 우측: 사용자 상세/등록 -->
    <div class="w-1/2 p-6 overflow-y-auto bg-gray-50">
      <div v-if="selectedUser">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-purple-700">
            {{ selectedUser.isNew ? '🆕 사용자 등록' : '📋 사용자 상세' }}
          </h2>
          <div class="space-x-2" v-if="!selectedUser.isNew">
            <button
              @click="newUser"
              class="px-3 py-2 text-sm bg-emerald-500 text-white rounded-lg shadow hover:bg-emerald-600"
            >신규 등록</button>
            <button
              @click="clearSelection"
              class="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >선택 해제</button>
          </div>
        </div>
        <!-- ✅ 우측 상세 폼 -->
        <div class="space-y-6 bg-white p-6 rounded-lg shadow">
          <!-- 기본 정보 2열 그리드 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- 사용자ID: 신규만 수정 가능 -->
            <label class="block">
              <span class="font-semibold text-gray-700">사용자ID</span>
              <input
                v-model="selectedUser.userId"
                :disabled="!selectedUser.isNew"
                class="border px-3 py-2 rounded-lg w-full mt-1 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="예: user01"
              />
            </label>

            <!-- 이름 -->
            <label class="block">
              <span class="font-semibold text-gray-700">이름</span>
              <input
                v-model="selectedUser.name"
                class="border px-3 py-2 rounded-lg w-full mt-1"
                placeholder="예: 홍길동"
              />
            </label>

            <!-- ✅ 이메일 추가 -->
            <label class="block">
              <span class="font-semibold text-gray-700">이메일</span>
              <input
                v-model="selectedUser.email"
                type="email"
                class="border px-3 py-2 rounded-lg w-full mt-1"
                placeholder="예: user@example.com"
                autocomplete="email"
              />
            </label>

            <!-- 부서 -->
            <label class="block">
              <span class="font-semibold text-gray-700">부서</span>
              <select
                v-model="selectedUser.dept"
                class="border px-3 py-2 rounded-lg w-full mt-1"
              >
                <option v-for="dept in departments" :key="dept.id" :value="dept.name">
                  {{ dept.name }}
                </option>
              </select>
            </label>

            <!-- 역할 -->
            <label class="block">
              <span class="font-semibold text-gray-700">역할</span>
              <select
                v-model="selectedUser.roles[0]"
                class="border px-3 py-2 rounded-lg w-full mt-1"
              >
                <option v-for="role in roles" :key="role.id" :value="role.id">
                  {{ role.name }}
                </option>
              </select>
            </label>

            <!-- (빈 칸으로 정렬 맞춤) -->
            <div class="hidden sm:block"></div>
          </div>

          <!-- 비밀번호: 2열 그리드 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="block">
              <span class="font-semibold text-gray-700">{{ selectedUser.isNew ? '비밀번호' : '새 비밀번호' }}</span>
              <input
                type="password"
                v-model="selectedUser.newPassword"
                class="border px-3 py-2 rounded-lg w-full mt-1"
                autocomplete="new-password"
              />
            </label>

            <label class="block">
              <span class="font-semibold text-gray-700">비밀번호 확인</span>
              <input
                type="password"
                v-model="selectedUser.confirmPassword"
                class="border px-3 py-2 rounded-lg w-full mt-1"
                autocomplete="new-password"
              />
            </label>
          </div>

          <!-- 서명(직접 그리기) - 기존 그대로 -->
          <div class="mt-2 border-t pt-4">
            <div class="flex items-start gap-6">
              <!-- 기본 서명 미리보기 -->
              <div class="flex flex-col items-center gap-2">
                <span class="text-sm text-gray-600">기본 서명</span>
                <div class="w-24 h-24 border rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                  <img
                    v-if="defaultSignaturePath"
                    :src="`/api/files/${encodeURIComponent(defaultSignaturePath)}`"
                    class="object-contain w-full h-full"
                  />
                  <span v-else class="text-xs text-gray-400">없음</span>
                </div>
              </div>

              <!-- 서명 캔버스 -->
              <div class="flex-1 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-gray-700">서명 캔버스</span>
                  <div class="flex items-center gap-3">
                    <label class="flex items-center gap-2 text-sm">
                      <input type="checkbox" v-model="setAsDefault" />
                      <span>저장 후 기본 지정</span>
                    </label>
                    <button @click="clearCanvas" class="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">
                      지우기
                    </button>
                    <button
                      v-if="!selectedUser?.isNew"
                      @click="saveSignatureNow"
                      :disabled="!hasSignature"
                      class="px-3 py-1 bg-emerald-500 text-white rounded disabled:opacity-50 hover:bg-emerald-600"
                    >
                      서명 저장
                    </button>
                  </div>
                </div>

                <div class="border rounded-lg bg-white overflow-hidden relative">
                  <canvas ref="signCanvas" class="w-full h-42 touch-none"></canvas>
                  <div class="absolute top-2 right-3 text-xs text-gray-400 select-none">
                    마우스/손가락으로 서명하세요
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 버튼 -->
          <div class="flex flex-wrap gap-3 mt-4">
            <button
              v-if="selectedUser.isNew"
              @click="createUser"
              class="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow hover:from-emerald-600 hover:to-teal-700 transition"
            >
              등록하기
            </button>
            <button
              v-else
              @click="updateUser"
              class="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow hover:from-purple-600 hover:to-indigo-700 transition"
            >
              저장하기
            </button>
            <button
              v-if="!selectedUser.isNew"
              @click="deleteUser"
              class="px-6 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
            >
              삭제하기
            </button>
            <button
              @click="clearSelection"
              class="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              취소
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-gray-500 text-lg flex items-center justify-center h-full">
        좌측에서 사용자를 선택하거나, <br>상단의 사용자 등록 버튼을 눌러 새로 생성하세요.
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
      roles: [],         // [{ id:Number, name:String }]
      roleNameToId: {},  // { [name]: id }
      roleIdToName: {},  // { [id]: name }
      roleIdSet: new Set(),
      selectedUser: null,
      filters: { dept: "", role: "", name: "" },

      // ✅ 서명 관련 상태
      setAsDefault: true,
      defaultSignaturePath: "",
      defaultSignatureId: null,
      isDrawing: false,
      hasSignature: false,
      lastX: 0,
      lastY: 0,
      dpr: 1,
      _onResize: null,   // 리스너 참조
    };
  },
  methods: {
    async fetchDepartments() {
      try {
        const res = await axios.get("/api/departments");
        this.departments = res.data.map(d => ({ id: d.id, name: d.dept_name }));
      } catch (err) {
        console.error("부서 데이터 불러오기 실패:", err);
      }
    },
    async fetchRoles() {
      try {
        const res = await axios.get("/api/roles");
        // ✅ id를 숫자로 통일하고 양방향 매핑 구성
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
    // ✅ 역할 정규화: "1,2" / ["1","2"] / ["admin","user"] 등을 Number[] id로 변환
    normalizeRoles(raw) {
      if (raw == null) return [];
      const arr = Array.isArray(raw)
        ? raw
        : String(raw).split(",").map(s => s.trim()).filter(Boolean);
      return arr
        .map(v => (isNaN(v) ? this.roleNameToId[v] : Number(v)))
        .filter(id => this.roleIdSet.has(id));
    },
    // ✅ 역할 이름 문자열 생성
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

    // ✅ 사용자 선택
    selectUser(user) {
      const normalized = this.normalizeRoles(user.roles);
      this.selectedUser = {
        ...user,
        roles: normalized,
        newPassword: "",
        confirmPassword: "",
        isNew: false
      };
      // 기본 서명 로드 & 서명 캔버스 준비
      this.loadDefaultSignature(this.selectedUser.id);
      this.$nextTick(() => {
        this.setupSignatureCanvas();
        this.clearCanvas();
      });
    },

    // ✅ 신규 사용자
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

    // ✅ 사용자 등록
    async createUser() {
      try {
        const su = this.selectedUser;
        su.roles = this.normalizeRoles(su.roles);

        // 프론트 유효성 검사
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

        // 생성된 사용자 id 확보 (API가 id를 반환하지 않으면 검색으로 보완)
        let newUserId = res?.data?.id || res?.data?.user?.id;
        if (!newUserId) {
          await this.searchUsers();
          const found = this.users.find(u => u.userId === su.userId);
          newUserId = found?.id;
        }

        // 현재 서명(캔버스)이 있으면 저장
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

    // ✅ 사용자 수정
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

    /* -------------------- 서명(캔버스) 관련 -------------------- */

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
      const widthCss = parent.clientWidth;
      const heightCss = 192; // h-48 ≈ 192px

      // HiDPI 대응
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
      ctx.strokeStyle = "#111827"; // slate-900

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

      canvas.style.touchAction = "none"; // 모바일 스크롤 방지

      // 리사이즈 핸들러
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
      if (!this.hasSignature) return null; // 비었으면 저장 안 함
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
/**** 추가적인 마이크로 UX ****/
select[multiple] { min-height: 8rem; }
canvas { cursor: crosshair; }
</style>
