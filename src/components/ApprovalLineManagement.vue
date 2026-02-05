<template>
  <div class="font-nanum text-gray-800 space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <div class="flex flex-wrap gap-2">
        <button
          class="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50"
          :disabled="!selectedDept"
          @click="prepareNewLine('existing')"
        >
          ＋ 선택 부서에 결재선 추가
        </button>
        <button
          class="px-3 py-2 text-sm bg-white border text-indigo-700 rounded-lg shadow-sm hover:bg-indigo-50"
          @click="prepareNewLine('new')"
        >
          ＋ 새 부서 결재선 등록
        </button>
        <button
          class="px-3 py-2 text-sm bg-white border border-indigo-200 text-indigo-700 rounded-lg shadow-sm hover:bg-indigo-50"
          @click="fetchLines"
        >
          새로고침
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3"
    >
      <span class="animate-pulse">⏳</span>
      결재선 정보를 불러오는 중입니다...
    </div>

    <!-- Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Department list -->
      <section class="bg-white rounded-xl shadow p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">부서 목록</h2>
          <span class="text-sm text-gray-500">총 {{ departments.length }}개</span>
        </div>

        <div class="flex items-center gap-2 mb-3">
          <input
            v-model="deptKeyword"
            type="search"
            placeholder="부서명 검색"
            class="w-48 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            @click="deptKeyword = ''"
          >
            초기화
          </button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scroll border rounded-lg divide-y">
          <button
            v-for="dept in filteredDepartments"
            :key="dept"
            class="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50"
            :class="selectedDept === dept ? 'bg-indigo-100 font-semibold text-indigo-700' : ''"
            @click="selectDept(dept)"
          >
            {{ dept }}
          </button>
          <p v-if="filteredDepartments.length === 0" class="p-4 text-sm text-gray-500">검색 결과가 없습니다.</p>
        </div>
      </section>

      <!-- Detail & table -->
      <section class="bg-white rounded-xl shadow p-6 lg:col-span-2 space-y-5">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 class="text-xl font-semibold">
              {{ selectedDept ? `${selectedDept} 결재선` : '부서를 먼저 선택하세요' }}
            </h2>
          </div>
        </div>
        <div
          v-if="newDeptMode"
          class="flex items-center gap-2 text-sm text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3"
        >
          <span class="font-semibold">새 부서 등록 모드</span>
          <span>부서 선택 후 바로 결재선을 등록할 수 있습니다.</span>         
        </div>

        <!-- Form -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <label class="block text-sm font-semibold text-gray-700">
            부서명
            <select
              v-model="editable.dept_name"
              :disabled="isDeptLocked"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            결재 역할
            <select
              v-model="editable.approver_role"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
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
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            사용자 ID
            <select
              v-model="editable.approver_user_id"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
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
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            결재 순서
            <input
              v-model.number="editable.order_no"
              type="number"
              min="1"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>

          <div class="md:col-span-2 flex flex-wrap gap-2">
            <button
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50"
              :disabled="!isValid"
              @click="saveLine"
            >
              {{ editable.id ? '결재선 수정' : '결재선 등록' }}
            </button>
            <button
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              @click="resetForm"
            >
              폼 초기화
            </button>
            <span v-if="saving" class="text-sm text-gray-500 flex items-center gap-1">⏳ 저장 중...</span>
            <span v-if="error" class="text-sm text-rose-600">{{ error }}</span>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-hidden border rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-indigo-50 text-indigo-900">
              <tr>
                <th class="px-3 py-2 border">순서</th>
                <th class="px-3 py-2 border">결재 역할</th>
                <th class="px-3 py-2 border">사용자 ID</th>
                <th class="px-3 py-2 border">비고</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="line in filteredLines"
                :key="line.id"
                class="hover:bg-indigo-50"
              >
                <td class="px-3 py-2 border text-center font-mono">{{ line.order_no }}</td>
                <td class="px-3 py-2 border">{{ line.approver_role }}</td>
                <td class="px-3 py-2 border">{{ line.approver_user_id }}</td>
                <td class="px-3 py-2 border">
                  <div class="flex flex-wrap gap-2 justify-end">
                    <button
                      class="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                      @click="move(line, -1)"
                      :disabled="line.order_no === 1"
                    >
                      ▲ 위로
                    </button>
                    <button
                      class="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                      @click="move(line, 1)"
                      :disabled="line.order_no === filteredLines.length"
                    >
                      ▼ 아래로
                    </button>
                    <button
                      class="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      @click="editExisting(line)"
                    >
                      수정
                    </button>
                    <button
                      class="px-2 py-1 text-xs bg-rose-500 text-white rounded hover:bg-rose-600"
                      @click="removeLine(line.id)"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredLines.length === 0">
                <td colspan="4" class="text-center text-gray-500 px-3 py-6">결재선이 없습니다. 추가 버튼을 눌러 등록하세요.</td>
              </tr>
            </tbody>
          </table>
        </div>
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
    if (!selectedDept.value && departments.value.length > 0) {
      selectedDept.value = departments.value[0];
    }
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
      console.log("editable >>>>>");
      await axios.put(`/api/approval-lines/${editable.value.id}`, {
        ...camelCasePayload,
        id: editable.value.id,
      });
    } else {
      console.log("created >>>>>createBody:",createBody);
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
.custom-scroll::-webkit-scrollbar {
  width: 8px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(99, 102, 241, 0.4);
  border-radius: 9999px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style>