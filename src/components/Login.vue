<template>
  <div class="h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 shadow rounded-lg w-96">
      <h2 class="text-2xl font-bold mb-6 text-center">🔐 로그인</h2>

      <div class="mb-3">
        <button
          type="button"
          class="w-full p-2 border rounded flex justify-between items-center"
          :disabled="loading.departments"
          @click="deptModalOpen = true"
        >
          <span>{{ selectedDeptLabel || "부서를 선택하세요" }}</span>
          <span class="text-gray-400">⌵</span>
        </button>

        <!-- 디바이스 유형별 모달을 동적 로딩 -->
        <Suspense v-if="deptModalOpen">
          <component
            :is="isMobile ? DeptPickerMobileAsync : DeptPickerDesktopAsync"
            :departments="departments"
            :favorites="favorites"
            :recent="recent"
            @close="deptModalOpen = false"
            @select="onSelectDeptMobile"
            @update:favorites="updateFavorites"
          />
          <template #fallback>
            <div class="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
              <div class="bg-white rounded-xl shadow p-6 text-sm">부서 선택 UI 불러오는 중…</div>
            </div>
          </template>
        </Suspense>
      </div>

      <!-- 역할 선택 -->
      <label class="block text-sm font-semibold mb-1">역할</label>
      <select
        v-model="selectedRoleId"
        class="w-full mb-3 p-2 border rounded"
        :disabled="!selectedDeptId || loading.roles || roles.length === 0"
        @change="onRoleChanged"
      >
        <option value="" disabled>
          {{ rolesDisabledReason || "역할을 선택하세요" }}
        </option>
        <option v-for="r in roles" :key="r.role_id" :value="r.role_id">
          {{ r.role_name }}
        </option>
      </select>

      <!-- 사용자 선택 -->
      <label class="block text-sm font-semibold mb-1">사용자</label>
      <select
        v-model="selectedUserId"
        class="w-full mb-3 p-2 border rounded"
        :disabled="usersDisabled"
      >
        <option value="" disabled>
          {{ usersDisabledReason || "사용자를 선택하세요" }}
        </option>
        <option v-for="u in users" :key="u.userId" :value="u.userId">
          {{ u.userName }} ({{ u.userId }})
        </option>
      </select>

      <!-- 비밀번호 -->
      <input
        v-model="password"
        type="password"
        placeholder="비밀번호"
        class="w-full mb-3 p-2 border rounded"
        @keyup.enter="login"
      />

      <button
        @click="login"
        class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        :disabled="!canSubmit"
      >
        로그인
      </button>

      <p v-if="error" class="text-red-500 mt-3">{{ error }}</p>

      <!-- 로딩 표시 (선택) -->
      <div class="text-xs text-gray-500 mt-3 space-y-1">
        <div v-if="loading.departments">· 부서 목록 불러오는 중…</div>
        <div v-if="loading.roles">· 역할 목록 불러오는 중…</div>
        <div v-if="loading.users">· 사용자 목록 불러오는 중…</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, defineAsyncComponent } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useUserStore } from "../store/userStore";
import DeptPickerMobile from "./mobile/DeptPickerMobile.vue";
import DeptPickerDesktop from "./DeptPickerDesktop.vue";
// ✅ 동적 로딩용 Async 컴포넌트 (코드 스플리팅)
const DeptPickerMobileAsync = defineAsyncComponent(() =>
  import("./mobile/DeptPickerMobile.vue")
);
const DeptPickerDesktopAsync = defineAsyncComponent(() =>
  import("./DeptPickerDesktop.vue")
);

const router = useRouter();
const userStore = useUserStore();

const departments = ref([]);
const roles = ref([]);              // [{ role_id, role_name }]
const users = ref([]);              // [{ userId, userName }]

const selectedDeptId = ref("");
const selectedRoleId = ref("");
const selectedUserId = ref("");

const password = ref("");
const error = ref("");

const loading = ref({
  departments: false,
  roles: false,
  users: false,
});

// ===== 모바일/즐겨찾기/최근 상태 =====
const isMobile = computed(() => typeof window !== "undefined" && window.innerWidth <= 640);
const deptModalOpen = ref(false);
const FAVORITE_KEY = "dept_favorites";
const RECENT_KEY = "dept_recent";
const favorites = ref([]); // [deptId]
const recent = ref([]);    // [deptId]

const selectedDeptLabel = computed(() => {
  const d = departments.value.find(x => String(x.id) === String(selectedDeptId.value));
  return d ? `${d.dept_name} (${d.dept_cd})` : "";
});


// ----- 유틸: 비로그인 상태에서 roles 401 허용 -----
const rolesDisabledReason = computed(() => {
  if (loading.value.roles) return "역할을 불러오는 중…";
  if (roles.value.length === 0)
    return "먼저 부서를 선택하세요.";
  return "";
});

// 사용자 select 비활성/문구
const usersDisabled = computed(() => {
  return (
    loading.value.users ||
    !selectedDeptId.value ||
    !selectedRoleId.value ||
    users.value.length === 0
  );
});
const usersDisabledReason = computed(() => {
  if (!selectedDeptId.value) return "먼저 부서를 선택하세요";
  if (!selectedRoleId.value) return "먼저 역할을 선택하세요";
  if (loading.value.users) return "사용자 목록 불러오는 중…";
  if (users.value.length === 0) return "해당 조건의 사용자가 없습니다";
  return "";
});

// 제출 가능 여부
const canSubmit = computed(() => {
  return !!selectedUserId.value && !!password.value;
});

// 초기 데이터 로딩
onMounted(async () => {
  await fetchDepartments();

  // 즐겨찾기/최근 로드
  try {
    favorites.value = JSON.parse(localStorage.getItem(FAVORITE_KEY) || "[]");
    recent.value = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {}
});


// ✅ 부서 변경 시 역할 목록 갱신
async function onDeptChanged() {
  selectedRoleId.value = "";
  selectedUserId.value = "";
  roles.value = [];
  users.value = [];

  if (selectedDeptId.value) {
    await fetchRoles(selectedDeptId.value);
  }
}

// 모바일 모달에서 부서 선택 시 처리
async function onSelectDeptMobile(dept) {
  selectedDeptId.value = dept.id;
  // 최근(최대 5개) 갱신
  recent.value = [dept.id, ...recent.value.filter(x => x !== dept.id)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value));
  deptModalOpen.value = false;
  await nextTick();
  await onDeptChanged();
}

// 즐겨찾기 업데이트(자식 → 부모)
function updateFavorites(next) {
  favorites.value = next;
  localStorage.setItem(FAVORITE_KEY, JSON.stringify(favorites.value.slice(0, 50)));
}

// ✅ 역할 변경 시 사용자 목록 갱신
async function onRoleChanged() {
  selectedUserId.value = "";
  users.value = [];

  if (selectedDeptId.value && selectedRoleId.value) {
    await fetchUsers(selectedDeptId.value, selectedRoleId.value);
  }
}

async function fetchDepartments() {
  try {
    loading.value.departments = true;
    const res = await axios.get("/api/departments", { withCredentials: true });
    departments.value = res.data || [];
  } catch (e) {
    console.error("부서 조회 실패:", e);
    error.value = "부서 목록을 불러오지 못했습니다.";
  } finally {
    loading.value.departments = false;
  }
}

async function fetchRoles(deptId) {
  console.log("fetchRoles - deptId :", deptId);
  try {
    loading.value.roles = true;

    // ✅ 부서별 역할 목록 조회
    const res = await axios.get("/api/public/roles", {
      params: { deptId },
      withCredentials: true,
    });
    roles.value = Array.isArray(res.data) ? res.data : [];

  } catch (e) {
    if (e?.response?.status === 401) {
      console.warn("역할 조회는 로그인 후에만 가능합니다. (로그인 화면에서는 빈 목록)");
      roles.value = [];
    } else {
      console.error("역할 조회 실패:", e);
      roles.value = [];
    }
  } finally {
    loading.value.roles = false;
  }
}

// ⚠️ 가정: 필터링된 사용자 목록을 제공하는 엔드포인트가 있다고 가정합니다.
// 예: GET /api/users?deptId=1&roleId=2 → [{ userId, userName }]
// 없다면, 간단히 하나 만들어 주세요(보안 상 비밀번호는 서버에서만 검증).
async function fetchUsers(deptId, roleId) {
  try {
    loading.value.users = true;
    const res = await axios.get("/api/public/users", {
      params: { deptId, roleId },
      withCredentials: true,
    });
    users.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error("사용자 조회 실패:", e);
    users.value = [];
  } finally {
    loading.value.users = false;
  }
}

const login = async () => {
  error.value = "";
  if (!canSubmit.value) return;
  const res = null;
  try {
    // 기존 /api/login 스펙 유지: userId + password
    res = await axios.post(
      "/api/login",
      {
        userId: selectedUserId.value,
        password: password.value,
        // 선택적으로, 서버에서 추가 검증에 활용하려면 함께 전송(백엔드 수용 시)
        deptId: selectedDeptId.value,
        roleId: selectedRoleId.value,
      },
      { withCredentials: true }
    );
    
    if (res.data?.success) {
      await userStore.loadSession(); // 세션 로드
      const rolesFromSession = userStore.roles.map((r) => r.role_name || r);

      if (rolesFromSession.includes("회계")) {
        router.push("/reportForm");
      } else {
        router.push("/approvalStatus");
      }
    } else {
      error.value = res.data?.message || "로그인 실패";
    }
  } catch (err) {
    error.value = err.response.data.message||"로그인 실패";
  }
};
</script>
