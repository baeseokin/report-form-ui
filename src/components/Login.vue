<template>
  <div class="min-h-screen flex flex-col lg:flex-row bg-gray-100 font-nanum overflow-hidden relative">
    
    <!-- 왼쪽: 수채화 이미지 영역 (PC/태블릿) -->
    <div class="hidden lg:flex flex-[1.4] items-center justify-center p-16 relative bg-gray-100">
      <div 
        class="w-full h-full max-w-3xl bg-contain bg-center bg-no-repeat relative"
        style="background-image: url('/images/login_bg.png');"
      >
        <!-- 수채화 특유의 부드러운 경계 처리 (bg-gray-100 색상 #F3F4F6 적용) -->
        <div class="absolute inset-0 shadow-[inset_0_0_100px_80px_rgba(243,244,246,1)] pointer-events-none"></div>
      </div>
    </div>

    <!-- 모바일 전용: 상단에 작게 배치되는 이미지 (옵션) -->
    <div class="lg:hidden absolute top-8 left-0 right-0 h-40 opacity-20 pointer-events-none">
      <div 
        class="w-full h-full bg-contain bg-center bg-no-repeat"
        style="background-image: url('/images/login_bg.png');"
      ></div>
    </div>

    <!-- 오른쪽: 로그인 폼 영역 -->
    <div class="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 z-10 bg-transparent">
      
      <!-- 초기 화면 전용 메시지 타이틀 -->
      <div class="mb-10 text-center animate-fadeIn drop-shadow-sm select-none font-gowun">
        <h1 class="text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-gray-800 tracking-tight leading-tight whitespace-nowrap lg:whitespace-nowrap">
          <span class="block lg:inline mb-1 lg:mb-0">원천교회</span>
          <span class="text-indigo-600 block lg:inline lg:ml-3">지출청구 시스템</span>
        </h1>
        <p class="mt-4 text-gray-500 font-medium tracking-widest text-[10px] md:text-sm lg:text-lg opacity-70 font-nanum">
          WONCHEON FINANCIAL REQUEST SYSTEM
        </p>
      </div>

      <div class="relative w-full max-w-[420px] bg-white px-8 py-12 sm:px-10 sm:py-16 shadow-[20px_40px_80px_rgba(0,0,0,0.1)] rounded-[2.5rem] border border-gray-100/50 backdrop-blur-sm animate-slideUp">
      <h2 class="text-2xl font-bold mb-6 text-center">🔐 로그인</h2>

      <div class="mb-3">
        <button
          type="button"
          data-testid="login-dept-trigger"
          class="w-full p-2 border rounded flex justify-between items-center"
          :disabled="loading.departments"
          @click="deptModalOpen = true"
        >
          
          <span>{{ selectedDeptLabel || "부서를 선택하세요" }}</span>
          <span class="text-gray-400">⌵</span>
        </button>
      </div>



      <form @submit.prevent="login" autocomplete="off">
        <!-- 역할 선택 -->
        <label class="block text-sm font-semibold mb-1">역할</label>
        <select
          v-model="selectedRoleId"
          data-testid="login-role-select"
          class="w-full mb-3 mobile-form-control mobile-form-control-select disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
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
          data-testid="login-user-select"
          class="w-full mb-3 mobile-form-control mobile-form-control-select disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          :disabled="usersDisabled"
          name="username"
          autocomplete="username"
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
          data-testid="login-password-input"
          type="password"
          placeholder="비밀번호"
          class="w-full mb-3 p-2 border rounded"
          name="password"
          autocomplete="current-password"
        />

        <button
          type="submit"
          data-testid="login-submit-button"
          class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          :disabled="!canSubmit"
        >
          로그인
        </button>
      </form>

      <p v-if="error" class="text-red-500 mt-3">{{ error }}</p>

      <!-- 로딩 표시 (선택) -->
      <div class="text-xs text-gray-500 mt-3 space-y-1">
        <div v-if="loading.departments">· 부서 목록 불러오는 중…</div>
        <div v-if="loading.roles">· 역할 목록 불러오는 중…</div>
        <div v-if="loading.users">· 사용자 목록 불러오는 중…</div>
      </div>
      </div>

      <!-- 디바이스 유형별 모달을 동적 로딩 (애니메이션 컨테이너 외부로 이동하여 모바일에서 공간 제약 해소) -->
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, defineAsyncComponent, inject } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useUserStore } from "../store/userStore";

const closeSidebar = inject("closeSidebar", null);
// ✅ 동적 로딩만 사용 (모바일/PC 중 해당하는 픽업만 로드되어 번들 절감)
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
const isMobile = computed(() => typeof window !== "undefined" && window.innerWidth < 1024);
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
  let res = null;

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
      closeSidebar?.(); // 로그인 후 left menu 접힌 상태로 보이도록 (모바일)
      await userStore.loadSession(); // 세션 로드
      router.replace("/portal");
    } else {
      error.value = res.data?.message || "로그인 실패";
    }
  } catch (err) {
    try{
      error.value = err.response.data.message||"로그인 실패";
    }catch (err1){
      error.value = "로그인 실패";
    }
    
  }
};
</script>

<style scoped>
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slideUp {
  animation: slideUp 0.6s ease-out;
}
</style>
