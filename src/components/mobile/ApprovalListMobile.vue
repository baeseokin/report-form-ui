<template>
  <div class="p-4 font-nanum bg-gray-50 min-h-screen">
    <h2 class="text-lg font-bold text-gray-800 mb-4">📑 청구목록 조회</h2>

    <!-- ✅ 검색조건 -->
    <div class="space-y-3 mb-6">
      <!-- 부서명은 session에서 가져오되 화면에서는 숨김 -->
      <input type="hidden" v-model="filters.deptName" />

      <!-- 문서종류 -->
      <div>
        <label class="font-bold mb-1 block">문서종류</label>
        <select v-model="filters.documentType" class="border rounded p-2 w-full">
          <option value="">전체</option>
          <option value="청구지출결의서">청구지출결의서</option>
          <option value="정산지출결의서">정산지출결의서</option>
          <option value="가불지출결의서">가불지출결의서</option>
        </select>
      </div>
     <!-- 진행상태 -->
      <div>
        <label class="font-bold mb-1 block">진행상태</label>
        <select v-model="filters.status" class="border rounded p-2 w-full">
          <option value="">전체</option>
          <option value="결재진행중">결재진행중</option>
          <option value="결재완료">결재완료</option>
          <option value="결재반려">결재반려</option>
          <option value="재정부이관완료">재정부이관완료</option>
        </select>
      </div>
      <!-- 청구 시작일자 -->
      <div>
        <label class="font-bold mb-1 block">청구 시작일자</label>
        <input type="date" v-model="filters.startDate" class="border rounded p-2 w-full" />
      </div>

      <!-- 청구 종료일자 -->
      <div>
        <label class="font-bold mb-1 block">청구 종료일자</label>
        <input type="date" v-model="filters.endDate" class="border rounded p-2 w-full" />
      </div>

      <!-- 조회 버튼 -->
      <button
        @click="fetchApprovals(1)"
        class="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-2"
      >
        조회
      </button>
    </div>

    <!-- ✅ 카드 리스트 -->
    <div class="space-y-4">
      <div
        v-for="a in approvals"
        :key="a.id"
        class="bg-white rounded-lg shadow-md p-4 border"
      >
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-bold text-purple-700">{{ a.document_type }}</h3>
          <span class="text-sm px-2 py-1 rounded bg-gray-100">{{ a.status }}</span>
        </div>

        <p class="text-gray-700 text-sm"><strong>부서:</strong> {{ a.dept_name }}</p>
        <p class="text-gray-700 text-sm"><strong>작성자:</strong> {{ a.author }}</p>
        <p class="text-gray-700 text-sm"><strong>별칭:</strong> {{ a.aliasName }}</p>
        <p class="text-gray-700 text-sm"><strong>일자:</strong> {{ formatDate(a.request_date) }}</p>
        <p class="text-gray-700 text-sm"><strong>총액:</strong> {{ formatAmount(a.total_amount) }}</p>

        <!-- 액션 버튼 -->
        <div class="flex justify-end space-x-3 mt-3">
          <button
            @click="openPreview(a.id)"
            class="p-2 rounded hover:bg-green-100"
            title="상세보기"
          >
            <img src="/icons/view.svg" alt="상세보기" class="w-6 h-6" />
          </button>
          <button
            @click="goToReport(a.id)"
            class="p-2 rounded hover:bg-purple-100"
            title="보고서작성"
          >
            <img src="/icons/report.svg" alt="보고서작성" class="w-6 h-6" />
          </button>
        </div>
      </div>

      <p v-if="approvals.length === 0" class="text-center text-gray-500">
        데이터가 없습니다.
      </p>
    </div>

    <!-- 페이지네이션 -->
    <div class="flex justify-center mt-6 space-x-2">
      <button
        v-for="page in totalPages"
        :key="page"
        @click="fetchApprovals(page)"
        :class="[
          'px-3 py-1 border rounded',
          currentPage === page ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
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
import { ref, onMounted } from "vue";
import axios from "axios";
//import ReportPreview from "../ReportPreview.vue";
import { defineAsyncComponent } from 'vue';
const ReportPreview = defineAsyncComponent(() => import ("../ReportPreview.vue"));
import { useRouter } from "vue-router";
import { useUserStore } from "../../store/userStore";
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
