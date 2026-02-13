<template>
  <div class="font-nanum text-gray-800 min-h-screen bg-gray-50 pb-safe">
    <!-- Header (부서 관리와 동일 스타일) -->
    <div class="sticky top-0 z-10 bg-purple-50 border-b border-purple-100">
      <div class="p-3 flex justify-between items-center flex-wrap gap-2">
        <h3 class="font-bold text-base text-purple-800">📄 결재선 관리</h3>
        <div class="flex items-center gap-1">
          <button
            @click="prepareNewLine('new')"
            class="px-3 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 active:bg-purple-200 text-sm font-medium touch-manipulation"
          >
            ＋ 신규 부서
          </button>
        </div>
      </div>
    </div>

    <div class="px-4 py-4 space-y-4">
      <!-- 로딩 -->
      <div
        v-if="loading"
        class="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-4 py-3"
      >
        <span class="animate-pulse">⏳</span>
        결재선 정보를 불러오는 중입니다...
      </div>

      <!-- 부서 목록 -->
      <section class="bg-white rounded-xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-800">부서 목록</h2>
          <span class="text-xs text-gray-500">총 {{ departments.length }}개</span>
        </div>
        <div class="flex items-center gap-2 mb-3">
          <input
            v-model="deptKeyword"
            type="search"
            placeholder="부서명 검색"
            class="flex-1 mobile-form-control min-w-0"
          />
          <button
            type="button"
            class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 active:bg-gray-300 text-sm touch-manipulation shrink-0"
            @click="deptKeyword = ''"
          >
            초기화
          </button>
        </div>
        <div class="max-h-[200px] overflow-y-auto border rounded-lg divide-y border-gray-200">
          <button
            v-for="dept in filteredDepartments"
            :key="dept"
            type="button"
            class="w-full text-left px-4 py-3 text-sm touch-manipulation transition"
            :class="selectedDept === dept ? 'bg-purple-100 font-semibold text-purple-700' : 'hover:bg-purple-50 active:bg-purple-100'"
            @click="selectDept(dept)"
          >
            {{ dept }}
          </button>
          <p v-if="filteredDepartments.length === 0" class="p-4 text-sm text-gray-500 text-center">
            검색 결과가 없습니다.
          </p>
        </div>
      </section>

      <!-- 선택 부서 제목 + 신규 부서 안내 -->
      <section class="bg-white rounded-xl shadow p-4">
        <h2 class="text-base font-semibold text-purple-800">
          {{ selectedDept ? `${selectedDept} 결재선` : '부서를 먼저 선택하세요' }}
        </h2>
        <div
          v-if="newDeptMode"
          class="mt-3 flex flex-wrap items-center gap-2 text-sm text-purple-800 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2"
        >
          <span class="font-semibold">새 부서 등록 모드</span>
          <span class="text-gray-600">부서 선택 후 결재선을 등록할 수 있습니다.</span>
        </div>
      </section>

      <!-- 결재선 목록 (카드) -->
      <section class="bg-white rounded-xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-800">결재선 목록</h2>
          <span class="text-xs text-gray-500">{{ filteredLines.length }}건</span>
        </div>
        <p v-if="filteredLines.length === 0" class="text-sm text-gray-500 py-6 text-center">
          결재선이 없습니다. 아래 폼에서 추가해 주세요.
        </p>
        <ul v-else class="space-y-2">
          <li
            v-for="line in filteredLines"
            :key="line.id"
            class="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-sm font-semibold text-purple-700">#{{ line.order_no }}</span>
              <span class="text-sm text-gray-700">{{ line.approver_role }}</span>
              <span class="text-sm text-gray-600 truncate">{{ line.approver_user_id }}{{ (line.approver_user_name || line.approverUserName) ? ` (${line.approver_user_name || line.approverUserName})` : '' }}</span>
            </div>
            <div class="flex flex-wrap gap-1.5 justify-end">
              <button
                type="button"
                class="px-2 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="line.order_no === 1"
                @click="move(line, -1)"
              >
                ▲ 위로
              </button>
              <button
                type="button"
                class="px-2 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="line.order_no === filteredLines.length"
                @click="move(line, 1)"
              >
                ▼ 아래로
              </button>
              <button
                type="button"
                class="px-2 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 active:bg-purple-800 touch-manipulation"
                @click="editExisting(line)"
              >
                수정
              </button>
              <button
                type="button"
                class="px-2 py-1.5 text-xs bg-rose-500 text-white rounded hover:bg-rose-600 active:bg-rose-700 touch-manipulation"
                @click="removeLine(line.id)"
              >
                삭제
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- 등록/수정 폼 -->
      <section class="bg-white rounded-xl shadow p-4 space-y-4">
        <h2 class="text-sm font-semibold text-gray-800">결재선 추가 / 수정</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">부서명</label>
            <select
              v-model="editable.dept_name"
              :disabled="isDeptLocked"
              class="w-full mobile-form-control mobile-form-control-select disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">부서를 선택하세요</option>
              <option
                v-for="dept in departmentOptions"
                :key="dept.id || dept.dept_name"
                :value="dept.dept_name"
              >
                {{ dept.dept_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">결재 역할</label>
            <select
              v-model="editable.approver_role"
              class="w-full mobile-form-control mobile-form-control-select"
            >
              <option value="">역할을 선택하세요</option>
              <option
                v-for="role in roleOptions"
                :key="role.role_id || role.role_name"
                :value="role.role_name"
              >
                {{ role.role_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">사용자 ID</label>
            <select
              v-model="editable.approver_user_id"
              class="w-full mobile-form-control mobile-form-control-select"
            >
              <option value="">사용자를 선택하세요</option>
              <option
                v-for="user in userOptions"
                :key="user.userId || user.id || user.approver_user_id"
                :value="user.userId || user.approver_user_id"
              >
                {{ user.name ? `${user.name} (${user.userId})` : user.userId || user.approver_user_id }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">결재 순서</label>
            <input
              v-model.number="editable.order_no"
              type="number"
              min="1"
              class="w-full mobile-form-control"
            />
          </div>
        </div>
        <div class="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            class="flex-1 min-w-[80px] py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 touch-manipulation"
            :disabled="!isValid"
            @click="saveLine"
          >
            저장
          </button>
          <button
            type="button"
            class="flex-1 min-w-[80px] py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:bg-gray-300 touch-manipulation"
            @click="resetForm"
          >
            초기화
          </button>
        </div>
        <p v-if="saving" class="text-sm text-gray-500 flex items-center gap-1">⏳ 저장 중...</p>
        <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";

const lines = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const selectedDept = ref("");
const deptKeyword = ref("");
const editable = ref(createBlank());
const newDeptMode = ref(false);
const departmentOptions = ref([]);
const roleOptions = ref([]);
const userOptions = ref([]);

const isEdit = computed(() => Boolean(editable.value.id));
const isDeptLocked = computed(
  () => isEdit.value || (!newDeptMode.value && Boolean(selectedDept.value))
);

function createBlank() {
  return {
    id: null,
    dept_name: "",
    approver_role: "",
    approver_user_id: "",
    order_no: 1,
  };
}

const departments = computed(() => {
  const names = Array.from(new Set(lines.value.map((l) => l.dept_name)));
  return names.sort((a, b) => a.localeCompare(b));
});

const filteredDepartments = computed(() => {
  if (!deptKeyword.value) return departments.value;
  return departments.value.filter((d) =>
    d.toLowerCase().includes(deptKeyword.value.toLowerCase())
  );
});

const filteredLines = computed(() => {
  if (!selectedDept.value) return [];
  return lines.value
    .filter((l) => l.dept_name === selectedDept.value)
    .sort((a, b) => a.order_no - b.order_no);
});

const isValid = computed(() => {
  const { dept_name, approver_role, approver_user_id, order_no } = editable.value;
  return dept_name && approver_role && approver_user_id && order_no > 0;
});

onMounted(() => {
  fetchLines();
  fetchDepartments();
  fetchRoles();
  fetchUsers();
});

async function fetchLines() {
  loading.value = true;
  error.value = "";
  try {
    const res = await axios.get("/api/approval-lines");
    lines.value = res.data || [];
  } catch (err) {
    console.error(err);
    error.value = "결재선 정보를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
}

async function fetchDepartments() {
  try {
    const res = await axios.get("/api/departments");
    departmentOptions.value = res.data || [];
  } catch (err) {
    console.error(err);
    error.value = "부서 정보를 불러오지 못했습니다.";
  }
}

async function fetchRoles() {
  try {
    const res = await axios.get("/api/roles");
    roleOptions.value = res.data || [];
  } catch (err) {
    console.error(err);
    error.value = "역할 정보를 불러오지 못했습니다.";
  }
}

async function fetchUsers() {
  try {
    const res = await axios.get("/api/users/search");
    const list = res.data || [];
    userOptions.value = list.slice().sort((a, b) => {
      const idA = String(a.userId ?? a.id ?? a.approver_user_id ?? "");
      const idB = String(b.userId ?? b.id ?? b.approver_user_id ?? "");
      return idA.localeCompare(idB, undefined, { numeric: true });
    });
  } catch (err) {
    console.error(err);
    error.value = "사용자 정보를 불러오지 못했습니다.";
  }
}

function selectDept(dept) {
  selectedDept.value = dept;
  newDeptMode.value = false;
  editable.value = {
    ...createBlank(),
    dept_name: dept,
    order_no: filteredLines.value.length + 1,
  };
}

function prepareNewLine(mode = "existing") {
  newDeptMode.value = mode === "new";
  if (mode === "new") {
    selectedDept.value = "";
  }
  editable.value = {
    ...createBlank(),
    dept_name: mode === "existing" ? selectedDept.value : "",
    order_no: selectedDept.value && mode === "existing" ? filteredLines.value.length + 1 : 1,
  };
}

function editExisting(line) {
  editable.value = { ...line };
}

function resetForm() {
  editable.value = createBlank();
}

async function saveLine() {
  if (!isValid.value) return;
  saving.value = true;
  error.value = "";

  const dept = departmentOptions.value.find(
    (d) => d.dept_name === editable.value.dept_name || d.name === editable.value.dept_name
  );
  const role = roleOptions.value.find(
    (r) => r.role_name === editable.value.approver_role || r.name === editable.value.approver_role
  );
  const user = userOptions.value.find(
    (u) => (u.userId || u.id || u.approver_user_id) === editable.value.approver_user_id
  );
  const payload = Object.fromEntries(
    Object.entries({
      dept_id: dept?.id || dept?.dept_id,
      dept_name: editable.value.dept_name,
      role_id: role?.role_id || role?.id,
      approver_role: editable.value.approver_role,
      approver_user_id: editable.value.approver_user_id,
      approver_user_name: user?.name,
      order_no: Number(editable.value.order_no),
    }).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
  const camelCasePayload = {
    ...payload,
    deptId: payload.dept_id,
    deptName: payload.dept_name,
    roleId: payload.role_id,
    approverRole: payload.approver_role,
    approverUserId: payload.approver_user_id,
    approverUserName: payload.approver_user_name,
    orderNo: payload.order_no,
  };

  const createBody = {
    deptId: camelCasePayload.deptId,
    deptName: camelCasePayload.deptName,
    lines: [
      ...filteredLines.value.map((line) => ({
        id: line.id,
        deptId: line.dept_id ?? line.deptId,
        deptName: line.dept_name ?? line.deptName,
        roleId: line.role_id ?? line.roleId,
        approverRole: line.approver_role ?? line.approverRole,
        approverUserId: line.approver_user_id ?? line.approverUserId,
        approverUserName: line.approver_user_name ?? line.approverUserName,
        orderNo: Number(line.order_no ?? line.orderNo),
      })),
      camelCasePayload,
    ],
  };

  try {
    if (editable.value.id) {
      await axios.put(`/api/approval-lines/${editable.value.id}`, {
        ...camelCasePayload,
        id: editable.value.id,
      });
    } else {
      await axios.post("/api/approval-lines", createBody);
    }
    await fetchLines();
    selectDept(editable.value.dept_name);
  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || "저장 중 오류가 발생했습니다.";
  } finally {
    saving.value = false;
  }
}

async function removeLine(id) {
  if (!confirm("삭제하시겠습니까?")) return;
  try {
    await axios.delete(`/api/approval-lines/${id}`);
    await fetchLines();
  } catch (err) {
    console.error(err);
    error.value = "삭제 중 오류가 발생했습니다.";
  }
}

async function move(line, direction) {
  const deptLines = filteredLines.value;
  const index = deptLines.findIndex((l) => l.id === line.id);
  const target = deptLines[index + direction];
  if (!target) return;

  const updated = [
    { ...line, order_no: target.order_no },
    { ...target, order_no: line.order_no },
  ];

  try {
    await Promise.all(
      updated.map((item) =>
        axios.put(`/api/approval-lines/${item.id}`, item)
      )
    );
    lines.value = lines.value.map((orig) => {
      const changed = updated.find((u) => u.id === orig.id);
      return changed ? { ...orig, order_no: changed.order_no } : orig;
    });
  } catch (err) {
    console.error(err);
    error.value = "순서 변경에 실패했습니다.";
  }
}
</script>

<style scoped>
/* 터치 스크롤 */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}
</style>
