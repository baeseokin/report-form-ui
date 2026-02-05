<template>
  <div class="p-6 font-nanum">
    <!-- ✅ 검색조건 -->
    <div class="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-gradient-to-br from-blue-50 via-white to-sky-50 rounded-xl shadow-lg border-l-4 border-blue-500 py-[15px] px-[14px] sm:p-6 md:p-8 mb-6 flex flex-wrap gap-6 items-end">
      <!-- 부서명 -->
      <div class="flex flex-col w-40">
        <label class="font-semibold text-blue-800 mb-1 text-sm">부서명</label>
        <input
          type="text"
          v-model="filters.deptName"
          placeholder="부서명 입력"
          class="bg-white/90 border border-blue-200 rounded-xl px-3 py-2.5 w-full shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition placeholder:text-slate-400"
          :readonly="!canEditDept"
        />
      </div>

      <!-- 문서종류 -->
      <div class="flex flex-col w-36">
        <label class="font-semibold text-blue-800 mb-1 text-sm">문서종류</label>
        <select v-model="filters.documentType" class="bg-white/90 border border-blue-200 rounded-xl px-3 py-2.5 w-full shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition">
          <option value="">전체</option>
          <option value="청구지출결의서">청구지출결의서</option>
          <option value="정산지출결의서">정산지출결의서</option>
          <option value="가불지출결의서">가불지출결의서</option>
        </select>
      </div>

      <!-- 진행상태 -->
      <div class="flex flex-col w-32">
        <label class="font-semibold text-blue-800 mb-1 text-sm">진행상태</label>
        <select v-model="filters.status" class="bg-white/90 border border-blue-200 rounded-xl px-3 py-2.5 w-full shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition">
          <option value="">전체</option>
          <option value="결재진행중">결재진행중</option>
          <option value="결재완료">결재완료</option>
          <option value="결재반려">결재반려</option>
          <option value="재정부이관완료">재정부이관완료</option>
        </select>
      </div>

      <!-- 청구 시작일자 -->
      <div class="flex flex-col w-40">
        <label class="font-semibold text-blue-800 mb-1 text-sm">청구 시작일자</label>
        <input type="date" v-model="filters.startDate" class="bg-white/90 border border-blue-200 rounded-xl px-3 py-2.5 w-full shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition" />
      </div>

      <!-- 청구 종료일자 -->
      <div class="flex flex-col w-40">
        <label class="font-semibold text-blue-800 mb-1 text-sm">청구 종료일자</label>
        <input type="date" v-model="filters.endDate" class="bg-white/90 border border-blue-200 rounded-xl px-3 py-2.5 w-full shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition" />
      </div>

      <!-- 조회 버튼 -->
      <div class="flex items-end">
        <button
          @click="fetchApprovals(1)"
          class="px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition font-medium"
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
            <th class="border p-3 text-center">문서종류</th>
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
          <tr v-for="a in approvals" :key="a.id" class="hover:bg-purple-50 transition text-sm h-10">
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
              >
                <img src="/icons/view.svg" alt="상세보기" class="w-6 h-6" />
              </button>
              <button
                @click="goToReport(a.id)"
                class="p-2 rounded-lg hover:bg-purple-100 transition"
                title="보고서작성"
              >
                <img src="/icons/report.svg" alt="보고서작성" class="w-6 h-6" />
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
          currentPage === page ? 'bg-purple-600 text-white' : 'bg-white hover:bg-gray-100'
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
  </div>
</template>


<script setup>
import { ref, onMounted, computed } from "vue";
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

const today = new Date();
const year = today.getFullYear();
const startOfYear = new Date(year, 0, 1);

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
  startDate: formatDateValue(startOfYear),
  endDate: formatDateValue(today),
  status: "",
});

// ✅ 권한 체크: 재정부 or 관리자
const canEditDept = computed(() => {
  if (!user.value?.roles) return false;
  return user.value.roles.some(
    (r) => r.role_name === "재정부" || r.role_name === "관리자"
  );
});

onMounted(() => {
  if (user.value?.deptName) {
    filters.value.deptName = user.value.deptName;
    fetchApprovals(1);
  }
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
</script>

<style scoped>
/* ✅ ApprovalListPage.vue와 동일한 행 높이로 조정 */
table td, table th {
  height: 2.5rem;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  vertical-align: middle;
}
</style>