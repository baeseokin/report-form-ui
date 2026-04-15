<template>
  <div class="p-6 font-nanum">
    <!-- ✅ 검색조건 -->
    <div class="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white border border-gray-200 rounded-lg shadow-sm py-4 px-4 sm:p-5 md:p-6 mb-6 flex flex-wrap gap-6 items-end">
      <!-- 부서명 (관리자/재정부만 변경 가능, 그 외는 본인 부서 고정) -->
      <div class="flex flex-col w-40">
        <label class="font-semibold text-gray-600 mb-1 text-sm">부서명</label>
        <select
          v-model="filters.deptName"
          :disabled="!canEditDept"
          class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option v-if="canEditDept" value="">전체</option>
          <option v-for="d in departmentOptions" :key="d.id ?? d.dept_name" :value="d.dept_name">
            {{ d.dept_name }}
          </option>
        </select>
      </div>

      <!-- 청구 유형 -->
      <div class="flex flex-col w-36">
        <label class="font-semibold text-gray-600 mb-1 text-sm">청구 유형</label>
        <select v-model="filters.documentType" class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition">
          <option value="">전체</option>
          <option value="청구지출결의서">청구지출결의서</option>
          <option value="정산지출결의서">정산지출결의서</option>
          <option value="가불지출결의서">가불지출결의서</option>
        </select>
      </div>

      <!-- 진행상태 -->
      <div class="flex flex-col w-32">
        <label class="font-semibold text-gray-600 mb-1 text-sm">진행상태</label>
        <select v-model="filters.status" class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition">
          <option value="">전체</option>
          <option value="결재진행중">결재진행중</option>
          <option value="결재완료">결재완료</option>
          <option value="결재반려">결재반려</option>
          <option value="재정부이관완료">재정부이관완료</option>
        </select>
      </div>

      <!-- 청구 시작일자 -->
      <div class="flex flex-col w-40">
        <label class="font-semibold text-gray-600 mb-1 text-sm">청구 시작일자</label>
        <input type="date" v-model="filters.startDate" class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition" />
      </div>

      <!-- 청구 종료일자 -->
      <div class="flex flex-col w-40">
        <label class="font-semibold text-gray-600 mb-1 text-sm">청구 종료일자</label>
        <input type="date" v-model="filters.endDate" class="bg-white/90 border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition" />
      </div>

      <!-- 조회 버튼 -->
      <div class="flex items-end">
        <button
          @click="fetchApprovals(1)"
          class="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          조회
        </button>
      </div>
    </div>

    <!-- 결과 목록 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-purple-100 text-gray-700">
            <th class="border p-3 text-center">청구 유형</th>
            <th class="border p-3 text-center">부서명</th>
            <th class="border p-3 text-center">작성자</th>
            <th class="border p-3 text-center">청구요청 별칭</th>
            <th class="border p-3 text-center">청구일자</th>
            <th class="border p-3 text-center">총액</th>
            <th class="border p-3 text-center">진행상태</th>
            <th class="border p-3 text-center">상세</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(a, index) in approvals" :key="a.id" class="hover:bg-purple-50 transition text-sm h-10">
            <td class="border p-3 text-center">{{ a.document_type }}</td>
            <td class="border p-3 text-center">{{ a.dept_name }}</td>
            <td class="border p-3 text-center">{{ a.author }}</td>
            <td class="border p-3 text-center">{{ a.aliasName }}</td>
            <td class="border p-3 text-center">{{ formatDate(a.request_date) }}</td>
            <td class="border p-3 text-right">{{ formatAmount(a.total_amount) }}</td>
            <td class="border p-3 text-center">{{ a.status }}</td>
            <td class="border p-3 text-center items-center space-x-3">
              <button
                @click="openPreview(a.id)"
                class="p-2 rounded-lg hover:bg-green-100 transition"
                title="상세보기"
                :data-testid="'row-view-btn-' + index"
              >
                <img src="/icons/view.svg" alt="상세보기" class="w-6 h-6" />
              </button>
              <button
                @click="attemptEdit(a)"
                class="p-2 rounded-lg hover:bg-blue-100 transition"
                :class="{ 'opacity-30 cursor-not-allowed': !(a.author === user?.userName && a.historyCount === 1) }"
                :title="a.author === user?.userName && a.historyCount === 1 ? '수정' : '수정 불가'"
              >
                <img src="/icons/edit.svg" alt="수정" class="w-6 h-6" />
              </button>
              <button
                @click="goToReport(a.id)"
                class="p-2 rounded-lg hover:bg-purple-100 transition"
                title="복사하기"
              >
                <img src="/icons/copy.svg" alt="복사하기" class="w-6 h-6" />
              </button>
              <button
                @click="attemptDelete(a)"
                class="p-2 rounded-lg hover:bg-red-100 transition"
                :class="{ 'opacity-30 cursor-not-allowed': !(a.author === user?.userName && a.historyCount === 1) }"
                :title="a.author === user?.userName && a.historyCount === 1 ? '삭제' : '삭제 불가'"
              >
                <img src="/icons/trash.svg" alt="삭제" class="w-6 h-6" />
              </button>
            </td>
          </tr>
          <tr v-if="approvals.length === 0">
            <td colspan="10" class="text-center p-6 text-gray-500">데이터가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    <div class="flex justify-center mt-6 space-x-2">
      <button
        v-for="page in totalPages"
        :key="page"
        @click="fetchApprovals(page)"
        :class="[
          'px-4 py-1 border rounded-lg transition',
          currentPage === page ? 'bg-gray-300 text-gray-800' : 'bg-white hover:bg-gray-100'
        ]"
      >
        {{ page }}
      </button>
    </div>

    <!-- 상세보기 모달 -->
    <ReportPreview
      v-if="previewReport"
      :report="previewReport"
      @close="previewReport = null"
    />

    <!-- ✅ 커스텀 Alert 모달 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="alertModal.visible" class="al-overlay" @click.self="alertModal.close()">
          <div class="al-box">
            <p class="al-msg">{{ alertModal.message }}</p>
            <div class="al-actions">
              <button class="al-ok" @click="alertModal.close()">확인</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ✅ 커스텀 Confirm 모달 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="confirmModal.visible" class="al-overlay" @click.self="confirmModal.resolve(false)">
          <div class="al-box">
            <p class="al-msg">{{ confirmModal.message }}</p>
            <div class="al-actions">
              <button class="al-cancel" @click="confirmModal.resolve(false)">취소</button>
              <button class="al-ok" @click="confirmModal.resolve(true)">확인</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>


<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import axios from "axios";
import { defineAsyncComponent } from 'vue';
const ReportPreview = defineAsyncComponent(() => import ("./ReportPreview.vue"));
import { useRouter } from "vue-router";
import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";

const router = useRouter();
const { user } = storeToRefs(useUserStore());

const approvals = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const previewReport = ref(null);
const departments = ref([]);

const today = new Date();
const year = today.getFullYear();
const startOfMonth = new Date();
startOfMonth.setMonth(startOfMonth.getMonth() - 1);

const formatDateValue = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// ✅ 로그인 사용자의 deptName 자동 세팅
const filters = ref({
  deptName: "",
  documentType: "",
  startDate: formatDateValue(startOfMonth),
  endDate: formatDateValue(today),
  status: "",
});

// ✅ 권한 체크: 재정부 or 관리자만 부서 변경 가능
const canEditDept = computed(() => {
  if (!user.value?.roles) return false;
  return user.value.roles.some(
    (r) => r.role_name === "재정부" || r.role_name === "관리자"
  );
});

// ✅ 부서 옵션: 관리자/재정부는 전체 목록, 그 외는 본인 부서만
const departmentOptions = computed(() => {
  const list = (departments.value || []).slice().sort((a, b) => (a.dept_name || "").localeCompare(b.dept_name || ""));
  if (canEditDept.value) return list;
  const deptName = user.value?.deptName;
  if (!deptName) return list;
  const mine = list.find((d) => d.dept_name === deptName);
  return mine ? [mine] : [{ id: null, dept_name: deptName }];
});

onMounted(async () => {
  try {
    const res = await axios.get("/api/departments");
    departments.value = res.data || [];
  } catch (e) {
    console.error("부서 목록 로드 실패", e);
  }
  if (user.value?.deptName) {
    filters.value.deptName = user.value.deptName;
  }
  fetchApprovals(1);
});

const fetchApprovals = async (page = 1) => {
  currentPage.value = page;
  try {
    const res = await axios.post("/api/approvalList", {
      ...filters.value,
      page,
      pageSize: 10,
    });
    approvals.value = res.data.rows;
    totalPages.value = res.data.totalPages;
  } catch (err) {
    console.error(err);
    approvals.value = [];
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const formatAmount = (val) => {
  if (val === null || val === undefined) return "";
  const num = Number(val);
  if (isNaN(num)) return val;
  if (Number.isInteger(num)) {
    return num.toLocaleString("ko-KR");
  }
  return num.toLocaleString("ko-KR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const openPreview = async (id) => {
  try {
    const res = await axios.get(`/api/approval/detail/${id}`);
    const report = {
      id: res.data.id,
      documentType: res.data.document_type,
      deptName: res.data.dept_name,
      author: res.data.author,
      payee: res.data.payee,
      date: res.data.request_date,
      totalAmount: res.data.total_amount,
      comment: res.data.comment,
      aliasName: res.data.aliasName,
      selectedGwan: res.data.selectedGwan,
      selectedHang: res.data.selectedHang,
      items: res.data.items || [],
      attachedFiles: res.data.attachedFiles || [],
      approvalHistory: res.data.approvalHistory || []  
    };
    previewReport.value = report;
  } catch (err) {
    console.error("상세조회 실패:", err);
  }
};

const goToReport = (id) => {
  router.push({ name: "ReportForm", params: { id } });
};

const editReport = (id) => {
  router.push({ name: "ReportForm", params: { id }, query: { mode: 'edit' } });
};

// ─── 커스텀 Alert 모달 ────────────────────────────────────────
const alertModal = reactive({
  visible: false,
  message: "",
  close() { this.visible = false; },
});

function showAlert(message) {
  alertModal.message = message;
  alertModal.visible = true;
}

// ─── 커스텀 Confirm 모달 ──────────────────────────────────────
const confirmModal = reactive({ visible: false, message: "", resolve: null });

function showConfirm(message) {
  return new Promise((resolve) => {
    confirmModal.message = message;
    confirmModal.visible = true;
    confirmModal.resolve = (result) => {
      confirmModal.visible = false;
      confirmModal.resolve = null;
      resolve(result);
    };
  });
}

// ─── 수정 / 삭제 ──────────────────────────────────────────────
const attemptEdit = (a) => {
  if (a.author === user.value?.userName && a.historyCount === 1) {
    editReport(a.id);
  } else {
    showAlert("이미 결재가 진행중인 건은 수정할 수 없습니다.");
  }
};

const attemptDelete = async (a) => {
  if (a.author === user.value?.userName && a.historyCount === 1) {
    const confirmed = await showConfirm("삭제된 데이터는 복원되지 않습니다.\n정말로 삭제하시겠습니까?");
    if (confirmed) {
      confirmDelete(a.id);
    }
  } else {
    showAlert("이미 결재가 진행중인 건은 삭제할 수 없습니다.");
  }
};

const confirmDelete = async (id) => {
  try {
    const res = await axios.delete(`/api/approval/${id}`);
    if (res.data.success) {
      showAlert("삭제되었습니다.");
      fetchApprovals(currentPage.value);
    } else {
      showAlert("삭제 실패: " + res.data.message);
    }
  } catch (err) {
    console.error("삭제 중 오류 발생:", err);
    showAlert("삭제 중 오류가 발생했습니다.");
  }
};
</script>

<style scoped>
/* ✅ ApprovalListPage.vue와 동일한 행 높이로 조정 */
table td, table th {
  height: 2.5rem;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  vertical-align: middle;
}

/* ─── 공통 모달 오버레이 ──────────────────────────── */
.al-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.al-box {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.22);
  padding: 28px 32px 22px;
  min-width: 300px;
  max-width: 400px;
  text-align: center;
  animation: alPop 0.18s ease-out;
}
@keyframes alPop {
  from { opacity: 0; transform: scale(0.93); }
  to   { opacity: 1; transform: scale(1); }
}
.al-msg {
  font-size: 0.97rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.65;
  margin-bottom: 20px;
  white-space: pre-line;
}
.al-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.al-cancel {
  padding: 8px 24px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.al-cancel:hover { background: #f3f4f6; }
.al-ok {
  padding: 8px 24px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.12s;
  border: none;
}
.al-ok:hover { opacity: 0.88; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>