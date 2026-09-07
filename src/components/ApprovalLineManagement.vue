<template>
  <div class="font-nanum text-gray-800 space-y-6">
    <div
      v-if="loading"
      class="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-4 py-3"
    >
      <span class="animate-pulse">⏳</span>
      결재선 정보를 불러오는 중입니다...
    </div>

    <!-- Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Department list -->
      <section class="bg-white rounded-xl shadow p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-800">부서 목록</h2>
          <span class="text-xs text-gray-500">총 {{ departments.length }}개</span>
        </div>

        <div class="flex items-center gap-2 mb-3">
          <input
            v-model="deptKeyword"
            type="search"
            placeholder="부서명 검색"
            class="w-48 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            class="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            @click="deptKeyword = ''"
          >
            초기화
          </button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scroll border rounded-lg divide-y">
          <button
            v-for="dept in filteredDepartments"
            :key="dept"
            class="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-purple-50"
            :class="selectedDept === dept ? 'bg-purple-100 font-semibold text-purple-700' : ''"
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
          <button
            class="px-3 py-2 text-sm bg-white border text-purple-700 rounded-lg shadow-sm hover:bg-purple-50 shrink-0"
            @click="prepareNewLine('new')"
          >
            신규 부서
          </button>
        </div>
        <div
          v-if="newDeptMode"
          class="flex items-center gap-2 text-sm text-purple-800 bg-purple-50 border border-purple-100 rounded-lg px-4 py-3"
        >
          <span class="font-semibold">새 부서 등록 모드</span>
          <span>부서 선택 후 바로 결재선을 등록할 수 있습니다.</span>         
        </div>

        <!-- Form -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4 bg-white">
          <label class="block text-sm font-semibold text-gray-700">
            부서명
            <select
              v-model="editable.dept_name"
              :disabled="isDeptLocked"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              disabled
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100 cursor-not-allowed"
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
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
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
            <select
              v-model.number="editable.order_no"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            >
              <option v-for="n in maxOrderOptions" :key="n" :value="n">{{ n }}차</option>
            </select>
          </label>

          <div class="md:col-span-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 disabled:opacity-50"
              :disabled="!isValid"
              @click="saveLine"
            >
              저장
            </button>
            <button
              type="button"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              @click="resetForm"
            >
              초기화
            </button>
            <span v-if="saving" class="text-sm text-gray-500 flex items-center gap-1">⏳ 저장 중...</span>
            <span v-if="error" class="text-sm text-rose-600">{{ error }}</span>
          </div>
        </div>

        <!-- Grouped Lines Layout -->
        <div class="overflow-hidden border rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-purple-50 text-purple-900">
              <tr>
                <th class="px-4 py-3 border-b text-center font-semibold w-24">순서</th>
                <th class="px-4 py-3 border-b text-left font-semibold">결재자 (같은 차수는 동시 결재)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="group in groupedLines"
                :key="group.order_no"
                class="hover:bg-purple-50/50 transition-colors"
              >
                <td class="px-4 py-4 border-b text-center font-bold text-gray-700 bg-gray-50/50">
                  {{ group.order_no }}차
                </td>
                <td class="px-4 py-4 border-b">
                  <div class="flex flex-wrap items-center gap-3">
                    <template v-for="(line, idx) in group.approvers" :key="line.id">
                      <!-- OR Badge for parallel approvers -->
                      <div v-if="idx > 0" class="flex items-center justify-center bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-full shadow-inner">
                        OR
                      </div>
                      
                      <!-- Approver Card -->
                      <div class="flex flex-col bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-w-[140px] hover:border-purple-300 transition-colors">
                        <div class="flex justify-between items-start mb-2 gap-2">
                          <span class="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            {{ line.approver_role }}
                          </span>
                          <div class="flex items-center gap-1">
                            <button
                              type="button"
                              class="text-gray-400 hover:text-purple-600 transition-colors"
                              @click.stop="editExisting(line)"
                              title="수정"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <button
                              type="button"
                              class="text-gray-400 hover:text-rose-600 transition-colors"
                              @click.stop.prevent="removeLine(line.id)"
                              title="삭제"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </div>
                        <span class="font-medium text-gray-800 text-sm line-clamp-1" :title="getDisplayName(line)">
                          {{ getDisplayName(line) }}
                        </span>
                      </div>
                    </template>
                  </div>
                </td>
              </tr>
              <tr v-if="groupedLines.length === 0">
                <td colspan="2" class="text-center text-gray-500 px-4 py-8 bg-gray-50/50">
                  결재선이 없습니다. 위에서 결재자를 추가해주세요.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
 
     <!-- ✅ 커스텀 확인 모달 (Native confirm 대용) -->
     <div v-if="confirmModal.visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
       <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
         <div class="p-6 text-center">
           <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
           </div>
           <h3 class="text-lg font-bold text-gray-900 mb-2">삭제 확인</h3>
           <p class="text-gray-600">{{ confirmModal.message }}</p>
         </div>
         <div class="flex border-t">
           <button @click="confirmModal.visible = false" class="flex-1 px-6 py-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
             취소
           </button>
           <button @click="confirmModal.onConfirm" class="flex-1 px-6 py-4 text-sm font-semibold text-rose-600 hover:bg-rose-50 border-l transition-colors">
             삭제하기
           </button>
         </div>
       </div>
     </div>
   </div>
 </template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
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

// ✅ 커스텀 컨펌 모달 상태
const confirmModal = ref({
  visible: false,
  message: "",
  onConfirm: null,
});

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

const groupedLines = computed(() => {
  if (!selectedDept.value) return [];
  const groups = {};
  lines.value
    .filter((l) => l.dept_name === selectedDept.value)
    .forEach((line) => {
      if (!groups[line.order_no]) groups[line.order_no] = [];
      groups[line.order_no].push(line);
    });
  
  return Object.keys(groups)
    .sort((a, b) => Number(a) - Number(b))
    .map(key => ({
      order_no: Number(key),
      approvers: groups[key]
    }));
});

const maxOrderOptions = computed(() => {
  const maxOrder = filteredLines.value.length > 0 
    ? Math.max(...filteredLines.value.map(l => Number(l.order_no) || 0)) 
    : 0;
  
  const options = [];
  for (let i = 1; i <= Math.max(1, maxOrder + 1); i++) {
    options.push(i);
  }
  
  if (editable.value.order_no && !options.includes(editable.value.order_no)) {
    options.push(editable.value.order_no);
    options.sort((a,b) => a - b);
  }
  
  return options;
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

function getDisplayName(line) {
  const name = line.approver_user_name || line.approverUserName;
  if (name) return `${line.approver_user_id} (${name})`;
  const user = userOptions.value.find(u => (u.userId || u.id || u.approver_user_id) === line.approver_user_id);
  return user?.name ? `${line.approver_user_id} (${user.name})` : line.approver_user_id;
}

// ✅ 사용자 선택 시 역할 자동 매핑
watch(
  () => editable.value.approver_user_id,
  (newVal) => {
    if (!newVal) return;
    const user = userOptions.value.find(
      (u) => (u.userId || u.id || u.approver_user_id) === newVal
    );
    if (user && user.roleNames) {
      // 콤마로 구분된 역할 중 첫 번째 역할을 기본으로 선택
      const firstRole = user.roleNames.split(",")[0];
      if (firstRole) {
        editable.value.approver_role = firstRole;
      }
    }
  }
);

function selectDept(dept) {
  selectedDept.value = dept;
  newDeptMode.value = false;
  const maxOrder = filteredLines.value.length > 0 
    ? Math.max(...filteredLines.value.map(l => Number(l.order_no) || 0)) 
    : 0;
  editable.value = {
    ...createBlank(),
    dept_name: dept,
    order_no: maxOrder + 1,
  };
}

function prepareNewLine(mode = "existing") {
  newDeptMode.value = mode === "new";
  if (mode === "new") {
    selectedDept.value = "";
  }
  const maxOrder = selectedDept.value && mode === "existing" && filteredLines.value.length > 0
    ? Math.max(...filteredLines.value.map(l => Number(l.order_no) || 0)) 
    : 0;
  editable.value = {
    ...createBlank(),
    dept_name: mode === "existing" ? selectedDept.value : "",
    order_no: maxOrder + 1,
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
  confirmModal.value = {
    visible: true,
    message: "정말로 이 결재선을 삭제하시겠습니까?",
    onConfirm: async () => {
      confirmModal.value.visible = false;
      try {
        await axios.delete(`/api/approval-lines/${id}`);
        await fetchLines();
      } catch (err) {
        console.error(err);
        error.value = "삭제 중 오류가 발생했습니다.";
      }
    }
  };
}


</script>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 8px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(147, 51, 234, 0.4);
  border-radius: 9999px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style>